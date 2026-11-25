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
