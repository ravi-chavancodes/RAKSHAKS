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
