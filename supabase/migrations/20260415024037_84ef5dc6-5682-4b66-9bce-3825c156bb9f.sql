-- Drop the overly broad SELECT policy
DROP POLICY IF EXISTS "Brand assets are publicly accessible" ON storage.objects;

-- Replace with a scoped policy: anyone can read files but only within a user folder structure
CREATE POLICY "Brand assets are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'brand-assets' AND (storage.foldername(name))[1] IS NOT NULL);