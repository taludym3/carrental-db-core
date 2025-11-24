-- Drop and recreate get_bookings_report function with correct enum values
DROP FUNCTION IF EXISTS get_bookings_report(DATE, DATE, UUID, TEXT);

CREATE OR REPLACE FUNCTION get_bookings_report(
  p_start_date DATE,
  p_end_date DATE,
  p_branch_id UUID DEFAULT NULL,
  p_status TEXT DEFAULT NULL
)
RETURNS TABLE (
  total_bookings BIGINT,
  pending_bookings BIGINT,
  completed_bookings BIGINT,
  active_bookings BIGINT,
  cancelled_bookings BIGINT,
  rejected_bookings BIGINT,
  total_revenue NUMERIC,
  total_discount NUMERIC,
  average_booking_value NUMERIC,
  average_rental_days NUMERIC,
  daily_rentals BIGINT,
  weekly_rentals BIGINT,
  monthly_rentals BIGINT,
  ownership_rentals BIGINT,
  conversion_rate NUMERIC,
  status_breakdown JSONB,
  branch_breakdown JSONB,
  daily_breakdown JSONB
)
SECURITY DEFINER
SET search_path = pg_catalog, public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH booking_stats AS (
    SELECT
      COUNT(*) as total_count,
      COUNT(*) FILTER (WHERE b.status IN ('pending', 'confirmed')) as pending_count,
      COUNT(*) FILTER (WHERE b.status = 'cancelled') as cancelled_count,
      COUNT(*) FILTER (WHERE b.status = 'completed') as completed_count,
      COUNT(*) FILTER (WHERE b.status = 'active') as active_count,
      COALESCE(SUM(b.final_amount) FILTER (WHERE b.status IN ('completed', 'active')), 0) as total_rev,
      COALESCE(SUM(b.discount_amount) FILTER (WHERE b.status IN ('completed', 'active')), 0) as total_disc,
      COALESCE(AVG(b.final_amount) FILTER (WHERE b.status IN ('completed', 'active')), 0) as avg_value,
      COALESCE(AVG(b.total_days) FILTER (WHERE b.status IN ('completed', 'active')), 0) as avg_days,
      COUNT(*) FILTER (WHERE b.rental_type = 'daily') as daily_count,
      COUNT(*) FILTER (WHERE b.rental_type = 'weekly') as weekly_count,
      COUNT(*) FILTER (WHERE b.rental_type = 'monthly') as monthly_count,
      COUNT(*) FILTER (WHERE b.rental_type = 'ownership') as ownership_count,
      CASE 
        WHEN COUNT(*) > 0 THEN 
          (COUNT(*) FILTER (WHERE b.status IN ('completed', 'active'))::NUMERIC / COUNT(*)::NUMERIC * 100)
        ELSE 0 
      END as conv_rate
    FROM bookings b
    WHERE b.created_at::DATE BETWEEN p_start_date AND p_end_date
      AND (p_branch_id IS NULL OR b.branch_id = p_branch_id)
      AND (p_status IS NULL OR b.status::TEXT = p_status)
  ),
  status_data AS (
    SELECT jsonb_object_agg(
      b.status::TEXT,
      jsonb_build_object(
        'count', COUNT(*),
        'revenue', COALESCE(SUM(b.final_amount), 0)
      )
    ) as breakdown
    FROM bookings b
    WHERE b.created_at::DATE BETWEEN p_start_date AND p_end_date
      AND (p_branch_id IS NULL OR b.branch_id = p_branch_id)
      AND (p_status IS NULL OR b.status::TEXT = p_status)
    GROUP BY b.status
  ),
  branch_data AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'branch_id', br.id,
        'branch_name_ar', br.name_ar,
        'branch_name_en', br.name_en,
        'total_bookings', COUNT(b.*),
        'revenue', COALESCE(SUM(b.final_amount) FILTER (WHERE b.status IN ('completed', 'active')), 0)
      )
      ORDER BY COUNT(b.*) DESC
    ) as breakdown
    FROM branches br
    LEFT JOIN bookings b ON b.branch_id = br.id 
      AND b.created_at::DATE BETWEEN p_start_date AND p_end_date
      AND (p_branch_id IS NULL OR b.branch_id = p_branch_id)
      AND (p_status IS NULL OR b.status::TEXT = p_status)
    GROUP BY br.id, br.name_ar, br.name_en
  ),
  daily_data AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'date', day::DATE,
        'bookings', COUNT(b.*),
        'revenue', COALESCE(SUM(b.final_amount) FILTER (WHERE b.status IN ('completed', 'active')), 0)
      )
      ORDER BY day
    ) as breakdown
    FROM generate_series(
      p_start_date::TIMESTAMP,
      p_end_date::TIMESTAMP,
      '1 day'::INTERVAL
    ) day
    LEFT JOIN bookings b ON b.created_at::DATE = day::DATE
      AND (p_branch_id IS NULL OR b.branch_id = p_branch_id)
      AND (p_status IS NULL OR b.status::TEXT = p_status)
    GROUP BY day
  )
  SELECT
    bs.total_count,
    bs.pending_count,
    bs.completed_count,
    bs.active_count,
    bs.cancelled_count,
    0::BIGINT,
    bs.total_rev,
    bs.total_disc,
    bs.avg_value,
    bs.avg_days,
    bs.daily_count,
    bs.weekly_count,
    bs.monthly_count,
    bs.ownership_count,
    bs.conv_rate,
    COALESCE(sd.breakdown, '{}'::JSONB),
    COALESCE(bd.breakdown, '[]'::JSONB),
    COALESCE(dd.breakdown, '[]'::JSONB)
  FROM booking_stats bs
  CROSS JOIN status_data sd
  CROSS JOIN branch_data bd
  CROSS JOIN daily_data dd;
