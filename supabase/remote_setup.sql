-- RAKSHAK: Core schema, PostGIS, enums, tables, and indexes

create extension if not exists postgis with schema extensions;

-- Enums
create type public.reporting_mode as enum ('self', 'third_person');

create type public.emergency_category as enum ('human', 'animal_bird', 'fire_rescue');

create type public.case_status as enum (
  'submitted',
  'under_review',
  'assigned',
  'accepted',
  'in_progress',
  'closed',
  'unresolved_escalated'
);

create type public.user_role as enum ('reporter', 'responder', 'admin');

-- Profiles (linked to auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role public.user_role not null default 'reporter',
  created_at timestamptz not null default now()
);

-- Incidents
create table public.incidents (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique
    check (reference ~ '^RK-[0-9]{8}-[A-Z0-9]{4,}$'),
  client_request_id uuid not null unique,
  reporter_id uuid references public.profiles(id) on delete set null,
  reporting_mode public.reporting_mode not null,
  category public.emergency_category not null,
  description text not null check (char_length(trim(description)) > 0),
  status public.case_status not null default 'submitted',
  ai_suggested_category public.emergency_category,
  ai_suggested_priority text,
  ai_confidence numeric(4, 3)
    check (ai_confidence is null or (ai_confidence >= 0 and ai_confidence <= 1)),
  category_confirmed boolean not null default false,
  location extensions.geography(Point, 4326),
  location_text text,
  location_accuracy_m double precision
    check (location_accuracy_m is null or location_accuracy_m >= 0),
  location_is_approximate boolean not null default false,
  audio_path text,
  audio_duration_ms integer
    check (audio_duration_ms is null or (audio_duration_ms >= 0 and audio_duration_ms <= 15000)),
  audio_permission_state text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Responders
create table public.responders (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  organisation_name text not null check (char_length(trim(organisation_name)) > 0),
  category public.emergency_category not null,
  service_area extensions.geography(Polygon, 4326),
  service_point extensions.geography(Point, 4326),
  radius_m integer check (radius_m is null or radius_m > 0),
  contact_channel text not null check (char_length(trim(contact_channel)) > 0),
  is_active boolean not null default true,
  verified boolean not null default false,
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  constraint responders_area_or_point_chk check (
    service_area is not null
    or (service_point is not null and radius_m is not null)
  )
);

-- Assignments
create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents(id) on delete cascade,
  responder_id uuid not null references public.responders(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  response_state text not null default 'notified'
    check (response_state in ('notified', 'accepted', 'rejected', 'escalated')),
  responded_at timestamptz,
  rejection_reason text
);

-- Status history (append-only via trigger)
create table public.status_history (
  id bigserial primary key,
  incident_id uuid not null references public.incidents(id) on delete cascade,
  old_status public.case_status,
  new_status public.case_status not null,
  actor_id uuid references public.profiles(id) on delete set null,
  actor_role public.user_role,
  note text,
  created_at timestamptz not null default now()
);

-- Audit logs
create table public.audit_logs (
  id bigserial primary key,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity text not null,
  entity_id text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Spatial & operational indexes
create index idx_incidents_location_gist
  on public.incidents using gist (location);

create index idx_incidents_reporter_id
  on public.incidents (reporter_id);

create index idx_incidents_status_category
  on public.incidents (status, category);

create index idx_responders_service_area_gist
  on public.responders using gist (service_area);

create index idx_responders_service_point_gist
  on public.responders using gist (service_point);

create index idx_responders_profile_id
  on public.responders (profile_id);

create index idx_responders_active_verified_cat
  on public.responders (category)
  where is_active = true and verified = true;

create index idx_assignments_incident_id
  on public.assignments (incident_id);

create index idx_assignments_responder_id
  on public.assignments (responder_id);

create index idx_status_history_incident_created
  on public.status_history (incident_id, created_at desc);

create index idx_audit_logs_entity
  on public.audit_logs (entity, entity_id, created_at desc);


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


-- RAKSHAK: Row Level Security policies on every table (no using (true), no auth.role())

alter table public.profiles enable row level security;
alter table public.incidents enable row level security;
alter table public.responders enable row level security;
alter table public.assignments enable row level security;
alter table public.status_history enable row level security;
alter table public.audit_logs enable row level security;

-- PROFILES
create policy "profiles_select_own_or_admin"
  on public.profiles
  for select
  to authenticated
  using (
    id = (select auth.uid())
    or private.is_admin()
  );

create policy "profiles_insert_own_reporter"
  on public.profiles
  for insert
  to authenticated
  with check (
    id = (select auth.uid())
    and role = 'reporter'
  );

create policy "profiles_update_own_non_role_or_admin"
  on public.profiles
  for update
  to authenticated
  using (
    id = (select auth.uid())
    or private.is_admin()
  )
  with check (
    private.is_admin()
    or (
      id = (select auth.uid())
      and role = private.current_user_role()
    )
  );

-- INCIDENTS
-- Anonymous users have NO direct policies (must submit via Edge Function).
create policy "incidents_select_reporter_responder_admin"
  on public.incidents
  for select
  to authenticated
  using (
    private.is_admin()
    or reporter_id = (select auth.uid())
    or exists (
      select 1
      from public.assignments a
      join public.responders r on r.id = a.responder_id
      where a.incident_id = incidents.id
        and r.profile_id = (select auth.uid())
    )
    or exists (
      select 1
      from public.responders r
      where r.profile_id = (select auth.uid())
        and r.is_active = true
        and r.verified = true
        and r.category = incidents.category
        and (
          incidents.location is null
          or (r.service_area is not null and extensions.ST_Covers(r.service_area, incidents.location))
          or (
            r.service_point is not null
            and r.radius_m is not null
            and extensions.ST_DWithin(r.service_point, incidents.location, r.radius_m)
          )
        )
    )
  );

create policy "incidents_insert_authenticated_reporter"
  on public.incidents
  for insert
  to authenticated
  with check (
    reporter_id = (select auth.uid())
    and status = 'submitted'
  );

create policy "incidents_admin_update"
  on public.incidents
  for update
  to authenticated
  using (private.is_admin())
  with check (private.is_admin());

create policy "incidents_admin_delete"
  on public.incidents
  for delete
  to authenticated
  using (private.is_admin());

-- RESPONDERS
create policy "responders_select_verified_own_or_admin"
  on public.responders
  for select
  to authenticated
  using (
    private.is_admin()
    or profile_id = (select auth.uid())
    or (is_active = true and verified = true)
  );

create policy "responders_admin_insert"
  on public.responders
  for insert
  to authenticated
  with check (private.is_admin());

create policy "responders_admin_update"
  on public.responders
  for update
  to authenticated
  using (private.is_admin())
  with check (private.is_admin());

create policy "responders_admin_delete"
  on public.responders
  for delete
  to authenticated
  using (private.is_admin());

-- ASSIGNMENTS
create policy "assignments_select_involved_or_admin"
  on public.assignments
  for select
  to authenticated
  using (
    private.is_admin()
    or exists (
      select 1
      from public.responders r
      where r.id = assignments.responder_id
        and r.profile_id = (select auth.uid())
    )
    or exists (
      select 1
      from public.incidents i
      where i.id = assignments.incident_id
        and i.reporter_id = (select auth.uid())
    )
  );

create policy "assignments_insert_admin_only"
  on public.assignments
  for insert
  to authenticated
  with check (private.is_admin());

create policy "assignments_update_responder_or_admin"
  on public.assignments
  for update
  to authenticated
  using (
    private.is_admin()
    or exists (
      select 1
      from public.responders r
      where r.id = assignments.responder_id
        and r.profile_id = (select auth.uid())
    )
  )
  with check (
    private.is_admin()
    or exists (
      select 1
      from public.responders r
      where r.id = assignments.responder_id
        and r.profile_id = (select auth.uid())
    )
  );

-- STATUS HISTORY
create policy "status_history_select_reporter_responder_admin"
  on public.status_history
  for select
  to authenticated
  using (
    private.is_admin()
    or exists (
      select 1
      from public.incidents i
      where i.id = status_history.incident_id
        and (
          i.reporter_id = (select auth.uid())
          or exists (
            select 1
            from public.assignments a
            join public.responders r on r.id = a.responder_id
            where a.incident_id = i.id
              and r.profile_id = (select auth.uid())
          )
        )
    )
  );

-- AUDIT LOGS
create policy "audit_logs_select_admin_only"
  on public.audit_logs
  for select
  to authenticated
  using (private.is_admin());


-- RAKSHAK: Automatically create a reporter profile when a new auth user signs up

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), ''),
    'reporter'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function private.handle_new_user();


