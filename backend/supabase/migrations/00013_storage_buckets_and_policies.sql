-- Storage buckets and RLS policies (wired for CLI `supabase db push`).

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('signatures', 'signatures', false, 2097152, ARRAY['image/png'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "auth_upload_avatars" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND auth.role() = 'authenticated'
  );

CREATE POLICY "auth_update_avatars" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' AND auth.role() = 'authenticated'
  );

CREATE POLICY "auth_delete_avatars" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' AND auth.role() = 'authenticated'
  );

CREATE POLICY "auth_select_signatures" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'signatures' AND auth.role() = 'authenticated'
  );

CREATE POLICY "auth_insert_signatures" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'signatures' AND auth.role() = 'authenticated'
  );
