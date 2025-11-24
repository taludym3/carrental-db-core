-- Fix add_branch_employee to UPDATE instead of INSERT (trigger already creates records)
CREATE OR REPLACE FUNCTION add_branch_employee(
  p_branch_id UUID,
  p_email TEXT,
  p_full_name TEXT,
  p_phone TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_new_user_id UUID;
  v_existing_user_id UUID;
  v_requesting_user_branch_id UUID;
  v_requesting_user_role user_role;
  encrypted_password TEXT;
BEGIN
  -- Check caller permissions: must be branch manager of the specified branch
  SELECT p.branch_id, ur.role 
  INTO v_requesting_user_branch_id, v_requesting_user_role
  FROM profiles p
  JOIN user_roles ur ON ur.user_id = p.user_id
  WHERE p.user_id = auth.uid();

  -- Only branch managers can add employees
  IF v_requesting_user_role != 'branch' THEN
    RAISE EXCEPTION 'Only branch managers can add employees';
  END IF;

  -- Manager can only add employees to their own branch
  IF v_requesting_user_branch_id != p_branch_id THEN
    RAISE EXCEPTION 'You can only add employees to your own branch';
  END IF;

  -- Check if user with this email already exists
  SELECT id INTO v_existing_user_id
  FROM auth.users
  WHERE email = p_email;

  IF v_existing_user_id IS NOT NULL THEN
    RAISE EXCEPTION 'User with this email already exists';
  END IF;

  -- Generate encrypted password using extensions schema
  encrypted_password := extensions.crypt('TempPassword123!', extensions.gen_salt('bf'));

  -- Create new user in auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    confirmation_token,
    email_change_token_new,
    recovery_token
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    p_email,
    encrypted_password,
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('full_name', p_full_name, 'phone', p_phone),
    false,
    '',
    '',
    ''
  )
  RETURNING id INTO v_new_user_id;

  -- Wait a moment for trigger to complete
  PERFORM pg_sleep(0.1);

  -- Update profile (trigger already created it)
  UPDATE profiles 
  SET email = p_email, 
      full_name = p_full_name, 
      phone = p_phone, 
      branch_id = p_branch_id,
      updated_at = NOW()
  WHERE user_id = v_new_user_id;

  -- Update user role (trigger already created it as 'customer')
  UPDATE user_roles 
  SET role = 'branch_employee', 
      assigned_by = auth.uid(),
      assigned_at = NOW()
  WHERE user_id = v_new_user_id;

  -- Send notification to new employee
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
    v_new_user_id,
    'account_created',
    'Welcome to the Team',
    'مرحباً بك في الفريق',
    'Your account has been created. Temporary password: TempPassword123!',
    'تم إنشاء حسابك. كلمة المرور المؤقتة: TempPassword123!',
    auth.uid()
  );

  RETURN json_build_object(
    'success', true,
    'user_id', v_new_user_id,
    'message', 'Employee added successfully'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;