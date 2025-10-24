-- ========================================================================
-- النسخة النهائية الكاملة والشاملة لقاعدة البيانات
-- تتضمن: الجداول، الدوال، Triggers، RLS Policies، Indexes، والجدولة
-- بدون أي بيانات أولية (INSERTs)
-- ========================================================================

-- ========================================================================
-- 1. تمكين الامتدادات اللازمة
-- ========================================================================
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ========================================================================
-- 2. إنشاء الأنواع المخصصة (Enums)
-- ========================================================================
DO $$ BEGIN CREATE TYPE public.user_role AS ENUM ('admin', 'branch', 'branch_employee', 'customer'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.rental_type AS ENUM ('daily', 'weekly', 'monthly', 'ownership'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.document_status AS ENUM ('pending', 'approved', 'rejected'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.car_status AS ENUM ('available', 'rented', 'maintenance', 'hidden'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.notification_type AS ENUM ('info','warning','booking_update','system','booking_cancelled','booking_expired','booking_completed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.announcement_priority AS ENUM ('normal','high'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- إنشاء نوع booking_status مع القيمة الجديدة 'expired'
DO $$ 
BEGIN 
  CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'payment_pending', 'active', 'completed', 'cancelled', 'expired'); 
EXCEPTION WHEN duplicate_object THEN 
  NULL;
END $$;

-- ========================================================================
-- 3. إنشاء الجداول الرئيسية
-- ========================================================================

-- جدول الفروع
CREATE TABLE IF NOT EXISTS public.branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en TEXT NOT NULL,
  name_ar TEXT,
  location_en TEXT NOT NULL,
  location_ar TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  geom geography(Point, 4326),
  phone TEXT,
  email TEXT,
  working_hours TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  manager_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- جدول الملفات الشخصية
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  full_name TEXT,
  phone TEXT UNIQUE,
  phone_verified_at TIMESTAMPTZ,
  age INTEGER,
  gender TEXT CHECK (gender IN ('male', 'female')),
  role user_role NOT NULL DEFAULT 'customer',
  location TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  user_latitude DECIMAL(10,8),
  user_longitude DECIMAL(11,8),
  location_updated_at TIMESTAMP WITH TIME ZONE,
  location_accuracy NUMERIC,
  geom geography(Point, 4326),
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- إضافة قيد المدير للفروع
ALTER TABLE public.branches ADD CONSTRAINT fk_manager FOREIGN KEY (manager_id) REFERENCES auth.users(id);

-- جدول الوثائق
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  document_url TEXT NOT NULL,
  status document_status DEFAULT 'pending',
  rejection_reason TEXT,
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT documents_document_type_check CHECK (document_type = ANY (ARRAY['national_id'::text, 'driving_license'::text])),
  CONSTRAINT chk_document_url_scheme CHECK (
    document_url ~* '^https://[a-z0-9.-]+(/.*)?$'::text 
    OR document_url ~* '^/storage/v1/object/public/.*'::text
    OR document_url ~* '^[a-zA-Z0-9_/-]+\.(jpg|jpeg|png|pdf|doc|docx)$'::text
  )
);

-- جدول العلامات التجارية
CREATE TABLE IF NOT EXISTS public.car_brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en TEXT NOT NULL UNIQUE,
  name_ar TEXT,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- جدول موديلات السيارات
CREATE TABLE IF NOT EXISTS public.car_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES public.car_brands(id) ON DELETE CASCADE,
  name_en TEXT NOT NULL,
  name_ar TEXT,
  year INTEGER NOT NULL,
  default_image_url TEXT,
  description_en TEXT,
  description_ar TEXT,
  specifications JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(brand_id, name_en, year)
);

-- جدول ألوان السيارات
CREATE TABLE IF NOT EXISTS public.car_colors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en TEXT NOT NULL UNIQUE,
  name_ar TEXT,
  hex_code TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- جدول السيارات
CREATE TABLE IF NOT EXISTS public.cars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  model_id UUID NOT NULL REFERENCES public.car_models(id),
  color_id UUID NOT NULL REFERENCES public.car_colors(id),
  daily_price DECIMAL(10, 2) NOT NULL,
  weekly_price DECIMAL(10, 2),
  monthly_price DECIMAL(10, 2),
  ownership_price DECIMAL(10, 2),
  mileage INTEGER DEFAULT 0,
  seats INTEGER NOT NULL DEFAULT 5,
  fuel_type TEXT NOT NULL DEFAULT 'gasoline',
  transmission TEXT NOT NULL DEFAULT 'automatic',
  features TEXT[],
  features_ar TEXT[],
  features_en TEXT[],
  branch_description_ar TEXT,
  branch_description_en TEXT,
  branch_images TEXT[],
  quantity INTEGER NOT NULL DEFAULT 1,
  available_quantity INTEGER NOT NULL DEFAULT 1,
  status car_status DEFAULT 'available',
  is_new BOOLEAN DEFAULT FALSE,
  discount_percentage INTEGER DEFAULT 0,
  offer_expires_at TIMESTAMPTZ,
  rental_types rental_type[] DEFAULT '{daily}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (available_quantity <= quantity),
  CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  CHECK (daily_price > 0)
);

-- جدول الحجوزات
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  car_id UUID NOT NULL REFERENCES public.cars(id),
  branch_id UUID NOT NULL REFERENCES public.branches(id),
  rental_type rental_type NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days INTEGER NOT NULL,
  daily_rate DECIMAL(10, 2) NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  final_amount DECIMAL(10, 2) NOT NULL,
  status booking_status DEFAULT 'pending',
  payment_reference TEXT,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  notes TEXT,
  expires_at TIMESTAMPTZ,
  booking_range daterange GENERATED ALWAYS AS (daterange(start_date, end_date, '[)')) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (daily_rate >= 0),
  CHECK (total_amount >= 0),
  CHECK (final_amount >= 0),
  CHECK (start_date < end_date)
);

