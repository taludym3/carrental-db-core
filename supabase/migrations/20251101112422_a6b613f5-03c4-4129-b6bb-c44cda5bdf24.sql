-- إنشاء دالة عامة لتحديث حالة المستند (للأدمن فقط)
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
  -- التحقق من صلاحيات الأدمن فقط
  IF NOT is_admin() AND NOT is_branch_manager() THEN
    RAISE EXCEPTION 'Insufficient privileges - Admin or Branch Manager required';
  END IF;
  
  -- جلب الحالة السابقة
  SELECT status INTO v_old_status
  FROM documents
  WHERE id = p_document_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Document not found';
  END IF;
  
  -- التحديث بدون أي قيود على الحالة
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
  
  -- إرسال إشعار حسب الحالة الجديدة
  IF p_new_status = 'approved' THEN
    PERFORM send_notification(
      v_document.user_id,
      'تم قبول المستند',
      'Document Approved',
      'تم قبول مستندك بنجاح',
      'Your document has been approved successfully',
      'document_update',
      jsonb_build_object('document_id', v_document.id, 'document_type', v_document.document_type)
    );
  ELSIF p_new_status = 'rejected' THEN
    PERFORM send_notification(
      v_document.user_id,
      'تم رفض المستند',
      'Document Rejected',
      'تم رفض مستندك' || COALESCE(': ' || p_reason, ''),
      'Your document has been rejected' || COALESCE(': ' || p_reason, ''),
      'document_update',
      jsonb_build_object('document_id', v_document.id, 'document_type', v_document.document_type, 'reason', p_reason)
    );
  ELSIF p_new_status = 'pending' THEN
    PERFORM send_notification(
      v_document.user_id,
      'تم إعادة المستند للمراجعة',
      'Document Under Review',
      'تم إعادة مستندك لحالة المراجعة',
      'Your document has been moved back to pending status',
      'document_update',
      jsonb_build_object('document_id', v_document.id, 'document_type', v_document.document_type)
    );
  END IF;
  
  RETURN v_document;
END;
$$;

-- تعديل approve_document لإزالة القيود
CREATE OR REPLACE FUNCTION public.approve_document(p_document_id UUID)
RETURNS documents
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN update_document_status(p_document_id, 'approved', NULL);
END;
$$;

-- تعديل reject_document لإزالة القيود
CREATE OR REPLACE FUNCTION public.reject_document(
  p_document_id UUID,
  p_reason TEXT
)
RETURNS documents
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF p_reason IS NULL OR TRIM(p_reason) = '' THEN
    RAISE EXCEPTION 'Rejection reason is required';
  END IF;
  
  RETURN update_document_status(p_document_id, 'rejected', p_reason);
END;
$$;

-- حذف policy القديم إذا كان موجود
DROP POLICY IF EXISTS "Admins and branch managers can update documents" ON documents;

-- إضافة policy للتحديث
CREATE POLICY "Admins and branch managers can update documents"
ON documents
FOR UPDATE
TO public
USING (
  is_admin() 
  OR (
    is_branch_manager() 
    AND user_id IN (
      SELECT user_id FROM profiles 
      WHERE branch_id = current_user_branch_id()
    )
  )
)
WITH CHECK (
  is_admin() 
  OR (
    is_branch_manager() 
    AND user_id IN (
      SELECT user_id FROM profiles 
      WHERE branch_id = current_user_branch_id()
    )
  )
);