-- RAKSHAK: Private Storage bucket for optional 10-second SOS audio recordings

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'incident-audio',
  'incident-audio',
  false,
  5242880,
  array['audio/webm', 'audio/mp4', 'audio/ogg', 'audio/wav']
)
on conflict (id) do nothing;

-- Admins and assigned responders can read audio for cases they own/are assigned to
create policy "incident_audio_select_admin_or_assigned_responder"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'incident-audio'
    and (
      private.is_admin()
      or exists (
        select 1
        from public.incidents i
        join public.assignments a on a.incident_id = i.id
        join public.responders r on r.id = a.responder_id
        where i.audio_path = storage.objects.name
          and r.profile_id = (select auth.uid())
      )
    )
  );


-- RAKSHAK: Seed 3 sample verified responders in Bengaluru test city

insert into public.responders (
  id,
  organisation_name,
  category,
  service_point,
  radius_m,
  contact_channel,
  is_active,
  verified,
  last_verified_at
) values
  (
    '11111111-1111-4111-8111-111111111101',
    'St. Martha Coordination Trauma Desk',
    'human',
    extensions.ST_SetSRID(extensions.ST_MakePoint(77.5872, 12.9716), 4326)::extensions.geography,
    12000,
    'tel:+918022275081',
    true,
    true,
    now()
  ),
  (
    '11111111-1111-4111-8111-111111111102',
    'Bengaluru Urban Wildlife & Animal Rescue',
    'animal_bird',
    extensions.ST_SetSRID(extensions.ST_MakePoint(77.6101, 12.9352), 4326)::extensions.geography,
    15000,
    'tel:+918025531234',
    true,
    true,
    now()
  ),
  (
    '11111111-1111-4111-8111-111111111103',
    'High Grounds Fire & Rescue Station',
    'fire_rescue',
    extensions.ST_SetSRID(extensions.ST_MakePoint(77.5906, 12.9881), 4326)::extensions.geography,
    15000,
    'tel:101',
    true,
    true,
    now()
  )
on conflict (id) do nothing;


-- Promote remote admin@test.com to admin
insert into public.profiles (id, full_name, role) values ('8164223b-89ff-485c-8f1f-f6fb97ea4740', 'Test Admin', 'admin') on conflict (id) do update set role = 'admin', full_name = 'Test Admin';

