-- Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'card', 'bank_transfer', 'online')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded', 'partial_refund')),
  transaction_reference TEXT,
  payment_date TIMESTAMPTZ,
  refund_amount NUMERIC(10,2) DEFAULT 0 CHECK (refund_amount >= 0),
  refund_reason TEXT,
  refund_date TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_payments_booking_id ON public.payments(booking_id);
CREATE INDEX idx_payments_status ON public.payments(payment_status);
CREATE INDEX idx_payments_date ON public.payments(payment_date);
CREATE INDEX idx_payments_created_by ON public.payments(created_by);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can view all payments"
  ON public.payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Branch managers view their branch payments"
  ON public.payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.profiles p ON ur.user_id = p.user_id
      JOIN public.bookings b ON payments.booking_id = b.id
      WHERE ur.user_id = auth.uid() 
        AND ur.role IN ('branch', 'branch_employee')
        AND b.branch_id = p.branch_id
    )
  );

CREATE POLICY "Customers view their own payments"
  ON public.payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = payments.booking_id
        AND b.customer_id = auth.uid()
    )
  );

CREATE POLICY "Staff can insert payments"
  ON public.payments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'branch', 'branch_employee')
    )
  );

CREATE POLICY "Staff can update payments"
  ON public.payments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'branch', 'branch_employee')
    )
  );

