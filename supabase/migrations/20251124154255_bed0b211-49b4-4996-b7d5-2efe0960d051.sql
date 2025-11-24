
-- إصلاح دالة notify_admins_new_document لتجاوز RLS
CREATE OR REPLACE FUNCTION notify_admins_new_document()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  admin_record RECORD;
  uploader_name TEXT;
BEGIN
  -- الحصول على اسم الرافع من profiles (مع تجاوز RLS)
  SELECT p.full_name INTO uploader_name
  FROM public.profiles p
  WHERE p.user_id = NEW.user_id;

  -- إرسال إشعار لكل أدمن
  FOR admin_record IN 
    SELECT DISTINCT ur.user_id 
    FROM public.user_roles ur
    WHERE ur.role = 'admin'
  LOOP
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
      admin_record.user_id,
      'document_pending',
      'New Document Pending Review',
      'مستند جديد بانتظار المراجعة',
      'A new ' || NEW.document_type || ' document has been uploaded by ' || COALESCE(uploader_name, 'Unknown') || ' and requires review.',
      'تم رفع مستند جديد (' || NEW.document_type || ') من قبل ' || COALESCE(uploader_name, 'غير معروف') || ' ويحتاج للمراجعة.',
      jsonb_build_object(
        'document_id', NEW.id,
        'document_type', NEW.document_type,
        'uploader_id', NEW.user_id,
        'uploader_name', uploader_name
      ),
      NEW.user_id
    );
  END LOOP;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION notify_admins_new_document() IS 
'Trigger function to notify admins when a new document is uploaded - bypasses RLS';
