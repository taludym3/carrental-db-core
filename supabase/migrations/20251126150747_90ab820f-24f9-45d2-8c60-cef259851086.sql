-- Drop existing function
DROP FUNCTION IF EXISTS search_cars(TEXT, UUID, UUID, UUID, NUMERIC, NUMERIC, TEXT, TEXT, TEXT, TEXT, INT, INT);

-- Create improved search_cars function with all fixes
CREATE OR REPLACE FUNCTION search_cars(
  p_search_query TEXT DEFAULT NULL,
  p_brand_id UUID DEFAULT NULL,
  p_model_id UUID DEFAULT NULL,
  p_branch_id UUID DEFAULT NULL,
  p_min_price NUMERIC DEFAULT NULL,
  p_max_price NUMERIC DEFAULT NULL,
  p_transmission TEXT DEFAULT NULL,
  p_fuel_type TEXT DEFAULT NULL,
  p_rental_type TEXT DEFAULT NULL,
  p_sort_by TEXT DEFAULT 'relevance',
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  model_name_en TEXT,
  model_name_ar TEXT,
  brand_name_en TEXT,
  brand_name_ar TEXT,
  branch_name_en TEXT,
  branch_name_ar TEXT,
  color_name_en TEXT,
  color_name_ar TEXT,
  default_image_url TEXT,
  year INT,
  branch_id UUID,
  daily_price NUMERIC,
  weekly_price NUMERIC,
  monthly_price NUMERIC,
  discount_percentage INT,
  offer_expires_at TIMESTAMPTZ,
  is_new BOOLEAN,
  mileage INT,
  status car_status,
  transmission TEXT,
  fuel_type TEXT,
  seats INT,
  available_quantity INT,
  features_ar TEXT[],
  features_en TEXT[],
  rental_types rental_type[],
  relevance_score FLOAT,
  total_results BIGINT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_count BIGINT;
BEGIN
  -- Get total count first
  SELECT COUNT(*)
  INTO v_total_count
  FROM cars c
  INNER JOIN car_models m ON c.model_id = m.id
  INNER JOIN car_brands b ON m.brand_id = b.id
  INNER JOIN branches br ON c.branch_id = br.id
  LEFT JOIN car_colors col ON c.color_id = col.id
  WHERE c.status = 'available'
    AND m.is_active = true
    AND b.is_active = true
    AND br.is_active = true
    AND (p_search_query IS NULL OR (
      m.name_en ILIKE '%' || p_search_query || '%' OR
      m.name_ar ILIKE '%' || p_search_query || '%' OR
      b.name_en ILIKE '%' || p_search_query || '%' OR
      b.name_ar ILIKE '%' || p_search_query || '%'
    ))
    AND (p_brand_id IS NULL OR b.id = p_brand_id)
    AND (p_model_id IS NULL OR m.id = p_model_id)
    AND (p_branch_id IS NULL OR br.id = p_branch_id)
    AND (p_min_price IS NULL OR c.daily_price >= p_min_price)
    AND (p_max_price IS NULL OR c.daily_price <= p_max_price)
    AND (p_transmission IS NULL OR c.transmission = p_transmission)
    AND (p_fuel_type IS NULL OR c.fuel_type = p_fuel_type)
    AND (p_rental_type IS NULL OR p_rental_type::rental_type = ANY(c.rental_types));

  -- Return results with all fields
  RETURN QUERY
  SELECT
    c.id,
    m.name_en,
    m.name_ar,
    b.name_en,
    b.name_ar,
    br.name_en,
    br.name_ar,
    col.name_en,
    col.name_ar,
    m.default_image_url,
    m.year,
    c.branch_id,
    c.daily_price,
    c.weekly_price,
    c.monthly_price,
    c.discount_percentage,
    c.offer_expires_at,
    c.is_new,
    c.mileage,
    c.status,
    c.transmission,
    c.fuel_type,
    c.seats,
    c.available_quantity,
    c.features_ar,
    c.features_en,
    c.rental_types,
    CASE
      WHEN p_search_query IS NULL THEN 1.0
      ELSE (
        CASE WHEN m.name_en ILIKE '%' || p_search_query || '%' THEN 2.0 ELSE 0.0 END +
        CASE WHEN m.name_ar ILIKE '%' || p_search_query || '%' THEN 2.0 ELSE 0.0 END +
        CASE WHEN b.name_en ILIKE '%' || p_search_query || '%' THEN 1.5 ELSE 0.0 END +
        CASE WHEN b.name_ar ILIKE '%' || p_search_query || '%' THEN 1.5 ELSE 0.0 END
      )
    END AS relevance_score,
    v_total_count
  FROM cars c
  INNER JOIN car_models m ON c.model_id = m.id
  INNER JOIN car_brands b ON m.brand_id = b.id
  INNER JOIN branches br ON c.branch_id = br.id
  LEFT JOIN car_colors col ON c.color_id = col.id
  WHERE c.status = 'available'
    AND m.is_active = true
    AND b.is_active = true
    AND br.is_active = true
    AND (p_search_query IS NULL OR (
      m.name_en ILIKE '%' || p_search_query || '%' OR
      m.name_ar ILIKE '%' || p_search_query || '%' OR
      b.name_en ILIKE '%' || p_search_query || '%' OR
      b.name_ar ILIKE '%' || p_search_query || '%'
    ))
    AND (p_brand_id IS NULL OR b.id = p_brand_id)
    AND (p_model_id IS NULL OR m.id = p_model_id)
    AND (p_branch_id IS NULL OR br.id = p_branch_id)
    AND (p_min_price IS NULL OR c.daily_price >= p_min_price)
    AND (p_max_price IS NULL OR c.daily_price <= p_max_price)
    AND (p_transmission IS NULL OR c.transmission = p_transmission)
    AND (p_fuel_type IS NULL OR c.fuel_type = p_fuel_type)
    AND (p_rental_type IS NULL OR p_rental_type::rental_type = ANY(c.rental_types))
  ORDER BY
    CASE WHEN p_sort_by = 'relevance' THEN 
      CASE
        WHEN p_search_query IS NULL THEN 1.0
        ELSE (
          CASE WHEN m.name_en ILIKE '%' || p_search_query || '%' THEN 2.0 ELSE 0.0 END +
          CASE WHEN m.name_ar ILIKE '%' || p_search_query || '%' THEN 2.0 ELSE 0.0 END +
          CASE WHEN b.name_en ILIKE '%' || p_search_query || '%' THEN 1.5 ELSE 0.0 END +
          CASE WHEN b.name_ar ILIKE '%' || p_search_query || '%' THEN 1.5 ELSE 0.0 END
        )
      END
    END DESC,
    CASE WHEN p_sort_by = 'price_asc' THEN c.daily_price END ASC,
    CASE WHEN p_sort_by = 'price_desc' THEN c.daily_price END DESC,
    CASE WHEN p_sort_by = 'newest' THEN c.created_at END DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;