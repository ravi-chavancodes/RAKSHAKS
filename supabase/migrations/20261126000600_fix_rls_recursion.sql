-- RAKSHAK: Fix RLS infinite recursion between incidents and assignments

create or replace function private.is_responder_assigned(p_incident_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.assignments a
    join public.responders r on r.id = a.responder_id
    where a.incident_id = p_incident_id
      and r.profile_id = (select auth.uid())
  );
$$;

create or replace function private.is_incident_reporter(p_incident_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.incidents i
    where i.id = p_incident_id
      and i.reporter_id = (select auth.uid())
  );
$$;

drop policy if exists "incidents_select_reporter_responder_admin" on public.incidents;
create policy "incidents_select_reporter_responder_admin"
  on public.incidents
  for select
  to authenticated
  using (
    private.is_admin()
    or reporter_id = (select auth.uid())
    or private.is_responder_assigned(incidents.id)
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

drop policy if exists "assignments_select_involved_or_admin" on public.assignments;
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
    or private.is_incident_reporter(assignments.incident_id)
  );
