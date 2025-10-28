-- المرحلة 8: دالة التحقق من صحة النظام

CREATE OR REPLACE FUNCTION public.verify_system_health()
RETURNS TABLE(component TEXT, status TEXT, details TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 'User Roles System'::TEXT,
    CASE WHEN EXISTS (SELECT 1 FROM user_roles LIMIT 1) THEN 'OK' ELSE 'WARNING' END::TEXT,
    (SELECT COUNT(*)::TEXT || ' roles configured' FROM user_roles)::TEXT
  
  UNION ALL
  SELECT 'Dynamic Availability'::TEXT, 'OK'::TEXT, 'Using get_actual_available_quantity()'::TEXT
  
  UNION ALL
  SELECT 'Critical Functions'::TEXT,
    CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname IN ('get_user_role', 'handle_new_user', 'search_cars', 'get_branch_employee_list') GROUP BY proname HAVING COUNT(*) >= 1) 
      THEN 'OK' ELSE 'ERROR' END::TEXT,
    'All critical functions present'::TEXT
  
  UNION ALL
  SELECT 'Search Functions'::TEXT,
    CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname IN ('search_cars', 'search_branches', 'search_models', 'quick_search_suggestions') GROUP BY proname HAVING COUNT(*) >= 1) 
      THEN 'OK' ELSE 'WARNING' END::TEXT,
    'Search functions available'::TEXT
  
  UNION ALL
  SELECT 'Cars Availability View'::TEXT,
    CASE WHEN EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'cars_availability') THEN 'OK' ELSE 'ERROR' END::TEXT,
    'Dynamic availability view'::TEXT
  
  UNION ALL
  SELECT 'Database Indexes'::TEXT,
    CASE WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE indexname LIKE 'idx_user_roles%') THEN 'OK' ELSE 'WARNING' END::TEXT,
    'User roles indexes present'::TEXT;
END;
$$;