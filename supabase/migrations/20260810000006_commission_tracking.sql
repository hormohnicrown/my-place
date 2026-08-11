-- =============================================================================
-- COMMISSION TRACKING SYSTEM
-- =============================================================================
-- Adds commission calculation and tracking to booking_requests without payment processing
-- Per TRD §3.6, §6 and PRD Non-Goals - records commission owed, not transactions

-- Add commission tracking fields to booking_requests
ALTER TABLE booking_requests 
ADD COLUMN IF NOT EXISTS price_agreed DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS commission_rate_applied DECIMAL(5, 4) NOT NULL DEFAULT 0.0700, -- 7% midpoint of 6-8% range
ADD COLUMN IF NOT EXISTS commission_amount DECIMAL(10, 2) GENERATED ALWAYS AS (CASE WHEN price_agreed IS NOT NULL THEN price_agreed * commission_rate_applied ELSE NULL END) STORED,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'disputed')),
ADD COLUMN IF NOT EXISTS payment_notes TEXT;

-- Add constraints
-- Postgres does not support ADD CONSTRAINT IF NOT EXISTS, so guard each one.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'valid_commission_rate_br'
  ) THEN
    ALTER TABLE booking_requests
      ADD CONSTRAINT valid_commission_rate_br
      CHECK (commission_rate_applied >= 0 AND commission_rate_applied <= 1);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'valid_price_agreed_br'
  ) THEN
    ALTER TABLE booking_requests
      ADD CONSTRAINT valid_price_agreed_br
      CHECK (price_agreed IS NULL OR price_agreed >= 0);
  END IF;
END $$;

-- Comments for documentation
COMMENT ON COLUMN booking_requests.price_agreed IS 'Final agreed price between client and merchant';
COMMENT ON COLUMN booking_requests.commission_rate_applied IS 'Commission rate for this booking (default 7%, can vary)';
COMMENT ON COLUMN booking_requests.commission_amount IS 'Auto-calculated commission owed to platform (price_agreed * commission_rate_applied)';
COMMENT ON COLUMN booking_requests.payment_status IS 'Off-platform payment tracking for manual reconciliation';
COMMENT ON COLUMN booking_requests.payment_notes IS 'Notes for manual payment reconciliation (no automated processing)';

-- =============================================================================
-- COMMISSION CALCULATION FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION calculate_commission_for_booking(
  p_booking_request_id UUID,
  p_agreed_price DECIMAL(10, 2),
  p_commission_rate DECIMAL(5, 4) DEFAULT NULL
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_booking_status TEXT;
  v_merchant_user_id UUID;
  v_client_user_id UUID;
  v_current_user_id UUID;
  v_commission_rate DECIMAL(5, 4);
  v_commission_amount DECIMAL(10, 2);
BEGIN
  -- Get current user
  SELECT id INTO v_current_user_id
  FROM users 
  WHERE auth_user_id = auth.uid();

  IF v_current_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  -- Get booking details
  SELECT status, merchant_user_id, client_user_id 
  INTO v_booking_status, v_merchant_user_id, v_client_user_id
  FROM booking_requests 
  WHERE id = p_booking_request_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Booking not found');
  END IF;

  -- Verify user is merchant for this booking
  IF v_current_user_id != v_merchant_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Access denied - merchant only');
  END IF;

  -- Only allow commission calculation for accepted bookings
  IF v_booking_status NOT IN ('accepted', 'in_progress', 'completed') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Commission can only be set for accepted bookings');
  END IF;

  -- Use provided commission rate or default
  v_commission_rate := COALESCE(p_commission_rate, 0.0700);

  -- Validate inputs
  IF p_agreed_price <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Price must be greater than 0');
  END IF;

  IF v_commission_rate < 0 OR v_commission_rate > 1 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Commission rate must be between 0% and 100%');
  END IF;

  -- Calculate commission
  v_commission_amount := p_agreed_price * v_commission_rate;

  -- Update booking with commission details
  UPDATE booking_requests 
  SET 
    price_agreed = p_agreed_price,
    commission_rate_applied = v_commission_rate,
    updated_at = NOW()
  WHERE id = p_booking_request_id;

  -- Return success with calculated values
  RETURN jsonb_build_object(
    'success', true,
    'data', jsonb_build_object(
      'booking_id', p_booking_request_id,
      'price_agreed', p_agreed_price,
      'commission_rate_applied', v_commission_rate,
      'commission_amount', v_commission_amount,
      'currency', 'NGN'
    )
  );
END;
$$;

-- =============================================================================
-- COMMISSION REPORTING FUNCTIONS
-- =============================================================================

CREATE OR REPLACE FUNCTION get_merchant_commission_summary(
  p_merchant_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  total_bookings_with_commission BIGINT,
  total_revenue DECIMAL(10, 2),
  total_commission_owed DECIMAL(10, 2),
  pending_payment_count BIGINT,
  paid_commission DECIMAL(10, 2)
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_current_user_id UUID;
  v_target_merchant_id UUID;
BEGIN
  -- Get current user
  SELECT id INTO v_current_user_id
  FROM users 
  WHERE auth_user_id = auth.uid();

  IF v_current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Determine target merchant (self or specified merchant)
  v_target_merchant_id := COALESCE(p_merchant_user_id, v_current_user_id);

  -- Verify access - merchants can only see their own data
  IF v_target_merchant_id != v_current_user_id THEN
    -- TODO: Add admin role check here if needed
    RAISE EXCEPTION 'Access denied - can only view own commission data';
  END IF;

  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_bookings_with_commission,
    COALESCE(SUM(price_agreed), 0)::DECIMAL(10, 2) as total_revenue,
    COALESCE(SUM(commission_amount), 0)::DECIMAL(10, 2) as total_commission_owed,
    COUNT(CASE WHEN payment_status = 'pending' THEN 1 END)::BIGINT as pending_payment_count,
    COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN commission_amount ELSE 0 END), 0)::DECIMAL(10, 2) as paid_commission
  FROM booking_requests 
  WHERE merchant_user_id = v_target_merchant_id
    AND status = 'completed'
    AND commission_amount IS NOT NULL;
END;
$$;

-- =============================================================================
-- RLS POLICIES FOR COMMISSION DATA
-- =============================================================================

-- Commission data is sensitive - merchants can only see their own
-- Clients can see price but not commission breakdown
CREATE POLICY "Commission data access" ON booking_requests
  FOR SELECT
  TO authenticated
  USING (
    -- Merchant can see all their commission data
    (merchant_user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()))
    OR
    -- Client can see basic pricing info (but not commission breakdown) - handled in application layer
    (client_user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()))
  );

-- Only merchants can update commission data for their bookings
CREATE POLICY "Merchants can set commission" ON booking_requests
  FOR UPDATE
  TO authenticated
  USING (
    merchant_user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
    AND status IN ('accepted', 'in_progress', 'completed')
  )
  WITH CHECK (
    merchant_user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
  );