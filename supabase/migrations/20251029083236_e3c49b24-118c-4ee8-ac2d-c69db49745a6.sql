-- إصلاح المشاكل المتبقية في دالتي search_cars و advanced_car_filter

-- 1. إصلاح search_cars() - مشكلة CTE
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
  -- حساب إجمالي النتائج
  SELECT COUNT(DISTINCT c.id) INTO total_count
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
    AND c.available_quantity > 0;

  -- إرجاع النتائج
  RETURN QUERY
  SELECT 
    c.id,
    m.name_en as model_name_en,
    m.name_ar as model_name_ar,
    b.name_en as brand_name_en,
    b.name_ar as brand_name_ar,
    br.name_en as branch_name_en,
    br.name_ar as branch_name_ar,
    cc.name_en as color_name_en,
    cc.name_ar as color_name_ar,
    c.daily_price,
    c.weekly_price,
    c.monthly_price,
    c.status::TEXT,
    c.transmission,
    c.fuel_type,
    c.seats,
    c.available_quantity,
    CASE 
      WHEN m.name_ar ILIKE p_search_query || '%' OR m.name_en ILIKE p_search_query || '%' THEN 100
      WHEN b.name_ar ILIKE p_search_query || '%' OR b.name_en ILIKE p_search_query || '%' THEN 90
      WHEN m.name_ar ILIKE '%' || p_search_query || '%' OR m.name_en ILIKE '%' || p_search_query || '%' THEN 80
      ELSE 70
    END as relevance_score,
    total_count as total_results
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
  ORDER BY 
    CASE 
      WHEN p_sort_by = 'price_asc' THEN c.daily_price
      WHEN p_sort_by = 'price_desc' THEN -c.daily_price
      WHEN p_sort_by = 'relevance' THEN -(CASE 
        WHEN m.name_ar ILIKE p_search_query || '%' OR m.name_en ILIKE p_search_query || '%' THEN 100
        WHEN b.name_ar ILIKE p_search_query || '%' OR b.name_en ILIKE p_search_query || '%' THEN 90
        WHEN m.name_ar ILIKE '%' || p_search_query || '%' OR m.name_en ILIKE '%' || p_search_query || '%' THEN 80
        ELSE 70
      END)
      ELSE -(CASE 
        WHEN m.name_ar ILIKE p_search_query || '%' OR m.name_en ILIKE p_search_query || '%' THEN 100
        WHEN b.name_ar ILIKE p_search_query || '%' OR b.name_en ILIKE p_search_query || '%' THEN 90
        WHEN m.name_ar ILIKE '%' || p_search_query || '%' OR m.name_en ILIKE '%' || p_search_query || '%' THEN 80
        ELSE 70
      END)
    END
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- 2. إصلاح advanced_car_filter() - features هو text[] وليس uuid[]
CREATE OR REPLACE FUNCTION public.advanced_car_filter(
  p_brand_ids UUID[] DEFAULT NULL,
  p_model_ids UUID[] DEFAULT NULL,
  p_branch_ids UUID[] DEFAULT NULL,
  p_color_ids UUID[] DEFAULT NULL,
  p_feature_names TEXT[] DEFAULT NULL,
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
    AND (p_feature_names IS NULL OR c.features_ar && p_feature_names);

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
    AND (p_feature_names IS NULL OR c.features_ar && p_feature_names)
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

COMMENT ON FUNCTION public.search_cars(TEXT, UUID, UUID, UUID, NUMERIC, NUMERIC, TEXT, TEXT, TEXT, TEXT, INT, INT) IS 'البحث في السيارات - تم إصلاح مشكلة CTE';
COMMENT ON FUNCTION public.advanced_car_filter(UUID[], UUID[], UUID[], UUID[], TEXT[], NUMERIC, NUMERIC, INT, INT, TEXT[], TEXT[], INT, INT, TEXT[], BOOLEAN, BOOLEAN, DATE, DATE, TEXT, INT, INT) IS 'فلتر متقدم للسيارات - تم تغيير p_feature_ids إلى p_feature_names';