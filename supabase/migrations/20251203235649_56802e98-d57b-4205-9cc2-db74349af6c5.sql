-- Create handle_booking_refund RPC function
CREATE OR REPLACE FUNCTION public.handle_booking_refund(
  p_booking_id UUID,
  p_user_id UUID,
  p_payment_id TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, extensions
AS $$
DECLARE
  v_booking RECORD;
  v_car_id UUID;
  v_result JSON;
BEGIN
  -- Get booking with lock
  SELECT b.*, c.quantity as car_quantity
  INTO v_booking
  FROM bookings b
  JOIN cars c ON c.id = b.car_id
  WHERE b.id = p_booking_id
  FOR UPDATE OF b;

  -- Validate booking exists
  IF v_booking IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'الحجز غير موجود'
    );
  END IF;

  -- Validate ownership
  IF v_booking.customer_id != p_user_id THEN
    RETURN json_build_object(
      'success', false,
      'message', 'غير مصرح بالوصول لهذا الحجز'
    );
  END IF;

  -- Only process if booking is active
  IF v_booking.status != 'active' THEN
    RETURN json_build_object(
      'success', true,
      'message', 'الحجز ليس نشطاً',
      'booking_status', v_booking.status
    );
  END IF;

  v_car_id := v_booking.car_id;

  -- Update booking status to cancelled
  UPDATE bookings
  SET 
    status = 'cancelled',
    notes = COALESCE(notes || E'\n', '') || 'تم استرجاع المبلغ - ' || COALESCE(p_payment_id, 'N/A'),
    updated_at = NOW()
  WHERE id = p_booking_id;

  -- Restore car availability
  UPDATE cars
  SET 
    available_quantity = LEAST(available_quantity + 1, quantity),
    updated_at = NOW()
  WHERE id = v_car_id;

  -- Log to audit
  INSERT INTO audit_log (table_name, record_id, action, old_data, new_data, changed_by, occurred_at)
  VALUES (
    'bookings',
    p_booking_id::TEXT,
    'REFUND',
    json_build_object('status', 'active'),
    json_build_object('status', 'cancelled', 'payment_id', p_payment_id),
    p_user_id::TEXT,
    NOW()
  );

  -- Send notification to customer
  INSERT INTO notifications (user_id, type, title_en, title_ar, message_en, message_ar, metadata, created_by)
  VALUES (
    p_user_id,
    'payment',
    'Payment Refunded',
    'تم استرجاع المبلغ',
    'Your payment has been refunded and booking cancelled.',
    'تم استرجاع المبلغ وإلغاء الحجز.',
    json_build_object('booking_id', p_booking_id, 'payment_id', p_payment_id),
    p_user_id
  );

  RETURN json_build_object(
    'success', true,
    'message', 'تم معالجة الاسترجاع بنجاح',
    'booking_id', p_booking_id,
    'new_status', 'cancelled'
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'message', SQLERRM
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.handle_booking_refund(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_booking_refund(UUID, UUID, TEXT) TO service_role;