-- Function: get_payments_list
CREATE OR REPLACE FUNCTION public.get_payments_list(
  p_status TEXT DEFAULT NULL,
  p_payment_method TEXT DEFAULT NULL,
  p_branch_id UUID DEFAULT NULL,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
  payment_id UUID,
  booking_id UUID,
  booking_reference TEXT,
  amount NUMERIC,
  payment_method TEXT,
  payment_status TEXT,
  transaction_reference TEXT,
  payment_date TIMESTAMPTZ,
  refund_amount NUMERIC,
  customer_id UUID,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  branch_id UUID,
  branch_name_ar TEXT,
  car_model_ar TEXT,
  created_by_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ,
  total_count BIGINT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  total_records BIGINT;
  v_user_role user_role;
  v_branch_id UUID;
BEGIN
  v_user_role := current_user_role();
  v_branch_id := current_user_branch_id();
  
  SELECT COUNT(*) INTO total_records
  FROM payments pay
  JOIN bookings b ON pay.booking_id = b.id
  JOIN profiles p ON b.customer_id = p.user_id
  WHERE 
    (p_status IS NULL OR pay.payment_status = p_status)
    AND (p_payment_method IS NULL OR pay.payment_method = p_payment_method)
    AND (p_branch_id IS NULL OR b.branch_id = p_branch_id)
    AND (p_start_date IS NULL OR pay.payment_date >= p_start_date)
    AND (p_end_date IS NULL OR pay.payment_date <= p_end_date)
    AND (
      v_user_role = 'admin'
      OR (v_user_role IN ('branch', 'branch_employee') AND b.branch_id = v_branch_id)
      OR (v_user_role = 'customer' AND b.customer_id = auth.uid())
    );

  RETURN QUERY
  SELECT 
    pay.id,
    b.id,
    SUBSTRING(b.id::TEXT, 1, 8),
    pay.amount,
    pay.payment_method,
    pay.payment_status,
    pay.transaction_reference,
    pay.payment_date,
    pay.refund_amount,
    p.user_id,
    p.full_name,
    p.email,
    p.phone,
    br.id,
    br.name_ar,
    cm.name_ar || ' ' || cb.name_ar,
    creator.full_name,
    pay.notes,
    pay.created_at,
    total_records
  FROM payments pay
  JOIN bookings b ON pay.booking_id = b.id
  JOIN profiles p ON b.customer_id = p.user_id
  JOIN branches br ON b.branch_id = br.id
  JOIN cars c ON b.car_id = c.id
  JOIN car_models cm ON c.model_id = cm.id
  JOIN car_brands cb ON cm.brand_id = cb.id
  LEFT JOIN profiles creator ON pay.created_by = creator.user_id
  WHERE 
    (p_status IS NULL OR pay.payment_status = p_status)
    AND (p_payment_method IS NULL OR pay.payment_method = p_payment_method)
    AND (p_branch_id IS NULL OR b.branch_id = p_branch_id)
    AND (p_start_date IS NULL OR pay.payment_date >= p_start_date)
    AND (p_end_date IS NULL OR pay.payment_date <= p_end_date)
    AND (
      v_user_role = 'admin'
      OR (v_user_role IN ('branch', 'branch_employee') AND b.branch_id = v_branch_id)
      OR (v_user_role = 'customer' AND b.customer_id = auth.uid())
    )
  ORDER BY pay.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Function: get_payment_details
CREATE OR REPLACE FUNCTION public.get_payment_details(p_payment_id UUID)
RETURNS TABLE(
  payment_id UUID,
  amount NUMERIC,
  payment_method TEXT,
  payment_status TEXT,
  transaction_reference TEXT,
  payment_date TIMESTAMPTZ,
  refund_amount NUMERIC,
  refund_reason TEXT,
  refund_date TIMESTAMPTZ,
  notes TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  created_by_id UUID,
  created_by_name TEXT,
  created_by_role TEXT,
  booking_id UUID,
  booking_status booking_status,
  booking_start_date DATE,
  booking_end_date DATE,
  booking_total_amount NUMERIC,
  booking_final_amount NUMERIC,
  customer_id UUID,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  customer_verified BOOLEAN,
  car_id UUID,
  car_brand_ar TEXT,
  car_model_ar TEXT,
  car_color_ar TEXT,
  car_image_url TEXT,
  branch_id UUID,
  branch_name_ar TEXT,
  branch_phone TEXT,
  total_paid NUMERIC,
  remaining_amount NUMERIC
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pay.id,
    pay.amount,
    pay.payment_method,
    pay.payment_status,
    pay.transaction_reference,
    pay.payment_date,
    pay.refund_amount,
    pay.refund_reason,
    pay.refund_date,
    pay.notes,
    pay.metadata,
    pay.created_at,
    pay.updated_at,
    
    creator.user_id,
    creator.full_name,
    ur.role::TEXT,
    
    b.id,
    b.status,
    b.start_date,
    b.end_date,
    b.total_amount,
    b.final_amount,
    
    p.user_id,
    p.full_name,
    p.email,
    p.phone,
    p.is_verified,
    
    c.id,
    cb.name_ar,
    cm.name_ar,
    cc.name_ar,
    cm.default_image_url,
    
    br.id,
    br.name_ar,
    br.phone,
    
    COALESCE((
      SELECT SUM(amount - refund_amount)
      FROM payments
      WHERE booking_id = b.id
        AND payment_status IN ('completed', 'partial_refund')
    ), 0),
    GREATEST(b.final_amount - COALESCE((
      SELECT SUM(amount - refund_amount)
      FROM payments
      WHERE booking_id = b.id
        AND payment_status IN ('completed', 'partial_refund')
    ), 0), 0)
    
  FROM payments pay
  JOIN bookings b ON pay.booking_id = b.id
  JOIN profiles p ON b.customer_id = p.user_id
  JOIN cars c ON b.car_id = c.id
  JOIN car_models cm ON c.model_id = cm.id
  JOIN car_brands cb ON cm.brand_id = cb.id
  LEFT JOIN car_colors cc ON c.color_id = cc.id
  JOIN branches br ON b.branch_id = br.id
  LEFT JOIN profiles creator ON pay.created_by = creator.user_id
  LEFT JOIN user_roles ur ON creator.user_id = ur.user_id
  
  WHERE pay.id = p_payment_id;
END;
$$;

-- Function: get_booking_payments
CREATE OR REPLACE FUNCTION public.get_booking_payments(p_booking_id UUID)
RETURNS TABLE(
  payment_id UUID,
  amount NUMERIC,
  payment_method TEXT,
  payment_status TEXT,
  transaction_reference TEXT,
  payment_date TIMESTAMPTZ,
  refund_amount NUMERIC,
  created_by_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    pay.id,
    pay.amount,
    pay.payment_method,
    pay.payment_status,
    pay.transaction_reference,
    pay.payment_date,
    pay.refund_amount,
    p.full_name,
    pay.notes,
    pay.created_at
  FROM payments pay
  LEFT JOIN profiles p ON pay.created_by = p.user_id
  WHERE pay.booking_id = p_booking_id
  ORDER BY pay.created_at DESC;
$$;

-- Function: get_payment_stats
CREATE OR REPLACE FUNCTION public.get_payment_stats(
  p_branch_id UUID DEFAULT NULL,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS TABLE(
  total_completed NUMERIC,
  total_pending NUMERIC,
  total_refunded NUMERIC,
  total_failed NUMERIC,
  count_completed BIGINT,
  count_pending BIGINT,
  count_refunded BIGINT,
  count_failed BIGINT,
  total_today NUMERIC,
  count_today BIGINT,
  avg_payment_amount NUMERIC
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_user_role user_role;
  v_branch_id UUID;
BEGIN
  v_user_role := current_user_role();
  v_branch_id := current_user_branch_id();

  RETURN QUERY
  SELECT 
    COALESCE(SUM(CASE WHEN pay.payment_status = 'completed' THEN pay.amount - pay.refund_amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN pay.payment_status = 'pending' THEN pay.amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN pay.payment_status IN ('refunded', 'partial_refund') THEN pay.refund_amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN pay.payment_status = 'failed' THEN pay.amount ELSE 0 END), 0),
    COUNT(CASE WHEN pay.payment_status = 'completed' THEN 1 END),
    COUNT(CASE WHEN pay.payment_status = 'pending' THEN 1 END),
    COUNT(CASE WHEN pay.payment_status IN ('refunded', 'partial_refund') THEN 1 END),
    COUNT(CASE WHEN pay.payment_status = 'failed' THEN 1 END),
    COALESCE(SUM(CASE WHEN pay.payment_date::DATE = CURRENT_DATE AND pay.payment_status = 'completed' THEN pay.amount - pay.refund_amount ELSE 0 END), 0),
    COUNT(CASE WHEN pay.payment_date::DATE = CURRENT_DATE AND pay.payment_status = 'completed' THEN 1 END),
    COALESCE(AVG(CASE WHEN pay.payment_status = 'completed' THEN pay.amount END), 0)
  FROM payments pay
  JOIN bookings b ON pay.booking_id = b.id
  WHERE 
    (p_branch_id IS NULL OR b.branch_id = p_branch_id)
    AND (p_start_date IS NULL OR pay.payment_date >= p_start_date)
    AND (p_end_date IS NULL OR pay.payment_date <= p_end_date)
    AND (
      v_user_role = 'admin'
      OR (v_user_role IN ('branch', 'branch_employee') AND b.branch_id = v_branch_id)
    );
END;
$$;

-- Function: add_manual_payment
CREATE OR REPLACE FUNCTION public.add_manual_payment(
  p_booking_id UUID,
  p_amount NUMERIC,
  p_payment_method TEXT,
  p_transaction_reference TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_payment_id UUID;
  v_user_role user_role;
  v_booking bookings%ROWTYPE;
  v_branch_id UUID;
BEGIN
  v_user_role := current_user_role();
  v_branch_id := current_user_branch_id();
  
  IF v_user_role NOT IN ('admin', 'branch', 'branch_employee') THEN
    RAISE EXCEPTION 'Insufficient privileges';
  END IF;
  
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Payment amount must be greater than zero';
  END IF;
  
  SELECT * INTO v_booking
  FROM bookings
  WHERE id = p_booking_id
    AND (
      v_user_role = 'admin'
      OR branch_id = v_branch_id
    );
    
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found or access denied';
  END IF;
  
  INSERT INTO payments (
    booking_id,
    amount,
    payment_method,
    payment_status,
    transaction_reference,
    payment_date,
    created_by,
    notes
  ) VALUES (
    p_booking_id,
    p_amount,
    p_payment_method,
    'completed',
    p_transaction_reference,
    NOW(),
    auth.uid(),
    p_notes
  )
  RETURNING id INTO v_payment_id;
  
  INSERT INTO notifications (
    user_id,
    title_ar,
    title_en,
    message_ar,
    message_en,
    type,
    metadata,
    created_by
  ) VALUES (
    v_booking.customer_id,
    'تم تسجيل دفعة جديدة',
    'New Payment Recorded',
    'تم تسجيل دفعة بمبلغ ' || p_amount || ' ريال لحجزك',
    'A payment of ' || p_amount || ' SAR has been recorded for your booking',
    'payment_update',
    jsonb_build_object(
      'payment_id', v_payment_id,
      'booking_id', p_booking_id,
      'amount', p_amount
    ),
    auth.uid()
  );
  
  RETURN v_payment_id;
END;
$$;

-- Function: process_refund
CREATE OR REPLACE FUNCTION public.process_refund(
  p_payment_id UUID,
  p_refund_amount NUMERIC,
  p_refund_reason TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_payment payments%ROWTYPE;
  v_booking bookings%ROWTYPE;
  v_user_role user_role;
  v_new_status TEXT;
  v_branch_id UUID;
BEGIN
  v_user_role := current_user_role();
  v_branch_id := current_user_branch_id();
  
  IF v_user_role NOT IN ('admin', 'branch') THEN
    RAISE EXCEPTION 'Only admins and branch managers can process refunds';
  END IF;
  
  IF p_refund_amount <= 0 THEN
    RAISE EXCEPTION 'Refund amount must be greater than zero';
  END IF;
  
  IF TRIM(p_refund_reason) = '' THEN
    RAISE EXCEPTION 'Refund reason is required';
  END IF;
  
  SELECT pay.* INTO v_payment
  FROM payments pay
  JOIN bookings b ON pay.booking_id = b.id
  WHERE pay.id = p_payment_id
    AND pay.payment_status IN ('completed', 'partial_refund')
    AND (
      v_user_role = 'admin'
      OR b.branch_id = v_branch_id
    );
    
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment not found, already refunded, or access denied';
  END IF;
  
  IF (v_payment.refund_amount + p_refund_amount) > v_payment.amount THEN
    RAISE EXCEPTION 'Refund amount exceeds payment amount';
  END IF;
  
  IF (v_payment.refund_amount + p_refund_amount) = v_payment.amount THEN
    v_new_status := 'refunded';
  ELSE
    v_new_status := 'partial_refund';
  END IF;
  
  UPDATE payments
  SET 
    payment_status = v_new_status,
    refund_amount = refund_amount + p_refund_amount,
    refund_reason = p_refund_reason,
    refund_date = NOW(),
    updated_at = NOW()
  WHERE id = p_payment_id;
  
  SELECT * INTO v_booking
  FROM bookings
  WHERE id = v_payment.booking_id;
  
  INSERT INTO notifications (
    user_id,
    title_ar,
    title_en,
    message_ar,
    message_en,
    type,
    metadata,
    created_by
  ) VALUES (
    v_booking.customer_id,
    'تم استرجاع مبلغ',
    'Refund Processed',
    'تم استرجاع مبلغ ' || p_refund_amount || ' ريال من دفعتك',
    'A refund of ' || p_refund_amount || ' SAR has been processed for your payment',
    'payment_refund',
    jsonb_build_object(
      'payment_id', v_payment.id,
      'booking_id', v_payment.booking_id,
      'refund_amount', p_refund_amount,
      'reason', p_refund_reason
    ),
    auth.uid()
  );
  
  RETURN p_payment_id;
END;
$$;

-- Function: update_payment_status
CREATE OR REPLACE FUNCTION public.update_payment_status(
  p_payment_id UUID,
  p_new_status TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_user_role user_role;
  v_branch_id UUID;
  v_updated BOOLEAN;
BEGIN
  v_user_role := current_user_role();
  v_branch_id := current_user_branch_id();
  
  IF v_user_role NOT IN ('admin', 'branch', 'branch_employee') THEN
    RAISE EXCEPTION 'Insufficient privileges';
  END IF;
  
  IF p_new_status NOT IN ('pending', 'completed', 'failed') THEN
    RAISE EXCEPTION 'Invalid status. Use process_refund for refunds.';
  END IF;
  
  UPDATE payments pay
  SET 
    payment_status = p_new_status,
    payment_date = CASE 
      WHEN p_new_status = 'completed' AND payment_date IS NULL THEN NOW()
      ELSE payment_date 
    END,
    notes = COALESCE(p_notes, pay.notes),
    updated_at = NOW()
  FROM bookings b
  WHERE pay.id = p_payment_id
    AND pay.booking_id = b.id
    AND (
      v_user_role = 'admin'
      OR b.branch_id = v_branch_id
    );
  
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  
  IF NOT v_updated THEN
    RAISE EXCEPTION 'Payment not found or access denied';
  END IF;
  
  RETURN p_payment_id;
END;
$$;

-- Trigger for updated_at
CREATE TRIGGER set_updated_at_payments
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for failed payment notifications
CREATE OR REPLACE FUNCTION public.notify_admins_failed_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_admin_id UUID;
BEGIN
  IF NEW.payment_status = 'failed' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'failed') THEN
    FOR v_admin_id IN SELECT user_id FROM user_roles WHERE role = 'admin'
    LOOP
      INSERT INTO notifications (
        user_id,
        title_ar,
        title_en,
        message_ar,
        message_en,
        type,
        metadata
      ) VALUES (
        v_admin_id,
        'فشلت عملية دفع',
        'Payment Failed',
        'فشلت عملية دفع لحجز رقم ' || SUBSTRING(NEW.booking_id::TEXT, 1, 8),
        'Payment failed for booking ' || SUBSTRING(NEW.booking_id::TEXT, 1, 8),
        'payment_failed',
        jsonb_build_object(
          'payment_id', NEW.id,
          'booking_id', NEW.booking_id,
          'amount', NEW.amount
        )
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_admins_failed_payment
  AFTER INSERT OR UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admins_failed_payment();