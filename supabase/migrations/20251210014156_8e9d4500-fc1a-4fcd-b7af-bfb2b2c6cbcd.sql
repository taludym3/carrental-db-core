-- 1. تعديل الـ RPC function لتحديد أولوية الأدوار
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_role TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;

  -- جلب الدور الأعلى أولوية: admin > branch > branch_employee > customer
  SELECT role::TEXT INTO v_role
  FROM public.user_roles
  WHERE user_id = auth.uid()
  ORDER BY 
    CASE role::TEXT
      WHEN 'admin' THEN 1
      WHEN 'branch' THEN 2
      WHEN 'branch_employee' THEN 3
      WHEN 'customer' THEN 4
      ELSE 5
    END
  LIMIT 1;

  RETURN v_role;
END;
$$;

-- 2. تنظيف البيانات - حذف دور customer للمستخدمين الذين لديهم دور أعلى
DELETE FROM public.user_roles 
WHERE role = 'customer'::public.user_role
AND user_id IN (
  SELECT DISTINCT user_id 
  FROM public.user_roles 
  WHERE role IN ('admin'::public.user_role, 'branch'::public.user_role, 'branch_employee'::public.user_role)
);