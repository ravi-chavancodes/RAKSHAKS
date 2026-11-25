-- RAKSHAK: Helper functions, status transition matrix, triggers, and geospatial lookup

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;

-- Internal role helpers (non-exposed schema to avoid RLS recursion on profiles)
create or replace function private.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select p.role
  from public.profiles p
  where p.id = (select auth.uid());
$$;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(private.current_user_role() = 'admin', false);
$$;

-- Allowed case_status transitions
create or replace function public.is_valid_transition(from_s public.case_status, to_s public.case_status)
returns boolean
language sql
immutable
as $$
  select case
    when from_s = 'submitted'            and to_s = 'under_review' then true
    when from_s = 'under_review'         and to_s in ('assigned','unresolved_escalated') then true
    when from_s = 'assigned'             and to_s in ('accepted','under_review','unresolved_escalated') then true
    when from_s = 'accepted'             and to_s in ('in_progress','unresolved_escalated') then true
    when from_s = 'in_progress'          and to_s in ('closed','unresolved_escalated') then true
    when from_s = 'unresolved_escalated' and to_s in ('assigned','closed') then true
    else false
  end;
$$;

-- Updated_at trigger
create or replace function private.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger trg_incidents_updated_at
  before update on public.incidents
  for each row
  execute function private.set_updated_at();

-- Guard direct client status updates (must go through transition_case_status)
create or replace function private.guard_incident_status_update()
returns trigger
language plpgsql
as $$
begin
  if old.status is distinct from new.status then
    if coalesce(current_setting('rakshak.allow_status_transition', true), '') <> 'true' then
      raise exception 'Direct status updates are forbidden; use transition_case_status()';
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_incidents_guard_status_update
  before update on public.incidents
  for each row
  execute function private.guard_incident_status_update();

-- Automatically record every status change in status_history
create or replace function private.record_incident_status_history()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor_id uuid;
  v_actor_role public.user_role;
  v_note text;
begin
  v_actor_id := coalesce((select auth.uid()), new.reporter_id);

  if v_actor_id is not null then
    select p.role into v_actor_role
    from public.profiles p
    where p.id = v_actor_id;
  end if;

  if tg_op = 'INSERT' then
    insert into public.status_history (
      incident_id,
      old_status,
      new_status,
      actor_id,
      actor_role,
      note
    ) values (
      new.id,
      null,
      new.status,
      v_actor_id,
      coalesce(v_actor_role, 'reporter'),
      'Case submitted'
    );
  elsif tg_op = 'UPDATE' and old.status is distinct from new.status then
    v_note := nullif(current_setting('rakshak.transition_note', true), '');
    insert into public.status_history (
      incident_id,
      old_status,
      new_status,
      actor_id,
      actor_role,
      note
    ) values (
      new.id,
      old.status,
      new.status,
      (select auth.uid()),
      v_actor_role,
      v_note
    );
  end if;

  return new;
end;
$$;

create trigger trg_incidents_status_history
  after insert or update of status on public.incidents
  for each row
  execute function private.record_incident_status_history();

-- Single server-side status transition function
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
  v_incident public.incidents;
  v_is_authorised_responder boolean := false;
begin
  v_uid := (select auth.uid());
  if v_uid is null then
    raise exception 'Authentication required to transition case status';
  end if;

  select p.role into v_role
  from public.profiles p
  where p.id = v_uid;

  if v_role is null then
    raise exception 'Caller profile not found';
  end if;

  select * into v_incident
  from public.incidents i
  where i.id = p_incident_id
  for update;

  if not found then
    raise exception 'Incident % not found', p_incident_id;
  end if;

  if v_role = 'admin' then
    v_is_authorised_responder := true;
  elsif v_role = 'responder' then
    select exists (
      select 1
      from public.responders r
      where r.profile_id = v_uid
        and r.is_active = true
        and r.verified = true
        and r.category = v_incident.category
    ) into v_is_authorised_responder;
  end if;

  if not v_is_authorised_responder then
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

revoke all on function public.transition_case_status(uuid, public.case_status, text) from public;
grant execute on function public.transition_case_status(uuid, public.case_status, text) to authenticated;

-- Find active, verified responders matching incident category and covering its location
create or replace function public.find_nearby_responders(p_incident_id uuid)
returns table (
  responder_id uuid,
  organisation_name text,
  category public.emergency_category,
  contact_channel text,
  distance_m double precision
)
language sql
stable
security invoker
set search_path = public, extensions, pg_temp
as $$
  with target as (
    select i.category, i.location
    from public.incidents i
    where i.id = p_incident_id
  )
  select
    r.id as responder_id,
    r.organisation_name,
    r.category,
    r.contact_channel,
    extensions.ST_Distance(
      coalesce(r.service_point, extensions.ST_Centroid(r.service_area::extensions.geometry)::extensions.geography),
      t.location
    ) as distance_m
  from public.responders r
  cross join target t
  where t.location is not null
    and r.is_active = true
    and r.verified = true
    and r.category = t.category
    and (
      (r.service_area is not null and extensions.ST_Covers(r.service_area, t.location))
      or (
        r.service_point is not null
        and r.radius_m is not null
        and extensions.ST_DWithin(r.service_point, t.location, r.radius_m)
      )
    )
  order by distance_m asc;
$$;