-- جدول الإعلانات
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_en TEXT NOT NULL,
  title_ar TEXT,
  description_en TEXT,
  description_ar TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  priority public.announcement_priority DEFAULT 'normal',
  branch_id UUID REFERENCES public.branches(id),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- جدول الإشعارات
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title_en TEXT NOT NULL,
  title_ar TEXT,
  message_en TEXT NOT NULL,
  message_ar TEXT,
  type public.notification_type NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  sent_via TEXT CHECK (sent_via IN ('system','job','admin','branch_manager')) DEFAULT 'system',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT notifications_metadata_size CHECK (pg_column_size(metadata) <= 8192)
);

-- جدول العروض على السيارات
CREATE TABLE IF NOT EXISTS public.car_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id UUID NOT NULL REFERENCES public.cars(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  offer_name_ar TEXT NOT NULL,
  offer_name_en TEXT NOT NULL,
  description_ar TEXT,
  description_en TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount', 'buy_days_get_free')),
  discount_value DECIMAL(10,2) NOT NULL,
  min_rental_days INTEGER DEFAULT 1,
  max_rental_days INTEGER,
  rental_types rental_type[] DEFAULT '{daily}',
  valid_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_until TIMESTAMPTZ NOT NULL,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- جدول تحديد معدل الطلبات
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,
  action_type TEXT NOT NULL,
  attempt_count INTEGER DEFAULT 1,
  first_attempt TIMESTAMPTZ DEFAULT NOW(),
  last_attempt TIMESTAMPTZ DEFAULT NOW(),
  blocked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(identifier, action_type)
);

-- جدول سجل الأمان
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  identifier TEXT,
  details JSONB,
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول صندوق الإشعارات الصادرة
CREATE TABLE IF NOT EXISTS public.notification_outbox (
  id bigserial PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  to_user uuid NOT NULL,
  type public.notification_type NOT NULL
);

-- جدول سجل المراجعة
CREATE TABLE IF NOT EXISTS public.audit_log (
  id bigserial PRIMARY KEY,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  actor uuid,
  table_name text NOT NULL,
  row_id uuid,
  action text CHECK (action IN ('insert','update','delete')),
  old_data jsonb,
  new_data jsonb
);

-- جدول طلبات OTP
CREATE TABLE IF NOT EXISTS public.otp_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  authentica_session_id TEXT,
  status TEXT DEFAULT 'pending',
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '5 minutes'),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول التحقق من الهاتف
CREATE TABLE IF NOT EXISTS public.phone_verifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number TEXT NOT NULL,
  verification_code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- جدول سجلات المصادقة
CREATE TABLE IF NOT EXISTS public.auth_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================================================
-- 4. تمكين RLS على جميع الجداول
-- ========================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.car_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.car_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.car_colors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.car_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otp_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phone_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_logs ENABLE ROW LEVEL SECURITY;

-- ========================================================================
-- 5. الدوال الأساسية والمساعدة
-- ========================================================================

