-- Drop old incorrect policies for car-model-images bucket
DROP POLICY IF EXISTS "Admins can upload model images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update model images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete model images" ON storage.objects;

-- Create new correct policies using user_roles table
CREATE POLICY "Admins can upload model images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'car-model-images' 
  AND auth.uid() IN (
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  )
);

CREATE POLICY "Admins can update model images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'car-model-images' 
  AND auth.uid() IN (
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  )
);

CREATE POLICY "Admins can delete model images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'car-model-images' 
  AND auth.uid() IN (
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  )
);