-- حذف الدالة القديمة وإعادة إنشائها بالنوع الصحيح
DROP FUNCTION IF EXISTS update_document_status(UUID, document_status, TEXT);

-- إنشاء دالة update_document_status لتغيير حالة المستند
CREATE OR REPLACE FUNCTION update_document_status(
  p_document_id UUID,
  p_new_status document_status,
  p_reason TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  document_type TEXT,
  document_url TEXT,
  status document_status,
  rejection_reason TEXT,
  verified_by UUID,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_document RECORD;
  v_user_name TEXT;
  v_verifier_name TEXT;
BEGIN
  -- الحصول على بيانات المستند الحالية
  SELECT * INTO v_document
  FROM public.documents d
  WHERE d.id = p_document_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Document not found';
  END IF;

  -- الحصول على اسم المستخدم من profiles
  SELECT p.full_name INTO v_user_name
  FROM public.profiles p
  WHERE p.user_id = v_document.user_id;

  -- الحصول على اسم المحقق من profiles
  SELECT p.full_name INTO v_verifier_name
  FROM public.profiles p
  WHERE p.user_id = auth.uid();

  -- تحديث المستند
  UPDATE public.documents
  SET 
    status = p_new_status,
    rejection_reason = CASE 
      WHEN p_new_status = 'rejected' THEN p_reason
      ELSE NULL
    END,
    verified_by = CASE 
      WHEN p_new_status IN ('approved', 'rejected') THEN auth.uid()
      ELSE NULL
    END,
    verified_at = CASE 
      WHEN p_new_status IN ('approved', 'rejected') THEN NOW()
      ELSE NULL
    END,
    updated_at = NOW()
  WHERE documents.id = p_document_id;

  -- إرسال إشعار للمستخدم حسب الحالة الجديدة
  IF p_new_status = 'approved' THEN
    INSERT INTO public.notifications (
      user_id,
      type,
      title_en,
      title_ar,
      message_en,
      message_ar,
      metadata,
      created_by
    ) VALUES (
      v_document.user_id,
      'document_approved',
      'Document Approved',
      'تمت الموافقة على المستند',
      'Your ' || v_document.document_type || ' document has been approved by ' || COALESCE(v_verifier_name, 'Admin') || '.',
      'تمت الموافقة على مستند ' || v_document.document_type || ' من قبل ' || COALESCE(v_verifier_name, 'الإدارة') || '.',
      jsonb_build_object(
        'document_id', p_document_id,
        'document_type', v_document.document_type,
        'status', 'approved',
        'verified_by', auth.uid()
      ),
      auth.uid()
    );
  ELSIF p_new_status = 'rejected' THEN
    INSERT INTO public.notifications (
      user_id,
      type,
      title_en,
      title_ar,
      message_en,
      message_ar,
      metadata,
      created_by
    ) VALUES (
      v_document.user_id,
      'document_rejected',
      'Document Rejected',
      'تم رفض المستند',
      'Your ' || v_document.document_type || ' document has been rejected. Reason: ' || COALESCE(p_reason, 'No reason provided') || '.',
      'تم رفض مستند ' || v_document.document_type || '. السبب: ' || COALESCE(p_reason, 'لم يتم تقديم سبب') || '.',
      jsonb_build_object(
        'document_id', p_document_id,
        'document_type', v_document.document_type,
        'status', 'rejected',
        'rejection_reason', p_reason,
        'verified_by', auth.uid()
      ),
      auth.uid()
    );
  ELSIF p_new_status = 'pending' THEN
    INSERT INTO public.notifications (
      user_id,
      type,
      title_en,
      title_ar,
      message_en,
      message_ar,
      metadata,
      created_by
    ) VALUES (
      v_document.user_id,
      'document_pending',
      'Document Under Review',
      'المستند قيد المراجعة',
      'Your ' || v_document.document_type || ' document status has been changed to pending review.',
      'تم تغيير حالة مستند ' || v_document.document_type || ' إلى قيد المراجعة.',
      jsonb_build_object(
        'document_id', p_document_id,
        'document_type', v_document.document_type,
        'status', 'pending',
        'changed_by', auth.uid()
      ),
      auth.uid()
    );
  END IF;

  -- إرجاع المستند المحدث
  RETURN QUERY
  SELECT 
    d.id,
    d.user_id,
    d.document_type,
    d.document_url,
    d.status,
    d.rejection_reason,
    d.verified_by,
    d.verified_at,
    d.created_at,
    d.updated_at
  FROM public.documents d
  WHERE d.id = p_document_id;
END;
$$;

COMMENT ON FUNCTION update_document_status IS 
'Updates document status and sends bilingual notifications to the user';