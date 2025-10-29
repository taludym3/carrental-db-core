-- إصلاح شامل لجميع دوال البحث المعطلة

-- 1. إصلاح quick_search_suggestions() - استبدال أسماء الجداول الصحيحة
CREATE OR REPLACE FUNCTION public.quick_search_suggestions(
  p_search_query TEXT,
  p_max_results_per_category INT DEFAULT 5
)
RETURNS TABLE(
  suggestion_type TEXT,
  suggestion_text TEXT,
  suggestion_id UUID,
  relevance_score INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- البحث في الماركات (أعلى أهمية)
  RETURN QUERY
  SELECT 
    'brand'::TEXT as suggestion_type,
    COALESCE(cb.name_ar, cb.name_en)::TEXT as suggestion_text,
    cb.id as suggestion_id,
    100 as relevance_score
  FROM car_brands cb
  WHERE 
    (cb.name_ar ILIKE '%' || p_search_query || '%' OR cb.name_en ILIKE '%' || p_search_query || '%')
    AND cb.is_active = true
  ORDER BY 
    CASE 
      WHEN cb.name_ar ILIKE p_search_query || '%' OR cb.name_en ILIKE p_search_query || '%' THEN 1
      ELSE 2
    END,
    cb.name_ar
  LIMIT p_max_results_per_category;

  -- البحث في الموديلات
  RETURN QUERY
  SELECT 
    'model'::TEXT as suggestion_type,
    (COALESCE(cm.name_ar, cm.name_en) || ' - ' || COALESCE(cb.name_ar, cb.name_en))::TEXT as suggestion_text,
    cm.id as suggestion_id,
    90 as relevance_score
  FROM car_models cm
  JOIN car_brands cb ON cm.brand_id = cb.id
  WHERE 
    (cm.name_ar ILIKE '%' || p_search_query || '%' OR cm.name_en ILIKE '%' || p_search_query || '%')
    AND cm.is_active = true
    AND cb.is_active = true
  ORDER BY 
    CASE 
      WHEN cm.name_ar ILIKE p_search_query || '%' OR cm.name_en ILIKE p_search_query || '%' THEN 1
      ELSE 2
    END,
    cm.name_ar
  LIMIT p_max_results_per_category;

  -- البحث في الفروع
  RETURN QUERY
  SELECT 
    'branch'::TEXT as suggestion_type,
    COALESCE(br.name_ar, br.name_en)::TEXT as suggestion_text,
    br.id as suggestion_id,
    80 as relevance_score
  FROM branches br
  WHERE 
    (br.name_ar ILIKE '%' || p_search_query || '%' OR br.name_en ILIKE '%' || p_search_query || '%'
     OR br.location_ar ILIKE '%' || p_search_query || '%' OR br.location_en ILIKE '%' || p_search_query || '%')
    AND br.is_active = true
  ORDER BY 
    CASE 
      WHEN br.name_ar ILIKE p_search_query || '%' OR br.name_en ILIKE p_search_query || '%' THEN 1
      ELSE 2
    END,
    br.name_ar
  LIMIT p_max_results_per_category;

  -- البحث في الألوان
  RETURN QUERY
  SELECT 
    'color'::TEXT as suggestion_type,
    COALESCE(cc.name_ar, cc.name_en)::TEXT as suggestion_text,
    cc.id as suggestion_id,
    60 as relevance_score
  FROM car_colors cc
  WHERE 
    (cc.name_ar ILIKE '%' || p_search_query || '%' OR cc.name_en ILIKE '%' || p_search_query || '%')
    AND cc.is_active = true
  ORDER BY 
    CASE 
      WHEN cc.name_ar ILIKE p_search_query || '%' OR cc.name_en ILIKE p_search_query || '%' THEN 1
      ELSE 2
    END,
    cc.name_ar
  LIMIT p_max_results_per_category;

  RETURN;
END;
$$;

-- 2. إصلاح search_branches() - إضافة cars. قبل branch_id
CREATE OR REPLACE FUNCTION public.search_branches(
  p_search_query TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
  p_has_available_cars BOOLEAN DEFAULT NULL,
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0
)
RETURNS TABLE(
  id UUID,
  name_en TEXT,
  name_ar TEXT,
  location_en TEXT,
  location_ar TEXT,
  phone TEXT,
  email TEXT,
  working_hours TEXT,
  available_cars_count BIGINT,
  total_results BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  total_count BIGINT;
BEGIN
  SELECT COUNT(DISTINCT b.id) INTO total_count
  FROM branches b
  WHERE 
    (p_search_query IS NULL OR 
     b.name_ar ILIKE '%' || p_search_query || '%' OR 
     b.name_en ILIKE '%' || p_search_query || '%' OR
     b.location_ar ILIKE '%' || p_search_query || '%' OR
     b.location_en ILIKE '%' || p_search_query || '%')
    AND b.is_active = true;

  RETURN QUERY
  SELECT 
    b.id,
    b.name_en,
    b.name_ar,
    b.location_en,
    b.location_ar,
    b.phone,
    b.email,
    b.working_hours,
    COALESCE((
      SELECT COUNT(*)
      FROM cars
      WHERE cars.branch_id = b.id 
        AND cars.status = 'available'
        AND cars.available_quantity > 0
    ), 0) as available_cars_count,
    total_count as total_results
  FROM branches b
  WHERE 
    (p_search_query IS NULL OR 
     b.name_ar ILIKE '%' || p_search_query || '%' OR 
     b.name_en ILIKE '%' || p_search_query || '%' OR
     b.location_ar ILIKE '%' || p_search_query || '%' OR
     b.location_en ILIKE '%' || p_search_query || '%')
    AND b.is_active = true
    AND (p_has_available_cars IS NULL OR EXISTS (
      SELECT 1 FROM cars 
      WHERE cars.branch_id = b.id 
        AND cars.status = 'available'
        AND cars.available_quantity > 0
    ))
  ORDER BY b.name_ar
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- 3. إصلاح search_models() - إضافة cars. قبل model_id
CREATE OR REPLACE FUNCTION public.search_models(
  p_search_query TEXT DEFAULT NULL,
  p_brand_id UUID DEFAULT NULL,
  p_year INT DEFAULT NULL,
  p_min_price NUMERIC DEFAULT NULL,
  p_max_price NUMERIC DEFAULT NULL,
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0
)
RETURNS TABLE(
  id UUID,
  name_en TEXT,
  name_ar TEXT,
  brand_name_en TEXT,
  brand_name_ar TEXT,
  year INT,
  default_image_url TEXT,
  min_daily_price NUMERIC,
  max_daily_price NUMERIC,
  available_cars_count BIGINT,
  total_results BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  total_count BIGINT;
BEGIN
  SELECT COUNT(DISTINCT m.id) INTO total_count
  FROM car_models m
  JOIN car_brands b ON m.brand_id = b.id
  WHERE 
    (p_search_query IS NULL OR 
     m.name_ar ILIKE '%' || p_search_query || '%' OR 
     m.name_en ILIKE '%' || p_search_query || '%' OR
     b.name_ar ILIKE '%' || p_search_query || '%' OR
     b.name_en ILIKE '%' || p_search_query || '%')
    AND (p_brand_id IS NULL OR m.brand_id = p_brand_id)
    AND (p_year IS NULL OR m.year = p_year)
    AND m.is_active = true
    AND b.is_active = true;

  RETURN QUERY
  SELECT 
    m.id,
    m.name_en,
    m.name_ar,
    b.name_en as brand_name_en,
    b.name_ar as brand_name_ar,
    m.year,
    m.default_image_url,
    COALESCE((SELECT MIN(daily_price) FROM cars WHERE cars.model_id = m.id AND cars.status = 'available'), 0) as min_daily_price,
    COALESCE((SELECT MAX(daily_price) FROM cars WHERE cars.model_id = m.id AND cars.status = 'available'), 0) as max_daily_price,
    COALESCE((SELECT COUNT(*) FROM cars WHERE cars.model_id = m.id AND cars.status = 'available' AND cars.available_quantity > 0), 0) as available_cars_count,
    total_count as total_results
  FROM car_models m
  JOIN car_brands b ON m.brand_id = b.id
  WHERE 
    (p_search_query IS NULL OR 
     m.name_ar ILIKE '%' || p_search_query || '%' OR 
     m.name_en ILIKE '%' || p_search_query || '%' OR
     b.name_ar ILIKE '%' || p_search_query || '%' OR
     b.name_en ILIKE '%' || p_search_query || '%')
    AND (p_brand_id IS NULL OR m.brand_id = p_brand_id)
    AND (p_year IS NULL OR m.year = p_year)
    AND (p_min_price IS NULL OR EXISTS (
      SELECT 1 FROM cars WHERE cars.model_id = m.id AND cars.daily_price >= p_min_price
    ))
    AND (p_max_price IS NULL OR EXISTS (
      SELECT 1 FROM cars WHERE cars.model_id = m.id AND cars.daily_price <= p_max_price
    ))
    AND m.is_active = true
    AND b.is_active = true
  ORDER BY m.name_ar
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- 4. إصلاح search_cars() - إضافة c. قبل daily_price في ORDER BY
CREATE OR REPLACE FUNCTION public.search_cars(
  p_search_query TEXT DEFAULT NULL,
  p_brand_id UUID DEFAULT NULL,
  p_model_id UUID DEFAULT NULL,
  p_branch_id UUID DEFAULT NULL,
  p_min_price NUMERIC DEFAULT NULL,
  p_max_price NUMERIC DEFAULT NULL,
  p_transmission TEXT DEFAULT NULL,
  p_fuel_type TEXT DEFAULT NULL,
  p_rental_type TEXT DEFAULT 'daily',
  p_sort_by TEXT DEFAULT 'relevance',
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0
)
RETURNS TABLE(
  id UUID,
  model_name_en TEXT,
  model_name_ar TEXT,
  brand_name_en TEXT,
  brand_name_ar TEXT,
  branch_name_en TEXT,
  branch_name_ar TEXT,
  color_name_en TEXT,
  color_name_ar TEXT,
  daily_price NUMERIC,
  weekly_price NUMERIC,
  monthly_price NUMERIC,
  status TEXT,
  transmission TEXT,
  fuel_type TEXT,
  seats INT,
  available_quantity INT,
  relevance_score INT,
  total_results BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  total_count BIGINT;
BEGIN
  WITH filtered_cars AS (
    SELECT 
      c.id as car_id,
      c.daily_price as car_daily_price,
      c.weekly_price as car_weekly_price,
      c.monthly_price as car_monthly_price,
      c.status as car_status,
      c.transmission as car_transmission,
      c.fuel_type as car_fuel_type,
      c.seats as car_seats,
      c.available_quantity as car_available_quantity,
      m.name_en as model_name_en,
      m.name_ar as model_name_ar,
      b.name_en as brand_name_en,
      b.name_ar as brand_name_ar,
      br.name_en as branch_name_en,
      br.name_ar as branch_name_ar,
      cc.name_en as color_name_en,
      cc.name_ar as color_name_ar,
      CASE 
        WHEN m.name_ar ILIKE p_search_query || '%' OR m.name_en ILIKE p_search_query || '%' THEN 100
        WHEN b.name_ar ILIKE p_search_query || '%' OR b.name_en ILIKE p_search_query || '%' THEN 90
        WHEN m.name_ar ILIKE '%' || p_search_query || '%' OR m.name_en ILIKE '%' || p_search_query || '%' THEN 80
        ELSE 70
      END as relevance_score
    FROM cars c
    JOIN car_models m ON c.model_id = m.id
    JOIN car_brands b ON m.brand_id = b.id
    JOIN branches br ON c.branch_id = br.id
    LEFT JOIN car_colors cc ON c.color_id = cc.id
    WHERE 
      (p_search_query IS NULL OR 
       m.name_ar ILIKE '%' || p_search_query || '%' OR 
       m.name_en ILIKE '%' || p_search_query || '%' OR
       b.name_ar ILIKE '%' || p_search_query || '%' OR
       b.name_en ILIKE '%' || p_search_query || '%')
      AND (p_brand_id IS NULL OR m.brand_id = p_brand_id)
      AND (p_model_id IS NULL OR c.model_id = p_model_id)
      AND (p_branch_id IS NULL OR c.branch_id = p_branch_id)
      AND (p_min_price IS NULL OR c.daily_price >= p_min_price)
      AND (p_max_price IS NULL OR c.daily_price <= p_max_price)
      AND (p_transmission IS NULL OR c.transmission = p_transmission)
      AND (p_fuel_type IS NULL OR c.fuel_type = p_fuel_type)
      AND c.status = 'available'
      AND c.available_quantity > 0
  )
  SELECT COUNT(*) INTO total_count FROM filtered_cars;

  RETURN QUERY
  SELECT 
    fc.car_id as id,
    fc.model_name_en,
    fc.model_name_ar,
    fc.brand_name_en,
    fc.brand_name_ar,
    fc.branch_name_en,
    fc.branch_name_ar,
    fc.color_name_en,
    fc.color_name_ar,
    fc.car_daily_price as daily_price,
    fc.car_weekly_price as weekly_price,
    fc.car_monthly_price as monthly_price,
    fc.car_status::TEXT as status,
    fc.car_transmission as transmission,
    fc.car_fuel_type as fuel_type,
    fc.car_seats as seats,
    fc.car_available_quantity as available_quantity,
    fc.relevance_score,
    total_count as total_results
  FROM filtered_cars fc
  ORDER BY 
    CASE 
      WHEN p_sort_by = 'price_asc' THEN fc.car_daily_price
      WHEN p_sort_by = 'price_desc' THEN -fc.car_daily_price
      WHEN p_sort_by = 'relevance' THEN -fc.relevance_score
      ELSE -fc.relevance_score
    END
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- 5. إصلاح advanced_car_filter() - استخدام aliases واضحة
CREATE OR REPLACE FUNCTION public.advanced_car_filter(
  p_brand_ids UUID[] DEFAULT NULL,
  p_model_ids UUID[] DEFAULT NULL,
  p_branch_ids UUID[] DEFAULT NULL,
  p_color_ids UUID[] DEFAULT NULL,
  p_feature_ids UUID[] DEFAULT NULL,
  p_min_price NUMERIC DEFAULT NULL,
  p_max_price NUMERIC DEFAULT NULL,
  p_min_year INT DEFAULT NULL,
  p_max_year INT DEFAULT NULL,
  p_transmission TEXT[] DEFAULT NULL,
  p_fuel_type TEXT[] DEFAULT NULL,
  p_min_seats INT DEFAULT NULL,
  p_max_seats INT DEFAULT NULL,
  p_rental_types TEXT[] DEFAULT NULL,
  p_is_new BOOLEAN DEFAULT NULL,
  p_has_discount BOOLEAN DEFAULT NULL,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL,
  p_sort_by TEXT DEFAULT 'price_asc',
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0
)
RETURNS TABLE(
  id UUID,
  model_name_en TEXT,
  model_name_ar TEXT,
  brand_name_en TEXT,
  brand_name_ar TEXT,
  branch_name_en TEXT,
  branch_name_ar TEXT,
  color_name_en TEXT,
  color_name_ar TEXT,
  year INT,
  daily_price NUMERIC,
  weekly_price NUMERIC,
  monthly_price NUMERIC,
  discount_percentage INT,
  final_price NUMERIC,
  transmission TEXT,
  fuel_type TEXT,
  seats INT,
  available_quantity INT,
  features TEXT[],
  total_results BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  total_count BIGINT;
BEGIN
  SELECT COUNT(DISTINCT c.id) INTO total_count
  FROM cars c
  JOIN car_models m ON c.model_id = m.id
  JOIN car_brands b ON m.brand_id = b.id
  JOIN branches br ON c.branch_id = br.id
  LEFT JOIN car_colors cc ON c.color_id = cc.id
  WHERE 
    (p_brand_ids IS NULL OR m.brand_id = ANY(p_brand_ids))
    AND (p_model_ids IS NULL OR c.model_id = ANY(p_model_ids))
    AND (p_branch_ids IS NULL OR c.branch_id = ANY(p_branch_ids))
    AND (p_color_ids IS NULL OR c.color_id = ANY(p_color_ids))
    AND (p_min_price IS NULL OR c.daily_price >= p_min_price)
    AND (p_max_price IS NULL OR c.daily_price <= p_max_price)
    AND (p_min_year IS NULL OR m.year >= p_min_year)
    AND (p_max_year IS NULL OR m.year <= p_max_year)
    AND (p_transmission IS NULL OR c.transmission = ANY(p_transmission))
    AND (p_fuel_type IS NULL OR c.fuel_type = ANY(p_fuel_type))
    AND (p_min_seats IS NULL OR c.seats >= p_min_seats)
    AND (p_max_seats IS NULL OR c.seats <= p_max_seats)
    AND (p_rental_types IS NULL OR c.rental_types && p_rental_types::rental_type[])
    AND (p_is_new IS NULL OR c.is_new = p_is_new)
    AND (p_has_discount IS NULL OR (p_has_discount = true AND c.discount_percentage > 0) OR (p_has_discount = false))
    AND c.status = 'available'
    AND c.available_quantity > 0
    AND (p_feature_ids IS NULL OR c.features @> p_feature_ids);

  RETURN QUERY
  SELECT 
    c.id,
    m.name_en as model_name_en_result,
    m.name_ar as model_name_ar_result,
    b.name_en as brand_name_en_result,
    b.name_ar as brand_name_ar_result,
    br.name_en as branch_name_en_result,
    br.name_ar as branch_name_ar_result,
    cc.name_en as color_name_en_result,
    cc.name_ar as color_name_ar_result,
    m.year,
    c.daily_price,
    c.weekly_price,
    c.monthly_price,
    c.discount_percentage,
    CASE 
      WHEN c.discount_percentage > 0 THEN c.daily_price * (1 - c.discount_percentage::NUMERIC / 100)
      ELSE c.daily_price
    END as final_price,
    c.transmission,
    c.fuel_type,
    c.seats,
    c.available_quantity,
    c.features_ar as features,
    total_count as total_results
  FROM cars c
  JOIN car_models m ON c.model_id = m.id
  JOIN car_brands b ON m.brand_id = b.id
  JOIN branches br ON c.branch_id = br.id
  LEFT JOIN car_colors cc ON c.color_id = cc.id
  WHERE 
    (p_brand_ids IS NULL OR m.brand_id = ANY(p_brand_ids))
    AND (p_model_ids IS NULL OR c.model_id = ANY(p_model_ids))
    AND (p_branch_ids IS NULL OR c.branch_id = ANY(p_branch_ids))
    AND (p_color_ids IS NULL OR c.color_id = ANY(p_color_ids))
    AND (p_min_price IS NULL OR c.daily_price >= p_min_price)
    AND (p_max_price IS NULL OR c.daily_price <= p_max_price)
    AND (p_min_year IS NULL OR m.year >= p_min_year)
    AND (p_max_year IS NULL OR m.year <= p_max_year)
    AND (p_transmission IS NULL OR c.transmission = ANY(p_transmission))
    AND (p_fuel_type IS NULL OR c.fuel_type = ANY(p_fuel_type))
    AND (p_min_seats IS NULL OR c.seats >= p_min_seats)
    AND (p_max_seats IS NULL OR c.seats <= p_max_seats)
    AND (p_rental_types IS NULL OR c.rental_types && p_rental_types::rental_type[])
    AND (p_is_new IS NULL OR c.is_new = p_is_new)
    AND (p_has_discount IS NULL OR (p_has_discount = true AND c.discount_percentage > 0) OR (p_has_discount = false))
    AND c.status = 'available'
    AND c.available_quantity > 0
    AND (p_feature_ids IS NULL OR c.features @> p_feature_ids)
  ORDER BY 
    CASE 
      WHEN p_sort_by = 'price_asc' THEN c.daily_price
      WHEN p_sort_by = 'price_desc' THEN -c.daily_price
      WHEN p_sort_by = 'year_desc' THEN -m.year
      WHEN p_sort_by = 'discount' THEN -c.discount_percentage
      ELSE c.daily_price
    END
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- إضافة تعليقات على الدوال المحدثة
COMMENT ON FUNCTION public.quick_search_suggestions(TEXT, INT) IS 'توفير اقتراحات سريعة للبحث - تم إصلاح أسماء الجداول';
COMMENT ON FUNCTION public.search_branches(TEXT, TEXT, BOOLEAN, INT, INT) IS 'البحث في الفروع - تم إصلاح الأعمدة الغامضة';
COMMENT ON FUNCTION public.search_models(TEXT, UUID, INT, NUMERIC, NUMERIC, INT, INT) IS 'البحث في الموديلات - تم إصلاح الأعمدة الغامضة';
COMMENT ON FUNCTION public.search_cars(TEXT, UUID, UUID, UUID, NUMERIC, NUMERIC, TEXT, TEXT, TEXT, TEXT, INT, INT) IS 'البحث في السيارات - تم إصلاح الأعمدة الغامضة';
COMMENT ON FUNCTION public.advanced_car_filter(UUID[], UUID[], UUID[], UUID[], UUID[], NUMERIC, NUMERIC, INT, INT, TEXT[], TEXT[], INT, INT, TEXT[], BOOLEAN, BOOLEAN, DATE, DATE, TEXT, INT, INT) IS 'فلتر متقدم للسيارات - تم إصلاح الأعمدة الغامضة';