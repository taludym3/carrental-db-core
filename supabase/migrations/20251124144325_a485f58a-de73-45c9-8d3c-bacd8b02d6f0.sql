-- =====================================================
-- Reports System - Complete Database Functions
-- =====================================================

-- 1. Bookings Report Function
-- =====================================================
CREATE OR REPLACE FUNCTION get_bookings_report(
  p_start_date DATE,
  p_end_date DATE,
  p_branch_id UUID DEFAULT NULL,
  p_status TEXT DEFAULT NULL
)
RETURNS TABLE(
  total_bookings BIGINT,
  completed_bookings BIGINT,
  active_bookings BIGINT,
  pending_bookings BIGINT,
  cancelled_bookings BIGINT,
  rejected_bookings BIGINT,
  total_revenue NUMERIC,
  average_booking_value NUMERIC,
  total_discount NUMERIC,
  average_rental_days NUMERIC,
  daily_rentals BIGINT,
  weekly_rentals BIGINT,
  monthly_rentals BIGINT,
  ownership_rentals BIGINT,
  conversion_rate NUMERIC,
  branch_breakdown JSONB,
  status_breakdown JSONB,
  daily_breakdown JSONB
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_total_bookings BIGINT;
  v_completed BIGINT;
  v_active BIGINT;
  v_pending BIGINT;
  v_cancelled BIGINT;
  v_rejected BIGINT;
BEGIN
  -- Basic counts
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'completed'),
    COUNT(*) FILTER (WHERE status = 'active'),
    COUNT(*) FILTER (WHERE status IN ('pending', 'approved')),
    COUNT(*) FILTER (WHERE status = 'cancelled'),
    COUNT(*) FILTER (WHERE status = 'rejected')
  INTO v_total_bookings, v_completed, v_active, v_pending, v_cancelled, v_rejected
  FROM bookings b
  WHERE b.created_at::DATE BETWEEN p_start_date AND p_end_date
    AND (p_branch_id IS NULL OR b.branch_id = p_branch_id)
    AND (p_status IS NULL OR b.status::TEXT = p_status);

  RETURN QUERY
  WITH booking_stats AS (
    SELECT 
      b.id,
      b.status,
      b.rental_type,
      b.final_amount,
      b.discount_amount,
      b.total_days,
      b.branch_id,
      br.name_ar as branch_name,
      b.created_at::DATE as booking_date
    FROM bookings b
    JOIN branches br ON br.id = b.branch_id
    WHERE b.created_at::DATE BETWEEN p_start_date AND p_end_date
      AND (p_branch_id IS NULL OR b.branch_id = p_branch_id)
      AND (p_status IS NULL OR b.status::TEXT = p_status)
  ),
  branch_stats AS (
    SELECT 
      branch_id,
      branch_name,
      COUNT(*) as bookings_count,
      SUM(final_amount) as total_revenue
    FROM booking_stats
    GROUP BY branch_id, branch_name
  ),
  status_stats AS (
    SELECT 
      status::TEXT,
      COUNT(*) as count,
      SUM(final_amount) as revenue
    FROM booking_stats
    GROUP BY status
  ),
  daily_stats AS (
    SELECT 
      booking_date,
      COUNT(*) as bookings_count,
      SUM(final_amount) as revenue
    FROM booking_stats
    GROUP BY booking_date
    ORDER BY booking_date
  )
  SELECT 
    v_total_bookings,
    v_completed,
    v_active,
    v_pending,
    v_cancelled,
    v_rejected,
    COALESCE(SUM(bs.final_amount), 0)::NUMERIC,
    CASE 
      WHEN v_total_bookings > 0 THEN (SUM(bs.final_amount) / v_total_bookings)::NUMERIC
      ELSE 0
    END,
    COALESCE(SUM(bs.discount_amount), 0)::NUMERIC,
    CASE 
      WHEN v_total_bookings > 0 THEN (AVG(bs.total_days))::NUMERIC
      ELSE 0
    END,
    COUNT(*) FILTER (WHERE bs.rental_type = 'daily'),
    COUNT(*) FILTER (WHERE bs.rental_type = 'weekly'),
    COUNT(*) FILTER (WHERE bs.rental_type = 'monthly'),
    COUNT(*) FILTER (WHERE bs.rental_type = 'ownership'),
    CASE 
      WHEN v_total_bookings > 0 THEN ((v_completed::NUMERIC / v_total_bookings) * 100)
      ELSE 0
    END,
    (SELECT jsonb_agg(
      jsonb_build_object(
        'branch_id', branch_id,
        'branch_name', branch_name,
        'bookings_count', bookings_count,
        'revenue', total_revenue
      )
    ) FROM branch_stats),
    (SELECT jsonb_agg(
      jsonb_build_object(
        'status', status,
        'count', count,
        'revenue', revenue
      )
    ) FROM status_stats),
    (SELECT jsonb_agg(
      jsonb_build_object(
        'date', booking_date,
        'bookings', bookings_count,
        'revenue', revenue
      ) ORDER BY booking_date
    ) FROM daily_stats)
  FROM booking_stats bs;
