-- Fix bulk_update_documents_status function - resolve user_id ambiguity
CREATE OR REPLACE FUNCTION bulk_update_documents_status(
  p_document_ids UUID[],
  p_status document_status,
  p_rejection_reason TEXT DEFAULT NULL
)
RETURNS TABLE (
  document_id UUID,
  user_id UUID,
  document_type TEXT,
  new_status document_status
) AS $$
DECLARE
  v_document_id UUID;
  v_user_id UUID;
  v_document_type TEXT;
  v_current_user_id UUID;
BEGIN
  v_current_user_id := auth.uid();
  
  -- Update all documents in the array
  FOREACH v_document_id IN ARRAY p_document_ids
  LOOP
    -- Get document info
    SELECT d.user_id, d.document_type
    INTO v_user_id, v_document_type
    FROM documents d
    WHERE d.id = v_document_id;
    
    -- Update document status
    UPDATE documents d
    SET 
      status = p_status,
      rejection_reason = CASE 
        WHEN p_status = 'rejected' THEN p_rejection_reason
        ELSE NULL
      END,
      verified_by = CASE 
        WHEN p_status IN ('approved', 'rejected') THEN v_current_user_id
        ELSE d.verified_by
      END,
      verified_at = CASE 
        WHEN p_status IN ('approved', 'rejected') THEN now()
        ELSE d.verified_at
      END,
      updated_at = now()
    WHERE d.id = v_document_id;
    
    -- Create notification for the document owner
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
        v_user_id,
        'document_approved',
        'Document Approved',
        'تمت الموافقة على المستند',
        'Your ' || v_document_type || ' document has been approved',
        'تمت الموافقة على مستند ' || v_document_type,
        v_current_user_id
      );
    ELSIF p_status = 'rejected' THEN
      INSERT INTO notifications (
        user_id,
        type,
        title_en,
        title_ar,
        message_en,
        message_ar,
        metadata,
        created_by
      ) VALUES (
        v_user_id,
        'document_rejected',
        'Document Rejected',
        'تم رفض المستند',
        'Your ' || v_document_type || ' document has been rejected',
        'تم رفض مستند ' || v_document_type,
        jsonb_build_object('rejection_reason', p_rejection_reason),
        v_current_user_id
      );
    END IF;
    
    -- Return the updated document info
    RETURN QUERY SELECT v_document_id, v_user_id, v_document_type, p_status;
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;