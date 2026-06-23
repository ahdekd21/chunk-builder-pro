
CREATE POLICY "promptkit read" ON storage.objects FOR SELECT USING (bucket_id = 'promptkit');
CREATE POLICY "promptkit insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'promptkit');
CREATE POLICY "promptkit update" ON storage.objects FOR UPDATE USING (bucket_id = 'promptkit');
CREATE POLICY "promptkit delete" ON storage.objects FOR DELETE USING (bucket_id = 'promptkit');
