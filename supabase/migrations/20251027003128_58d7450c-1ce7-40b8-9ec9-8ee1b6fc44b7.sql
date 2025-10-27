-- المرحلة 1: استكمال تحديث الدوال الحرجة

-- 1.1 تحديث get_user_role() لاستخدام user_roles
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS user_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1;
$$;

-- 1.2 تحديث handle_new_user() لإضافة role في user_roles بدلاً من profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  new_user_id UUID;
BEGIN
  new_user_id := NEW.id;
  
  INSERT INTO public.profiles (
    user_id, 
    full_name, 
    email, 
    phone,
    age,
    gender,
    location,
    user_latitude,
    user_longitude
  )
  VALUES (
    new_user_id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    CASE 
      WHEN NEW.raw_user_meta_data ->> 'temp_email' IS NOT NULL 
        AND NEW.raw_user_meta_data ->> 'email' != '' 
      THEN NEW.raw_user_meta_data ->> 'email'
      ELSE COALESCE(NEW.email, '')
    END,
    COALESCE(NEW.raw_user_meta_data ->> 'phone', ''),
    CASE 
      WHEN NEW.raw_user_meta_data ->> 'age' IS NOT NULL 
      THEN (NEW.raw_user_meta_data ->> 'age')::INTEGER
      ELSE NULL
    END,
    NEW.raw_user_meta_data ->> 'gender',
    NEW.raw_user_meta_data ->> 'location',
    CASE 
      WHEN NEW.raw_user_meta_data ->> 'user_latitude' IS NOT NULL 
      THEN (NEW.raw_user_meta_data ->> 'user_latitude')::DECIMAL
      ELSE NULL
    END,
    CASE 
      WHEN NEW.raw_user_meta_data ->> 'user_longitude' IS NOT NULL 
      THEN (NEW.raw_user_meta_data ->> 'user_longitude')::DECIMAL
      ELSE NULL
    END
  );
  
  INSERT INTO public.user_roles (
    user_id,
    role
  )
  VALUES (
    new_user_id,
    'customer'
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to create user profile: %', SQLERRM;
END;
$$;

-- 1.3 تحديث get_branch_employee_list()
CREATE OR REPLACE FUNCTION public.get_branch_employee_list(_branch_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  role user_role,
  is_verified BOOLEAN,
  created_at TIMESTAMPTZ
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    p.id,
    p.user_id,
    p.full_name,
    p.email,
    p.phone,
    ur.role,
    p.is_verified,
    p.created_at
  FROM public.profiles p
  JOIN public.user_roles ur ON p.user_id = ur.user_id
  WHERE p.branch_id = _branch_id 
    AND ur.role IN ('branch', 'branch_employee')
    AND (
      public.has_role(auth.uid(), 'admin')
      OR EXISTS (
        SELECT 1 FROM public.branches b 
        WHERE b.id = _branch_id AND b.manager_id = auth.uid()
      )
    )
  ORDER BY p.created_at DESC;
$$;

-- 1.4 تحديث get_branch_employees_count()
CREATE OR REPLACE FUNCTION public.get_branch_employees_count(_branch_id UUID)
RETURNS INTEGER
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.profiles p
  JOIN public.user_roles ur ON p.user_id = ur.user_id
  WHERE p.branch_id = _branch_id 
    AND ur.role IN ('branch', 'branch_employee');
$$;

-- 1.5 تحديث get_branch_statistics()
CREATE OR REPLACE FUNCTION public.get_branch_statistics(_branch_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  location TEXT,
  is_active BOOLEAN,
  manager_id UUID,
  manager_name TEXT,
  employees_count INTEGER,
  cars_count INTEGER,
  active_bookings_count INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    b.id,
    b.name_en as name,
    b.location_en as location,
    b.is_active,
    b.manager_id,
    p_manager.full_name as manager_name,
    public.get_branch_employees_count(b.id) as employees_count,
    public.get_branch_cars_count(b.id) as cars_count,
    public.get_branch_active_bookings_count(b.id) as active_bookings_count,
    b.created_at,
    b.updated_at
  FROM public.branches b
  LEFT JOIN public.profiles p_manager ON b.manager_id = p_manager.user_id
  WHERE b.id = _branch_id
    AND (
      public.has_role(auth.uid(), 'admin')
      OR b.manager_id = auth.uid()
      OR b.is_active = true
    );
$$;

-- إنشاء indexes لـ user_roles
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_roles_unique ON public.user_roles(user_id, role);