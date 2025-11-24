-- Update approve_booking function to allow branch staff to approve bookings
CREATE OR REPLACE FUNCTION approve_booking(
  p_booking_id UUID,
  p_payment_deadline_hours INTEGER DEFAULT 24
)
RETURNS SETOF bookings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_booking public.bookings%ROWTYPE;
  v_customer_name TEXT;
  v_car_name TEXT;
  v_branch_name TEXT;
  v_user_role public.user_role;
  v_user_branch_id UUID;
  admin_record RECORD;
  branch_staff_record RECORD;
BEGIN
  -- Get current user's role
  SELECT role INTO v_user_role
  FROM public.user_roles 
  WHERE user_id = auth.uid();

  -- Check that current user is admin or branch staff
  IF v_user_role NOT IN ('admin', 'branch', 'branch_employee') THEN
    RAISE EXCEPTION 'Insufficient privileges to approve bookings';
  END IF;

  -- Get the booking with lock
  SELECT * INTO v_booking
  FROM public.bookings
  WHERE id = p_booking_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;

  IF v_booking.status != 'pending' THEN
    RAISE EXCEPTION 'Only pending bookings can be approved';
  END IF;

  -- For branch staff: verify booking belongs to their branch
  IF v_user_role IN ('branch', 'branch_employee') THEN
    SELECT branch_id INTO v_user_branch_id
    FROM public.profiles
    WHERE user_id = auth.uid();
    
    IF v_booking.branch_id != v_user_branch_id THEN
      RAISE EXCEPTION 'Unauthorized: booking belongs to different branch';
    END IF;
  END IF;

  -- Get customer, car, and branch names
  SELECT COALESCE(p.full_name, p.email) INTO v_customer_name
  FROM public.profiles p
  WHERE p.user_id = v_booking.customer_id;

  SELECT CONCAT(
    COALESCE(b.name_ar, b.name_en), ' ',
    COALESCE(m.name_ar, m.name_en), ' ',
    m.year
  ) INTO v_car_name
  FROM public.cars c
  JOIN public.car_models m ON m.id = c.model_id
  JOIN public.car_brands b ON b.id = m.brand_id
  WHERE c.id = v_booking.car_id;

  SELECT COALESCE(name_ar, name_en) INTO v_branch_name
  FROM public.branches
  WHERE id = v_booking.branch_id;

  -- Update booking status to confirmed and set approval info
  UPDATE public.bookings
  SET 
    status = 'confirmed',
    approved_at = NOW(),
    approved_by = auth.uid(),
    expires_at = NOW() + (p_payment_deadline_hours || ' hours')::INTERVAL,
    updated_at = NOW()
  WHERE id = p_booking_id;

  -- Notify customer
  INSERT INTO public.notifications (
    user_id,
    type,
    title_en,
    title_ar,
    message_en,
    message_ar,
    metadata,
    created_by
  ) VALUES (
    v_booking.customer_id,
    'booking_approved',
    'Booking Approved',
    'تم قبول الحجز',
    'Your booking for ' || v_car_name || ' has been approved. Please complete payment within ' || p_payment_deadline_hours || ' hours.',
    'تم قبول حجزك لسيارة ' || v_car_name || '. يرجى إكمال الدفع خلال ' || p_payment_deadline_hours || ' ساعة.',
    jsonb_build_object(
      'booking_id', p_booking_id,
      'car_name', v_car_name,
      'branch_name', v_branch_name,
      'deadline_hours', p_payment_deadline_hours,
      'expires_at', NOW() + (p_payment_deadline_hours || ' hours')::INTERVAL
    ),
    auth.uid()
  );

  -- Notify all admins
  FOR admin_record IN
    SELECT DISTINCT ur.user_id
    FROM public.user_roles ur
    WHERE ur.role = 'admin'
      AND ur.user_id != auth.uid()
  LOOP
    INSERT INTO public.notifications (
      user_id,
      type,
      title_en,
      title_ar,
      message_en,
      message_ar,
      metadata,
      created_by
    ) VALUES (
      admin_record.user_id,
      'booking_approved',
      'Booking Approved',
      'تم قبول حجز',
      'Booking for ' || v_customer_name || ' at ' || v_branch_name || ' has been approved.',
      'تم قبول حجز للعميل ' || v_customer_name || ' في فرع ' || v_branch_name || '.',
      jsonb_build_object(
        'booking_id', p_booking_id,
        'customer_name', v_customer_name,
        'car_name', v_car_name,
        'branch_name', v_branch_name
      ),
      auth.uid()
    );
  END LOOP;

  -- Notify branch staff (only those at the booking's branch, excluding current user)
  FOR branch_staff_record IN
    SELECT DISTINCT ur.user_id
    FROM public.user_roles ur
    JOIN public.profiles p ON p.user_id = ur.user_id
    WHERE ur.role IN ('branch', 'branch_employee')
      AND p.branch_id = v_booking.branch_id
      AND ur.user_id != auth.uid()
  LOOP
    INSERT INTO public.notifications (
      user_id,
      type,
      title_en,
      title_ar,
      message_en,
      message_ar,
      metadata,
      created_by
    ) VALUES (
      branch_staff_record.user_id,
      'booking_approved',
      'Booking Approved',
      'تم قبول حجز',
      'Booking for ' || v_customer_name || ' has been approved.',
      'تم قبول حجز للعميل ' || v_customer_name || '.',
      jsonb_build_object(
        'booking_id', p_booking_id,
        'customer_name', v_customer_name,
        'car_name', v_car_name,
        'branch_name', v_branch_name
      ),
      auth.uid()
    );
  END LOOP;

  -- Return the updated booking
  RETURN QUERY
  SELECT * FROM public.bookings WHERE id = p_booking_id;
END;
$$;