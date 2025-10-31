-- إنشاء bucket للإعلانات
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'announcement-images',
  'announcement-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
)
ON CONFLICT (id) DO NOTHING;

-- إنشاء RLS policies للـ bucket
CREATE POLICY "Admins can upload announcement images"
ON storage.objects FOR INSERT
TO public
WITH CHECK (
  bucket_id = 'announcement-images' 
  AND (auth.jwt() ->> 'role')::text = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'branch')
  )
);

CREATE POLICY "Everyone can view announcement images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'announcement-images');

CREATE POLICY "Admins can delete announcement images"
ON storage.objects FOR DELETE
TO public
USING (
  bucket_id = 'announcement-images'
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'branch')
  )
);

-- دالة جلب الإعلانات النشطة
CREATE OR REPLACE FUNCTION public.get_active_announcements(
  p_branch_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 10,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
  announcement_id UUID,
  title_ar TEXT,
  title_en TEXT,
  description_ar TEXT,
  description_en TEXT,
  image_url TEXT,
  is_featured BOOLEAN,
  priority announcement_priority,
  branch_id UUID,
  branch_name_ar TEXT,
  created_by_name TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  total_count BIGINT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  total_records BIGINT;
BEGIN
  SELECT COUNT(*) INTO total_records
  FROM announcements a
  WHERE a.is_active = true
    AND (a.expires_at IS NULL OR a.expires_at > NOW())
    AND (p_branch_id IS NULL OR a.branch_id = p_branch_id OR a.branch_id IS NULL);
  
  RETURN QUERY
  SELECT 
    a.id,
    a.title_ar,
    a.title_en,
    a.description_ar,
    a.description_en,
    a.image_url,
    a.is_featured,
    a.priority,
    a.branch_id,
    b.name_ar,
    p.full_name,
    a.expires_at,
    a.created_at,
    total_records
  FROM announcements a
  LEFT JOIN branches b ON a.branch_id = b.id
  LEFT JOIN profiles p ON a.created_by = p.user_id
  WHERE a.is_active = true
    AND (a.expires_at IS NULL OR a.expires_at > NOW())
    AND (p_branch_id IS NULL OR a.branch_id = p_branch_id OR a.branch_id IS NULL)
  ORDER BY 
    CASE a.priority
      WHEN 'urgent' THEN 1
      WHEN 'high' THEN 2
      WHEN 'normal' THEN 3
      ELSE 4
    END,
    a.is_featured DESC,
    a.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- دالة تبديل حالة الإعلان
CREATE OR REPLACE FUNCTION public.toggle_announcement_status(
  p_announcement_id UUID
)
RETURNS announcements
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_announcement announcements%ROWTYPE;
BEGIN
  UPDATE announcements
  SET 
    is_active = NOT is_active,
    updated_at = NOW()
  WHERE id = p_announcement_id
    AND (
      is_admin()
      OR (
        is_branch_manager() 
        AND (branch_id IS NULL OR branch_id = current_user_branch_id())
      )
    )
  RETURNING * INTO v_announcement;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Announcement not found or access denied';
  END IF;
  
  RETURN v_announcement;
END;
$$;