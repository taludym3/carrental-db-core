-- دالة لجلب تفاصيل الحجز الشاملة
CREATE OR REPLACE FUNCTION public.get_booking_details(p_booking_id UUID)
RETURNS TABLE(
  -- معلومات الحجز
  booking_id UUID,
  booking_status booking_status,
  start_date DATE,
  end_date DATE,
  total_days INTEGER,
  daily_rate NUMERIC,
  total_amount NUMERIC,
  discount_amount NUMERIC,
  final_amount NUMERIC,
  rental_type rental_type,
  payment_reference TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  
  -- معلومات العميل
  customer_id UUID,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  customer_verified BOOLEAN,
  customer_bookings_count BIGINT,
  customer_documents_count BIGINT,
  customer_approved_documents_count BIGINT,
  
  -- معلومات السيارة
  car_id UUID,
  brand_name_ar TEXT,
  model_name_ar TEXT,
  model_year INTEGER,
  color_name_ar TEXT,
  car_image_url TEXT,
  
  -- معلومات الفرع
  branch_id UUID,
  branch_name_ar TEXT,
  branch_phone TEXT,
  branch_location_ar TEXT,
  
  -- من قبِل
  approved_by_id UUID,
  approved_by_name TEXT
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    b.id,
    b.status,
    b.start_date,
    b.end_date,
    b.total_days,
    b.daily_rate,
    b.total_amount,
    b.discount_amount,
    b.final_amount,
    b.rental_type,
    b.payment_reference,
    b.notes,
    b.created_at,
    b.approved_at,
    b.expires_at,
    
    p.user_id,
    p.full_name,
    p.email,
    p.phone,
    p.is_verified,
    (SELECT COUNT(*) FROM bookings WHERE customer_id = p.user_id),
    (SELECT COUNT(*) FROM documents WHERE user_id = p.user_id),
    (SELECT COUNT(*) FROM documents WHERE user_id = p.user_id AND status = 'approved'),
    
    c.id,
    cb.name_ar,
    cm.name_ar,
    cm.year,
    cc.name_ar,
    cm.default_image_url,
    
    br.id,
    br.name_ar,
    br.phone,
    br.location_ar,
    
    ap.user_id,
    ap.full_name
    
  FROM bookings b
  LEFT JOIN profiles p ON b.customer_id = p.user_id
  LEFT JOIN cars c ON b.car_id = c.id
  LEFT JOIN car_models cm ON c.model_id = cm.id
  LEFT JOIN car_brands cb ON cm.brand_id = cb.id
  LEFT JOIN car_colors cc ON c.color_id = cc.id
  LEFT JOIN branches br ON b.branch_id = br.id
  LEFT JOIN profiles ap ON b.approved_by = ap.user_id
  
  WHERE b.id = p_booking_id
    AND (
      is_admin()
      OR b.branch_id = current_user_branch_id()
      OR b.customer_id = auth.uid()
    );
$$;

-- دالة لجلب مستندات العميل
CREATE OR REPLACE FUNCTION public.get_customer_documents(p_customer_id UUID)
RETURNS TABLE(
  document_id UUID,
  document_type TEXT,
  document_url TEXT,
  document_status document_status,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  verified_by_name TEXT
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    d.id,
    d.document_type,
    d.document_url,
    d.status,
    d.rejection_reason,
    d.created_at,
    d.verified_at,
    vp.full_name
  FROM documents d
  LEFT JOIN profiles vp ON d.verified_by = vp.user_id
  WHERE d.user_id = p_customer_id
    AND (
      is_admin()
      OR d.user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM bookings b
        WHERE b.customer_id = p_customer_id
          AND b.branch_id = current_user_branch_id()
      )
    )
  ORDER BY d.created_at DESC;
$$;

-- دالة لتحديث ملاحظات الحجز
CREATE OR REPLACE FUNCTION public.update_booking_notes(
  p_booking_id UUID,
  p_notes TEXT
)
RETURNS bookings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_booking bookings%ROWTYPE;
  v_role user_role;
BEGIN
  v_role := get_user_role(auth.uid());
  
  IF v_role NOT IN ('admin', 'branch', 'branch_employee') THEN
    RAISE EXCEPTION 'Insufficient privileges';
  END IF;
  
  UPDATE bookings
  SET 
    notes = p_notes,
    updated_at = NOW()
  WHERE id = p_booking_id
    AND (
      is_admin()
      OR branch_id = current_user_branch_id()
    )
  RETURNING * INTO v_booking;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found or access denied';
  END IF;
  
  RETURN v_booking;
END;
$$;