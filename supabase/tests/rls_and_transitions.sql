-- RAKSHAK: Verification script for status transitions, authorisation, and RLS
-- Run against local Postgres after `supabase db reset`.

begin;

-- 1. Seed test auth users (trigger auto-creates profiles with role = 'reporter')
insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'reporter@rakshak.test'),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'human-resp@rakshak.test'),
  ('aaaaaaaa-0000-0000-0000-000000000003', 'fire-resp@rakshak.test'),
  ('aaaaaaaa-0000-0000-0000-000000000004', 'admin@rakshak.test');

do $$
declare
  v_profile_count int;
begin
  select count(*) into v_profile_count
  from public.profiles
  where id in (
    'aaaaaaaa-0000-0000-0000-000000000001',
    'aaaaaaaa-0000-0000-0000-000000000002',
    'aaaaaaaa-0000-0000-0000-000000000003',
    'aaaaaaaa-0000-0000-0000-000000000004'
  ) and role = 'reporter';

  if v_profile_count <> 4 then
    raise exception 'FAIL: expected 4 auto-created reporter profiles, got %', v_profile_count;
  end if;
end $$;

update public.profiles set full_name = 'Test Reporter' where id = 'aaaaaaaa-0000-0000-0000-000000000001';
update public.profiles set full_name = 'Human Responder', role = 'responder' where id = 'aaaaaaaa-0000-0000-0000-000000000002';
update public.profiles set full_name = 'Fire Responder', role = 'responder' where id = 'aaaaaaaa-0000-0000-0000-000000000003';
update public.profiles set full_name = 'Ops Admin', role = 'admin' where id = 'aaaaaaaa-0000-0000-0000-000000000004';

-- Link seeded responders to responder profiles
update public.responders
set profile_id = 'aaaaaaaa-0000-0000-0000-000000000002'
where id = '11111111-1111-4111-8111-111111111101';

update public.responders
set profile_id = 'aaaaaaaa-0000-0000-0000-000000000003'
where id = '11111111-1111-4111-8111-111111111103';

-- 2. Insert a test human emergency incident as reporter
set local role authenticated;
select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-0000-0000-000000000001', true);

insert into public.incidents (
  id,
  reference,
  client_request_id,
  reporter_id,
  reporting_mode,
  category,
  description,
  location
) values (
  'bbbbbbbb-0000-0000-0000-000000000001',
  'RK-20261126-TEST',
  'cccccccc-0000-0000-0000-000000000001',
  'aaaaaaaa-0000-0000-0000-000000000001',
  'self',
  'human',
  'Road collision near MG Road metro exit',
  extensions.ST_SetSRID(extensions.ST_MakePoint(77.5946, 12.9756), 4326)::extensions.geography
);

-- 3. Verify anonymous user CANNOT read incidents
set local role anon;
select set_config('request.jwt.claim.sub', '', true);

do $$
declare
  v_count int;
begin
  select count(*) into v_count from public.incidents;
  if v_count <> 0 then
    raise exception 'FAIL: anon user read % incident(s)', v_count;
  end if;
end $$;

-- 4. Verify reporter CANNOT transition status (unauthorised)
set local role authenticated;
select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-0000-0000-000000000001', true);

do $$
begin
  perform public.transition_case_status(
    'bbbbbbbb-0000-0000-0000-000000000001',
    'under_review',
    'Reporter trying to self-triage'
  );
  raise exception 'FAIL: reporter was able to call transition_case_status';
exception when others then
  if sqlerrm like 'FAIL:%' then
    raise;
  end if;
end $$;

-- 5. Verify fire responder CANNOT transition a human incident (wrong category)
select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-0000-0000-000000000003', true);

do $$
begin
  perform public.transition_case_status(
    'bbbbbbbb-0000-0000-0000-000000000001',
    'under_review',
    'Wrong category responder'
  );
  raise exception 'FAIL: wrong-category responder transitioned incident';
exception when others then
  if sqlerrm like 'FAIL:%' then
    raise;
  end if;
end $$;

-- 6. Verify human responder CANNOT skip from submitted -> accepted (invalid transition)
select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-0000-0000-000000000002', true);

do $$
begin
  perform public.transition_case_status(
    'bbbbbbbb-0000-0000-0000-000000000001',
    'accepted',
    'Skipping under_review and assigned'
  );
  raise exception 'FAIL: invalid transition submitted -> accepted succeeded';
exception when others then
  if sqlerrm like 'FAIL:%' then
    raise;
  end if;
end $$;

-- 7. Verify valid transition submitted -> under_review succeeds and writes status_history
do $$
declare
  v_hist_count int;
begin
  perform public.transition_case_status(
    'bbbbbbbb-0000-0000-0000-000000000001',
    'under_review',
    'Verified by human responder'
  );

  reset role;
  select count(*) into v_hist_count
  from public.status_history
  where incident_id = 'bbbbbbbb-0000-0000-0000-000000000001'
    and new_status = 'under_review';

  if v_hist_count <> 1 then
    raise exception 'FAIL: expected 1 under_review status_history row, got %', v_hist_count;
  end if;
end $$;

-- 8. Verify find_nearby_responders returns the human responder
do $$
declare
  v_responder_count int;
begin
  select count(*) into v_responder_count
  from public.find_nearby_responders('bbbbbbbb-0000-0000-0000-000000000001');

  if v_responder_count <> 1 then
    raise exception 'FAIL: expected 1 nearby human responder, got %', v_responder_count;
  end if;
end $$;

rollback;
