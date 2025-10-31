-- دالة قبول المستند
CREATE OR REPLACE FUNCTION public.approve_document(
  p_document_id UUID
)
RETURNS documents
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_document documents%ROWTYPE;
  v_role user_role;
BEGIN
  v_role := get_user_role(auth.uid());
  
  IF v_role NOT IN ('admin', 'branch', 'branch_employee') THEN
    RAISE EXCEPTION 'Insufficient privileges';
  END IF;
  
  UPDATE documents
  SET 
    status = 'approved',
    verified_by = auth.uid(),
    verified_at = NOW(),
    rejection_reason = NULL,
    updated_at = NOW()
  WHERE id = p_document_id
    AND (
      is_admin()
      OR (
        is_branch_manager() 
        AND user_id IN (
          SELECT user_id FROM profiles 
          WHERE branch_id = current_user_branch_id()
        )
      )
    )
  RETURNING * INTO v_document;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Document not found or access denied';
  END IF;
  
  -- إرسال إشعار للمستخدم
  PERFORM send_notification(
    v_document.user_id,
    'تم قبول المستند',
    'Document Approved',
    'تم قبول مستندك بنجاح',
    'Your document has been approved successfully',
    'document_update',
    jsonb_build_object('document_id', v_document.id, 'document_type', v_document.document_type)
  );
  
  RETURN v_document;
END;
$$;

-- دالة رفض المستند
CREATE OR REPLACE FUNCTION public.reject_document(
  p_document_id UUID,
  p_reason TEXT
)
RETURNS documents
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_document documents%ROWTYPE;
  v_role user_role;
BEGIN
  IF p_reason IS NULL OR TRIM(p_reason) = '' THEN
    RAISE EXCEPTION 'Rejection reason is required';
  END IF;
  
  v_role := get_user_role(auth.uid());
  
  IF v_role NOT IN ('admin', 'branch', 'branch_employee') THEN
    RAISE EXCEPTION 'Insufficient privileges';
  END IF;
  
  UPDATE documents
  SET 
    status = 'rejected',
    verified_by = auth.uid(),
    verified_at = NOW(),
    rejection_reason = p_reason,
    updated_at = NOW()
  WHERE id = p_document_id
    AND (
      is_admin()
      OR (
        is_branch_manager() 
        AND user_id IN (
          SELECT user_id FROM profiles 
          WHERE branch_id = current_user_branch_id()
        )
      )
    )
  RETURNING * INTO v_document;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Document not found or access denied';
  END IF;
  
  -- إرسال إشعار للمستخدم
  PERFORM send_notification(
    v_document.user_id,
    'تم رفض المستند',
    'Document Rejected',
    'تم رفض مستندك: ' || p_reason,
    'Your document has been rejected: ' || p_reason,
    'document_update',
    jsonb_build_object('document_id', v_document.id, 'document_type', v_document.document_type, 'reason', p_reason)
  );
  
  RETURN v_document;
END;
$$;

-- دالة جلب المستندات قيد المراجعة
CREATE OR REPLACE FUNCTION public.get_pending_documents(
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
  document_id UUID,
  document_type TEXT,
  document_url TEXT,
  document_status document_status,
  created_at TIMESTAMPTZ,
  user_id UUID,
  user_name TEXT,
  user_email TEXT,
  user_phone TEXT,
  total_count BIGINT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  total_records BIGINT;
BEGIN
  -- حساب إجمالي السجلات
  SELECT COUNT(*) INTO total_records
  FROM documents d
  JOIN profiles p ON d.user_id = p.user_id
  WHERE d.status = 'pending'
    AND (
      is_admin()
      OR (
        is_branch_manager()
        AND p.branch_id = current_user_branch_id()
      )
    );
  
  RETURN QUERY
  SELECT 
    d.id,
    d.document_type,
    d.document_url,
    d.status,
    d.created_at,
    p.user_id,
    p.full_name,
    p.email,
    p.phone,
    total_records
  FROM documents d
  JOIN profiles p ON d.user_id = p.user_id
  WHERE d.status = 'pending'
    AND (
      is_admin()
      OR (
        is_branch_manager()
        AND p.branch_id = current_user_branch_id()
      )
    )
  ORDER BY d.created_at ASC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- دالة جلب المستندات حسب الحالة
CREATE OR REPLACE FUNCTION public.get_documents_by_status(
  p_status document_status DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
  document_id UUID,
  document_type TEXT,
  document_url TEXT,
  document_status document_status,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  user_id UUID,
  user_name TEXT,
  user_email TEXT,
  user_phone TEXT,
  verified_by_name TEXT,
  total_count BIGINT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  total_records BIGINT;
BEGIN
  -- حساب إجمالي السجلات
  SELECT COUNT(*) INTO total_records
  FROM documents d
  JOIN profiles p ON d.user_id = p.user_id
  WHERE (p_status IS NULL OR d.status = p_status)
    AND (
      is_admin()
      OR (
        is_branch_manager()
        AND p.branch_id = current_user_branch_id()
      )
    );
  
  RETURN QUERY
  SELECT 
    d.id,
    d.document_type,
    d.document_url,
    d.status,
    d.rejection_reason,
    d.created_at,
    d.verified_at,
    p.user_id,
    p.full_name,
    p.email,
    p.phone,
    vp.full_name,
    total_records
  FROM documents d
  JOIN profiles p ON d.user_id = p.user_id
  LEFT JOIN profiles vp ON d.verified_by = vp.user_id
  WHERE (p_status IS NULL OR d.status = p_status)
    AND (
      is_admin()
      OR (
        is_branch_manager()
        AND p.branch_id = current_user_branch_id()
      )
    )
  ORDER BY 
    CASE 
      WHEN d.status = 'pending' THEN 1
      WHEN d.status = 'approved' THEN 2
      ELSE 3
    END,
    d.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;