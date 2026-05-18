-- Fit mode: user garment photos (private bucket, backend uploads via service role)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'fit-uploads',
  'fit-uploads',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Authenticated users can read objects in their own folder: {user_id}/{recommendation_id}.ext
DROP POLICY IF EXISTS fit_uploads_select_own ON storage.objects;
CREATE POLICY fit_uploads_select_own ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'fit-uploads'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
