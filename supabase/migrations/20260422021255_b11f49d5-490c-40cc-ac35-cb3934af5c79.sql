UPDATE storage.buckets
SET public = false
WHERE id = 'brand-assets';

DROP POLICY IF EXISTS "Brand assets are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Brand assets are publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Users read own brand assets" ON storage.objects;

CREATE POLICY "Users read own brand assets"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'brand-assets'
  AND auth.uid()::text = (storage.foldername(name))[1]
);