-- المرحلة 3: دوال البحث الإضافية

-- 3.2 search_branches()
CREATE FUNCTION public.search_branches(
  search_query TEXT DEFAULT NULL, search_language TEXT DEFAULT NULL, user_lat DECIMAL DEFAULT NULL, user_lon DECIMAL DEFAULT NULL,
  max_distance_km DECIMAL DEFAULT NULL, is_active_filter BOOLEAN DEFAULT TRUE, page_size INTEGER DEFAULT 20, page_number INTEGER DEFAULT 1
)
RETURNS TABLE(branch_id UUID, name_ar TEXT, name_en TEXT, location_ar TEXT, location_en TEXT, description_ar TEXT, description_en TEXT, phone TEXT, email TEXT, working_hours TEXT, images TEXT[], latitude DECIMAL, longitude DECIMAL, manager_name TEXT, cars_count INTEGER, distance_km DECIMAL, search_rank REAL)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  offset_value INTEGER; detected_lang TEXT;
BEGIN
  offset_value := (page_number - 1) * page_size;
  detected_lang := COALESCE(search_language, CASE WHEN search_query IS NOT NULL AND search_query != '' THEN detect_language(search_query) ELSE 'ar' END);

  RETURN QUERY
  SELECT b.id, b.name_ar, b.name_en, b.location_ar, b.location_en, b.description_ar, b.description_en,
    b.phone, b.email, b.working_hours, b.images, b.latitude, b.longitude, p.full_name,
    (SELECT COUNT(*)::INTEGER FROM public.cars WHERE branch_id = b.id AND status = 'available'),
    CASE WHEN user_lat IS NOT NULL AND user_lon IS NOT NULL AND b.geom IS NOT NULL 
      THEN ROUND((ST_Distance(b.geom, ST_SetSRID(ST_MakePoint(user_lon, user_lat), 4326)) / 1000)::DECIMAL, 2) ELSE NULL END,
    CASE WHEN search_query IS NOT NULL AND search_query != '' THEN
      CASE WHEN detected_lang = 'ar' THEN ts_rank(to_tsvector('arabic', COALESCE(b.name_ar || ' ' || b.location_ar, '')), plainto_tsquery('arabic', search_query))
      ELSE ts_rank(to_tsvector('english', COALESCE(b.name_en || ' ' || b.location_en, '')), plainto_tsquery('english', search_query)) END
    ELSE 0.5 END
  FROM public.branches b
  LEFT JOIN public.profiles p ON b.manager_id = p.user_id
  WHERE (is_active_filter IS NULL OR b.is_active = is_active_filter)
    AND (search_query IS NULL OR search_query = '' OR 
      CASE WHEN detected_lang = 'ar' THEN (b.name_ar ILIKE '%' || search_query || '%' OR b.location_ar ILIKE '%' || search_query || '%')
      ELSE (b.name_en ILIKE '%' || search_query || '%' OR b.location_en ILIKE '%' || search_query || '%') END)
    AND (user_lat IS NULL OR user_lon IS NULL OR max_distance_km IS NULL OR ST_DWithin(b.geom, ST_SetSRID(ST_MakePoint(user_lon, user_lat), 4326), max_distance_km * 1000))
  ORDER BY distance_km ASC NULLS LAST, search_rank DESC, b.name_ar
  LIMIT page_size OFFSET offset_value;
END;
$$;

