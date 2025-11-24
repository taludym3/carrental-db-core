-- ========================================================================
-- دوال تكامل Moyasar Payment
-- 4 دوال للتعامل مع عمليات الدفع من Edge Functions
-- ========================================================================

-- ========================================================================
-- 1. دالة تحديث الحجز إلى payment_pending
-- ========================================================================
DROP FUNCTION IF EXISTS public.update_booking_to_payment_pending(UUID, UUID);
CREATE OR REPLACE FUNCTION public.update_booking_to_payment_pending(
  p_booking_id UUID,
  p_user_id UUID
)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT,
  booking_status booking_status
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_booking RECORD;
BEGIN
  -- جلب معلومات الحجز
  SELECT 
    id,
    customer_id,
    status,
    car_id,
    final_amount
  INTO v_booking
  FROM bookings
  WHERE id = p_booking_id
    AND customer_id = p_user_id
  FOR UPDATE; -- قفل السجل
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Booking not found or unauthorized'::TEXT, NULL::booking_status;
    RETURN;
  END IF;
  
  -- التحقق من الحالة
  IF v_booking.status NOT IN ('confirmed', 'payment_pending') THEN
    RETURN QUERY SELECT 
      false, 
      format('Cannot process payment - booking status is %s', v_booking.status),
      v_booking.status;
    RETURN;
  END IF;
  
  -- إذا كانت بالفعل payment_pending، لا نفعل شيء
  IF v_booking.status = 'payment_pending' THEN
    RETURN QUERY SELECT true, 'Booking already in payment_pending status'::TEXT, v_booking.status;
    RETURN;
  END IF;
  
  -- تحديث الحالة
  UPDATE bookings
  SET 
    status = 'payment_pending',
    updated_at = NOW()
  WHERE id = p_booking_id;
  
  -- تسجيل في audit log
  INSERT INTO audit_log (
    table_name,
    action,
    record_id,
    old_data,
    new_data,
    changed_by
  ) VALUES (
    'bookings',
    'payment_initiated',
    p_booking_id,
    jsonb_build_object('status', v_booking.status),
    jsonb_build_object('status', 'payment_pending'),
    p_user_id
  );
  
  RETURN QUERY SELECT true, 'Booking updated to payment_pending'::TEXT, 'payment_pending'::booking_status;
END;
$$;

COMMENT ON FUNCTION public.update_booking_to_payment_pending IS 
'تحديث حالة الحجز إلى payment_pending قبل إرسال الدفعة لـ Moyasar';

-- ========================================================================
-- 2. دالة إكمال عملية الدفع الناجحة
-- ========================================================================
DROP FUNCTION IF EXISTS public.complete_booking_payment_transaction(UUID, TEXT, UUID, JSONB);
CREATE OR REPLACE FUNCTION public.complete_booking_payment_transaction(
  p_booking_id UUID,
  p_payment_reference TEXT,
  p_user_id UUID,
  p_booking_data JSONB DEFAULT NULL
)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT,
  booking_id UUID,
  payment_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_booking RECORD;
  v_payment_id UUID;
  v_car_info RECORD;
  v_customer_info RECORD;
