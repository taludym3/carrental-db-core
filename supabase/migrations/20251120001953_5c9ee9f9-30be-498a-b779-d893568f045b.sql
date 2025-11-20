-- ===================================================================
-- نظام الإشعارات التلقائية للأدمن
-- ===================================================================

-- 1. إضافة أنواع إشعارات جديدة للـ enum
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t 
    JOIN pg_enum e ON t.oid = e.enumtypid 
    WHERE t.typname = 'notification_type' AND e.enumlabel = 'document_pending'
  ) THEN
    ALTER TYPE notification_type ADD VALUE 'document_pending';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t 
    JOIN pg_enum e ON t.oid = e.enumtypid 
    WHERE t.typname = 'notification_type' AND e.enumlabel = 'booking_approved'
  ) THEN
    ALTER TYPE notification_type ADD VALUE 'booking_approved';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t 
    JOIN pg_enum e ON t.oid = e.enumtypid 
    WHERE t.typname = 'notification_type' AND e.enumlabel = 'booking_active'
  ) THEN
    ALTER TYPE notification_type ADD VALUE 'booking_active';
  END IF;
END $$;

-- ===================================================================
-- 2. Function لإشعار الأدمن عند رفع مستند جديد
-- ===================================================================
CREATE OR REPLACE FUNCTION notify_admins_new_document()
RETURNS TRIGGER AS $$
DECLARE
  v_admin_id UUID;
  v_user_name TEXT;