-- دالة التحديث التلقائي للـ updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- دالة كشف اللغة
CREATE OR REPLACE FUNCTION public.detect_language(text_input TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF text_input ~ '[\u0600-\u06FF]' THEN
    RETURN 'ar';
  ELSE
    RETURN 'en';
  END IF;
END;
$$;

-- دالة الحصول على دور المستخدم
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS user_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT role FROM public.profiles WHERE user_id = _user_id;
$$;

-- دالة التحقق من المسؤول
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean 
LANGUAGE sql 
STABLE 
SET search_path = 'public'
AS $$
  SELECT get_user_role(auth.uid()) = 'admin';
$$;

-- دالة التحقق من مدير الفرع
CREATE OR REPLACE FUNCTION public.is_branch_manager()
RETURNS boolean 
LANGUAGE sql 
STABLE 
SET search_path = 'public'
AS $$
  SELECT get_user_role(auth.uid()) = 'branch';
$$;

-- دالة الحصول على فرع المستخدم الحالي
CREATE OR REPLACE FUNCTION public.current_user_branch_id()
RETURNS uuid 
LANGUAGE sql 
STABLE 
SET search_path = 'public'
AS $$
  SELECT branch_id FROM profiles WHERE user_id = auth.uid();
$$;

-- دالة إرسال الإشعارات
CREATE OR REPLACE FUNCTION public.send_notification(
  p_user_id UUID,
  p_title_ar TEXT,
  p_title_en TEXT,
  p_message_ar TEXT,
  p_message_en TEXT,
  p_type notification_type,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO public.notifications (
    user_id, title_ar, title_en, message_ar, message_en, type, metadata, created_by
  ) VALUES (
    p_user_id, p_title_ar, p_title_en, p_message_ar, p_message_en, p_type, p_metadata, auth.uid()
  )
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$;

-- ========================================================================
-- 6. دوال نظام الحجوزات
-- ========================================================================

-- دالة تحديد الحالات التي تستهلك السعة
CREATE OR REPLACE FUNCTION public.booking_status_consumes_capacity(_st public.booking_status)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = 'public'
AS $$
  SELECT _st IN ('pending', 'confirmed', 'payment_pending', 'active');
$$;

-- دوال المساعدة للحجوزات
CREATE OR REPLACE FUNCTION public.make_booking_range(_start date, _end date)
RETURNS daterange
LANGUAGE sql
STABLE
SET search_path = 'public'
AS $$
  SELECT daterange(_start, _end, '[)');
$$;

CREATE OR REPLACE FUNCTION public.days_from_range(_r daterange)
RETURNS integer
LANGUAGE sql
STABLE
SET search_path = 'public'
AS $$
  SELECT GREATEST(1, (upper(_r) - lower(_r))::int);
$$;

-- الدالة الرئيسية لحساب الكمية المتاحة الفعلية
CREATE OR REPLACE FUNCTION public.get_actual_available_quantity(
  _car_id uuid,
  _start_date date DEFAULT NULL,
  _end_date date DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  total_quantity INTEGER;
  reserved_quantity INTEGER;
BEGIN
  SELECT quantity INTO total_quantity
  FROM public.cars
  WHERE id = _car_id;

  IF total_quantity IS NULL THEN
    RETURN 0;
  END IF;

  IF _start_date IS NOT NULL AND _end_date IS NOT NULL THEN
    SELECT COALESCE(COUNT(*), 0) INTO reserved_quantity
    FROM public.bookings
    WHERE car_id = _car_id
      AND booking_status_consumes_capacity(status)
      AND booking_range && make_booking_range(_start_date, _end_date);
  ELSE
    SELECT COALESCE(COUNT(*), 0) INTO reserved_quantity
    FROM public.bookings
    WHERE car_id = _car_id
      AND booking_status_consumes_capacity(status)
      AND (expires_at IS NULL OR expires_at > NOW());
  END IF;

  RETURN GREATEST(0, total_quantity - reserved_quantity);
END;
$$;

-- دالة التحقق من توفر السيارة
CREATE OR REPLACE FUNCTION public.check_car_availability(
  _car_id UUID,
  _start_date DATE,
  _end_date DATE DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_end_date date;
  v_available_qty integer;
  v_car_status car_status;
BEGIN
  v_end_date := COALESCE(_end_date, _start_date + 1);
  
  SELECT status INTO v_car_status
  FROM cars
  WHERE id = _car_id;
  
  IF v_car_status IS NULL OR v_car_status != 'available' THEN
    RETURN false;
  END IF;
  
  v_available_qty := get_actual_available_quantity(_car_id, _start_date, v_end_date);
  
  RETURN v_available_qty > 0;
END;
$$;

-- دالة إنشاء الحجز النهائية
CREATE OR REPLACE FUNCTION public.create_booking_atomic(
  p_customer_id uuid, 
  p_car_id uuid, 
  p_branch_id uuid, 
  p_rental_type rental_type, 
  p_start date, 
  p_end date, 
  p_daily_rate numeric, 
  p_discount_amount numeric DEFAULT 0, 
  p_initial_status booking_status DEFAULT 'pending'::booking_status,
  p_notes text DEFAULT NULL::text
)
RETURNS bookings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_role public.user_role;
  v_car public.cars%ROWTYPE;
  v_b public.bookings%ROWTYPE;
  v_range daterange;
  v_total_days int;
  v_total_amount numeric;
  v_final_amount numeric;
  v_actual_rate numeric;
  v_expires_at timestamp with time zone;
  v_branch_manager_id uuid;
  v_actual_available int;
BEGIN
  -- تحقق الصلاحيات
  v_role := public.get_user_role(auth.uid());
  IF v_role IS NULL THEN
    RAISE EXCEPTION 'Unauthenticated';
  END IF;

  -- قفل السيارة والتحقق
  SELECT * INTO v_car 
  FROM public.cars 
  WHERE id = p_car_id 
    AND status = 'available'
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Car not available';
  END IF;
  
  IF v_car.branch_id IS DISTINCT FROM p_branch_id THEN
    RAISE EXCEPTION 'Car branch mismatch';
  END IF;

  -- تحقق نوع الإيجار
  IF NOT (p_rental_type = ANY(v_car.rental_types)) THEN
    RAISE EXCEPTION 'Rental type % not allowed for this car', p_rental_type;
  END IF;

  -- تحضير النطاق والحسابات
  IF p_start IS NULL OR p_end IS NULL OR p_start >= p_end THEN
    RAISE EXCEPTION 'Invalid dates';
  END IF;
  
  v_range := daterange(p_start, p_end, '[)');
  v_total_days := GREATEST(1, (p_end - p_start));

  -- حساب السعر الفعلي حسب نوع الإيجار
  CASE p_rental_type
    WHEN 'daily' THEN
      v_actual_rate := v_car.daily_price;
      v_total_amount := v_actual_rate * v_total_days;
    WHEN 'weekly' THEN
      v_actual_rate := COALESCE(v_car.weekly_price, v_car.daily_price * 7);
      v_total_amount := v_actual_rate * CEIL(v_total_days::decimal / 7);
    WHEN 'monthly' THEN
      v_actual_rate := COALESCE(v_car.monthly_price, v_car.daily_price * 30);
      v_total_amount := v_actual_rate * CEIL(v_total_days::decimal / 30);
    WHEN 'ownership' THEN
      IF v_car.ownership_price IS NULL THEN
        RAISE EXCEPTION 'Ownership price not available for this car';
      END IF;
      v_actual_rate := v_car.ownership_price;
      v_total_amount := v_actual_rate;
    ELSE
      RAISE EXCEPTION 'Invalid rental type: %', p_rental_type;
  END CASE;

  -- التحقق من التوفر
  IF public.booking_status_consumes_capacity(p_initial_status) THEN
    v_actual_available := public.get_actual_available_quantity(p_car_id, p_start, p_end);
    
    IF v_actual_available <= 0 THEN
      RAISE EXCEPTION 'No availability for the requested period';
    END IF;
  END IF;

  -- حساب المبلغ النهائي
  v_final_amount := GREATEST(0, v_total_amount - COALESCE(p_discount_amount,0));

  -- تحديد وقت انتهاء الصلاحية حسب الحالة
  IF p_initial_status = 'pending' THEN
    v_expires_at := NULL;
  ELSIF p_initial_status = 'confirmed' THEN
    v_expires_at := NOW() + INTERVAL '24 hours';
  ELSIF p_initial_status = 'payment_pending' THEN
    v_expires_at := NOW() + INTERVAL '30 minutes';
  ELSE
    v_expires_at := NULL;
  END IF;

  -- إنشاء الحجز
  INSERT INTO public.bookings (
    id, customer_id, car_id, branch_id, rental_type,
    start_date, end_date, total_days, daily_rate,
    total_amount, discount_amount, final_amount,
    status, notes, expires_at
  ) VALUES (
    gen_random_uuid(), p_customer_id, p_car_id, p_branch_id, p_rental_type,
    p_start, p_end, v_total_days, v_actual_rate,
    v_total_amount, COALESCE(p_discount_amount,0), v_final_amount,
    p_initial_status, p_notes, v_expires_at
  )
  RETURNING * INTO v_b;

  -- إرسال إشعار للفرع
  IF p_initial_status = 'pending' THEN
    SELECT manager_id INTO v_branch_manager_id
    FROM public.branches 
    WHERE id = p_branch_id;
    
    IF v_branch_manager_id IS NOT NULL THEN
      PERFORM public.send_notification(
        v_branch_manager_id,
        'حجز جديد',
        'New Booking',
        'هناك حجز جديد في انتظار موافقتك',
        'There is a new booking waiting for your approval',
        'booking_update',
        jsonb_build_object('booking_id', v_b.id)
      );
    END IF;
  END IF;

  RETURN v_b;
END;
$function$;

-- دالة إلغاء الحجز من العميل
CREATE OR REPLACE FUNCTION public.customer_cancel_booking(
  p_booking_id UUID,
  p_cancellation_notes TEXT DEFAULT NULL
)
RETURNS bookings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking bookings;
  v_customer_id UUID;
BEGIN
  v_customer_id := auth.uid();
  
  IF v_customer_id IS NULL THEN
    RAISE EXCEPTION 'unauthenticated';
  END IF;

  SELECT * INTO v_booking
  FROM bookings
  WHERE id = p_booking_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'booking_not_found';
  END IF;

  IF v_booking.customer_id != v_customer_id THEN
    RAISE EXCEPTION 'forbidden: not your booking';
  END IF;

  IF v_booking.status NOT IN ('pending', 'confirmed', 'payment_pending') THEN
    RAISE EXCEPTION 'cannot_cancel: booking status is %', v_booking.status;
  END IF;

  -- تحديث حالة الحجز
  UPDATE bookings
  SET 
    status = 'cancelled',
    notes = COALESCE(p_cancellation_notes, notes),
    updated_at = NOW()
  WHERE id = p_booking_id
  RETURNING * INTO v_booking;

  -- إرسال إشعار للفرع
  PERFORM send_notification(
    (SELECT manager_id FROM branches WHERE id = v_booking.branch_id),
    'إلغاء حجز',
    'Booking Cancelled',
    'تم إلغاء حجز من قبل العميل',
    'A booking has been cancelled by the customer',
    'booking_cancelled',
    jsonb_build_object('booking_id', p_booking_id)
  );

  RETURN v_booking;
END;
$$;

-- دالة موافقة الفرع على الحجز
CREATE OR REPLACE FUNCTION public.approve_booking(
  p_booking_id uuid,
  p_payment_deadline_hours integer DEFAULT 24
)
RETURNS bookings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  v_booking public.bookings%ROWTYPE;
  v_role public.user_role;
BEGIN
  -- التحقق من الصلاحيات
  v_role := public.get_user_role(auth.uid());
  IF v_role NOT IN ('admin', 'branch', 'branch_employee') THEN
    RAISE EXCEPTION 'Insufficient privileges';
  END IF;

  -- جلب الحجز والتحقق من الحالة
  SELECT * INTO v_booking
  FROM public.bookings
  WHERE id = p_booking_id
    AND status = 'pending'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found or not in pending status';
  END IF;

  -- تحديث الحجز إلى confirmed
  UPDATE public.bookings
  SET 
    status = 'confirmed',
    approved_by = auth.uid(),
    approved_at = NOW(),
    expires_at = NOW() + (p_payment_deadline_hours || ' hours')::interval,
    updated_at = NOW()
  WHERE id = p_booking_id
  RETURNING * INTO v_booking;

  -- إرسال إشعار للمستخدم
  PERFORM public.send_notification(
    v_booking.customer_id,
    'تم قبول حجزك',
    'Booking Approved',
    'تم قبول حجزك. يرجى إتمام الدفع خلال ' || p_payment_deadline_hours || ' ساعة',
    'Your booking has been approved. Please complete payment within ' || p_payment_deadline_hours || ' hours',
    'booking_update',
    jsonb_build_object(
      'booking_id', p_booking_id,
      'expires_at', v_booking.expires_at
    )
  );

  RETURN v_booking;
END;
$function$;

-- دالة رفض الحجز من الفرع
CREATE OR REPLACE FUNCTION public.reject_booking(
  p_booking_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS bookings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  v_booking public.bookings%ROWTYPE;
  v_role public.user_role;
BEGIN
  -- التحقق من الصلاحيات
  v_role := public.get_user_role(auth.uid());
  IF v_role NOT IN ('admin', 'branch', 'branch_employee') THEN
    RAISE EXCEPTION 'Insufficient privileges';
  END IF;

  -- جلب الحجز
  SELECT * INTO v_booking
  FROM public.bookings
  WHERE id = p_booking_id
    AND status = 'pending'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found or not in pending status';
  END IF;

  -- تحديث الحجز إلى cancelled
  UPDATE public.bookings
  SET 
    status = 'cancelled',
    notes = COALESCE(p_reason, 'رفض من قبل الفرع'),
    updated_at = NOW()
  WHERE id = p_booking_id
  RETURNING * INTO v_booking;

  -- إرسال إشعار للمستخدم
  PERFORM public.send_notification(
    v_booking.customer_id,
    'تم رفض حجزك',
    'Booking Rejected',
    COALESCE(p_reason, 'تم رفض حجزك من قبل الفرع. يمكنك التواصل معهم لمعرفة السبب'),
    COALESCE(p_reason, 'Your booking has been rejected by the branch. You can contact them for more information'),
    'warning',
    jsonb_build_object('booking_id', p_booking_id, 'reason', p_reason)
  );

  RETURN v_booking;
END;
$function$;

-- ========================================================================
-- 7. دوال التنظيف والجدولة
-- ========================================================================

-- تنظيف الحجوزات منتهية الصلاحية
CREATE OR REPLACE FUNCTION public.cleanup_expired_bookings()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  booking_record RECORD;
  updated_count INTEGER := 0;
BEGIN
  FOR booking_record IN
    SELECT 
      id,
      customer_id,
      car_id,
      branch_id
    FROM bookings
    WHERE status IN ('pending', 'payment_pending', 'confirmed')
      AND expires_at IS NOT NULL
      AND expires_at < NOW()
  LOOP
    UPDATE bookings
    SET 
      status = 'cancelled',
      notes = COALESCE(notes, '') || ' [Auto-cancelled: expired]',
      updated_at = NOW()
    WHERE id = booking_record.id;

    -- إرسال إشعار للعميل
    PERFORM send_notification(
      booking_record.customer_id,
      'انتهت صلاحية الحجز',
      'Booking Expired',
      'انتهت صلاحية حجزك وتم إلغاؤه تلقائياً',
      'Your booking has expired and was automatically cancelled',
      'booking_expired',
      jsonb_build_object('booking_id', booking_record.id)
    );

    updated_count := updated_count + 1;
  END LOOP;

  RETURN updated_count;
END;
$$;

-- إكمال الحجوزات النشطة المنتهية
CREATE OR REPLACE FUNCTION public.complete_active_bookings()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  booking_record RECORD;
  completed_count INTEGER := 0;
BEGIN
  FOR booking_record IN
    SELECT 
      id,
      customer_id,
      car_id,
      branch_id,
      end_date
    FROM bookings
    WHERE status = 'active'
      AND end_date < CURRENT_DATE
  LOOP
    UPDATE bookings
    SET 
      status = 'completed',
      updated_at = NOW()
    WHERE id = booking_record.id;

    -- إرسال إشعار للعميل
    PERFORM send_notification(
      booking_record.customer_id,
      'اكتمل الحجز',
      'Booking Completed',
      'تم إكمال حجزك بنجاح',
      'Your booking has been completed successfully',
      'booking_completed',
      jsonb_build_object('booking_id', booking_record.id)
    );

    completed_count := completed_count + 1;
  END LOOP;

  RETURN completed_count;
END;
$$;

-- ========================================================================
-- 8. دوال البحث المتقدمة
-- ========================================================================

-- دالة البحث المتقدمة للسيارات
CREATE OR REPLACE FUNCTION public.search_cars(
  search_query text DEFAULT NULL,
  search_language text DEFAULT NULL,
  branch_ids uuid[] DEFAULT NULL,
  brand_ids uuid[] DEFAULT NULL,
  model_ids uuid[] DEFAULT NULL,
  color_ids uuid[] DEFAULT NULL,
  min_price numeric DEFAULT NULL,
  max_price numeric DEFAULT NULL,
  price_type text DEFAULT 'daily',
  min_seats integer DEFAULT NULL,
  max_seats integer DEFAULT NULL,
  fuel_types text[] DEFAULT NULL,
  transmission_types text[] DEFAULT NULL,
  p_rental_types rental_type[] DEFAULT NULL,
  include_new_only boolean DEFAULT false,
  include_discounted_only boolean DEFAULT false,
  car_status_filter car_status[] DEFAULT ARRAY['available']::car_status[],
  user_lat numeric DEFAULT NULL,
  user_lon numeric DEFAULT NULL,
  max_distance_km numeric DEFAULT NULL,
  sort_by text DEFAULT 'distance',
  page_size integer DEFAULT 20,
  page_number integer DEFAULT 1
)
RETURNS TABLE(
  car_id uuid,
  brand_name_ar text,
  brand_name_en text,
  brand_logo_url text,
  model_name_ar text,
  model_name_en text,
  model_year integer,
  main_image_url text,
  color_name_ar text,
  color_name_en text,
  color_hex_code text,
  daily_price numeric,
  weekly_price numeric,
  monthly_price numeric,
  ownership_price numeric,
  seats integer,
  fuel_type text,
  transmission text,
  mileage integer,
  description_ar text,
  description_en text,
  features_ar text[],
  features_en text[],
  additional_images text[],
  quantity integer,
  available_quantity integer,
  actual_available_quantity integer,
  status car_status,
  is_new boolean,
  discount_percentage integer,
  offer_expires_at timestamp with time zone,
  rental_types rental_type[],
  branch_id uuid,
  branch_name_ar text,
  branch_name_en text,
  branch_location_ar text,
  branch_location_en text,
  branch_phone text,
  distance_km numeric,
  best_offer_id uuid,
  best_offer_name_ar text,
  best_offer_name_en text,
  best_offer_discount numeric,
  search_rank real
)
LANGUAGE plpgsql
STABLE
SET search_path TO 'public'
AS $$
DECLARE
  offset_value INTEGER;
  detected_lang text;
BEGIN
  offset_value := (page_number - 1) * page_size;
  
  IF search_language IS NULL AND search_query IS NOT NULL AND search_query != '' THEN
    detected_lang := detect_language(search_query);
  ELSE
    detected_lang := COALESCE(search_language, 'ar');
  END IF;

  RETURN QUERY
  WITH car_search AS (
    SELECT 
      c.id as car_id,
      cb.name_ar as brand_name_ar,
      cb.name_en as brand_name_en,
      cb.logo_url as brand_logo_url,
      cm.name_ar as model_name_ar,
      cm.name_en as model_name_en,
      cm.year as model_year,
      cm.default_image_url as main_image_url,
      cc.name_ar as color_name_ar,
      cc.name_en as color_name_en,
      cc.hex_code as color_hex_code,
      c.daily_price,
      c.weekly_price,
      c.monthly_price,
      c.ownership_price,
      c.seats,
      c.fuel_type,
      c.transmission,
      c.mileage,
      COALESCE(c.branch_description_ar, cm.description_ar) as description_ar,
      COALESCE(c.branch_description_en, cm.description_en) as description_en,
      c.features_ar,
      c.features_en,
      c.branch_images as additional_images,
      c.quantity,
      c.available_quantity,
      get_actual_available_quantity(c.id) as actual_available_quantity,
      c.status,
      c.is_new,
      c.discount_percentage,
      c.offer_expires_at,
      c.rental_types,
      c.branch_id,
      b.name_ar as branch_name_ar,
      b.name_en as branch_name_en,
      b.location_ar as branch_location_ar,
      b.location_en as branch_location_en,
      b.phone as branch_phone,
      CASE 
        WHEN user_lat IS NOT NULL AND user_lon IS NOT NULL AND b.geom IS NOT NULL THEN
          ROUND((ST_Distance(b.geom, ST_SetSRID(ST_MakePoint(user_lon, user_lat), 4326)) / 1000)::DECIMAL, 2)
        ELSE NULL
      END as distance_km,
      CASE 
        WHEN search_query IS NOT NULL AND search_query != '' THEN
          CASE WHEN detected_lang = 'ar' THEN
            ts_rank(to_tsvector('arabic', COALESCE(cb.name_ar || ' ' || cm.name_ar, '')), plainto_tsquery('arabic', search_query))
          ELSE
            ts_rank(to_tsvector('english', COALESCE(cb.name_en || ' ' || cm.name_en, '')), plainto_tsquery('english', search_query))
          END
        ELSE 0.5
      END as search_rank
    FROM public.cars c
    JOIN public.branches b ON c.branch_id = b.id
    JOIN public.car_models cm ON c.model_id = cm.id
    JOIN public.car_brands cb ON cm.brand_id = cb.id
    JOIN public.car_colors cc ON c.color_id = cc.id
    WHERE b.is_active = TRUE
      AND c.status = ANY(car_status_filter)
      AND (branch_ids IS NULL OR c.branch_id = ANY(branch_ids))
      AND (brand_ids IS NULL OR cb.id = ANY(brand_ids))
      AND (model_ids IS NULL OR cm.id = ANY(model_ids))
      AND (color_ids IS NULL OR cc.id = ANY(color_ids))
      AND (min_price IS NULL OR 
        CASE WHEN price_type = 'daily' THEN c.daily_price
             WHEN price_type = 'weekly' THEN c.weekly_price
             WHEN price_type = 'monthly' THEN c.monthly_price
             ELSE c.daily_price END >= min_price)
      AND (max_price IS NULL OR 
        CASE WHEN price_type = 'daily' THEN c.daily_price
             WHEN price_type = 'weekly' THEN c.weekly_price
             WHEN price_type = 'monthly' THEN c.monthly_price
             ELSE c.daily_price END <= max_price)
      AND (min_seats IS NULL OR c.seats >= min_seats)
      AND (max_seats IS NULL OR c.seats <= max_seats)
      AND (fuel_types IS NULL OR c.fuel_type = ANY(fuel_types))
      AND (transmission_types IS NULL OR c.transmission = ANY(transmission_types))
      AND (p_rental_types IS NULL OR c.rental_types && p_rental_types)
      AND (include_new_only = FALSE OR c.is_new = TRUE)
      AND (include_discounted_only = FALSE OR c.discount_percentage > 0)
      AND (search_query IS NULL OR search_query = '' OR 
        CASE WHEN detected_lang = 'ar' THEN
          (to_tsvector('arabic', COALESCE(cb.name_ar || ' ' || cm.name_ar || ' ' || cm.description_ar, '')) @@ plainto_tsquery('arabic', search_query)
           OR cb.name_ar ILIKE '%' || search_query || '%' 
           OR cm.name_ar ILIKE '%' || search_query || '%'
           OR cb.name_en ILIKE '%' || search_query || '%' 
           OR cm.name_en ILIKE '%' || search_query || '%')
        ELSE
          (to_tsvector('english', COALESCE(cb.name_en || ' ' || cm.name_en || ' ' || cm.description_en, '')) @@ plainto_tsquery('english', search_query)
           OR cb.name_en ILIKE '%' || search_query || '%' 
           OR cm.name_en ILIKE '%' || search_query || '%'
           OR cb.name_ar ILIKE '%' || search_query || '%' 
           OR cm.name_ar ILIKE '%' || search_query || '%')
        END)
      AND (user_lat IS NULL OR user_lon IS NULL OR max_distance_km IS NULL OR
        ST_DWithin(b.geom, ST_SetSRID(ST_MakePoint(user_lon, user_lat), 4326), max_distance_km * 1000))
  ),
  car_with_offers AS (
    SELECT 
      cs.*,
      co.id as best_offer_id,
      co.offer_name_ar as best_offer_name_ar,
      co.offer_name_en as best_offer_name_en,
      co.discount_value as best_offer_discount
    FROM car_search cs
    LEFT JOIN LATERAL (
      SELECT co.id, co.offer_name_ar, co.offer_name_en, co.discount_value
      FROM public.car_offers co
      WHERE co.car_id = cs.car_id
        AND co.is_active = TRUE
        AND co.valid_from <= NOW()
        AND co.valid_until >= NOW()
        AND (co.max_uses IS NULL OR co.current_uses < co.max_uses)
      ORDER BY co.discount_value DESC
      LIMIT 1
    ) co ON true
    WHERE cs.actual_available_quantity > 0
  )
  SELECT 
    cwo.car_id,
    cwo.brand_name_ar, cwo.brand_name_en, cwo.brand_logo_url,
    cwo.model_name_ar, cwo.model_name_en, cwo.model_year, cwo.main_image_url,
    cwo.color_name_ar, cwo.color_name_en, cwo.color_hex_code,
    cwo.daily_price, cwo.weekly_price, cwo.monthly_price, cwo.ownership_price,
    cwo.seats, cwo.fuel_type, cwo.transmission, cwo.mileage,
    cwo.description_ar, cwo.description_en, cwo.features_ar, cwo.features_en, cwo.additional_images,
    cwo.quantity, cwo.available_quantity, cwo.actual_available_quantity,
    cwo.status, cwo.is_new, cwo.discount_percentage, cwo.offer_expires_at, cwo.rental_types,
    cwo.branch_id, cwo.branch_name_ar, cwo.branch_name_en, cwo.branch_location_ar, cwo.branch_location_en, cwo.branch_phone,
    cwo.distance_km,
    cwo.best_offer_id,
    cwo.best_offer_name_ar,
    cwo.best_offer_name_en,
    cwo.best_offer_discount,
    cwo.search_rank
  FROM car_with_offers cwo
  ORDER BY 
    CASE WHEN sort_by = 'price_asc' THEN cwo.daily_price END ASC,
    CASE WHEN sort_by = 'price_desc' THEN cwo.daily_price END DESC,
    CASE WHEN sort_by = 'newest' THEN cwo.model_year END DESC,
    CASE WHEN sort_by = 'brand' AND detected_lang = 'ar' THEN cwo.brand_name_ar END,
    CASE WHEN sort_by = 'brand' AND detected_lang = 'en' THEN cwo.brand_name_en END,
    CASE WHEN sort_by = 'discount' THEN cwo.discount_percentage END DESC,
    CASE WHEN sort_by = 'distance' OR sort_by IS NULL THEN cwo.distance_km END ASC NULLS LAST,
    cwo.search_rank DESC,
    cwo.daily_price ASC
  LIMIT page_size OFFSET offset_value;
END;
$$;

-- ========================================================================
-- 9. دوال الجغرافيا
-- ========================================================================

-- تحديث البيانات الجغرافية للفروع
CREATE OR REPLACE FUNCTION public.update_branch_geom()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.geom = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- تحديث البيانات الجغرافية للمستخدمين
CREATE OR REPLACE FUNCTION public.update_profile_geom()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_latitude IS NOT NULL AND NEW.user_longitude IS NOT NULL THEN
    NEW.geom = ST_SetSRID(ST_MakePoint(NEW.user_longitude, NEW.user_latitude), 4326);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- ========================================================================
-- 10. إنشاء Triggers
-- ========================================================================

-- تحديث updated_at تلقائياً
DROP TRIGGER IF EXISTS update_branches_updated_at ON public.branches;
CREATE TRIGGER update_branches_updated_at BEFORE UPDATE ON public.branches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_documents_updated_at ON public.documents;
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_cars_updated_at ON public.cars;
CREATE TRIGGER update_cars_updated_at BEFORE UPDATE ON public.cars FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_bookings_updated_at ON public.bookings;
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_announcements_updated_at ON public.announcements;
CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON public.announcements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_car_offers_updated_at ON public.car_offers;
CREATE TRIGGER update_car_offers_updated_at BEFORE UPDATE ON public.car_offers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- تحديث البيانات الجغرافية
DROP TRIGGER IF EXISTS update_branch_geom_trigger ON public.branches;
CREATE TRIGGER update_branch_geom_trigger BEFORE INSERT OR UPDATE ON public.branches FOR EACH ROW EXECUTE FUNCTION public.update_branch_geom();

DROP TRIGGER IF EXISTS update_profile_geom_trigger ON public.profiles;
CREATE TRIGGER update_profile_geom_trigger BEFORE INSERT OR UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_profile_geom();

-- ========================================================================
-- 11. سياسات RLS (Row Level Security)
-- ========================================================================

-- سياسات profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE USING (is_admin());

DROP POLICY IF EXISTS "Branch managers can view their branch employees" ON public.profiles;
CREATE POLICY "Branch managers can view their branch employees" ON public.profiles FOR SELECT USING (
  is_branch_manager() AND branch_id = current_user_branch_id()
);

-- سياسات documents
DROP POLICY IF EXISTS "Users can view own documents" ON public.documents;
CREATE POLICY "Users can view own documents" ON public.documents FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own documents" ON public.documents;
CREATE POLICY "Users can insert own documents" ON public.documents FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all documents" ON public.documents;
CREATE POLICY "Admins can view all documents" ON public.documents FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Branch managers can view branch documents" ON public.documents;
CREATE POLICY "Branch managers can view branch documents" ON public.documents FOR SELECT USING (
  is_branch_manager() AND user_id IN (
    SELECT user_id FROM profiles WHERE branch_id = current_user_branch_id()
  )
);

-- سياسات branches
DROP POLICY IF EXISTS "Everyone can view active branches" ON public.branches;
CREATE POLICY "Everyone can view active branches" ON public.branches FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "Admins can manage branches" ON public.branches;
CREATE POLICY "Admins can manage branches" ON public.branches FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Branch managers can view own branch" ON public.branches;
CREATE POLICY "Branch managers can view own branch" ON public.branches FOR SELECT USING (
  is_branch_manager() AND id = current_user_branch_id()
);

DROP POLICY IF EXISTS "Branch managers can update own branch" ON public.branches;
CREATE POLICY "Branch managers can update own branch" ON public.branches FOR UPDATE USING (
  is_branch_manager() AND id = current_user_branch_id()
);

-- سياسات car_brands
DROP POLICY IF EXISTS "Everyone can view active brands" ON public.car_brands;
CREATE POLICY "Everyone can view active brands" ON public.car_brands FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "Admins can manage brands" ON public.car_brands;
CREATE POLICY "Admins can manage brands" ON public.car_brands FOR ALL USING (is_admin());

-- سياسات car_models
DROP POLICY IF EXISTS "Everyone can view active models" ON public.car_models;
CREATE POLICY "Everyone can view active models" ON public.car_models FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "Admins can manage models" ON public.car_models;
CREATE POLICY "Admins can manage models" ON public.car_models FOR ALL USING (is_admin());

-- سياسات car_colors
DROP POLICY IF EXISTS "Everyone can view active colors" ON public.car_colors;
CREATE POLICY "Everyone can view active colors" ON public.car_colors FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "Admins can manage colors" ON public.car_colors;
CREATE POLICY "Admins can manage colors" ON public.car_colors FOR ALL USING (is_admin());

-- سياسات cars
DROP POLICY IF EXISTS "Everyone can view available cars" ON public.cars;
CREATE POLICY "Everyone can view available cars" ON public.cars FOR SELECT USING (status = 'available');

DROP POLICY IF EXISTS "Admins can manage all cars" ON public.cars;
CREATE POLICY "Admins can manage all cars" ON public.cars FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Branch managers can manage own branch cars" ON public.cars;
CREATE POLICY "Branch managers can manage own branch cars" ON public.cars FOR ALL USING (
  is_branch_manager() AND branch_id = current_user_branch_id()
);

-- سياسات bookings
DROP POLICY IF EXISTS "Users can view own bookings" ON public.bookings;
CREATE POLICY "Users can view own bookings" ON public.bookings FOR SELECT USING (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Users can create own bookings" ON public.bookings;
CREATE POLICY "Users can create own bookings" ON public.bookings FOR INSERT WITH CHECK (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Admins can view all bookings" ON public.bookings;
CREATE POLICY "Admins can view all bookings" ON public.bookings FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS "Admins can manage all bookings" ON public.bookings;
CREATE POLICY "Admins can manage all bookings" ON public.bookings FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Branch managers can view branch bookings" ON public.bookings;
CREATE POLICY "Branch managers can view branch bookings" ON public.bookings FOR SELECT USING (
  is_branch_manager() AND branch_id = current_user_branch_id()
);

DROP POLICY IF EXISTS "Branch managers can update branch bookings" ON public.bookings;
CREATE POLICY "Branch managers can update branch bookings" ON public.bookings FOR UPDATE USING (
  is_branch_manager() AND branch_id = current_user_branch_id()
);

-- سياسات announcements
DROP POLICY IF EXISTS "Everyone can view active announcements" ON public.announcements;
CREATE POLICY "Everyone can view active announcements" ON public.announcements FOR SELECT USING (
  is_active = TRUE AND (expires_at IS NULL OR expires_at > NOW())
);

DROP POLICY IF EXISTS "Admins can manage announcements" ON public.announcements;
CREATE POLICY "Admins can manage announcements" ON public.announcements FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Branch managers can manage own branch announcements" ON public.announcements;
CREATE POLICY "Branch managers can manage own branch announcements" ON public.announcements FOR ALL USING (
  is_branch_manager() AND (branch_id IS NULL OR branch_id = current_user_branch_id())
);

-- سياسات notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins and branch managers can send notifications" ON public.notifications;
CREATE POLICY "Admins and branch managers can send notifications" ON public.notifications FOR INSERT WITH CHECK (
  is_admin() OR is_branch_manager()
);

-- سياسات car_offers
DROP POLICY IF EXISTS "Everyone can view active offers" ON public.car_offers;
CREATE POLICY "Everyone can view active offers" ON public.car_offers FOR SELECT USING (
  is_active = TRUE AND valid_from <= NOW() AND valid_until >= NOW()
);

DROP POLICY IF EXISTS "Admins can manage all offers" ON public.car_offers;
CREATE POLICY "Admins can manage all offers" ON public.car_offers FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Branch managers can manage own branch offers" ON public.car_offers;
CREATE POLICY "Branch managers can manage own branch offers" ON public.car_offers FOR ALL USING (
  is_branch_manager() AND branch_id = current_user_branch_id()
);

-- سياسات rate_limits (للإدارة فقط)
DROP POLICY IF EXISTS "Service role can manage rate limits" ON public.rate_limits;
CREATE POLICY "Service role can manage rate limits" ON public.rate_limits FOR ALL USING (is_admin());

-- سياسات security_audit_log (للإدارة فقط)
DROP POLICY IF EXISTS "Admins can view security logs" ON public.security_audit_log;
CREATE POLICY "Admins can view security logs" ON public.security_audit_log FOR SELECT USING (is_admin());

-- سياسات notification_outbox (للنظام)
DROP POLICY IF EXISTS "System can manage notification outbox" ON public.notification_outbox;
CREATE POLICY "System can manage notification outbox" ON public.notification_outbox FOR ALL USING (is_admin());

-- سياسات audit_log (للإدارة فقط)
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_log;
CREATE POLICY "Admins can view audit logs" ON public.audit_log FOR SELECT USING (is_admin());

-- سياسات otp_requests
DROP POLICY IF EXISTS "Users can view own OTP requests" ON public.otp_requests;
CREATE POLICY "Users can view own OTP requests" ON public.otp_requests FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create OTP requests" ON public.otp_requests;
CREATE POLICY "Users can create OTP requests" ON public.otp_requests FOR INSERT WITH CHECK (auth.uid() = user_id);

-- سياسات phone_verifications (للنظام فقط)
DROP POLICY IF EXISTS "Service role can manage phone verifications" ON public.phone_verifications;
CREATE POLICY "Service role can manage phone verifications" ON public.phone_verifications FOR ALL USING (is_admin());

-- سياسات auth_logs (للإدارة فقط)
DROP POLICY IF EXISTS "Admins can view auth logs" ON public.auth_logs;
CREATE POLICY "Admins can view auth logs" ON public.auth_logs FOR SELECT USING (is_admin());

-- ========================================================================
-- 12. إنشاء Indexes للأداء
-- ========================================================================

-- Indexes للـ profiles
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_branch_id ON public.profiles(branch_id);
CREATE INDEX IF NOT EXISTS idx_profiles_geom ON public.profiles USING GIST(geom);

-- Indexes للـ branches
CREATE INDEX IF NOT EXISTS idx_branches_is_active ON public.branches(is_active);
CREATE INDEX IF NOT EXISTS idx_branches_manager_id ON public.branches(manager_id);
CREATE INDEX IF NOT EXISTS idx_branches_geom ON public.branches USING GIST(geom);

-- Indexes للـ cars
CREATE INDEX IF NOT EXISTS idx_cars_branch_id ON public.cars(branch_id);
CREATE INDEX IF NOT EXISTS idx_cars_model_id ON public.cars(model_id);
CREATE INDEX IF NOT EXISTS idx_cars_color_id ON public.cars(color_id);
CREATE INDEX IF NOT EXISTS idx_cars_status ON public.cars(status);
CREATE INDEX IF NOT EXISTS idx_cars_daily_price ON public.cars(daily_price);
CREATE INDEX IF NOT EXISTS idx_cars_is_new ON public.cars(is_new);
CREATE INDEX IF NOT EXISTS idx_cars_discount ON public.cars(discount_percentage) WHERE discount_percentage > 0;

-- Indexes للـ bookings
CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON public.bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_car_id ON public.bookings(car_id);
CREATE INDEX IF NOT EXISTS idx_bookings_branch_id ON public.bookings(branch_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON public.bookings(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_bookings_range ON public.bookings USING GIST(booking_range);
CREATE INDEX IF NOT EXISTS idx_bookings_expires_at ON public.bookings(expires_at) WHERE expires_at IS NOT NULL;

-- Indexes للـ car_models
CREATE INDEX IF NOT EXISTS idx_car_models_brand_id ON public.car_models(brand_id);
CREATE INDEX IF NOT EXISTS idx_car_models_year ON public.car_models(year);

-- Indexes للـ documents
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON public.documents(status);

-- Indexes للـ notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);

-- Indexes للـ car_offers
CREATE INDEX IF NOT EXISTS idx_car_offers_car_id ON public.car_offers(car_id);
CREATE INDEX IF NOT EXISTS idx_car_offers_branch_id ON public.car_offers(branch_id);
CREATE INDEX IF NOT EXISTS idx_car_offers_active ON public.car_offers(is_active, valid_from, valid_until);

-- Indexes للبحث النصي
CREATE INDEX IF NOT EXISTS idx_car_brands_name_ar_trgm ON public.car_brands USING gin(name_ar gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_car_brands_name_en_trgm ON public.car_brands USING gin(name_en gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_car_models_name_ar_trgm ON public.car_models USING gin(name_ar gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_car_models_name_en_trgm ON public.car_models USING gin(name_en gin_trgm_ops);