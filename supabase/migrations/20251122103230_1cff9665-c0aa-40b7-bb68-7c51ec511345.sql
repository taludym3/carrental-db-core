
-- تفعيل الـ triggers المعطلة
ALTER TABLE documents ENABLE TRIGGER trigger_notify_admins_new_document;
ALTER TABLE bookings ENABLE TRIGGER trigger_notify_admins_booking_active;

-- إعادة إنشاء function إشعارات المستندات الجديدة بشكل محسّن
CREATE OR REPLACE FUNCTION notify_admins_new_document()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_record RECORD;
  uploader_name TEXT;
BEGIN
  -- الحصول على اسم الرافع
  SELECT full_name INTO uploader_name
  FROM profiles
  WHERE user_id = NEW.user_id;

  -- إرسال إشعار لكل أدمن
  FOR admin_record IN 
    SELECT DISTINCT user_id 
    FROM user_roles 
    WHERE role = 'admin'
  LOOP
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

-- إعادة إنشاء function إشعارات الحجوزات النشطة بشكل محسّن
CREATE OR REPLACE FUNCTION notify_admins_booking_active()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_record RECORD;
  customer_name TEXT;
  car_info TEXT;
BEGIN
  -- التحقق من أن الحالة تغيرت إلى active
  IF NEW.status = 'active' AND (OLD.status IS NULL OR OLD.status != 'active') THEN
    
    -- الحصول على معلومات العميل
    SELECT full_name INTO customer_name
    FROM profiles
    WHERE user_id = NEW.customer_id;

    -- الحصول على معلومات السيارة
    SELECT 
      COALESCE(cm.name_en, '') || ' ' || COALESCE(cb.name_en, '')
    INTO car_info
    FROM cars c
    LEFT JOIN car_models cm ON cm.id = c.model_id
    LEFT JOIN car_brands cb ON cb.id = cm.brand_id
    WHERE c.id = NEW.car_id;

    -- إرسال إشعار لكل أدمن
    FOR admin_record IN 
      SELECT DISTINCT user_id 
      FROM user_roles 
      WHERE role = 'admin'
    LOOP
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
        admin_record.user_id,
        'booking_active',
        'Booking Now Active',
        'حجز نشط الآن',
        'Booking for ' || COALESCE(car_info, 'Unknown car') || ' by ' || COALESCE(customer_name, 'Unknown') || ' is now active.',
        'الحجز للسيارة ' || COALESCE(car_info, 'غير معروف') || ' من قبل ' || COALESCE(customer_name, 'غير معروف') || ' أصبح نشطاً الآن.',
        jsonb_build_object(
          'booking_id', NEW.id,
          'customer_id', NEW.customer_id,
          'customer_name', customer_name,
          'car_id', NEW.car_id,
          'car_info', car_info,
          'start_date', NEW.start_date,
          'end_date', NEW.end_date
        ),
        NEW.customer_id
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

-- حذف function القديم وإعادة إنشائه بدعم إشعارات الأدمن
DROP FUNCTION IF EXISTS approve_booking(UUID, INTEGER);

CREATE FUNCTION approve_booking(
  p_booking_id UUID,
  p_payment_deadline_hours INTEGER DEFAULT 24
)
RETURNS SETOF bookings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking bookings%ROWTYPE;
  admin_record RECORD;
  customer_name TEXT;
  car_info TEXT;
BEGIN
  -- تحديث حالة الحجز
  UPDATE bookings
  SET 
    status = 'payment_pending',
    approved_by = auth.uid(),
    approved_at = NOW(),
    expires_at = NOW() + (p_payment_deadline_hours || ' hours')::INTERVAL,
    updated_at = NOW()
  WHERE id = p_booking_id
  RETURNING * INTO v_booking;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;

  -- إرسال إشعار للعميل
  INSERT INTO notifications (
    user_id,
    type,
    title_en,
    title_ar,
    message_en,
    message_ar,
    metadata
  ) VALUES (
    v_booking.customer_id,
    'booking_update',
    'Booking Approved',
    'تمت الموافقة على الحجز',
    'Please complete payment within ' || p_payment_deadline_hours || ' hours',
    'يرجى إكمال الدفع خلال ' || p_payment_deadline_hours || ' ساعة',
    jsonb_build_object(
      'booking_id', v_booking.id,
      'expires_at', v_booking.expires_at,
      'final_amount', v_booking.final_amount
    )
  );

  -- الحصول على معلومات العميل والسيارة
  SELECT full_name INTO customer_name
  FROM profiles
  WHERE user_id = v_booking.customer_id;

  SELECT 
    COALESCE(cm.name_en, '') || ' ' || COALESCE(cb.name_en, '')
  INTO car_info
  FROM cars c
  LEFT JOIN car_models cm ON cm.id = c.model_id
  LEFT JOIN car_brands cb ON cb.id = cm.brand_id
  WHERE c.id = v_booking.car_id;

  -- إرسال إشعار لكل أدمن
  FOR admin_record IN 
    SELECT DISTINCT user_id 
    FROM user_roles 
    WHERE role = 'admin'
  LOOP
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
      admin_record.user_id,
      'booking_approved',
      'Booking Approved',
      'تمت الموافقة على حجز',
      'Booking for ' || COALESCE(car_info, 'Unknown car') || ' by ' || COALESCE(customer_name, 'Unknown') || ' has been approved.',
      'تمت الموافقة على حجز السيارة ' || COALESCE(car_info, 'غير معروف') || ' من قبل ' || COALESCE(customer_name, 'غير معروف') || '.',
      jsonb_build_object(
        'booking_id', v_booking.id,
        'customer_id', v_booking.customer_id,
        'customer_name', customer_name,
        'car_id', v_booking.car_id,
        'car_info', car_info,
        'final_amount', v_booking.final_amount,
        'expires_at', v_booking.expires_at
      ),
      auth.uid()
    );
  END LOOP;

  RETURN QUERY SELECT * FROM bookings WHERE id = p_booking_id;
END;
$$;
