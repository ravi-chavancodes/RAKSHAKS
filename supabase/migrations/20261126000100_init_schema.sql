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