END;
$$;

-- Drop and recreate get_customers_report function to fix ambiguous column
DROP FUNCTION IF EXISTS get_customers_report(DATE, DATE);

CREATE OR REPLACE FUNCTION get_customers_report(
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  total_customers BIGINT,
  verified_customers BIGINT,
  active_customers BIGINT,
  new_customers BIGINT,
  customers_with_bookings BIGINT,
  repeat_customers BIGINT,
  high_value_customers BIGINT,
  average_customer_value NUMERIC,
  verification_rate NUMERIC,
  gender_distribution JSONB,
  age_distribution JSONB,
  location_distribution JSONB,
  growth_timeline JSONB
)
SECURITY DEFINER
SET search_path = pg_catalog, public
LANGUAGE plpgsql
AS $$
DECLARE
  v_start_date DATE;
  v_end_date DATE;
BEGIN
  v_start_date := COALESCE(p_start_date, CURRENT_DATE - INTERVAL '1 year');
  v_end_date := COALESCE(p_end_date, CURRENT_DATE);

  RETURN QUERY
  WITH customer_stats AS (
    SELECT
      COUNT(DISTINCT p.id) as total_count,
      COUNT(DISTINCT p.id) FILTER (WHERE p.is_verified = true) as verified_count,
      COUNT(DISTINCT p.id) FILTER (
        WHERE EXISTS (
          SELECT 1 FROM bookings b 
          WHERE b.customer_id = p.user_id 
          AND b.status IN ('active', 'completed')
          AND b.created_at >= CURRENT_DATE - INTERVAL '3 months'
        )
      ) as active_count,
      COUNT(DISTINCT p.id) FILTER (WHERE p.created_at::DATE BETWEEN v_start_date AND v_end_date) as new_count,
      COUNT(DISTINCT p.id) FILTER (
        WHERE EXISTS (SELECT 1 FROM bookings b WHERE b.customer_id = p.user_id)
      ) as with_bookings_count,
      COUNT(DISTINCT p.id) FILTER (
        WHERE (SELECT COUNT(*) FROM bookings b WHERE b.customer_id = p.user_id) > 1
      ) as repeat_count,
      COUNT(DISTINCT p.id) FILTER (
        WHERE (
          SELECT COALESCE(SUM(b.final_amount), 0) 
          FROM bookings b 
          WHERE b.customer_id = p.user_id 
          AND b.status IN ('completed', 'active')
        ) > 5000
      ) as high_value_count,
      COALESCE(AVG(
        (SELECT SUM(b.final_amount) 
         FROM bookings b 
         WHERE b.customer_id = p.user_id 
         AND b.status IN ('completed', 'active'))
      ), 0) as avg_value
    FROM profiles p
    INNER JOIN user_roles ur ON ur.user_id = p.user_id
    WHERE ur.role = 'customer'
  ),
  gender_data AS (
    SELECT jsonb_object_agg(
      COALESCE(p.gender, 'غير محدد'),
      COUNT(*)
    ) as distribution
    FROM profiles p
    INNER JOIN user_roles ur ON ur.user_id = p.user_id
    WHERE ur.role = 'customer'
    GROUP BY p.gender
  ),
  age_data AS (
    SELECT jsonb_object_agg(
      age_group,
      customer_count
    ) as distribution
    FROM (
      SELECT
        CASE
          WHEN p.age < 25 THEN 'أقل من 25'
          WHEN p.age BETWEEN 25 AND 34 THEN '25-34'
          WHEN p.age BETWEEN 35 AND 44 THEN '35-44'
          WHEN p.age BETWEEN 45 AND 54 THEN '45-54'
          WHEN p.age >= 55 THEN '55 فأكثر'
          ELSE 'غير محدد'
        END as age_group,
        COUNT(*) as customer_count
      FROM profiles p
      INNER JOIN user_roles ur ON ur.user_id = p.user_id
      WHERE ur.role = 'customer'
      GROUP BY age_group
    ) age_groups
  ),
  top_locations AS (
    SELECT
      COALESCE(p.location, 'غير محدد') as location,
      COUNT(*) as count
    FROM profiles p
    INNER JOIN user_roles ur ON ur.user_id = p.user_id
    WHERE ur.role = 'customer'
    GROUP BY p.location
    ORDER BY COUNT(*) DESC
    LIMIT 10
  ),
  location_data AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'location', location,
        'count', count
      )
    ) as distribution
    FROM top_locations
  ),
  growth_data AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'month', TO_CHAR(month, 'YYYY-MM'),
        'customers', monthly_new_customers
      )
      ORDER BY month
    ) as timeline
    FROM (
      SELECT
        DATE_TRUNC('month', p.created_at)::DATE as month,
        COUNT(*) as monthly_new_customers
      FROM profiles p
      INNER JOIN user_roles ur ON ur.user_id = p.user_id
      WHERE ur.role = 'customer'
        AND p.created_at >= v_start_date
        AND p.created_at <= v_end_date
      GROUP BY DATE_TRUNC('month', p.created_at)
    ) monthly_stats
  )
  SELECT
    cs.total_count,
    cs.verified_count,
    cs.active_count,
    cs.new_count,
    cs.with_bookings_count,
    cs.repeat_count,
    cs.high_value_count,
    cs.avg_value,
    CASE WHEN cs.total_count > 0 THEN (cs.verified_count::NUMERIC / cs.total_count::NUMERIC * 100) ELSE 0 END,
    COALESCE(gd.distribution, '{}'::JSONB),
    COALESCE(ad.distribution, '{}'::JSONB),
    COALESCE(ld.distribution, '[]'::JSONB),
    COALESCE(gtd.timeline, '[]'::JSONB)
  FROM customer_stats cs
  CROSS JOIN gender_data gd
  CROSS JOIN age_data ad
  CROSS JOIN location_data ld
  CROSS JOIN growth_data gtd;
END;
$$;