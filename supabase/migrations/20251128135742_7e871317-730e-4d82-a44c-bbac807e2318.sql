-- Update complete_active_bookings function to restore car availability
CREATE OR REPLACE FUNCTION complete_active_bookings()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  WITH updated_bookings AS (
    UPDATE bookings
    SET status = 'completed'::booking_status,
        updated_at = now()
    WHERE status = 'active'::booking_status
      AND end_date < (CURRENT_DATE - INTERVAL '1 day')
    RETURNING id, car_id
  )
  SELECT COUNT(*) INTO updated_count FROM updated_bookings;
  
  -- Restore car availability for completed bookings
  UPDATE cars c
  SET available_quantity = c.available_quantity + 1,
      updated_at = now()
  FROM (
    SELECT DISTINCT car_id 
    FROM bookings
    WHERE status = 'completed'::booking_status
      AND updated_at >= now() - INTERVAL '1 minute'
  ) b
  WHERE c.id = b.car_id
    AND c.available_quantity < c.quantity;
  
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create get_user_details RPC function
CREATE OR REPLACE FUNCTION get_user_details(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'user_id', p.user_id,
    'id', p.id,
    'full_name', p.full_name,
    'email', p.email,
    'phone', p.phone,
    'is_verified', p.is_verified,
    'phone_verified_at', p.phone_verified_at,
    'created_at', p.created_at,
    'gender', p.gender,
    'age', p.age,
    'location', p.location,
    'role', ur.role,
    'branch', CASE 
      WHEN b.id IS NOT NULL THEN json_build_object(
        'id', b.id,
        'name_ar', b.name_ar,
        'name_en', b.name_en,
        'location_ar', b.location_ar,
        'location_en', b.location_en
      )
      ELSE NULL
    END
  ) INTO result
  FROM profiles p
  LEFT JOIN user_roles ur ON ur.user_id = p_user_id
  LEFT JOIN branches b ON b.id = p.branch_id
  WHERE p.user_id = p_user_id;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;