BEGIN
  -- جلب معلومات الحجز
  SELECT 
    b.id,
    b.customer_id,
    b.car_id,
    b.branch_id,
    b.status,
    b.final_amount,
    b.start_date,
    b.end_date
  INTO v_booking
  FROM bookings b
  WHERE b.id = p_booking_id
    AND b.customer_id = p_user_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Booking not found'::TEXT, NULL::UUID, NULL::UUID;
    RETURN;
  END IF;
  
  -- التحقق من الحالة
  IF v_booking.status NOT IN ('payment_pending', 'confirmed') THEN
    RETURN QUERY SELECT 
      false, 
      format('Cannot complete payment - booking status is %s', v_booking.status),
      NULL::UUID,
      NULL::UUID;
    RETURN;
  END IF;
  
  -- جلب معلومات السيارة والعميل
  SELECT 
    c.id,
    cm.name_ar as model_name,
    cb.name_ar as brand_name,
    br.name_ar as branch_name
  INTO v_car_info
  FROM cars c
  INNER JOIN car_models cm ON c.model_id = cm.id
  INNER JOIN car_brands cb ON cm.brand_id = cb.id
  INNER JOIN branches br ON c.branch_id = br.id
  WHERE c.id = v_booking.car_id;
  
  SELECT 
    full_name,
    phone,
    email
  INTO v_customer_info
  FROM profiles
  WHERE user_id = v_booking.customer_id;
  
  -- تحديث الحجز إلى active
  UPDATE bookings
  SET 
    status = 'active',
    updated_at = NOW()
  WHERE id = p_booking_id;
  
  -- إضافة سجل الدفع
  INSERT INTO payments (
    booking_id,
    amount,
    payment_method,
    payment_status,
    transaction_reference,
    payment_date,
    notes,
    created_by
  ) VALUES (
    p_booking_id,
    v_booking.final_amount,
    'card', -- Moyasar card payment
    'completed',
    p_payment_reference,
    NOW(),
    format('Moyasar Payment - Reference: %s', p_payment_reference),
    p_user_id
  )
  RETURNING id INTO v_payment_id;
  
  -- تحديث available_quantity للسيارة
  UPDATE cars
  SET 
    available_quantity = GREATEST(0, available_quantity - 1),
    updated_at = NOW()
  WHERE id = v_booking.car_id;
  
  -- تسجيل في audit log
  INSERT INTO audit_log (
    table_name,
    action,
    record_id,
    old_data,
    new_data,
    changed_by
  ) VALUES (
    'bookings',
    'payment_completed',
    p_booking_id,
    jsonb_build_object(
      'status', v_booking.status,
      'payment_reference', NULL
    ),
    jsonb_build_object(
      'status', 'active',
      'payment_reference', p_payment_reference,
      'payment_id', v_payment_id
    ),
    p_user_id
  );
  
  -- إرسال إشعار للعميل
  PERFORM send_notification(
    v_booking.customer_id,
    'تم الدفع بنجاح',
    'Payment Completed Successfully',
    format('تم تأكيد دفع حجزك لسيارة %s %s بمبلغ %s ريال', 
      v_car_info.brand_name, 
      v_car_info.model_name,
      v_booking.final_amount
    ),
    format('Payment confirmed for your booking of %s %s for %s SAR', 
      v_car_info.brand_name,
      v_car_info.model_name,
      v_booking.final_amount
    ),
    'payment_completed',
    jsonb_build_object(
      'booking_id', p_booking_id,
      'payment_id', v_payment_id,
      'payment_reference', p_payment_reference,
      'amount', v_booking.final_amount,
      'car_name', format('%s %s', v_car_info.brand_name, v_car_info.model_name),
      'start_date', v_booking.start_date,
      'end_date', v_booking.end_date
    )
  );
  
  -- إرسال إشعار للأدمن
  INSERT INTO notifications (user_id, title_ar, title_en, message_ar, message_en, type, metadata, created_by)
  SELECT 
    ur.user_id,
    'دفع حجز جديد',
    'New Booking Payment',
    format('تم دفع حجز لسيارة %s %s - العميل: %s - المبلغ: %s ريال', 
      v_car_info.brand_name,
      v_car_info.model_name,
      v_customer_info.full_name,
      v_booking.final_amount
    ),
    format('Payment received for %s %s - Customer: %s - Amount: %s SAR', 
      v_car_info.brand_name,
      v_car_info.model_name,
      v_customer_info.full_name,
      v_booking.final_amount
    ),
    'booking_payment_completed',
    jsonb_build_object(
      'booking_id', p_booking_id,
      'payment_id', v_payment_id,
      'customer_id', v_booking.customer_id,
      'customer_name', v_customer_info.full_name,
      'amount', v_booking.final_amount,
      'payment_reference', p_payment_reference,
      'branch_id', v_booking.branch_id
    ),
    p_user_id
  FROM user_roles ur
  WHERE ur.role = 'admin';
  
  -- إرسال إشعار لموظفي الفرع
  INSERT INTO notifications (user_id, title_ar, title_en, message_ar, message_en, type, metadata, created_by)
  SELECT 
    ur.user_id,
    'دفع حجز جديد',
    'New Booking Payment',
    format('تم دفع حجز لسيارة %s %s - العميل: %s', 
      v_car_info.brand_name,
      v_car_info.model_name,
      v_customer_info.full_name
    ),
    format('Payment received for %s %s - Customer: %s', 
      v_car_info.brand_name,
      v_car_info.model_name,
      v_customer_info.full_name
    ),
    'booking_payment_completed',
    jsonb_build_object(
      'booking_id', p_booking_id,
      'payment_id', v_payment_id,
      'customer_name', v_customer_info.full_name,
      'amount', v_booking.final_amount,
      'branch_id', v_booking.branch_id
    ),
    p_user_id
  FROM user_roles ur
  INNER JOIN profiles p ON ur.user_id = p.user_id
  WHERE ur.role IN ('branch', 'branch_employee')
    AND p.branch_id = v_booking.branch_id;
  
  RETURN QUERY SELECT 
    true, 
    'Payment completed successfully'::TEXT,
    p_booking_id,
    v_payment_id;
