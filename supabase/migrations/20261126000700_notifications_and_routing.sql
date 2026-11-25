-- RAKSHAK: Notifications table, assignment distance, and service_role support in transition_case_status

alter table public.assignments
  add column if not exists distance_m double precision;

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents(id) on delete cascade,
  responder_id uuid not null references public.responders(id) on delete cascade,
  channel text not null default 'in_app',
  status text not null default 'queued'
    check (status in ('queued', 'sent', 'failed')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_incident_id
  on public.notifications (incident_id);

create index if not exists idx_notifications_responder_id
  on public.notifications (responder_id);

alter table public.notifications enable row level security;

create policy "notifications_select_responder_or_admin"
  on public.notifications
  for select
  to authenticated
  using (
    private.is_admin()
    or exists (
      select 1
      from public.responders r
      where r.id = notifications.responder_id
        and r.profile_id = (select auth.uid())
    )
  );

-- Allow trusted server-side service_role calls (e.g. route-incident) in transition_case_status
create or replace function public.transition_case_status(
  p_incident_id uuid,
  p_to public.case_status,
  p_note text default null
)
returns public.incidents
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid;
  v_role public.user_role;
  v_is_service_role boolean := false;
  v_incident public.incidents;
  v_is_authorised boolean := false;
begin
  v_uid := (select auth.uid());
  v_is_service_role := (
    coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role'
    or current_user = 'service_role'
  );

  if v_uid is null and not v_is_service_role then
    raise exception 'Authentication required to transition case status';
  end if;

  select * into v_incident
  from public.incidents i
  where i.id = p_incident_id
  for update;

  if not found then
    raise exception 'Incident % not found', p_incident_id;
  end if;

  if v_is_service_role then
    v_is_authorised := true;
  else
    select p.role into v_role
    from public.profiles p
    where p.id = v_uid;

    if v_role = 'admin' then
      v_is_authorised := true;
    elsif v_role = 'responder' then
      select exists (
        select 1
        from public.responders r
        where r.profile_id = v_uid
          and r.is_active = true
          and r.verified = true
          and r.category = v_incident.category
      ) into v_is_authorised;
    end if;
  end if;

  if not v_is_authorised then
    raise exception 'User % is not authorised to transition incident %', v_uid, p_incident_id;
  end if;

  if not public.is_valid_transition(v_incident.status, p_to) then
    raise exception 'Invalid status transition from % to %', v_incident.status, p_to;
  end if;

  perform set_config('rakshak.allow_status_transition', 'true', true);
  perform set_config('rakshak.transition_note', coalesce(p_note, ''), true);

  update public.incidents
  set status = p_to
  where id = p_incident_id
  returning * into v_incident;

  insert into public.audit_logs (
    actor_id,
    action,
    entity,
    entity_id,
    metadata
  ) values (
    v_uid,
    'status_transition',
    'incidents',
    p_incident_id::text,
    jsonb_build_object(
      'to', p_to,
      'note', p_note
    )
  );

  return v_incident;
end;
$$;
