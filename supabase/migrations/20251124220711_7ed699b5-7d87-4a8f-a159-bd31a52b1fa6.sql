-- إنشاء function لإرسال إشعارات لموظفي الفرع عند حجز جديد
CREATE OR REPLACE FUNCTION notify_branch_staff_new_booking()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = pg_catalog, public
LANGUAGE plpgsql
AS $$
DECLARE
  v_branch_id UUID;
  v_car_model TEXT;
  v_customer_name TEXT;
  v_staff_record RECORD;
BEGIN
  -- الحصول على branch_id من السيارة المحجوزة
  SELECT c.branch_id, 
         COALESCE(m.name_ar, m.name_en) || ' ' || m.year
  INTO v_branch_id, v_car_model
  FROM cars c
  JOIN car_models m ON c.model_id = m.id
  WHERE c.id = NEW.car_id;

  -- الحصول على اسم العميل
  SELECT COALESCE(p.full_name, p.email, p.phone)
  INTO v_customer_name
  FROM profiles p
  WHERE p.user_id = NEW.customer_id;

  -- إرسال إشعار لجميع موظفي الفرع (branch managers and employees)
  FOR v_staff_record IN
    SELECT DISTINCT p.user_id
    FROM profiles p
    JOIN user_roles ur ON ur.user_id = p.user_id
    WHERE p.branch_id = v_branch_id
      AND ur.role IN ('branch', 'branch_employee')
  LOOP
    INSERT INTO notifications (
      user_id,
      type,
      title_en,
      title_ar,
      message_en,
      message_ar,
      metadata
    ) VALUES (
      v_staff_record.user_id,
      'new_booking',
      'New Booking Request',
      'طلب حجز جديد',
      'New booking request for ' || v_car_model || ' by ' || v_customer_name,
      'طلب حجز جديد لسيارة ' || v_car_model || ' من العميل ' || v_customer_name,
      jsonb_build_object(
        'booking_id', NEW.id,
        'car_id', NEW.car_id,
        'customer_id', NEW.customer_id,
        'branch_id', v_branch_id
      )
    );
  END LOOP;

  RETURN NEW;
END;
$$;

-- إنشاء trigger لتنفيذ الـ function عند إضافة حجز جديد
DROP TRIGGER IF EXISTS trigger_notify_branch_new_booking ON bookings;

CREATE TRIGGER trigger_notify_branch_new_booking
  AFTER INSERT ON bookings
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION notify_branch_staff_new_booking();