BEGIN
  -- الحصول على اسم المستخدم
  SELECT COALESCE(full_name, email) INTO v_user_name
  FROM auth.users
  WHERE id = NEW.user_id;
  
  -- إرسال إشعار لكل أدمن
  FOR v_admin_id IN 
    SELECT user_id FROM user_roles WHERE role = 'admin'
  LOOP
    PERFORM send_notification(
      v_admin_id,
      'مستند جديد يحتاج مراجعة',
      'New Document Pending Review',
      'تم رفع مستند جديد من نوع ' || NEW.document_type || ' من قبل ' || COALESCE(v_user_name, 'مستخدم') || ' ويحتاج للمراجعة',
      'A new ' || NEW.document_type || ' document has been uploaded by ' || COALESCE(v_user_name, 'user') || ' and needs review',
      'document_pending',
      jsonb_build_object(
        'document_id', NEW.id,
        'document_type', NEW.document_type,
        'user_id', NEW.user_id
      )
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- إنشاء Trigger للمستندات الجديدة
DROP TRIGGER IF EXISTS trigger_notify_admins_new_document ON documents;
CREATE TRIGGER trigger_notify_admins_new_document
  AFTER INSERT ON documents
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION notify_admins_new_document();

-- ===================================================================
-- 3. تحديث Function لرفض المستند (إضافة إشعار للأدمن)
-- ===================================================================
CREATE OR REPLACE FUNCTION update_document_status(
  p_document_id UUID,
  p_new_status document_status,
  p_reason TEXT DEFAULT NULL
)
RETURNS documents AS $$
DECLARE
  v_document documents%ROWTYPE;
  v_admin_id UUID;
  v_user_name TEXT;
BEGIN
  -- التحقق من وجود المستند
  SELECT * INTO v_document
  FROM documents
  WHERE id = p_document_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Document not found';
  END IF;

  -- تحديث حالة المستند
  UPDATE documents
  SET 
    status = p_new_status,
    updated_at = now()
  WHERE id = p_document_id
  RETURNING * INTO v_document;

  -- الحصول على اسم المستخدم
  SELECT COALESCE(full_name, email) INTO v_user_name
  FROM auth.users
  WHERE id = v_document.user_id;

  -- إرسال إشعار حسب الحالة
  IF p_new_status = 'approved' THEN
    -- إشعار للعميل
    PERFORM send_notification(
      v_document.user_id,
      'تمت الموافقة على المستند',
      'Document Approved',
      'تمت الموافقة على مستند ' || v_document.document_type,
      'Your ' || v_document.document_type || ' document has been approved',
      'document_approved',
      jsonb_build_object(
        'document_id', v_document.id,
        'document_type', v_document.document_type
      )
    );
  ELSIF p_new_status = 'rejected' THEN
    -- إشعار للعميل
    PERFORM send_notification(
      v_document.user_id,
      'تم رفض المستند',
      'Document Rejected',
      'تم رفض مستند ' || v_document.document_type || CASE WHEN p_reason IS NOT NULL THEN ' - السبب: ' || p_reason ELSE '' END,
      'Your ' || v_document.document_type || ' document was rejected' || CASE WHEN p_reason IS NOT NULL THEN ' - Reason: ' || p_reason ELSE '' END,
      'document_rejected',
      jsonb_build_object(
        'document_id', v_document.id,
        'document_type', v_document.document_type,
        'reason', p_reason
      )
    );
    
    -- إشعار لجميع الأدمن عن الرفض
    FOR v_admin_id IN 
      SELECT user_id FROM user_roles WHERE role = 'admin'
    LOOP
      PERFORM send_notification(
        v_admin_id,
        'تم رفض مستند',
        'Document Rejected',
        'تم رفض مستند من نوع ' || v_document.document_type || ' للمستخدم ' || COALESCE(v_user_name, 'غير معروف') || CASE WHEN p_reason IS NOT NULL THEN ' - السبب: ' || p_reason ELSE '' END,
        'A ' || v_document.document_type || ' document for user ' || COALESCE(v_user_name, 'unknown') || ' was rejected' || CASE WHEN p_reason IS NOT NULL THEN ' - Reason: ' || p_reason ELSE '' END,
        'document_rejected',
        jsonb_build_object(
          'document_id', v_document.id,
          'document_type', v_document.document_type,
          'user_id', v_document.user_id,
          'reason', p_reason
        )
      );
    END LOOP;
  END IF;

  RETURN v_document;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===================================================================
-- 4. تحديث Function لقبول الحجز (إضافة إشعار للأدمن)
-- ===================================================================
CREATE OR REPLACE FUNCTION approve_booking(
  p_booking_id UUID,
  p_payment_deadline_hours INTEGER DEFAULT 24
)
RETURNS bookings AS $$
DECLARE
  v_booking bookings;
  v_admin_id UUID;
  v_customer_name TEXT;
BEGIN
  -- التحقق من وجود الحجز
  SELECT * INTO v_booking
  FROM bookings
  WHERE id = p_booking_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;

  -- تحديث حالة الحجز
  UPDATE bookings
  SET 
    status = 'approved',
    expires_at = now() + (p_payment_deadline_hours || ' hours')::INTERVAL,
    updated_at = now()
  WHERE id = p_booking_id
  RETURNING * INTO v_booking;

  -- الحصول على اسم العميل
  SELECT COALESCE(full_name, email) INTO v_customer_name
  FROM auth.users
  WHERE id = v_booking.customer_id;

  -- إشعار للعميل
  PERFORM send_notification(
    v_booking.customer_id,
    'تمت الموافقة على الحجز',
    'Booking Approved',
    'تمت الموافقة على حجزك. يرجى إتمام الدفع خلال ' || p_payment_deadline_hours || ' ساعة',
    'Your booking has been approved. Please complete payment within ' || p_payment_deadline_hours || ' hours',
    'booking_approved',
    jsonb_build_object(
      'booking_id', v_booking.id,
      'expires_at', v_booking.expires_at
    )
  );

  -- إشعار لجميع الأدمن
  FOR v_admin_id IN 
    SELECT user_id FROM user_roles WHERE role = 'admin'
  LOOP
    PERFORM send_notification(
      v_admin_id,
      'تم قبول حجز جديد',
      'Booking Approved',
      'تم قبول الحجز للعميل ' || COALESCE(v_customer_name, 'غير معروف') || ' وينتظر الدفع خلال ' || p_payment_deadline_hours || ' ساعة',
      'Booking for customer ' || COALESCE(v_customer_name, 'unknown') || ' has been approved and awaiting payment within ' || p_payment_deadline_hours || ' hours',
      'booking_approved',
      jsonb_build_object(
        'booking_id', v_booking.id,
        'customer_id', v_booking.customer_id,
        'branch_id', v_booking.branch_id,
        'expires_at', v_booking.expires_at
      )
    );
  END LOOP;

  RETURN v_booking;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===================================================================
-- 5. Function لإشعار الأدمن عند تفعيل الحجز
-- ===================================================================
CREATE OR REPLACE FUNCTION notify_admins_booking_active()
RETURNS TRIGGER AS $$
DECLARE
  v_admin_id UUID;
  v_customer_name TEXT;
  v_car_info TEXT;
BEGIN
  -- الحصول على معلومات العميل والسيارة
  SELECT COALESCE(u.full_name, u.email) INTO v_customer_name
  FROM auth.users u
  WHERE u.id = NEW.customer_id;
  
  SELECT CONCAT(b.name_ar, ' ', m.name_ar, ' ', c.year) INTO v_car_info
  FROM cars c
  LEFT JOIN brands b ON c.brand_id = b.id
  LEFT JOIN models m ON c.model_id = m.id
  WHERE c.id = NEW.car_id;
  
  -- إرسال إشعار لكل أدمن
  FOR v_admin_id IN 
    SELECT user_id FROM user_roles WHERE role = 'admin'
  LOOP
    PERFORM send_notification(
      v_admin_id,
      'حجز نشط الآن',
      'Booking Now Active',
      'الحجز للعميل ' || COALESCE(v_customer_name, 'غير معروف') || ' للسيارة ' || COALESCE(v_car_info, 'غير معروفة') || ' أصبح نشطاً الآن',
      'Booking for customer ' || COALESCE(v_customer_name, 'unknown') || ' for car ' || COALESCE(v_car_info, 'unknown') || ' is now active',
      'booking_active',
      jsonb_build_object(
        'booking_id', NEW.id,
        'customer_id', NEW.customer_id,
        'branch_id', NEW.branch_id,
        'car_id', NEW.car_id,
        'start_date', NEW.start_date,
        'end_date', NEW.end_date
      )
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- إنشاء Trigger للحجوزات النشطة
DROP TRIGGER IF EXISTS trigger_notify_admins_booking_active ON bookings;
CREATE TRIGGER trigger_notify_admins_booking_active
  AFTER UPDATE ON bookings
  FOR EACH ROW
  WHEN (NEW.status = 'active' AND OLD.status != 'active')
  EXECUTE FUNCTION notify_admins_booking_active();

-- ===================================================================
-- 6. إضافة indexes لتحسين الأداء
-- ===================================================================
CREATE INDEX IF NOT EXISTS idx_notifications_user_type ON notifications(user_id, type);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);