-- Fix document management issues

-- 1. Add new notification types
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'document_approved';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'document_rejected';

-- 2. Update documents policies to allow users to update/delete their own pending documents
DROP POLICY IF EXISTS "Users can update own pending documents" ON public.documents;
DROP POLICY IF EXISTS "Users can delete own pending documents" ON public.documents;

CREATE POLICY "Users can update own pending documents"
ON public.documents
FOR UPDATE
TO public
USING (
  auth.uid() = user_id 
  AND status = 'pending'
)
WITH CHECK (
  auth.uid() = user_id 
  AND status = 'pending'
);

CREATE POLICY "Users can delete own pending documents"
ON public.documents
FOR DELETE
TO public
USING (
  auth.uid() = user_id 
  AND status = 'pending'
);

-- 3. Fix storage policies for documents bucket
DROP POLICY IF EXISTS "Users can view their own documents or admin/branch can view" ON storage.objects;
DROP POLICY IF EXISTS "Anyone authenticated can view documents" ON storage.objects;

CREATE POLICY "Authenticated users can view documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' AND (
    -- User can view their own documents
    (auth.uid())::text = (storage.foldername(name))[1]
    -- Or admin can view all
    OR is_admin()
    -- Or branch manager can view employee documents only
    OR (
      is_branch_manager() 
      AND (storage.foldername(name))[1]::uuid IN (
        SELECT p.user_id 
        FROM public.profiles p
        INNER JOIN public.user_roles ur ON ur.user_id = p.user_id
        WHERE p.branch_id = current_user_branch_id()
        AND ur.role IN ('branch'::user_role, 'branch_employee'::user_role)
      )
    )
  )
);

-- 4. Fix update_document_status function to properly set verified_by and use correct notification types
CREATE OR REPLACE FUNCTION public.update_document_status(
  p_document_id UUID,
  p_new_status document_status,
  p_reason TEXT DEFAULT NULL
)
RETURNS documents
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_document documents%ROWTYPE;
  v_old_status document_status;
BEGIN
  -- Check admin or branch manager privileges
  IF NOT is_admin() AND NOT is_branch_manager() THEN
    RAISE EXCEPTION 'Insufficient privileges';
  END IF;
  
  -- Get previous status
  SELECT status INTO v_old_status
  FROM documents
  WHERE id = p_document_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Document not found';
  END IF;
  
  -- Update without restrictions (admin can change any status to any status)
  UPDATE documents
  SET 
    status = p_new_status,
    verified_by = auth.uid(),
    verified_at = NOW(),
    rejection_reason = CASE 
      WHEN p_new_status = 'rejected' THEN COALESCE(p_reason, rejection_reason)
      ELSE NULL 
    END,
    updated_at = NOW()
  WHERE id = p_document_id
  RETURNING * INTO v_document;
  
  -- Send notification based on new status
  IF p_new_status = 'approved' THEN
    PERFORM send_notification(
      v_document.user_id,
      'تم قبول المستند',
      'Document Approved',
      'تم قبول مستندك بنجاح',
      'Your document has been approved successfully',
      'document_approved',
      jsonb_build_object('document_id', v_document.id, 'document_type', v_document.document_type)
    );
  ELSIF p_new_status = 'rejected' THEN
    PERFORM send_notification(
      v_document.user_id,
      'تم رفض المستند',
      'Document Rejected',
      'تم رفض مستندك' || COALESCE(': ' || p_reason, ''),
      'Your document has been rejected' || COALESCE(': ' || p_reason, ''),
      'document_rejected',
      jsonb_build_object('document_id', v_document.id, 'document_type', v_document.document_type, 'reason', p_reason)
    );
  ELSIF p_new_status = 'pending' THEN
    PERFORM send_notification(
      v_document.user_id,
      'تم إعادة المستند للمراجعة',
      'Document Under Review',
      'تم إعادة مستندك لحالة المراجعة',
      'Your document has been moved back to pending status',
      'info',
      jsonb_build_object('document_id', v_document.id, 'document_type', v_document.document_type)
    );
  END IF;
  
  RETURN v_document;
END;
$$;