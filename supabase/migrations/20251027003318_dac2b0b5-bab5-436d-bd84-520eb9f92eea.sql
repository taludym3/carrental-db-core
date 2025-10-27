-- المرحلة 2: نظام available_quantity الديناميكي + أهم دوال البحث

-- 2.1 create_booking_atomic() - استخدام get_actual_available_quantity
CREATE OR REPLACE FUNCTION public.create_booking_atomic(
  p_customer_id uuid, 
  p_car_id uuid, 
  p_branch_id uuid, 
  p_rental_type rental_type, 
  p_start date, 
  p_end date, 
  p_daily_rate numeric, 
  p_discount_amount numeric DEFAULT 0, 
  p_initial_status booking_status DEFAULT 'payment_pending'::booking_status, 
  p_notes text DEFAULT NULL::text
)
RETURNS bookings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_role public.user_role;
  v_car public.cars%ROWTYPE;
  v_b public.bookings%ROWTYPE;
  v_total_days int;
  v_total_amount numeric;
  v_final_amount numeric;
  v_actual_available integer;
  v_actual_rate numeric;
  v_expires_at timestamp with time zone;
BEGIN
  v_role := public.get_user_role(auth.uid());
  IF v_role IS NULL THEN
    RAISE EXCEPTION 'Unauthenticated';
  END IF;

  SELECT * INTO v_car FROM public.cars WHERE id = p_car_id AND status = 'available' FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Car not available';
  END IF;
  
  IF v_car.branch_id IS DISTINCT FROM p_branch_id THEN
    RAISE EXCEPTION 'Car branch mismatch';
  END IF;

  IF NOT (p_rental_type = ANY(v_car.rental_types)) THEN
    RAISE EXCEPTION 'Rental type % not allowed for this car', p_rental_type;
  END IF;

  IF p_start IS NULL OR p_end IS NULL OR p_start >= p_end THEN
    RAISE EXCEPTION 'Invalid dates';
  END IF;
  
  v_total_days := GREATEST(1, (p_end - p_start));

  CASE p_rental_type
    WHEN 'daily' THEN v_actual_rate := v_car.daily_price; v_total_amount := v_actual_rate * v_total_days;
    WHEN 'weekly' THEN v_actual_rate := COALESCE(v_car.weekly_price, v_car.daily_price * 7); v_total_amount := v_actual_rate * CEIL(v_total_days::decimal / 7);
    WHEN 'monthly' THEN v_actual_rate := COALESCE(v_car.monthly_price, v_car.daily_price * 30); v_total_amount := v_actual_rate * CEIL(v_total_days::decimal / 30);
    WHEN 'ownership' THEN 
      IF v_car.ownership_price IS NULL THEN RAISE EXCEPTION 'Ownership price not available for this car'; END IF;
      v_actual_rate := v_car.ownership_price; v_total_amount := v_actual_rate;
    ELSE RAISE EXCEPTION 'Invalid rental type: %', p_rental_type;
  END CASE;

  IF public.booking_status_consumes_capacity(p_initial_status) THEN
    v_actual_available := public.get_actual_available_quantity(p_car_id);
    IF v_actual_available <= 0 THEN RAISE EXCEPTION 'No availability for the requested period'; END IF;
  END IF;

  v_final_amount := GREATEST(0, v_total_amount - COALESCE(p_discount_amount,0));

  IF p_initial_status = 'payment_pending' THEN v_expires_at := NOW() + INTERVAL '30 minutes';
  ELSE v_expires_at := NULL; END IF;

  INSERT INTO public.bookings (id, customer_id, car_id, branch_id, rental_type, start_date, end_date, total_days, daily_rate, total_amount, discount_amount, final_amount, status, notes, expires_at)
  VALUES (gen_random_uuid(), p_customer_id, p_car_id, p_branch_id, p_rental_type, p_start, p_end, v_total_days, v_actual_rate, v_total_amount, COALESCE(p_discount_amount,0), v_final_amount, p_initial_status, p_notes, v_expires_at)
  RETURNING * INTO v_b;

  RETURN v_b;
END;
$function$;

-- 2.2 cleanup_expired_bookings() - بدون تحديث يدوي
CREATE FUNCTION public.cleanup_expired_bookings()
RETURNS TABLE(cleaned_count integer, restored_cars text[])
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  car_updates_count INTEGER := 0;
  updated_cars TEXT[] := ARRAY[]::TEXT[];
  booking_record RECORD;