-- 3.3 search_models()
CREATE FUNCTION public.search_models(
  search_query TEXT DEFAULT NULL, search_language TEXT DEFAULT NULL, brand_ids UUID[] DEFAULT NULL,
  min_year INTEGER DEFAULT NULL, max_year INTEGER DEFAULT NULL, is_active_filter BOOLEAN DEFAULT TRUE,
  page_size INTEGER DEFAULT 20, page_number INTEGER DEFAULT 1
)
RETURNS TABLE(model_id UUID, name_ar TEXT, name_en TEXT, description_ar TEXT, description_en TEXT, year INTEGER, brand_name_ar TEXT, brand_name_en TEXT, brand_logo_url TEXT, default_image_url TEXT, specifications JSONB, available_cars_count INTEGER, min_daily_price DECIMAL, search_rank REAL)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  offset_value INTEGER; detected_lang TEXT;
BEGIN
  offset_value := (page_number - 1) * page_size;
  detected_lang := COALESCE(search_language, CASE WHEN search_query IS NOT NULL AND search_query != '' THEN detect_language(search_query) ELSE 'ar' END);

  RETURN QUERY
  SELECT cm.id, cm.name_ar, cm.name_en, cm.description_ar, cm.description_en, cm.year, cb.name_ar, cb.name_en, cb.logo_url, cm.default_image_url, cm.specifications,
    (SELECT COUNT(*)::INTEGER FROM public.cars WHERE model_id = cm.id AND status = 'available'),
    (SELECT MIN(daily_price) FROM public.cars WHERE model_id = cm.id AND status = 'available'),
    CASE WHEN search_query IS NOT NULL AND search_query != '' THEN
      CASE WHEN detected_lang = 'ar' THEN ts_rank(to_tsvector('arabic', COALESCE(cm.name_ar || ' ' || cm.description_ar, '')), plainto_tsquery('arabic', search_query))
      ELSE ts_rank(to_tsvector('english', COALESCE(cm.name_en || ' ' || cm.description_en, '')), plainto_tsquery('english', search_query)) END
    ELSE 0.5 END
  FROM public.car_models cm
  JOIN public.car_brands cb ON cm.brand_id = cb.id
  WHERE (is_active_filter IS NULL OR cm.is_active = is_active_filter)
    AND (brand_ids IS NULL OR cm.brand_id = ANY(brand_ids))
    AND (min_year IS NULL OR cm.year >= min_year) AND (max_year IS NULL OR cm.year <= max_year)
    AND (search_query IS NULL OR search_query = '' OR 
      CASE WHEN detected_lang = 'ar' THEN (cm.name_ar ILIKE '%' || search_query || '%' OR cm.description_ar ILIKE '%' || search_query || '%')
      ELSE (cm.name_en ILIKE '%' || search_query || '%' OR cm.description_en ILIKE '%' || search_query || '%') END)
  ORDER BY search_rank DESC, available_cars_count DESC, cm.year DESC
  LIMIT page_size OFFSET offset_value;
END;
$$;

