-- Fix Security Definer Views Issue
-- These views are currently owned by postgres superuser, which bypasses RLS
-- Solution: Recreate them with security_invoker option to enforce RLS

-- Drop existing views
DROP VIEW IF EXISTS public.cars_with_details CASCADE;
DROP VIEW IF EXISTS public.cars_with_details_admin CASCADE;

-- Recreate cars_with_details with security_invoker
CREATE VIEW public.cars_with_details
WITH (security_invoker = true)
AS
SELECT 
  c.id,
  c.branch_id,
  b.name_ar AS branch_name_ar,
  b.name_en AS branch_name_en,
  cm.name_ar AS model_name_ar,
  cm.name_en AS model_name_en,
  cm.default_image_url,
  cb.name_ar AS brand_name_ar,
  cb.name_en AS brand_name_en,
  cc.name_ar AS color_name_ar,
  cc.name_en AS color_name_en,
  cc.hex_code AS color_hex_code,
  c.daily_price,
  c.weekly_price,
  c.monthly_price,
  c.ownership_price,
  c.discount_percentage,
  c.offer_expires_at,
  CASE
    WHEN c.discount_percentage > 0 AND (c.offer_expires_at IS NULL OR c.offer_expires_at >= now()) THEN true
    ELSE false
  END AS has_active_offer,
  c.quantity,
  c.available_quantity,
  public.get_actual_available_quantity(c.id) AS actual_available_quantity,
  c.status,
  COALESCE(ARRAY(
    SELECT cf.name_ar
    FROM public.car_feature_assignments cfa
    JOIN public.car_features cf ON cfa.feature_id = cf.id
    WHERE cfa.car_id = c.id AND cf.is_active = true
    ORDER BY cf.name_ar
  ), '{}'::text[]) AS features_ar,
  COALESCE(ARRAY(
    SELECT cf.name_en
    FROM public.car_feature_assignments cfa
    JOIN public.car_features cf ON cfa.feature_id = cf.id
    WHERE cfa.car_id = c.id AND cf.is_active = true
    ORDER BY cf.name_en
  ), '{}'::text[]) AS features_en,
  COALESCE(ARRAY(
    SELECT cf.id
    FROM public.car_feature_assignments cfa
    JOIN public.car_features cf ON cfa.feature_id = cf.id
    WHERE cfa.car_id = c.id AND cf.is_active = true
  ), '{}'::uuid[]) AS feature_ids,
  c.description_ar,
  c.description_en,
  c.additional_images,
  c.seats,
  c.fuel_type,
  c.transmission,
  c.mileage,
  c.is_new,
  c.rental_types,
  c.created_at,
  c.updated_at
FROM public.cars c
JOIN public.car_models cm ON c.model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
JOIN public.branches b ON c.branch_id = b.id
LEFT JOIN public.car_colors cc ON c.color_id = cc.id
WHERE c.status <> 'hidden'::car_status;

-- Recreate cars_with_details_admin with security_invoker
CREATE VIEW public.cars_with_details_admin
WITH (security_invoker = true)
AS
SELECT 
  c.id,
  c.branch_id,
  b.name_ar AS branch_name_ar,
  b.name_en AS branch_name_en,
  cm.name_ar AS model_name_ar,
  cm.name_en AS model_name_en,
  cm.default_image_url,
  cb.name_ar AS brand_name_ar,
  cb.name_en AS brand_name_en,
  cc.name_ar AS color_name_ar,
  cc.name_en AS color_name_en,
  cc.hex_code AS color_hex_code,
  c.daily_price,
  c.weekly_price,
  c.monthly_price,
  c.ownership_price,
  c.discount_percentage,
  c.offer_expires_at,
  CASE
    WHEN c.discount_percentage > 0 AND (c.offer_expires_at IS NULL OR c.offer_expires_at >= now()) THEN true
    ELSE false
  END AS has_active_offer,
  c.quantity,
  c.available_quantity,
  public.get_actual_available_quantity(c.id) AS actual_available_quantity,
  c.status,
  COALESCE(ARRAY(
    SELECT cf.name_ar
    FROM public.car_feature_assignments cfa
    JOIN public.car_features cf ON cfa.feature_id = cf.id
    WHERE cfa.car_id = c.id AND cf.is_active = true
    ORDER BY cf.name_ar
  ), '{}'::text[]) AS features_ar,
  COALESCE(ARRAY(
    SELECT cf.name_en
    FROM public.car_feature_assignments cfa
    JOIN public.car_features cf ON cfa.feature_id = cf.id
    WHERE cfa.car_id = c.id AND cf.is_active = true
    ORDER BY cf.name_en
  ), '{}'::text[]) AS features_en,
  COALESCE(ARRAY(
    SELECT cf.id
    FROM public.car_feature_assignments cfa
    JOIN public.car_features cf ON cfa.feature_id = cf.id
    WHERE cfa.car_id = c.id AND cf.is_active = true
  ), '{}'::uuid[]) AS feature_ids,
  c.description_ar,
  c.description_en,
  c.additional_images,
  c.seats,
  c.fuel_type,
  c.transmission,
  c.mileage,
  c.is_new,
  c.rental_types,
  c.created_at,
  c.updated_at
FROM public.cars c
JOIN public.car_models cm ON c.model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
JOIN public.branches b ON c.branch_id = b.id
LEFT JOIN public.car_colors cc ON c.color_id = cc.id;

-- Recreate cars_availability with security_invoker
DROP VIEW IF EXISTS public.cars_availability CASCADE;

CREATE VIEW public.cars_availability
WITH (security_invoker = true)
AS
SELECT 
  c.id as car_id,
  c.quantity as total_quantity,
  public.get_actual_available_quantity(c.id) as available_quantity,
  c.status,
  c.branch_id,
  cb.name_ar as brand_name_ar,
  cb.name_en as brand_name_en,
  cm.name_ar as model_name_ar,
  cm.name_en as model_name_en
FROM public.cars c
JOIN public.car_models cm ON c.model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id;