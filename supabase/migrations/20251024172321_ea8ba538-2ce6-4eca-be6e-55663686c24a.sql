-- ===================================================================
-- LEAGO Car Rental System - Security Fix: User Roles System
-- ===================================================================
-- This migration creates a secure user roles system using a separate
-- table to prevent privilege escalation attacks.
-- ===================================================================

-- 1. Create user_roles table (separate from profiles for security)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role user_role NOT NULL,
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 2. Create security definer function to check roles safely
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role user_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- 3. Create function to get current user's role
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS user_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT role FROM public.user_roles 
  WHERE user_id = auth.uid() 
  LIMIT 1;
$$;

-- 4. Update existing helper functions to use new system
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN 
LANGUAGE SQL 
STABLE 
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT has_role(auth.uid(), 'admin');
$$;

CREATE OR REPLACE FUNCTION public.is_branch_manager()
RETURNS BOOLEAN 
LANGUAGE SQL 
STABLE 
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT has_role(auth.uid(), 'branch');
$$;

-- 5. Migrate existing role data from profiles.role to user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, role FROM public.profiles
WHERE role IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- 6. Drop the insecure role column from profiles
ALTER TABLE public.profiles DROP COLUMN IF EXISTS role;

-- 7. Create RLS policies for user_roles table
-- Users can view their own role
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
CREATE POLICY "Users can view own role"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

-- Only admins can assign roles
DROP POLICY IF EXISTS "Only admins can assign roles" ON public.user_roles;
CREATE POLICY "Only admins can assign roles"
ON public.user_roles FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Only admins can update roles
DROP POLICY IF EXISTS "Only admins can update roles" ON public.user_roles;
CREATE POLICY "Only admins can update roles"
ON public.user_roles FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Only admins can delete roles
DROP POLICY IF EXISTS "Only admins can delete roles" ON public.user_roles;
CREATE POLICY "Only admins can delete roles"
ON public.user_roles FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- 8. Update existing RLS policies to use has_role function
-- Update profiles policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Branch managers can view branch profiles" ON public.profiles;
CREATE POLICY "Branch managers can view branch profiles"
ON public.profiles FOR SELECT
USING (has_role(auth.uid(), 'branch'));

-- Update branches policies
DROP POLICY IF EXISTS "Admins can view all branches" ON public.branches;
CREATE POLICY "Admins can view all branches"
ON public.branches FOR SELECT
USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Branch managers can view own branch" ON public.branches;
CREATE POLICY "Branch managers can view own branch"
ON public.branches FOR SELECT
USING (
  has_role(auth.uid(), 'branch') AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND branch_id = branches.id
  )
);

-- Success message
COMMENT ON TABLE public.user_roles IS 'Secure user roles table - prevents privilege escalation attacks';