END;
$$;

COMMENT ON FUNCTION public.complete_booking_payment_transaction IS 
'إكمال عملية الدفع الناجحة - تحديث الحجز، إضافة payment، إرسال إشعارات';

-- ========================================================================
-- 3. دالة معالجة فشل الدفع
-- ========================================================================
DROP FUNCTION IF EXISTS public.handle_payment_failure_transaction(UUID, UUID, TEXT, TEXT);
CREATE OR REPLACE FUNCTION public.handle_payment_failure_transaction(
  p_booking_id UUID,
  p_user_id UUID,
  p_error_message TEXT,
  p_payment_id TEXT DEFAULT NULL
)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT,
  booking_status booking_status
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_booking RECORD;
  v_car_info RECORD;
BEGIN
  -- جلب معلومات الحجز
  SELECT 
    b.id,
    b.customer_id,
    b.car_id,
    b.status,
    b.final_amount
  INTO v_booking
  FROM bookings b
  WHERE b.id = p_booking_id
    AND b.customer_id = p_user_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Booking not found'::TEXT, NULL::booking_status;
    RETURN;
  END IF;
  
  -- فقط نعالج إذا كانت payment_pending
  IF v_booking.status != 'payment_pending' THEN
    RETURN QUERY SELECT 
      true, 
      format('Booking status is %s - no action needed', v_booking.status),
      v_booking.status;
    RETURN;
  END IF;
  
  -- جلب معلومات السيارة
  SELECT 
    cm.name_ar as model_name,
    cb.name_ar as brand_name
  INTO v_car_info
  FROM cars c
  INNER JOIN car_models cm ON c.model_id = cm.id
  INNER JOIN car_brands cb ON cm.brand_id = cb.id
  WHERE c.id = v_booking.car_id;
  
  -- إرجاع الحجز إلى confirmed
  UPDATE bookings
  SET 
    status = 'confirmed',
    updated_at = NOW()
  WHERE id = p_booking_id;
  
  -- إضافة سجل دفع فاشل
  INSERT INTO payments (
    booking_id,
    amount,
    payment_method,
    payment_status,
    transaction_reference,
    notes,
    created_by
  ) VALUES (
    p_booking_id,
    v_booking.final_amount,
    'card',
    'failed',
    p_payment_id,
    format('Payment failed: %s', p_error_message),
    p_user_id
  );
  
  -- تسجيل في audit log
  INSERT INTO audit_log (
    table_name,
    action,
    record_id,
    old_data,
    new_data,
    changed_by
  ) VALUES (
    'bookings',
    'payment_failed',
    p_booking_id,
    jsonb_build_object('status', 'payment_pending'),
    jsonb_build_object(
      'status', 'confirmed',
      'error', p_error_message,
      'payment_id', p_payment_id
    ),
    p_user_id
  );
  
  -- تسجيل في security audit log
  PERFORM log_security_event(
    'payment_failure',
    jsonb_build_object(
      'booking_id', p_booking_id,
      'customer_id', v_booking.customer_id,
      'amount', v_booking.final_amount,
      'error', p_error_message,
      'payment_id', p_payment_id
    ),
    NULL, -- identifier
    'medium'
  );
  
  -- إرسال إشعار للعميل
  PERFORM send_notification(
    v_booking.customer_id,
    'فشل عملية الدفع',
    'Payment Failed',
    format('عذراً، فشلت عملية دفع حجزك لسيارة %s %s. السبب: %s. يرجى المحاولة مرة أخرى.', 
      v_car_info.brand_name,
      v_car_info.model_name,
      p_error_message
    ),
    format('Sorry, payment failed for your booking of %s %s. Reason: %s. Please try again.', 
      v_car_info.brand_name,
      v_car_info.model_name,
      p_error_message
    ),
    'payment_failed',
    jsonb_build_object(
      'booking_id', p_booking_id,
      'error', p_error_message,
      'payment_id', p_payment_id,
      'amount', v_booking.final_amount
    )
  );
  
  RETURN QUERY SELECT 
    true, 
    'Payment failure handled'::TEXT,
    'confirmed'::booking_status;
