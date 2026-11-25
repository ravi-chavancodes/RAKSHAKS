-- RAKSHAK: Enable Supabase Realtime on incidents & status_history, plus safe coordinate reader

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'incidents'
  ) then
    alter publication supabase_realtime add table public.incidents;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'status_history'
  ) then
    alter publication supabase_realtime add table public.status_history;
  end if;
end $$;

create or replace function public.get_incident_coordinates(p_incident_id uuid)
returns table (
  latitude double precision,
  longitude double precision
)
language sql
stable
security invoker
set search_path = public, extensions, pg_temp
as $$
  select
    extensions.ST_Y(i.location::extensions.geometry) as latitude,
    extensions.ST_X(i.location::extensions.geometry) as longitude
  from public.incidents i
  where i.id = p_incident_id
    and i.location is not null;
$$;
