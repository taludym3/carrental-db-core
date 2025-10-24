-- Create bucket for brand logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('brand-logos', 'brand-logos', true);

-- RLS Policies for brand-logos bucket

-- Allow anyone to view brand logos (public bucket)
CREATE POLICY "Anyone can view brand logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'brand-logos');

-- Allow admins to upload logos
CREATE POLICY "Admins can upload brand logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'brand-logos' 
  AND auth.uid() IN (
    SELECT user_id FROM user_roles WHERE role = 'admin'
  )
);

-- Allow admins to update logos
CREATE POLICY "Admins can update brand logos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'brand-logos'
  AND auth.uid() IN (
    SELECT user_id FROM user_roles WHERE role = 'admin'
  )
);

-- Allow admins to delete logos
CREATE POLICY "Admins can delete brand logos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'brand-logos'
  AND auth.uid() IN (
    SELECT user_id FROM user_roles WHERE role = 'admin'
  )
);