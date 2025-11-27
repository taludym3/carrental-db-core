-- إنشاء دالة لجلب آخر الحجوزات للداشبورد
CREATE OR REPLACE FUNCTION get_recent_bookings_admin(p_limit INTEGER DEFAULT 5)
RETURNS TABLE (
  booking_id UUID,
  customer_name TEXT,
  customer_email TEXT,
  car_brand_ar TEXT,
  car_model_ar TEXT,
  branch_name_ar TEXT,
  start_date DATE,
  end_date DATE,
  status booking_status,
  final_amount NUMERIC,
  created_at TIMESTAMPTZ
) 
SECURITY DEFINER
SET search_path = pg_catalog, public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id as booking_id,
    COALESCE(p.full_name, p.email, 'غير محدد') as customer_name,
    p.email as customer_email,
    cb.name_ar as car_brand_ar,
    cm.name_ar as car_model_ar,
    br.name_ar as branch_name_ar,
    b.start_date,
    b.end_date,
    b.status,
    b.final_amount,
    b.created_at
  FROM bookings b
  LEFT JOIN profiles p ON b.customer_id = p.user_id
  LEFT JOIN cars c ON b.car_id = c.id
  LEFT JOIN car_models cm ON c.model_id = cm.id
  LEFT JOIN car_brands cb ON cm.brand_id = cb.id
  LEFT JOIN branches br ON b.branch_id = br.id
  ORDER BY b.created_at DESC
  LIMIT p_limit;
END;
$$;