-- 3.4 advanced_car_filter()
CREATE FUNCTION public.advanced_car_filter(
  availability_start_date DATE DEFAULT NULL, availability_end_date DATE DEFAULT NULL, offers_only BOOLEAN DEFAULT FALSE,
  max_offer_discount DECIMAL DEFAULT NULL, required_features TEXT[] DEFAULT NULL, preferred_features TEXT[] DEFAULT NULL,
  budget_range TEXT DEFAULT NULL, user_lat DECIMAL DEFAULT NULL, user_lon DECIMAL DEFAULT NULL, preferred_branches UUID[] DEFAULT NULL,
  include_statistics BOOLEAN DEFAULT FALSE, page_size INTEGER DEFAULT 20, page_number INTEGER DEFAULT 1
)
RETURNS TABLE (car_id UUID, brand_name TEXT, model_name TEXT, year INTEGER, daily_price DECIMAL, branch_name TEXT, distance_km DECIMAL, availability_score INTEGER, feature_match_score INTEGER, overall_score DECIMAL)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE offset_value INTEGER; price_min DECIMAL; price_max DECIMAL;
BEGIN
  offset_value := (page_number - 1) * page_size;
  CASE budget_range
    WHEN 'budget' THEN price_min := 0; price_max := 200;
    WHEN 'mid_range' THEN price_min := 200; price_max := 500;
    WHEN 'luxury' THEN price_min := 500; price_max := NULL;
    ELSE price_min := NULL; price_max := NULL;
  END CASE;

  RETURN QUERY
  WITH available_cars AS (
    SELECT c.id, c.daily_price, c.features_ar, c.features_en, c.branch_id, cm.name_en, cm.year, cb.name_en, b.name_en, b.geom,
      CASE WHEN availability_start_date IS NULL THEN 100 WHEN public.get_actual_available_quantity(c.id) > 0 THEN 100 ELSE 0 END,
      CASE WHEN required_features IS NULL THEN 100 WHEN c.features_en @> required_features THEN 100 ELSE 0 END + 
      CASE WHEN preferred_features IS NULL THEN 0 ELSE (SELECT (COUNT(*) * 100 / array_length(preferred_features, 1))::INTEGER FROM unnest(preferred_features) feature WHERE feature = ANY(c.features_en)) END
    FROM public.cars c
    JOIN public.car_models cm ON c.model_id = cm.id
    JOIN public.car_brands cb ON cm.brand_id = cb.id
    JOIN public.branches b ON c.branch_id = b.id
    WHERE c.status = 'available' AND public.get_actual_available_quantity(c.id) > 0 AND b.is_active = TRUE
      AND (price_min IS NULL OR c.daily_price >= price_min) AND (price_max IS NULL OR c.daily_price <= price_max)
      AND (preferred_branches IS NULL OR c.branch_id = ANY(preferred_branches))
      AND (NOT offers_only OR EXISTS (SELECT 1 FROM public.car_offers co WHERE co.car_id = c.id AND co.is_active = TRUE AND co.valid_until >= NOW() AND (max_offer_discount IS NULL OR co.discount_value <= max_offer_discount)))
      AND (required_features IS NULL OR c.features_en @> required_features)
  )
  SELECT ac.id, ac.name_en, ac.name_en, ac.year, ac.daily_price, ac.name_en,
    CASE WHEN user_lat IS NOT NULL AND user_lon IS NOT NULL AND ac.geom IS NOT NULL 
      THEN ROUND((ST_Distance(ac.geom, ST_SetSRID(ST_MakePoint(user_lon, user_lat), 4326)) / 1000)::DECIMAL, 2) ELSE NULL END,
    ac.availability_score, ac.feature_match_score,
    (ac.availability_score * 0.4 + ac.feature_match_score * 0.3 + CASE WHEN user_lat IS NOT NULL AND user_lon IS NOT NULL AND ac.geom IS NOT NULL 
      THEN GREATEST(0, 100 - (ST_Distance(ac.geom, ST_SetSRID(ST_MakePoint(user_lon, user_lat), 4326)) / 1000)) * 0.3 ELSE 50 END)
  FROM available_cars ac
  WHERE ac.availability_score > 0 AND (required_features IS NULL OR ac.feature_match_score >= 100)
  ORDER BY overall_score DESC, ac.daily_price ASC
  LIMIT page_size OFFSET offset_value;
END;
$$;

-- 3.5 get_search_statistics()
CREATE FUNCTION public.get_search_statistics()
RETURNS TABLE(total_brands INTEGER, active_brands INTEGER, total_models INTEGER, active_models INTEGER, total_branches INTEGER, active_branches INTEGER, total_cars INTEGER, available_cars INTEGER, total_bookings INTEGER, active_bookings INTEGER)
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
  SELECT 
    (SELECT COUNT(*)::INTEGER FROM car_brands), (SELECT COUNT(*)::INTEGER FROM car_brands WHERE is_active = true),
    (SELECT COUNT(*)::INTEGER FROM car_models), (SELECT COUNT(*)::INTEGER FROM car_models WHERE is_active = true),
    (SELECT COUNT(*)::INTEGER FROM branches), (SELECT COUNT(*)::INTEGER FROM branches WHERE is_active = true),
    (SELECT COUNT(*)::INTEGER FROM cars), (SELECT COUNT(*)::INTEGER FROM cars WHERE status = 'available'),
    (SELECT COUNT(*)::INTEGER FROM bookings), (SELECT COUNT(*)::INTEGER FROM bookings WHERE status IN ('pending', 'confirmed', 'payment_pending', 'active'));
$$;