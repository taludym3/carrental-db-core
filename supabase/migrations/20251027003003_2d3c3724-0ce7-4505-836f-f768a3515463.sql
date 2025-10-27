-- إنشاء الدوال المساعدة المفقودة أولاً

-- دالة get_branch_cars_count()
CREATE OR REPLACE FUNCTION public.get_branch_cars_count(_branch_id UUID)
RETURNS INTEGER
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.cars 
  WHERE branch_id = _branch_id 
    AND status != 'hidden';
$$;

-- دالة get_branch_active_bookings_count()
CREATE OR REPLACE FUNCTION public.get_branch_active_bookings_count(_branch_id UUID)
RETURNS INTEGER
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.bookings 
  WHERE branch_id = _branch_id 
    AND status IN ('pending', 'confirmed', 'payment_pending', 'active');
$$;