END;
$$;

COMMENT ON FUNCTION public.handle_payment_failure_transaction IS 
'معالجة فشل الدفع - إرجاع الحجز إلى confirmed وإرسال إشعارات';

-- ========================================================================
-- 4. دالة جلب معلومات الحجز للتحقق من الدفع
-- ========================================================================
DROP FUNCTION IF EXISTS public.get_booking_for_payment_check(UUID, UUID);
CREATE OR REPLACE FUNCTION public.get_booking_for_payment_check(
  p_booking_id UUID,
  p_user_id UUID
)
RETURNS TABLE(
  booking_id UUID,
  customer_id UUID,
  current_status booking_status,
  car_id UUID,
  final_amount NUMERIC,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ,
  booking_data JSONB
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_booking RECORD;
BEGIN
  -- جلب معلومات الحجز مع التحقق من الملكية
  SELECT 
    b.id,
    b.customer_id,
    b.status,
    b.car_id,
    b.final_amount,
    b.start_date,
    b.end_date,
    b.created_at,
    jsonb_build_object(
      'booking_id', b.id,
      'customer_id', b.customer_id,
      'status', b.status,
      'car_id', b.car_id,
      'branch_id', b.branch_id,
      'final_amount', b.final_amount,
      'start_date', b.start_date,
      'end_date', b.end_date,
      'rental_type', b.rental_type,
      'car', jsonb_build_object(
        'model', jsonb_build_object(
          'name_ar', cm.name_ar,
          'brand', jsonb_build_object(
            'name_ar', cb.name_ar
          )
        )
      )
    ) as full_data
  INTO v_booking
  FROM bookings b
  INNER JOIN cars c ON b.car_id = c.id
  INNER JOIN car_models cm ON c.model_id = cm.id
  INNER JOIN car_brands cb ON cm.brand_id = cb.id
  WHERE b.id = p_booking_id
    AND b.customer_id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found or unauthorized';
  END IF;
  
  RETURN QUERY
  SELECT 
    v_booking.id,
    v_booking.customer_id,
    v_booking.status,
    v_booking.car_id,
    v_booking.final_amount,
    v_booking.start_date,
    v_booking.end_date,
    v_booking.created_at,
    v_booking.full_data;
END;
$$;

COMMENT ON FUNCTION public.get_booking_for_payment_check IS 
'جلب معلومات الحجز للتحقق من حالة الدفع - مع التحقق من الملكية';