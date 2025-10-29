-- ========================================
-- المرحلة 1: إنشاء جدول الربط car_feature_assignments
-- ========================================

CREATE TABLE IF NOT EXISTS public.car_feature_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id UUID NOT NULL REFERENCES public.cars(id) ON DELETE CASCADE,
  feature_id UUID NOT NULL REFERENCES public.car_features(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(car_id, feature_id)
);

-- Indexes للأداء
CREATE INDEX IF NOT EXISTS idx_car_feature_assignments_car_id 
ON public.car_feature_assignments(car_id);

CREATE INDEX IF NOT EXISTS idx_car_feature_assignments_feature_id 
ON public.car_feature_assignments(feature_id);

-- RLS Policies
ALTER TABLE public.car_feature_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone can view car features" ON public.car_feature_assignments;
CREATE POLICY "Everyone can view car features"
ON public.car_feature_assignments FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Admins can manage car features" ON public.car_feature_assignments;
CREATE POLICY "Admins can manage car features"
ON public.car_feature_assignments FOR ALL
USING (is_admin());

DROP POLICY IF EXISTS "Branch managers can manage branch car features" ON public.car_feature_assignments;
CREATE POLICY "Branch managers can manage branch car features"
ON public.car_feature_assignments FOR ALL
USING (
  is_branch_manager() AND EXISTS (
    SELECT 1 FROM cars 
    WHERE cars.id = car_feature_assignments.car_id 
      AND cars.branch_id = current_user_branch_id()
  )
);

-- ========================================
-- المرحلة 2: إنشاء الدوال المساعدة
-- ========================================

-- 1. دالة تعيين مميزات متعددة لسيارة (استبدال كامل)
CREATE OR REPLACE FUNCTION public.set_car_features(
  p_car_id UUID,
  p_feature_ids UUID[]
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- التحقق من الصلاحيات
  IF NOT (is_admin() OR (
    is_branch_manager() AND EXISTS (
      SELECT 1 FROM cars 
      WHERE id = p_car_id AND branch_id = current_user_branch_id()
    )
  )) THEN
    RAISE EXCEPTION 'Insufficient privileges';
  END IF;

  -- حذف جميع المميزات الحالية
  DELETE FROM car_feature_assignments WHERE car_id = p_car_id;

  -- إضافة المميزات الجديدة
  IF p_feature_ids IS NOT NULL AND array_length(p_feature_ids, 1) > 0 THEN
    INSERT INTO car_feature_assignments (car_id, feature_id)
    SELECT p_car_id, unnest(p_feature_ids)
    ON CONFLICT (car_id, feature_id) DO NOTHING;
  END IF;
END;
$$;

-- 2. دالة الحصول على مميزات سيارة
CREATE OR REPLACE FUNCTION public.get_car_features(p_car_id UUID)
RETURNS TABLE(
  feature_id UUID,
  name_ar TEXT,
  name_en TEXT
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    cf.id,
    cf.name_ar,
    cf.name_en
  FROM car_feature_assignments cfa
  JOIN car_features cf ON cfa.feature_id = cf.id
  WHERE cfa.car_id = p_car_id
    AND cf.is_active = true
  ORDER BY cf.name_ar;
$$;

-- 3. دالة إضافة ميزة لسيارة
CREATE OR REPLACE FUNCTION public.add_feature_to_car(
  p_car_id UUID,
  p_feature_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- التحقق من الصلاحيات
  IF NOT (is_admin() OR (
    is_branch_manager() AND EXISTS (
      SELECT 1 FROM cars 
      WHERE id = p_car_id AND branch_id = current_user_branch_id()
    )
  )) THEN
    RAISE EXCEPTION 'Insufficient privileges';
  END IF;

  -- إضافة الميزة
  INSERT INTO car_feature_assignments (car_id, feature_id)
  VALUES (p_car_id, p_feature_id)
  ON CONFLICT (car_id, feature_id) DO NOTHING;
END;
$$;

-- 4. دالة حذف ميزة من سيارة
CREATE OR REPLACE FUNCTION public.remove_feature_from_car(
  p_car_id UUID,
  p_feature_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- التحقق من الصلاحيات
  IF NOT (is_admin() OR (
    is_branch_manager() AND EXISTS (
      SELECT 1 FROM cars 
      WHERE id = p_car_id AND branch_id = current_user_branch_id()
    )
  )) THEN
    RAISE EXCEPTION 'Insufficient privileges';
  END IF;

  -- حذف الميزة
  DELETE FROM car_feature_assignments
  WHERE car_id = p_car_id AND feature_id = p_feature_id;
END;
$$;

-- ========================================
-- المرحلة 3: نقل البيانات القديمة
-- ========================================

DO $$
DECLARE
  car_record RECORD;
  feature_record RECORD;
  feature_name TEXT;
  feature_uuid UUID;
BEGIN
  -- لكل سيارة لديها مميزات في features_ar
  FOR car_record IN 
    SELECT id, features_ar 
    FROM cars 
    WHERE features_ar IS NOT NULL AND array_length(features_ar, 1) > 0
  LOOP
    -- لكل ميزة في السيارة
    FOREACH feature_name IN ARRAY car_record.features_ar
    LOOP
      -- البحث عن الميزة في car_features
      SELECT id INTO feature_uuid
      FROM car_features
      WHERE name_ar = feature_name AND is_active = true;
      
      -- إذا وجدت، أضفها للسيارة
      IF feature_uuid IS NOT NULL THEN
        INSERT INTO car_feature_assignments (car_id, feature_id)
        VALUES (car_record.id, feature_uuid)
        ON CONFLICT (car_id, feature_id) DO NOTHING;
      ELSE
        -- إذا لم توجد، سجل تحذير (يمكن تخطيها أو إنشاء ميزة جديدة)
        RAISE NOTICE 'Feature not found: % for car: %', feature_name, car_record.id;
      END IF;
    END LOOP;
  END LOOP;
  
  RAISE NOTICE 'Migration completed successfully';
END $$;