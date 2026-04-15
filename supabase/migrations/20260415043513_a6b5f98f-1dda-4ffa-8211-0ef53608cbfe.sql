
DROP POLICY "Spot photos are publicly accessible" ON storage.objects;
CREATE POLICY "Spot photos are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'spot-photos' AND auth.role() = 'authenticated' OR bucket_id = 'spot-photos' AND storage.filename(name) IS NOT NULL);
