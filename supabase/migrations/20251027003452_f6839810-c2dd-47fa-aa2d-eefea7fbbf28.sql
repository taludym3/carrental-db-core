-- المرحلة 3: دوال البحث الأساسية

-- 3.1 search_cars() - الدالة الأساسية للبحث عن السيارات
CREATE FUNCTION public.search_cars(
  search_query text DEFAULT NULL,
  search_language text DEFAULT NULL,
  branch_ids uuid[] DEFAULT NULL,
  brand_ids uuid[] DEFAULT NULL,
  model_ids uuid[] DEFAULT NULL,
  color_ids uuid[] DEFAULT NULL,
  min_price numeric DEFAULT NULL,
  max_price numeric DEFAULT NULL,
  price_type text DEFAULT 'daily',
  min_seats integer DEFAULT NULL,
  max_seats integer DEFAULT NULL,
  fuel_types text[] DEFAULT NULL,
  transmission_types text[] DEFAULT NULL,
  p_rental_types rental_type[] DEFAULT NULL,
  include_new_only boolean DEFAULT false,
  include_discounted_only boolean DEFAULT false,
  car_status_filter car_status[] DEFAULT '{available}',
  user_lat numeric DEFAULT NULL,
  user_lon numeric DEFAULT NULL,
  max_distance_km numeric DEFAULT NULL,
  sort_by text DEFAULT 'distance',
  page_size integer DEFAULT 20,
  page_number integer DEFAULT 1
)
RETURNS TABLE(
  car_id uuid, brand_name_ar text, brand_name_en text, brand_logo_url text, model_name_ar text, model_name_en text,
  model_year integer, main_image_url text, color_name_ar text, color_name_en text, color_hex_code text,
  daily_price numeric, weekly_price numeric, monthly_price numeric, ownership_price numeric,
  seats integer, fuel_type text, transmission text, mileage integer, description_ar text, description_en text,
  features_ar text[], features_en text[], additional_images text[], quantity integer, available_quantity integer,
  status car_status, is_new boolean, discount_percentage integer, offer_expires_at timestamp with time zone,
  rental_types rental_type[], branch_id uuid, branch_name_ar text, branch_name_en text, branch_location_ar text, branch_location_en text, branch_phone text,
  distance_km numeric, best_offer_id uuid, best_offer_name_ar text, best_offer_name_en text, best_offer_discount numeric, search_rank real
)
LANGUAGE plpgsql STABLE SET search_path TO 'public'
AS $$
DECLARE
  offset_value INTEGER;
  detected_lang text;