BEGIN
  FOR booking_record IN 
    SELECT b.id, b.car_id, cb.name_ar as brand_name, cm.name_ar as model_name
    FROM public.bookings b
    JOIN public.cars c ON b.car_id = c.id
    JOIN public.car_models cm ON c.model_id = cm.id
    JOIN public.car_brands cb ON cm.brand_id = cb.id
    WHERE b.status = 'payment_pending' AND b.expires_at IS NOT NULL AND b.expires_at < NOW()
  LOOP
    UPDATE public.bookings SET status = 'expired', updated_at = NOW() WHERE id = booking_record.id;
    car_updates_count := car_updates_count + 1;
    updated_cars := array_append(updated_cars, booking_record.brand_name || ' ' || booking_record.model_name);
    PERFORM log_security_event('booking_expired', NULL, booking_record.id::TEXT, jsonb_build_object('car_id', booking_record.car_id, 'brand_model', booking_record.brand_name || ' ' || booking_record.model_name));
  END LOOP;
  RETURN QUERY SELECT car_updates_count, updated_cars;
END;
$function$;

-- 2.3 fix_availability_inconsistencies()
CREATE OR REPLACE FUNCTION public.fix_availability_inconsistencies()
RETURNS table(car_id uuid, expected_availability integer, actual_availability integer, needs_attention boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  car_record RECORD;
  expected_avail integer;
BEGIN
  FOR car_record IN SELECT c.id, c.quantity, c.available_quantity FROM cars c WHERE c.status = 'available' LOOP
    expected_avail := public.get_actual_available_quantity(car_record.id);
    IF expected_avail != car_record.available_quantity THEN
      PERFORM log_availability_inconsistency(car_record.id, 'quantity_mismatch', jsonb_build_object('expected', expected_avail, 'actual', car_record.available_quantity, 'total_quantity', car_record.quantity, 'note', 'Use get_actual_available_quantity() for accurate availability'));
      RETURN QUERY SELECT car_record.id, expected_avail, car_record.available_quantity, true;
    ELSE
      RETURN QUERY SELECT car_record.id, expected_avail, car_record.available_quantity, false;
    END IF;
  END LOOP;
END;
$$;

-- 2.4 إنشاء VIEW ديناميكي
CREATE OR REPLACE VIEW public.cars_availability AS
SELECT 
  c.id as car_id,
  c.quantity as total_quantity,
  public.get_actual_available_quantity(c.id) as available_quantity,
  c.status,
  c.branch_id,
  cb.name_ar as brand_name_ar,
  cb.name_en as brand_name_en,
  cm.name_ar as model_name_ar,
  cm.name_en as model_name_en
FROM public.cars c
JOIN public.car_models cm ON c.model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id;

-- 2.5 get_nearest_cars() - مع استخدام get_actual_available_quantity
CREATE FUNCTION public.get_nearest_cars(_user_lat DECIMAL, _user_lon DECIMAL, _limit INTEGER DEFAULT 10)
RETURNS TABLE (car_id UUID, car_model TEXT, car_brand TEXT, car_color TEXT, daily_price DECIMAL, branch_name TEXT, branch_location TEXT, distance_meters DECIMAL, distance_km DECIMAL, main_image_url TEXT, seats INTEGER, fuel_type TEXT, transmission TEXT, is_new BOOLEAN, discount_percentage INTEGER, actual_available_quantity INTEGER)
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
  SELECT c.id, cm.name_en, cb.name_en, cc.name_en, c.daily_price, b.name_en, b.location_en,
    ROUND(ST_Distance(b.geom, ST_SetSRID(ST_MakePoint(_user_lon, _user_lat), 4326))::DECIMAL, 0),
    ROUND((ST_Distance(b.geom, ST_SetSRID(ST_MakePoint(_user_lon, _user_lat), 4326)) / 1000)::DECIMAL, 2),
    cm.default_image_url, c.seats, c.fuel_type, c.transmission, c.is_new, c.discount_percentage, public.get_actual_available_quantity(c.id)
  FROM public.cars c
  JOIN public.branches b ON c.branch_id = b.id
  JOIN public.car_models cm ON c.model_id = cm.id
  JOIN public.car_brands cb ON cm.brand_id = cb.id
  JOIN public.car_colors cc ON c.color_id = cc.id
  WHERE c.status = 'available' AND public.get_actual_available_quantity(c.id) > 0 AND b.is_active = TRUE AND b.geom IS NOT NULL
  ORDER BY b.geom <-> ST_SetSRID(ST_MakePoint(_user_lon, _user_lat), 4326)
  LIMIT _limit;
$$;