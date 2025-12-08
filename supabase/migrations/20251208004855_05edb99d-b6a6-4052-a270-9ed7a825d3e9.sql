-- Drop and recreate get_bookings_report function to fix nested aggregate error
DROP FUNCTION IF EXISTS public.get_bookings_report(DATE, DATE, UUID, TEXT);

CREATE FUNCTION public.get_bookings_report(
  p_start_date DATE,
  p_end_date DATE,
  p_branch_id UUID DEFAULT NULL,
  p_status TEXT DEFAULT NULL
)
RETURNS TABLE (
  total_bookings BIGINT,
  pending_bookings BIGINT,
  active_bookings BIGINT,
  completed_bookings BIGINT,
  cancelled_bookings BIGINT,
  rejected_bookings BIGINT,
  total_revenue NUMERIC,
  total_discount NUMERIC,
  average_booking_value NUMERIC,
  average_rental_days NUMERIC,
  conversion_rate NUMERIC,
  daily_rentals BIGINT,
  weekly_rentals BIGINT,
  monthly_rentals BIGINT,
  ownership_rentals BIGINT,
  status_breakdown JSONB,
  branch_breakdown JSONB,
  daily_breakdown JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH filtered_bookings AS (
    SELECT b.*
    FROM bookings b
    WHERE b.created_at::DATE BETWEEN p_start_date AND p_end_date
      AND (p_branch_id IS NULL OR b.branch_id = p_branch_id)
      AND (p_status IS NULL OR b.status::TEXT = p_status)
  ),
  main_stats AS (
    SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'pending') as pending,
      COUNT(*) FILTER (WHERE status = 'active') as active,
      COUNT(*) FILTER (WHERE status = 'completed') as completed,
      COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled,
      COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
      COALESCE(SUM(final_amount), 0) as revenue,
      COALESCE(SUM(discount_amount), 0) as discount,
      COALESCE(AVG(final_amount), 0) as avg_value,
      COALESCE(AVG(total_days), 0) as avg_days,
      COUNT(*) FILTER (WHERE rental_type = 'daily') as daily,
      COUNT(*) FILTER (WHERE rental_type = 'weekly') as weekly,
      COUNT(*) FILTER (WHERE rental_type = 'monthly') as monthly,
      COUNT(*) FILTER (WHERE rental_type = 'ownership') as ownership
    FROM filtered_bookings
  ),
  status_agg AS (
    SELECT COALESCE(
      jsonb_object_agg(sub.status_name, sub.stat_obj),
      '{}'::JSONB
    ) as breakdown
    FROM (
      SELECT 
        b.status::TEXT as status_name,
        jsonb_build_object(
          'count', COUNT(*),
          'revenue', COALESCE(SUM(b.final_amount), 0)
        ) as stat_obj
      FROM filtered_bookings b
      GROUP BY b.status
    ) sub
  ),
  branch_agg AS (
    SELECT COALESCE(
      jsonb_object_agg(sub.branch_name, sub.branch_obj),
      '{}'::JSONB
    ) as breakdown
    FROM (
      SELECT 
        COALESCE(br.name_ar, br.name_en) as branch_name,
        jsonb_build_object(
          'count', COUNT(*),
          'revenue', COALESCE(SUM(b.final_amount), 0)
        ) as branch_obj
      FROM filtered_bookings b
      JOIN branches br ON br.id = b.branch_id
      GROUP BY br.id, br.name_ar, br.name_en
    ) sub
  ),
  daily_agg AS (
    SELECT COALESCE(
      jsonb_agg(sub.day_obj ORDER BY sub.day_date),
      '[]'::JSONB
    ) as breakdown
    FROM (
      SELECT 
        b.created_at::DATE as day_date,
        jsonb_build_object(
          'date', b.created_at::DATE,
          'count', COUNT(*),
          'revenue', COALESCE(SUM(b.final_amount), 0)
        ) as day_obj
      FROM filtered_bookings b
      GROUP BY b.created_at::DATE
    ) sub
  )
  SELECT
    ms.total,
    ms.pending,
    ms.active,
    ms.completed,
    ms.cancelled,
    ms.rejected,
    ms.revenue,
    ms.discount,
    ROUND(ms.avg_value, 2),
    ROUND(ms.avg_days, 1),
    CASE 
      WHEN ms.total > 0 THEN ROUND((ms.completed::NUMERIC / ms.total) * 100, 2)
      ELSE 0
    END,
    ms.daily,
    ms.weekly,
    ms.monthly,
    ms.ownership,
    sa.breakdown,
    ba.breakdown,
    da.breakdown
  FROM main_stats ms
  CROSS JOIN status_agg sa
  CROSS JOIN branch_agg ba
  CROSS JOIN daily_agg da;
END;
$$;