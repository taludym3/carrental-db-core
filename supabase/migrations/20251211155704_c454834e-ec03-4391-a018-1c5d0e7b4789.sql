-- Create RPC function to get available branch managers (bypasses RLS)
CREATE OR REPLACE FUNCTION get_available_branch_managers(p_current_manager_id UUID DEFAULT NULL)
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  email TEXT,
  branch_id UUID,
  is_assigned BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.user_id,
    p.full_name,
    p.email,
    p.branch_id,
    (p.branch_id IS NOT NULL AND p.user_id != COALESCE(p_current_manager_id, '00000000-0000-0000-0000-000000000000'::UUID)) as is_assigned
  FROM public.profiles p
  INNER JOIN public.user_roles ur ON ur.user_id = p.user_id
  WHERE ur.role = 'branch'
  ORDER BY 
    CASE WHEN p.user_id = p_current_manager_id THEN 0 ELSE 1 END,
    CASE WHEN p.branch_id IS NULL THEN 0 ELSE 1 END,
    p.full_name NULLS LAST;
END;
$$;