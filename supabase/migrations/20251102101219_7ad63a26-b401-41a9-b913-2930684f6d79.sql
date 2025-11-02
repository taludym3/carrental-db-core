-- Fix user roles visibility policies
-- Drop existing conflicting policy if exists
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;

-- Allow users to view their own roles
CREATE POLICY "Users can view own role"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Allow admins to view all roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (has_role(auth.uid(), 'admin'::user_role));

-- Allow branch managers to view roles of their branch employees
CREATE POLICY "Branch managers can view branch employee roles"
ON public.user_roles
FOR SELECT
USING (
  has_role(auth.uid(), 'branch'::user_role) 
  AND user_id IN (
    SELECT p.user_id 
    FROM profiles p
    WHERE p.branch_id IN (
      SELECT branch_id 
      FROM profiles 
      WHERE user_id = auth.uid()
    )
  )
);