BEGIN
  offset_value := (page_number - 1) * page_size;
  detected_lang := COALESCE(search_language, CASE WHEN search_query IS NOT NULL AND search_query != '' THEN detect_language(search_query) ELSE 'ar' END);

  RETURN QUERY
  WITH car_search AS (
    SELECT c.id, cb.name_ar, cb.name_en, cb.logo_url, cm.name_ar, cm.name_en, cm.year, cm.default_image_url,
      cc.name_ar, cc.name_en, cc.hex_code, c.daily_price, c.weekly_price, c.monthly_price, c.ownership_price,
      c.seats, c.fuel_type, c.transmission, c.mileage, COALESCE(c.description_ar, cm.description_ar), COALESCE(c.description_en, cm.description_en),
      c.features_ar, c.features_en, c.additional_images, c.quantity, public.get_actual_available_quantity(c.id), c.status,
      c.is_new, c.discount_percentage, c.offer_expires_at, c.rental_types, c.branch_id,
      b.name_ar, b.name_en, b.location_ar, b.location_en, b.phone,
      CASE WHEN user_lat IS NOT NULL AND user_lon IS NOT NULL AND b.geom IS NOT NULL 
        THEN ROUND((ST_Distance(b.geom, ST_SetSRID(ST_MakePoint(user_lon, user_lat), 4326)) / 1000)::DECIMAL, 2) 
        ELSE NULL END,
      CASE WHEN search_query IS NOT NULL AND search_query != '' THEN
        CASE WHEN detected_lang = 'ar' THEN ts_rank(to_tsvector('arabic', COALESCE(cb.name_ar || ' ' || cm.name_ar, '')), plainto_tsquery('arabic', search_query))
        ELSE ts_rank(to_tsvector('english', COALESCE(cb.name_en || ' ' || cm.name_en, '')), plainto_tsquery('english', search_query)) END
      ELSE 0.5 END
    FROM public.cars c
    JOIN public.branches b ON c.branch_id = b.id
    JOIN public.car_models cm ON c.model_id = cm.id
    JOIN public.car_brands cb ON cm.brand_id = cb.id
    JOIN public.car_colors cc ON c.color_id = cc.id
    WHERE b.is_active = TRUE AND c.status = ANY(car_status_filter)
      AND (branch_ids IS NULL OR c.branch_id = ANY(branch_ids))
      AND (brand_ids IS NULL OR cb.id = ANY(brand_ids))
      AND (model_ids IS NULL OR cm.id = ANY(model_ids))
      AND (color_ids IS NULL OR cc.id = ANY(color_ids))
      AND (min_price IS NULL OR CASE WHEN price_type = 'daily' THEN c.daily_price WHEN price_type = 'weekly' THEN c.weekly_price WHEN price_type = 'monthly' THEN c.monthly_price ELSE c.daily_price END >= min_price)
      AND (max_price IS NULL OR CASE WHEN price_type = 'daily' THEN c.daily_price WHEN price_type = 'weekly' THEN c.weekly_price WHEN price_type = 'monthly' THEN c.monthly_price ELSE c.daily_price END <= max_price)
      AND (min_seats IS NULL OR c.seats >= min_seats) AND (max_seats IS NULL OR c.seats <= max_seats)
      AND (fuel_types IS NULL OR c.fuel_type = ANY(fuel_types)) AND (transmission_types IS NULL OR c.transmission = ANY(transmission_types))
      AND (p_rental_types IS NULL OR c.rental_types && p_rental_types)
      AND (include_new_only = FALSE OR c.is_new = TRUE) AND (include_discounted_only = FALSE OR c.discount_percentage > 0)
      AND (search_query IS NULL OR search_query = '' OR 
        CASE WHEN detected_lang = 'ar' THEN (to_tsvector('arabic', COALESCE(cb.name_ar || ' ' || cm.name_ar || ' ' || cm.description_ar, '')) @@ plainto_tsquery('arabic', search_query) OR cb.name_ar ILIKE '%' || search_query || '%' OR cm.name_ar ILIKE '%' || search_query || '%')
        ELSE (to_tsvector('english', COALESCE(cb.name_en || ' ' || cm.name_en || ' ' || cm.description_en, '')) @@ plainto_tsquery('english', search_query) OR cb.name_en ILIKE '%' || search_query || '%' OR cm.name_en ILIKE '%' || search_query || '%') END)
      AND (user_lat IS NULL OR user_lon IS NULL OR max_distance_km IS NULL OR ST_DWithin(b.geom, ST_SetSRID(ST_MakePoint(user_lon, user_lat), 4326), max_distance_km * 1000))
  ),
  car_with_offers AS (
    SELECT cs.*, co.id, co.offer_name_ar, co.offer_name_en, co.discount_value
    FROM car_search cs
    LEFT JOIN LATERAL (SELECT co.id, co.offer_name_ar, co.offer_name_en, co.discount_value FROM public.car_offers co
      WHERE co.car_id = cs.id AND co.is_active = TRUE AND co.valid_from <= NOW() AND co.valid_until >= NOW() AND (co.max_uses IS NULL OR co.current_uses < co.max_uses)
      ORDER BY co.discount_value DESC LIMIT 1) co ON true
  )
  SELECT * FROM car_with_offers
  ORDER BY 
    CASE WHEN sort_by = 'price_asc' THEN daily_price END ASC,
    CASE WHEN sort_by = 'price_desc' THEN daily_price END DESC,
    CASE WHEN sort_by = 'newest' THEN model_year END DESC,
    CASE WHEN sort_by = 'discount' THEN discount_percentage END DESC,
    CASE WHEN sort_by = 'distance' OR sort_by IS NULL THEN distance_km END ASC NULLS LAST,
    search_rank DESC, daily_price ASC
  LIMIT page_size OFFSET offset_value;
END;
$$;