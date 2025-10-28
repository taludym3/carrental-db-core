-- إضافة دالة الاقتراحات السريعة للبحث

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
    name_ar::TEXT as suggestion_text,
    id as suggestion_id,
    100 as relevance_score
  FROM brands
  WHERE 
    (name_ar ILIKE '%' || p_search_query || '%' OR name_en ILIKE '%' || p_search_query || '%')
    AND deleted_at IS NULL
  ORDER BY 
    CASE 
      WHEN name_ar ILIKE p_search_query || '%' OR name_en ILIKE p_search_query || '%' THEN 1
      ELSE 2
    END,
    name_ar
  LIMIT p_max_results_per_category;

  -- البحث في الموديلات
  RETURN QUERY
  SELECT 
    'model'::TEXT as suggestion_type,
    (m.name_ar || ' - ' || b.name_ar)::TEXT as suggestion_text,
    m.id as suggestion_id,
    90 as relevance_score
  FROM models m
  JOIN brands b ON m.brand_id = b.id
  WHERE 
    (m.name_ar ILIKE '%' || p_search_query || '%' OR m.name_en ILIKE '%' || p_search_query || '%')
    AND m.deleted_at IS NULL
    AND b.deleted_at IS NULL
  ORDER BY 
    CASE 
      WHEN m.name_ar ILIKE p_search_query || '%' OR m.name_en ILIKE p_search_query || '%' THEN 1
      ELSE 2
    END,
    m.name_ar
  LIMIT p_max_results_per_category;

  -- البحث في الفروع
  RETURN QUERY
  SELECT 
    'branch'::TEXT as suggestion_type,
    name_ar::TEXT as suggestion_text,
    id as suggestion_id,
    80 as relevance_score
  FROM branches
  WHERE 
    (name_ar ILIKE '%' || p_search_query || '%' OR name_en ILIKE '%' || p_search_query || '%'
     OR city ILIKE '%' || p_search_query || '%' OR region ILIKE '%' || p_search_query || '%')
    AND deleted_at IS NULL
  ORDER BY 
    CASE 
      WHEN name_ar ILIKE p_search_query || '%' OR name_en ILIKE p_search_query || '%' THEN 1
      ELSE 2
    END,
    name_ar
  LIMIT p_max_results_per_category;

  -- البحث في السيارات (حسب رقم اللوحة أو الشاسيه)
  RETURN QUERY
  SELECT 
    'car'::TEXT as suggestion_type,
    (plate_number || ' - ' || mo.name_ar)::TEXT as suggestion_text,
    c.id as suggestion_id,
    70 as relevance_score
  FROM cars c
  JOIN models mo ON c.model_id = mo.id
  WHERE 
    (plate_number ILIKE '%' || p_search_query || '%' 
     OR chassis_number ILIKE '%' || p_search_query || '%')
    AND c.deleted_at IS NULL
    AND mo.deleted_at IS NULL
  ORDER BY 
    CASE 
      WHEN plate_number ILIKE p_search_query || '%' THEN 1
      ELSE 2
    END,
    plate_number
  LIMIT p_max_results_per_category;

  -- البحث في الألوان
  RETURN QUERY
  SELECT 
    'color'::TEXT as suggestion_type,
    name_ar::TEXT as suggestion_text,
    id as suggestion_id,
    60 as relevance_score
  FROM colors
  WHERE 
    (name_ar ILIKE '%' || p_search_query || '%' OR name_en ILIKE '%' || p_search_query || '%')
    AND deleted_at IS NULL
  ORDER BY 
    CASE 
      WHEN name_ar ILIKE p_search_query || '%' OR name_en ILIKE p_search_query || '%' THEN 1
      ELSE 2
    END,
    name_ar
  LIMIT p_max_results_per_category;

  RETURN;
END;
$$;

-- إضافة تعليق على الدالة
COMMENT ON FUNCTION public.quick_search_suggestions(TEXT, INT) IS 
'توفير اقتراحات سريعة للبحث عبر جميع الكيانات (ماركات، موديلات، فروع، سيارات، ألوان) مع دعم العربية والإنجليزية';