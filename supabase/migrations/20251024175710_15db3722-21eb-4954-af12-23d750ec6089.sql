-- Fix current_user_branch_id function to avoid infinite recursion
-- by adding SECURITY DEFINER to bypass RLS policies

CREATE OR REPLACE FUNCTION public.current_user_branch_id()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT branch_id 
  FROM public.profiles 
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;