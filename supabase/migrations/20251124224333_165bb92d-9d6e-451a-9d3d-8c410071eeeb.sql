-- دوال RPC لإدارة موظفي الفرع

-- دالة لإضافة موظف جديد إلى الفرع (للمدراء فقط)
CREATE OR REPLACE FUNCTION add_branch_employee(
  p_full_name TEXT,
  p_email TEXT,
  p_phone TEXT,
  p_branch_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_user_id UUID;
  v_profile_id UUID;
  v_current_user_branch UUID;
  v_current_user_role user_role;
  v_result JSON;
BEGIN
  -- التحقق من أن المستخدم الحالي هو مدير فرع
  SELECT role INTO v_current_user_role
  FROM user_roles
  WHERE user_id = auth.uid()
  LIMIT 1;

  IF v_current_user_role != 'branch' THEN
    RAISE EXCEPTION 'Only branch managers can add employees';
  END IF;

  -- التحقق من أن المدير يضيف موظف لفرعه الخاص
  SELECT branch_id INTO v_current_user_branch
  FROM profiles
  WHERE user_id = auth.uid();

  IF v_current_user_branch != p_branch_id THEN
    RAISE EXCEPTION 'You can only add employees to your own branch';
  END IF;

  -- التحقق من عدم وجود المستخدم مسبقاً
  IF EXISTS (SELECT 1 FROM profiles WHERE email = p_email OR phone = p_phone) THEN
    RAISE EXCEPTION 'User with this email or phone already exists';
  END IF;

  -- إنشاء مستخدم جديد في auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    p_email,
    crypt('TempPassword123!', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('full_name', p_full_name, 'phone', p_phone),
    NOW(),
    NOW(),
    encode(gen_random_bytes(32), 'hex'),
    encode(gen_random_bytes(32), 'hex')
  )
  RETURNING id INTO v_user_id;

  -- إنشاء ملف شخصي للموظف
  INSERT INTO profiles (user_id, full_name, email, phone, branch_id, is_verified)
  VALUES (v_user_id, p_full_name, p_email, p_phone, p_branch_id, true)
  RETURNING id INTO v_profile_id;

  -- إضافة دور الموظف
  INSERT INTO user_roles (user_id, role, assigned_by)
  VALUES (v_user_id, 'branch_employee', auth.uid());

  -- إنشاء إشعار للموظف الجديد
  INSERT INTO notifications (
    user_id,
    type,
    title_en,
    title_ar,
    message_en,
    message_ar,
    created_by
  )
  VALUES (
    v_user_id,
    'system',
    'Welcome to the team',
    'مرحباً بك في الفريق',
    'You have been added as a branch employee. Please change your password.',
    'تم إضافتك كموظف فرع. يرجى تغيير كلمة المرور الخاصة بك.',
    auth.uid()
  );

  v_result := json_build_object(
    'success', true,
    'user_id', v_user_id,
    'profile_id', v_profile_id,
    'message', 'Employee added successfully'
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- دالة لتعطيل/تفعيل موظف (للمدراء فقط)
CREATE OR REPLACE FUNCTION toggle_branch_employee_status(
  p_employee_user_id UUID,
  p_is_active BOOLEAN
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_current_user_branch UUID;
  v_employee_branch UUID;
  v_current_user_role user_role;
  v_employee_role user_role;
  v_result JSON;
BEGIN
  -- التحقق من أن المستخدم الحالي هو مدير فرع
  SELECT role INTO v_current_user_role
  FROM user_roles
  WHERE user_id = auth.uid()
  LIMIT 1;

  IF v_current_user_role != 'branch' THEN
    RAISE EXCEPTION 'Only branch managers can manage employees';
  END IF;

  -- الحصول على فرع المدير
  SELECT branch_id INTO v_current_user_branch
  FROM profiles
  WHERE user_id = auth.uid();

  -- الحصول على فرع ودور الموظف
  SELECT p.branch_id, ur.role INTO v_employee_branch, v_employee_role
  FROM profiles p
  LEFT JOIN user_roles ur ON ur.user_id = p.user_id
  WHERE p.user_id = p_employee_user_id;

  -- التحقق من أن الموظف تابع لنفس الفرع
  IF v_employee_branch != v_current_user_branch THEN
    RAISE EXCEPTION 'Employee does not belong to your branch';
  END IF;

  -- التحقق من أن الموظف ليس مدير
  IF v_employee_role = 'branch' OR v_employee_role = 'admin' THEN
    RAISE EXCEPTION 'Cannot modify manager or admin accounts';
  END IF;

  -- تحديث حالة الموظف
  UPDATE profiles
  SET is_verified = p_is_active
  WHERE user_id = p_employee_user_id;

  -- إنشاء إشعار للموظف
  INSERT INTO notifications (
    user_id,
    type,
    title_en,
    title_ar,
    message_en,
    message_ar,
    created_by
  )
  VALUES (
    p_employee_user_id,
    'system',
    CASE WHEN p_is_active THEN 'Account Activated' ELSE 'Account Deactivated' END,
    CASE WHEN p_is_active THEN 'تم تفعيل الحساب' ELSE 'تم تعطيل الحساب' END,
    CASE WHEN p_is_active THEN 'Your account has been activated.' ELSE 'Your account has been deactivated.' END,
    CASE WHEN p_is_active THEN 'تم تفعيل حسابك.' ELSE 'تم تعطيل حسابك.' END,
    auth.uid()
  );

  v_result := json_build_object(
    'success', true,
    'message', 'Employee status updated successfully'
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- دالة لحذف موظف (للمدراء فقط)
CREATE OR REPLACE FUNCTION remove_branch_employee(
  p_employee_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_current_user_branch UUID;
  v_employee_branch UUID;
  v_current_user_role user_role;
  v_employee_role user_role;
  v_result JSON;
BEGIN
  -- التحقق من أن المستخدم الحالي هو مدير فرع
  SELECT role INTO v_current_user_role
  FROM user_roles
  WHERE user_id = auth.uid()
  LIMIT 1;

  IF v_current_user_role != 'branch' THEN
    RAISE EXCEPTION 'Only branch managers can remove employees';
  END IF;

  -- الحصول على فرع المدير
  SELECT branch_id INTO v_current_user_branch
  FROM profiles
  WHERE user_id = auth.uid();

  -- الحصول على فرع ودور الموظف
  SELECT p.branch_id, ur.role INTO v_employee_branch, v_employee_role
  FROM profiles p
  LEFT JOIN user_roles ur ON ur.user_id = p.user_id
  WHERE p.user_id = p_employee_user_id;

  -- التحقق من أن الموظف تابع لنفس الفرع
  IF v_employee_branch != v_current_user_branch THEN
    RAISE EXCEPTION 'Employee does not belong to your branch';
  END IF;

  -- التحقق من أن الموظف ليس مدير
  IF v_employee_role = 'branch' OR v_employee_role = 'admin' THEN
    RAISE EXCEPTION 'Cannot remove manager or admin accounts';
  END IF;

  -- حذف المستخدم (cascade سيحذف البروفايل والأدوار)
  DELETE FROM auth.users WHERE id = p_employee_user_id;

  v_result := json_build_object(
    'success', true,
    'message', 'Employee removed successfully'
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- دالة للحصول على موظفي الفرع (للمدراء فقط)
CREATE OR REPLACE FUNCTION get_branch_employees(
  p_branch_id UUID DEFAULT NULL
)
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ,
  role user_role
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_current_user_branch UUID;
  v_current_user_role user_role;
  v_target_branch UUID;
BEGIN
  -- الحصول على دور المستخدم الحالي
  SELECT ur.role INTO v_current_user_role
  FROM user_roles ur
  WHERE ur.user_id = auth.uid()
  LIMIT 1;

  -- الحصول على فرع المستخدم الحالي
  SELECT p.branch_id INTO v_current_user_branch
  FROM profiles p
  WHERE p.user_id = auth.uid();

  -- تحديد الفرع المستهدف
  IF p_branch_id IS NOT NULL THEN
    v_target_branch := p_branch_id;
  ELSE
    v_target_branch := v_current_user_branch;
  END IF;

  -- التحقق من الصلاحيات
  IF v_current_user_role = 'branch' OR v_current_user_role = 'branch_employee' THEN
    -- يمكن للمدراء والموظفين رؤية موظفي فرعهم فقط
    IF v_target_branch != v_current_user_branch THEN
      RAISE EXCEPTION 'You can only view employees from your own branch';
    END IF;
  ELSIF v_current_user_role != 'admin' THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- إرجاع قائمة الموظفين
  RETURN QUERY
  SELECT
    p.user_id,
    p.full_name,
    p.email,
    p.phone,
    p.is_verified as is_active,
    p.created_at,
    ur.role
  FROM profiles p
  INNER JOIN user_roles ur ON ur.user_id = p.user_id
  WHERE p.branch_id = v_target_branch
    AND ur.role IN ('branch', 'branch_employee')
  ORDER BY 
    CASE WHEN ur.role = 'branch' THEN 0 ELSE 1 END,
    p.created_at DESC;
END;
$$;