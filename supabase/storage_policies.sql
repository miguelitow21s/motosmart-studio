DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='order-files_upload' AND tablename='objects') THEN
    EXECUTE 'CREATE POLICY "order-files_upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = ''order-files'')';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='order-files_read' AND tablename='objects') THEN
    EXECUTE 'CREATE POLICY "order-files_read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = ''order-files'')';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='templates_public_read' AND tablename='objects') THEN
    EXECUTE 'CREATE POLICY "templates_public_read" ON storage.objects FOR SELECT TO public USING (bucket_id = ''templates'')';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='templates_write' AND tablename='objects') THEN
    EXECUTE 'CREATE POLICY "templates_write" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = ''templates'' AND (SELECT role FROM public.users WHERE id = auth.uid()) IN (''admin'',''designer''))';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='avatars_public_read' AND tablename='objects') THEN
    EXECUTE 'CREATE POLICY "avatars_public_read" ON storage.objects FOR SELECT TO public USING (bucket_id = ''avatars'')';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='avatars_upload' AND tablename='objects') THEN
    EXECUTE 'CREATE POLICY "avatars_upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = ''avatars'')';
  END IF;
END;
$$;
