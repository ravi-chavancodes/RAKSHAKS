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
