-- Create RPC function for bulk document status updates
CREATE OR REPLACE FUNCTION bulk_update_documents_status(
  p_document_ids UUID[],
  p_status document_status,
  p_rejection_reason TEXT DEFAULT NULL
)
RETURNS TABLE(
  document_id UUID,
  user_id UUID,
  document_type TEXT,
  new_status document_status
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_admin_id UUID;
  v_doc RECORD;
  v_user_name TEXT;
BEGIN
  -- Get current admin user ID
  v_admin_id := auth.uid();
  
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = v_admin_id AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can update document status';
  END IF;

  -- Update all documents in the array
  FOR v_doc IN
    UPDATE documents
    SET 
      status = p_status,
      rejection_reason = CASE 
        WHEN p_status = 'rejected' THEN COALESCE(p_rejection_reason, rejection_reason)
        ELSE NULL 
      END,
      verified_by = v_admin_id,
      verified_at = CASE 
        WHEN p_status IN ('approved', 'rejected') THEN NOW()
        ELSE verified_at
      END,
      updated_at = NOW()
    WHERE id = ANY(p_document_ids)
    RETURNING id, user_id, document_type, status
  LOOP
    document_id := v_doc.id;
    user_id := v_doc.user_id;
    document_type := v_doc.document_type;
    new_status := v_doc.status;
    
    RETURN NEXT;
    
    -- Get user name for notification
    SELECT full_name INTO v_user_name
    FROM profiles
    WHERE user_id = v_doc.user_id;
    
    -- Send notification to customer
    IF p_status = 'approved' THEN
      INSERT INTO notifications (
        user_id, 
        type, 
        title_en, 
        title_ar,
        message_en, 
        message_ar,
        created_by
      ) VALUES (
        v_doc.user_id,
        'document_approved',
        'Document Approved',
        'تمت الموافقة على المستند',
        'Your ' || v_doc.document_type || ' has been approved',
        'تمت الموافقة على ' || 
          CASE v_doc.document_type
            WHEN 'national_id' THEN 'الهوية الوطنية'
            WHEN 'drivers_license' THEN 'رخصة القيادة'
            WHEN 'passport' THEN 'جواز السفر'
            ELSE v_doc.document_type
          END,
        v_admin_id
      );
    ELSIF p_status = 'rejected' THEN
      INSERT INTO notifications (
        user_id, 
        type, 
        title_en, 
        title_ar,
        message_en, 
        message_ar,
        created_by,
        metadata
      ) VALUES (
        v_doc.user_id,
        'document_rejected',
        'Document Rejected',
        'تم رفض المستند',
        'Your ' || v_doc.document_type || ' has been rejected. Reason: ' || COALESCE(p_rejection_reason, 'Not specified'),
        'تم رفض ' || 
          CASE v_doc.document_type
            WHEN 'national_id' THEN 'الهوية الوطنية'
            WHEN 'drivers_license' THEN 'رخصة القيادة'
            WHEN 'passport' THEN 'جواز السفر'
            ELSE v_doc.document_type
          END || 
          '. السبب: ' || COALESCE(p_rejection_reason, 'غير محدد'),
        v_admin_id,
        jsonb_build_object('rejection_reason', p_rejection_reason)
      );
    END IF;
  END LOOP;
  
  RETURN;
END;
$$;

-- Grant execute permission to authenticated users (RLS will handle authorization)
GRANT EXECUTE ON FUNCTION bulk_update_documents_status TO authenticated;