END;
$$;

-- 2. Revenue Report Function
-- =====================================================
CREATE OR REPLACE FUNCTION get_revenue_report(
  p_start_date DATE,
  p_end_date DATE,
  p_branch_id UUID DEFAULT NULL,
  p_group_by TEXT DEFAULT 'day'
)
RETURNS TABLE(
  total_revenue NUMERIC,
  total_paid NUMERIC,
  total_pending NUMERIC,
  total_refunded NUMERIC,
  average_payment_amount NUMERIC,
  payment_success_rate NUMERIC,
  revenue_growth NUMERIC,
  payment_methods_breakdown JSONB,
  time_series JSONB,
  top_branches JSONB
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_previous_start DATE;
  v_previous_end DATE;
  v_previous_revenue NUMERIC;
BEGIN
  -- Calculate previous period dates
  v_previous_start := p_start_date - (p_end_date - p_start_date + 1);
  v_previous_end := p_start_date - 1;
  
  -- Get previous period revenue for growth calculation
  SELECT COALESCE(SUM(amount), 0)
  INTO v_previous_revenue
  FROM payments p
  WHERE p.payment_date::DATE BETWEEN v_previous_start AND v_previous_end
    AND p.payment_status = 'completed'
    AND (p_branch_id IS NULL OR EXISTS (
      SELECT 1 FROM bookings b 
      WHERE b.id = p.booking_id AND b.branch_id = p_branch_id
    ));

  RETURN QUERY
  WITH payment_stats AS (
    SELECT 
      p.id,
      p.amount,
      p.payment_method,
      p.payment_status,
      p.payment_date::DATE as payment_date,
      p.refund_amount,
      b.branch_id,
      br.name_ar as branch_name
    FROM payments p
    JOIN bookings b ON b.id = p.booking_id
    JOIN branches br ON br.id = b.branch_id
    WHERE p.payment_date::DATE BETWEEN p_start_date AND p_end_date
      AND (p_branch_id IS NULL OR b.branch_id = p_branch_id)
  ),
  method_stats AS (
    SELECT 
      payment_method,
      COUNT(*) as count,
      SUM(amount) as total_amount,
      ROUND((COUNT(*)::NUMERIC / NULLIF((SELECT COUNT(*) FROM payment_stats), 0) * 100), 2) as percentage
    FROM payment_stats
    GROUP BY payment_method
  ),
  branch_stats AS (
    SELECT 
      branch_id,
      branch_name,
      SUM(amount) as revenue
    FROM payment_stats
    WHERE payment_status = 'completed'
    GROUP BY branch_id, branch_name
    ORDER BY revenue DESC
    LIMIT 5
  ),
  time_stats AS (
    SELECT 
      payment_date,
      SUM(CASE WHEN payment_status = 'completed' THEN amount ELSE 0 END) as revenue,
      COUNT(*) as transactions
    FROM payment_stats
    GROUP BY payment_date
    ORDER BY payment_date
  )
  SELECT 
    COALESCE(SUM(ps.amount), 0)::NUMERIC,
    COALESCE(SUM(CASE WHEN ps.payment_status = 'completed' THEN ps.amount ELSE 0 END), 0)::NUMERIC,
    COALESCE(SUM(CASE WHEN ps.payment_status = 'pending' THEN ps.amount ELSE 0 END), 0)::NUMERIC,
    COALESCE(SUM(ps.refund_amount), 0)::NUMERIC,
    CASE 
      WHEN COUNT(*) > 0 THEN (AVG(ps.amount))::NUMERIC
      ELSE 0
    END,
    CASE 
      WHEN COUNT(*) > 0 THEN 
        (COUNT(*) FILTER (WHERE ps.payment_status = 'completed')::NUMERIC / COUNT(*) * 100)
      ELSE 0
    END,
    CASE 
      WHEN v_previous_revenue > 0 THEN 
        (((COALESCE(SUM(CASE WHEN ps.payment_status = 'completed' THEN ps.amount ELSE 0 END), 0) - v_previous_revenue) / v_previous_revenue) * 100)::NUMERIC
      ELSE 0
    END,
    (SELECT jsonb_agg(
      jsonb_build_object(
        'method', payment_method,
        'count', count,
        'amount', total_amount,
        'percentage', percentage
      )
    ) FROM method_stats),
    (SELECT jsonb_agg(
      jsonb_build_object(
        'date', payment_date,
        'revenue', revenue,
        'transactions', transactions
      ) ORDER BY payment_date
    ) FROM time_stats),
    (SELECT jsonb_agg(
      jsonb_build_object(
        'branch_id', branch_id,
        'branch_name', branch_name,
        'revenue', revenue
      ) ORDER BY revenue DESC
    ) FROM branch_stats)
  FROM payment_stats ps;
END;
$$;

-- 3. Branches Performance Report
-- =====================================================
CREATE OR REPLACE FUNCTION get_branches_performance_report(
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE(
  branch_id UUID,
  branch_name_ar TEXT,
  branch_name_en TEXT,
  total_bookings BIGINT,
  active_bookings BIGINT,
  completed_bookings BIGINT,
  total_revenue NUMERIC,
  total_payments NUMERIC,
  pending_payments NUMERIC,
  total_cars INTEGER,
  available_cars INTEGER,
  utilization_rate NUMERIC,
  performance_score NUMERIC,
  revenue_change NUMERIC,
  bookings_change NUMERIC
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_previous_start DATE;
  v_previous_end DATE;
BEGIN
  v_previous_start := p_start_date - (p_end_date - p_start_date + 1);
  v_previous_end := p_start_date - 1;

  RETURN QUERY
  WITH branch_bookings AS (
    SELECT 
      b.branch_id,
      COUNT(*) as total_bookings,
      COUNT(*) FILTER (WHERE b.status = 'active') as active_bookings,
      COUNT(*) FILTER (WHERE b.status = 'completed') as completed_bookings,
      SUM(b.final_amount) as total_revenue
    FROM bookings b
    WHERE b.created_at::DATE BETWEEN p_start_date AND p_end_date
    GROUP BY b.branch_id
  ),
  branch_payments AS (
    SELECT 
      bk.branch_id,
      SUM(p.amount) FILTER (WHERE p.payment_status = 'completed') as total_payments,
      SUM(p.amount) FILTER (WHERE p.payment_status = 'pending') as pending_payments
    FROM payments p
    JOIN bookings bk ON bk.id = p.booking_id
    WHERE p.created_at::DATE BETWEEN p_start_date AND p_end_date
    GROUP BY bk.branch_id
  ),
  branch_cars AS (
    SELECT 
      c.branch_id,
      COUNT(*) as total_cars,
      SUM(c.available_quantity) as available_cars
    FROM cars c
    WHERE c.status = 'available'
    GROUP BY c.branch_id
  ),
  previous_bookings AS (
    SELECT 
      b.branch_id,
      COUNT(*) as prev_bookings,
      SUM(b.final_amount) as prev_revenue
    FROM bookings b
    WHERE b.created_at::DATE BETWEEN v_previous_start AND v_previous_end
    GROUP BY b.branch_id
  )
  SELECT 
    br.id,
    br.name_ar,
    br.name_en,
    COALESCE(bb.total_bookings, 0),
    COALESCE(bb.active_bookings, 0),
    COALESCE(bb.completed_bookings, 0),
    COALESCE(bb.total_revenue, 0)::NUMERIC,
    COALESCE(bp.total_payments, 0)::NUMERIC,
    COALESCE(bp.pending_payments, 0)::NUMERIC,
    COALESCE(bc.total_cars, 0)::INTEGER,
    COALESCE(bc.available_cars, 0)::INTEGER,
    CASE 
      WHEN COALESCE(bc.total_cars, 0) > 0 THEN 
        ((COALESCE(bc.total_cars, 0) - COALESCE(bc.available_cars, 0))::NUMERIC / bc.total_cars * 100)
      ELSE 0
    END,
    -- Performance score (weighted average)
    (
      COALESCE(bb.completed_bookings, 0)::NUMERIC * 0.4 +
      COALESCE(bb.total_revenue, 0)::NUMERIC / 10000 * 0.4 +
      CASE 
        WHEN COALESCE(bc.total_cars, 0) > 0 THEN 
          ((COALESCE(bc.total_cars, 0) - COALESCE(bc.available_cars, 0))::NUMERIC / bc.total_cars * 100) * 0.2
        ELSE 0
      END
    )::NUMERIC,
    CASE 
      WHEN COALESCE(pb.prev_revenue, 0) > 0 THEN 
        (((COALESCE(bb.total_revenue, 0) - pb.prev_revenue) / pb.prev_revenue) * 100)::NUMERIC
      ELSE 0
    END,
    CASE 
      WHEN COALESCE(pb.prev_bookings, 0) > 0 THEN 
        (((COALESCE(bb.total_bookings, 0) - pb.prev_bookings::NUMERIC) / pb.prev_bookings) * 100)::NUMERIC
      ELSE 0
    END
  FROM branches br
  LEFT JOIN branch_bookings bb ON bb.branch_id = br.id
  LEFT JOIN branch_payments bp ON bp.branch_id = br.id
  LEFT JOIN branch_cars bc ON bc.branch_id = br.id
  LEFT JOIN previous_bookings pb ON pb.branch_id = br.id
  WHERE br.is_active = true
  ORDER BY performance_score DESC;
END;
$$;

-- 4. Cars Performance Report
-- =====================================================
CREATE OR REPLACE FUNCTION get_cars_performance_report(
  p_start_date DATE,
  p_end_date DATE,
  p_branch_id UUID DEFAULT NULL
)
RETURNS TABLE(
  car_id UUID,
  brand_name_ar TEXT,
  model_name_ar TEXT,
  total_bookings BIGINT,
  total_rental_days INTEGER,
  utilization_rate NUMERIC,
  total_revenue NUMERIC,
  average_daily_rate NUMERIC,
  current_status car_status,
  availability_status TEXT,
  popularity_score NUMERIC,
  branch_name_ar TEXT
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH car_bookings AS (
    SELECT 
      b.car_id,
      COUNT(*) as total_bookings,
      SUM(b.total_days) as total_days,
      SUM(b.final_amount) as total_revenue
    FROM bookings b
    WHERE b.created_at::DATE BETWEEN p_start_date AND p_end_date
      AND (p_branch_id IS NULL OR b.branch_id = p_branch_id)
      AND b.status IN ('completed', 'active')
    GROUP BY b.car_id
  ),
  date_range_days AS (
    SELECT (p_end_date - p_start_date + 1) as total_days
  )
  SELECT 
    c.id,
    cb_brands.name_ar,
    cm.name_ar,
    COALESCE(cb.total_bookings, 0),
    COALESCE(cb.total_days, 0)::INTEGER,
    CASE 
      WHEN drd.total_days > 0 THEN 
        (COALESCE(cb.total_days, 0)::NUMERIC / drd.total_days * 100)
      ELSE 0
    END,
    COALESCE(cb.total_revenue, 0)::NUMERIC,
    CASE 
      WHEN COALESCE(cb.total_days, 0) > 0 THEN 
        (cb.total_revenue / cb.total_days)::NUMERIC
      ELSE c.daily_price
    END,
    c.status,
    CASE 
      WHEN c.available_quantity > 0 THEN 'متاحة'
      ELSE 'غير متاحة'
    END,
    (
      COALESCE(cb.total_bookings, 0)::NUMERIC * 0.4 +
      COALESCE(cb.total_revenue, 0)::NUMERIC / 1000 * 0.4 +
      CASE 
        WHEN drd.total_days > 0 THEN 
          (COALESCE(cb.total_days, 0)::NUMERIC / drd.total_days * 100) * 0.2
        ELSE 0
      END
    )::NUMERIC,
    br.name_ar
  FROM cars c
  JOIN car_models cm ON cm.id = c.model_id
  JOIN car_brands cb_brands ON cb_brands.id = cm.brand_id
  JOIN branches br ON br.id = c.branch_id
  LEFT JOIN car_bookings cb ON cb.car_id = c.id
  CROSS JOIN date_range_days drd
  WHERE (p_branch_id IS NULL OR c.branch_id = p_branch_id)
  ORDER BY popularity_score DESC;
END;
$$;

-- 5. Customers Report
-- =====================================================
CREATE OR REPLACE FUNCTION get_customers_report(
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS TABLE(
  total_customers BIGINT,
  verified_customers BIGINT,
  active_customers BIGINT,
  new_customers BIGINT,
  verification_rate NUMERIC,
  customers_with_bookings BIGINT,
  repeat_customers BIGINT,
  high_value_customers BIGINT,
  average_customer_value NUMERIC,
  gender_distribution JSONB,
  age_distribution JSONB,
  location_distribution JSONB,
  growth_timeline JSONB
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_start_date DATE;
  v_end_date DATE;
BEGIN
  v_start_date := COALESCE(p_start_date, CURRENT_DATE - INTERVAL '30 days');
  v_end_date := COALESCE(p_end_date, CURRENT_DATE);

  RETURN QUERY
  WITH customer_stats AS (
    SELECT 
      p.user_id,
      p.is_verified,
      p.gender,
      p.age,
      p.location,
      p.created_at::DATE as join_date,
      COUNT(b.id) as booking_count,
      SUM(b.final_amount) as total_spent
    FROM profiles p
    LEFT JOIN bookings b ON b.customer_id = p.user_id 
      AND b.created_at::DATE BETWEEN v_start_date AND v_end_date
    WHERE EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = p.user_id AND ur.role = 'customer'
    )
    GROUP BY p.user_id, p.is_verified, p.gender, p.age, p.location, p.created_at
  ),
  gender_stats AS (
    SELECT 
      COALESCE(gender, 'غير محدد') as gender,
      COUNT(*) as count
    FROM customer_stats
    GROUP BY gender
  ),
  age_stats AS (
    SELECT 
      CASE 
        WHEN age < 25 THEN 'أقل من 25'
        WHEN age BETWEEN 25 AND 34 THEN '25-34'
        WHEN age BETWEEN 35 AND 44 THEN '35-44'
        WHEN age BETWEEN 45 AND 54 THEN '45-54'
        ELSE '55+'
      END as age_group,
      COUNT(*) as count
    FROM customer_stats
    WHERE age IS NOT NULL
    GROUP BY age_group
  ),
  location_stats AS (
    SELECT 
      COALESCE(location, 'غير محدد') as location,
      COUNT(*) as count
    FROM customer_stats
    WHERE location IS NOT NULL
    GROUP BY location
    ORDER BY count DESC
    LIMIT 10
  ),
  growth_stats AS (
    SELECT 
      join_date,
      COUNT(*) as new_customers
    FROM customer_stats
    WHERE join_date BETWEEN v_start_date AND v_end_date
    GROUP BY join_date
    ORDER BY join_date
  )
  SELECT 
    COUNT(*)::BIGINT,
    COUNT(*) FILTER (WHERE cs.is_verified = true)::BIGINT,
    COUNT(*) FILTER (WHERE cs.booking_count > 0)::BIGINT,
    COUNT(*) FILTER (WHERE cs.join_date BETWEEN v_start_date AND v_end_date)::BIGINT,
    CASE 
      WHEN COUNT(*) > 0 THEN 
        (COUNT(*) FILTER (WHERE cs.is_verified = true)::NUMERIC / COUNT(*) * 100)
      ELSE 0
    END,
    COUNT(*) FILTER (WHERE cs.booking_count > 0)::BIGINT,
    COUNT(*) FILTER (WHERE cs.booking_count > 1)::BIGINT,
    COUNT(*) FILTER (WHERE cs.total_spent > 5000)::BIGINT,
    COALESCE(AVG(cs.total_spent), 0)::NUMERIC,
    (SELECT jsonb_agg(
      jsonb_build_object(
        'gender', gender,
        'count', count
      )
    ) FROM gender_stats),
    (SELECT jsonb_agg(
      jsonb_build_object(
        'age_group', age_group,
        'count', count
      )
    ) FROM age_stats),
    (SELECT jsonb_agg(
      jsonb_build_object(
        'location', location,
        'count', count
      )
    ) FROM location_stats),
    (SELECT jsonb_agg(
      jsonb_build_object(
        'date', join_date,
        'new_customers', new_customers
      ) ORDER BY join_date
    ) FROM growth_stats)
  FROM customer_stats cs;
END;
$$;

-- 6. Documents Report
-- =====================================================
CREATE OR REPLACE FUNCTION get_documents_report(
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS TABLE(
  total_documents BIGINT,
  pending_documents BIGINT,
  approved_documents BIGINT,
  rejected_documents BIGINT,
  approval_rate NUMERIC,
  average_verification_time INTERVAL,
  document_types_breakdown JSONB,
  daily_submissions JSONB,
  verification_stats JSONB
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_start_date DATE;
  v_end_date DATE;
BEGIN
  v_start_date := COALESCE(p_start_date, CURRENT_DATE - INTERVAL '30 days');
  v_end_date := COALESCE(p_end_date, CURRENT_DATE);

  RETURN QUERY
  WITH document_stats AS (
    SELECT 
      d.id,
      d.document_type,
      d.status,
      d.created_at::DATE as submission_date,
      d.verified_at,
      CASE 
        WHEN d.verified_at IS NOT NULL THEN 
          d.verified_at - d.created_at
        ELSE NULL
      END as verification_time
    FROM documents d
    WHERE d.created_at::DATE BETWEEN v_start_date AND v_end_date
  ),
  type_stats AS (
    SELECT 
      document_type,
      COUNT(*) as count,
      COUNT(*) FILTER (WHERE status = 'approved') as approved_count,
      COUNT(*) FILTER (WHERE status = 'rejected') as rejected_count
    FROM document_stats
    GROUP BY document_type
  ),
  daily_stats AS (
    SELECT 
      submission_date,
      COUNT(*) as submissions
    FROM document_stats
    GROUP BY submission_date
    ORDER BY submission_date
  ),
  verification_time_stats AS (
    SELECT 
      MIN(verification_time) as fastest,
      MAX(verification_time) as slowest,
      AVG(verification_time) as average
    FROM document_stats
    WHERE verification_time IS NOT NULL
  )
  SELECT 
    COUNT(*)::BIGINT,
    COUNT(*) FILTER (WHERE ds.status = 'pending')::BIGINT,
    COUNT(*) FILTER (WHERE ds.status = 'approved')::BIGINT,
    COUNT(*) FILTER (WHERE ds.status = 'rejected')::BIGINT,
    CASE 
      WHEN COUNT(*) FILTER (WHERE ds.status IN ('approved', 'rejected')) > 0 THEN 
        (COUNT(*) FILTER (WHERE ds.status = 'approved')::NUMERIC / 
         COUNT(*) FILTER (WHERE ds.status IN ('approved', 'rejected')) * 100)
      ELSE 0
    END,
    (SELECT average FROM verification_time_stats),
    (SELECT jsonb_agg(
      jsonb_build_object(
        'document_type', document_type,
        'total', count,
        'approved', approved_count,
        'rejected', rejected_count
      )
    ) FROM type_stats),
    (SELECT jsonb_agg(
      jsonb_build_object(
        'date', submission_date,
        'submissions', submissions
      ) ORDER BY submission_date
    ) FROM daily_stats),
    (SELECT jsonb_build_object(
      'fastest', fastest,
      'slowest', slowest,
      'average', average
    ) FROM verification_time_stats)
  FROM document_stats ds;
END;
$$;

-- 7. Comparison Report
-- =====================================================
CREATE OR REPLACE FUNCTION get_comparison_report(
  p_current_start DATE,
  p_current_end DATE,
  p_previous_start DATE,
  p_previous_end DATE
)
RETURNS TABLE(
  metric_name TEXT,
  current_value NUMERIC,
  previous_value NUMERIC,
  change_amount NUMERIC,
  change_percentage NUMERIC,
  trend TEXT
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH current_metrics AS (
    SELECT 
      COUNT(DISTINCT b.id) as bookings,
      SUM(b.final_amount) as revenue,
      COUNT(DISTINCT b.customer_id) as customers,
      AVG(b.final_amount) as avg_booking_value
    FROM bookings b
    WHERE b.created_at::DATE BETWEEN p_current_start AND p_current_end
  ),
  previous_metrics AS (
    SELECT 
      COUNT(DISTINCT b.id) as bookings,
      SUM(b.final_amount) as revenue,
      COUNT(DISTINCT b.customer_id) as customers,
      AVG(b.final_amount) as avg_booking_value
    FROM bookings b
    WHERE b.created_at::DATE BETWEEN p_previous_start AND p_previous_end
  ),
  current_payments AS (
    SELECT 
      COUNT(*) as payment_count,
      SUM(amount) as total_payments
    FROM payments
    WHERE payment_date::DATE BETWEEN p_current_start AND p_current_end
      AND payment_status = 'completed'
  ),
  previous_payments AS (
    SELECT 
      COUNT(*) as payment_count,
      SUM(amount) as total_payments
    FROM payments
    WHERE payment_date::DATE BETWEEN p_previous_start AND p_previous_end
      AND payment_status = 'completed'
  )
  SELECT * FROM (
    SELECT 
      'إجمالي الحجوزات'::TEXT,
      cm.bookings::NUMERIC,
      pm.bookings::NUMERIC,
      (cm.bookings - pm.bookings)::NUMERIC,
      CASE 
        WHEN pm.bookings > 0 THEN ((cm.bookings - pm.bookings)::NUMERIC / pm.bookings * 100)
        ELSE 0
      END,
      CASE 
        WHEN cm.bookings > pm.bookings THEN 'up'
        WHEN cm.bookings < pm.bookings THEN 'down'
        ELSE 'stable'
      END::TEXT
    FROM current_metrics cm, previous_metrics pm
    
    UNION ALL
    
    SELECT 
      'إجمالي الإيرادات'::TEXT,
      COALESCE(cm.revenue, 0)::NUMERIC,
      COALESCE(pm.revenue, 0)::NUMERIC,
      (COALESCE(cm.revenue, 0) - COALESCE(pm.revenue, 0))::NUMERIC,
      CASE 
        WHEN COALESCE(pm.revenue, 0) > 0 THEN 
          ((COALESCE(cm.revenue, 0) - COALESCE(pm.revenue, 0))::NUMERIC / pm.revenue * 100)
        ELSE 0
      END,
      CASE 
        WHEN COALESCE(cm.revenue, 0) > COALESCE(pm.revenue, 0) THEN 'up'
        WHEN COALESCE(cm.revenue, 0) < COALESCE(pm.revenue, 0) THEN 'down'
        ELSE 'stable'
      END::TEXT
    FROM current_metrics cm, previous_metrics pm
    
    UNION ALL
    
    SELECT 
      'عدد العملاء'::TEXT,
      cm.customers::NUMERIC,
      pm.customers::NUMERIC,
      (cm.customers - pm.customers)::NUMERIC,
      CASE 
        WHEN pm.customers > 0 THEN ((cm.customers - pm.customers)::NUMERIC / pm.customers * 100)
        ELSE 0
      END,
      CASE 
        WHEN cm.customers > pm.customers THEN 'up'
        WHEN cm.customers < pm.customers THEN 'down'
        ELSE 'stable'
      END::TEXT
    FROM current_metrics cm, previous_metrics pm
    
    UNION ALL
    
    SELECT 
      'متوسط قيمة الحجز'::TEXT,
      COALESCE(cm.avg_booking_value, 0)::NUMERIC,
      COALESCE(pm.avg_booking_value, 0)::NUMERIC,
      (COALESCE(cm.avg_booking_value, 0) - COALESCE(pm.avg_booking_value, 0))::NUMERIC,
      CASE 
        WHEN COALESCE(pm.avg_booking_value, 0) > 0 THEN 
          ((COALESCE(cm.avg_booking_value, 0) - COALESCE(pm.avg_booking_value, 0))::NUMERIC / pm.avg_booking_value * 100)
        ELSE 0
      END,
      CASE 
        WHEN COALESCE(cm.avg_booking_value, 0) > COALESCE(pm.avg_booking_value, 0) THEN 'up'
        WHEN COALESCE(cm.avg_booking_value, 0) < COALESCE(pm.avg_booking_value, 0) THEN 'down'
        ELSE 'stable'
      END::TEXT
    FROM current_metrics cm, previous_metrics pm
    
    UNION ALL
    
    SELECT 
      'إجمالي المدفوعات'::TEXT,
      COALESCE(cp.total_payments, 0)::NUMERIC,
      COALESCE(pp.total_payments, 0)::NUMERIC,
      (COALESCE(cp.total_payments, 0) - COALESCE(pp.total_payments, 0))::NUMERIC,
      CASE 
        WHEN COALESCE(pp.total_payments, 0) > 0 THEN 
          ((COALESCE(cp.total_payments, 0) - COALESCE(pp.total_payments, 0))::NUMERIC / pp.total_payments * 100)
        ELSE 0
      END,
      CASE 
        WHEN COALESCE(cp.total_payments, 0) > COALESCE(pp.total_payments, 0) THEN 'up'
        WHEN COALESCE(cp.total_payments, 0) < COALESCE(pp.total_payments, 0) THEN 'down'
        ELSE 'stable'
      END::TEXT
    FROM current_payments cp, previous_payments pp
  ) metrics;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_bookings_report TO authenticated;
GRANT EXECUTE ON FUNCTION get_revenue_report TO authenticated;
GRANT EXECUTE ON FUNCTION get_branches_performance_report TO authenticated;
GRANT EXECUTE ON FUNCTION get_cars_performance_report TO authenticated;
GRANT EXECUTE ON FUNCTION get_customers_report TO authenticated;
GRANT EXECUTE ON FUNCTION get_documents_report TO authenticated;
GRANT EXECUTE ON FUNCTION get_comparison_report TO authenticated;