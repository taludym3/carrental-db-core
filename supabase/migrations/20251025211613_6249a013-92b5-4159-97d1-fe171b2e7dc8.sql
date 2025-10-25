-- Migration 4: Create storage buckets for cars and branches
-- إنشاء buckets للسيارات والفروع

-- إنشاء bucket للسيارات
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'car-images', 
  'car-images', 
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- إنشاء bucket للفروع
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'branch-images', 
  'branch-images', 
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- RLS policies لـ car-images bucket
CREATE POLICY "Admins can upload car images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'car-images' AND
  is_admin()
);

CREATE POLICY "Admins can update car images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'car-images' AND is_admin())
WITH CHECK (bucket_id = 'car-images' AND is_admin());

CREATE POLICY "Admins can delete car images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'car-images' AND is_admin());

CREATE POLICY "Everyone can view car images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'car-images');

-- RLS policies لـ branch-images bucket
CREATE POLICY "Admins can upload branch images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'branch-images' AND
  is_admin()
);

CREATE POLICY "Admins can update branch images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'branch-images' AND is_admin())
WITH CHECK (bucket_id = 'branch-images' AND is_admin());

CREATE POLICY "Admins can delete branch images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'branch-images' AND is_admin());

CREATE POLICY "Everyone can view branch images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'branch-images');