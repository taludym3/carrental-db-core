-- Fix critical security issues: Restrict branch manager access to employee data only

-- 1. Fix profiles RLS policy - Branch managers should only view employee profiles, not customers
DROP POLICY IF EXISTS "Branch managers can view their branch employees" ON public.profiles;

CREATE POLICY "Branch managers can view their branch employees" ON public.profiles 
FOR SELECT 
USING (
  is_branch_manager() 
  AND branch_id = current_user_branch_id()
  AND user_id IN (
    -- Only show profiles that have employee roles (branch or branch_employee)
    SELECT user_id FROM public.user_roles 
    WHERE role IN ('branch'::user_role, 'branch_employee'::user_role)
  )
);

-- 2. Fix documents RLS policy - Branch managers should only view employee documents, not customer documents
DROP POLICY IF EXISTS "Branch managers can view branch documents" ON public.documents;

CREATE POLICY "Branch managers can view branch documents" ON public.documents 
FOR SELECT 
USING (
  is_branch_manager() 
  AND user_id IN (
    -- Only show documents for users who are employees in their branch
    SELECT p.user_id 
    FROM public.profiles p
    INNER JOIN public.user_roles ur ON ur.user_id = p.user_id
    WHERE p.branch_id = current_user_branch_id()
    AND ur.role IN ('branch'::user_role, 'branch_employee'::user_role)
  )
);

-- 3. Same restriction for document updates by branch managers
DROP POLICY IF EXISTS "Admins and branch managers can update documents" ON public.documents;

CREATE POLICY "Admins and branch managers can update documents" ON public.documents 
FOR UPDATE 
USING (
  is_admin() 
  OR (
    is_branch_manager() 
    AND user_id IN (
      -- Only allow updates to documents of employees in their branch
      SELECT p.user_id 
      FROM public.profiles p
      INNER JOIN public.user_roles ur ON ur.user_id = p.user_id
      WHERE p.branch_id = current_user_branch_id()
      AND ur.role IN ('branch'::user_role, 'branch_employee'::user_role)
    )
  )
)
WITH CHECK (
  is_admin() 
  OR (
    is_branch_manager() 
    AND user_id IN (
      SELECT p.user_id 
      FROM public.profiles p
      INNER JOIN public.user_roles ur ON ur.user_id = p.user_id
      WHERE p.branch_id = current_user_branch_id()
      AND ur.role IN ('branch'::user_role, 'branch_employee'::user_role)
    )
  )
);

-- Add audit logging trigger for sensitive profile access
CREATE OR REPLACE FUNCTION public.log_profile_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log when branch managers access employee profiles
  IF is_branch_manager() AND auth.uid() != NEW.user_id THEN
    INSERT INTO public.security_audit_log (
      event_type,
      user_id,
      identifier,
      details
    ) VALUES (
      'profile_access',
      auth.uid(),
      NEW.user_id::text,
      jsonb_build_object(
        'accessed_user_id', NEW.user_id,
        'accessed_user_name', NEW.full_name,
        'branch_id', NEW.branch_id
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Add audit logging trigger for document access
CREATE OR REPLACE FUNCTION public.log_document_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log when admins or branch managers access documents
  IF (is_admin() OR is_branch_manager()) AND auth.uid() != NEW.user_id THEN
    INSERT INTO public.security_audit_log (
      event_type,
      user_id,
      identifier,
      details
    ) VALUES (
      'document_access',
      auth.uid(),
      NEW.user_id::text,
      jsonb_build_object(
        'document_id', NEW.id,
        'document_type', NEW.document_type,
        'document_status', NEW.status,
        'accessed_user_id', NEW.user_id
      )
    );
  END IF;
  RETURN NEW;
END;
$$;