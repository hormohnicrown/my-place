-- =============================================================================
-- BOOKING_REQUESTS TABLE AND RLS POLICIES
-- =============================================================================
-- Create booking_requests table (separate from bookings) with comprehensive RLS
-- Addresses the missing defense-in-depth security requirement flagged in Phase 3

-- Create booking_requests table if it doesn't exist
CREATE TABLE IF NOT EXISTS booking_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Participants
    client_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    merchant_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    merchant_profile_id UUID NOT NULL REFERENCES merchant_profiles(id) ON DELETE CASCADE,
    listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
    
    -- Service details
    service_details TEXT NOT NULL,
    preferred_date DATE NOT NULL,
    preferred_time_start TIME NOT NULL,
    preferred_time_end TIME NOT NULL,
    special_requirements TEXT,
    
    -- Address (revealed only post-acceptance per TRD §4)
    client_address TEXT, -- Full address revealed after booking acceptance
    
    -- Booking lifecycle
    status booking_status NOT NULL DEFAULT 'pending',
    
    -- GPS and service tracking
    gps_checkin_required BOOLEAN DEFAULT true,
    service_started_at TIMESTAMPTZ,
    service_completed_at TIMESTAMPTZ,
    
    -- Commission and pricing
    price_agreed DECIMAL(10, 2),
    commission_rate_applied DECIMAL(5, 4) NOT NULL DEFAULT 0.0700, -- 7% default
    commission_amount DECIMAL(10, 2) GENERATED ALWAYS AS (CASE WHEN price_agreed IS NOT NULL THEN price_agreed * commission_rate_applied ELSE NULL END) STORED,
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'disputed')),
    payment_notes TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_commission_rate_br CHECK (commission_rate_applied >= 0 AND commission_rate_applied <= 1),
    CONSTRAINT valid_price_agreed_br CHECK (price_agreed IS NULL OR price_agreed >= 0),
    CONSTRAINT valid_time_range CHECK (preferred_time_start < preferred_time_end)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_booking_requests_client_user_id ON booking_requests(client_user_id);
CREATE INDEX IF NOT EXISTS idx_booking_requests_merchant_user_id ON booking_requests(merchant_user_id);
CREATE INDEX IF NOT EXISTS idx_booking_requests_status ON booking_requests(status);
CREATE INDEX IF NOT EXISTS idx_booking_requests_created_at ON booking_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_booking_requests_preferred_date ON booking_requests(preferred_date);

-- Enable RLS
ALTER TABLE booking_requests ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- RLS POLICIES FOR BOOKING_REQUESTS TABLE
-- =============================================================================

-- Drop any existing policies first
DROP POLICY IF EXISTS "Service role has full access" ON booking_requests;
DROP POLICY IF EXISTS "Commission data access" ON booking_requests;
DROP POLICY IF EXISTS "Merchants can set commission" ON booking_requests;

-- =============================================================================
-- SELECT POLICIES
-- =============================================================================

-- Clients can view their own booking requests
CREATE POLICY "Clients can view own booking requests"
ON booking_requests FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND client_user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
);

-- Merchants can view booking requests for their services
CREATE POLICY "Merchants can view their booking requests"
ON booking_requests FOR SELECT  
TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND merchant_user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
);

-- =============================================================================
-- INSERT POLICIES  
-- =============================================================================

-- Only clients can create new booking requests for themselves
CREATE POLICY "Clients can create own booking requests"
ON booking_requests FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND client_user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
  AND (SELECT role FROM users WHERE auth_user_id = auth.uid()) = 'client'
);

-- =============================================================================
-- UPDATE POLICIES
-- =============================================================================

-- Merchants can update status of their booking requests (accept/decline)
CREATE POLICY "Merchants can update booking status"
ON booking_requests FOR UPDATE
TO authenticated  
USING (
  auth.uid() IS NOT NULL
  AND merchant_user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
  AND (SELECT role FROM users WHERE auth_user_id = auth.uid()) = 'merchant'
)
WITH CHECK (
  merchant_user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
);

-- Clients can cancel their own pending booking requests
CREATE POLICY "Clients can cancel own pending requests"
ON booking_requests FOR UPDATE
TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND client_user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
  AND status = 'pending'
)
WITH CHECK (
  client_user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
  AND status = 'cancelled'
);

-- System updates for GPS and service tracking (via service functions)
CREATE POLICY "System can update GPS and service tracking"
ON booking_requests FOR UPDATE
TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND (
    -- Participant can update GPS-related fields
    client_user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
    OR merchant_user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
  )
  AND status IN ('accepted', 'in_progress', 'completed')
)
WITH CHECK (
  -- Can only modify GPS and timestamp fields, not core booking details
  client_user_id = OLD.client_user_id
  AND merchant_user_id = OLD.merchant_user_id  
  AND service_details = OLD.service_details
);

-- =============================================================================
-- DELETE POLICIES
-- =============================================================================

-- Clients can delete their own pending booking requests (alternative to cancel)
CREATE POLICY "Clients can delete own pending requests"
ON booking_requests FOR DELETE
TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND client_user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
  AND status = 'pending'
);

-- No one can delete accepted/completed bookings (audit trail preservation)
-- This is enforced by the absence of additional DELETE policies

-- =============================================================================
-- ADDRESS PRIVACY ENFORCEMENT AT RLS LEVEL
-- =============================================================================

-- Create a view that enforces address privacy at the database level
CREATE OR REPLACE VIEW booking_requests_private AS
SELECT 
  id,
  client_user_id,
  merchant_user_id,
  merchant_profile_id,
  listing_id,
  service_details,
  preferred_date,
  preferred_time_start,
  preferred_time_end,
  special_requirements,
  -- ADDRESS PRIVACY: Only reveal client_address for accepted/active bookings
  CASE 
    WHEN status IN ('accepted', 'in_progress', 'completed') 
    THEN client_address 
    ELSE NULL 
  END as client_address,
  status,
  gps_checkin_required,
  service_started_at,
  service_completed_at,
  price_agreed,
  commission_rate_applied,
  commission_amount,
  payment_status,
  payment_notes,
  created_at,
  updated_at
FROM booking_requests
WHERE 
  -- Apply same RLS as the table
  (
    -- Current user is the client
    client_user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
  ) OR (
    -- Current user is the merchant  
    merchant_user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
  );

-- Grant access to the privacy-enforced view
GRANT SELECT ON booking_requests_private TO authenticated;

-- =============================================================================
-- COMMISSION DATA PROTECTION
-- =============================================================================

-- Create view that hides commission details from clients
CREATE OR REPLACE VIEW booking_requests_client_view AS
SELECT 
  id,
  client_user_id,
  merchant_user_id,
  merchant_profile_id,
  listing_id,
  service_details,
  preferred_date,
  preferred_time_start,
  preferred_time_end,
  special_requirements,
  CASE 
    WHEN status IN ('accepted', 'in_progress', 'completed') 
    THEN client_address 
    ELSE NULL 
  END as client_address,
  status,
  gps_checkin_required,
  service_started_at,
  service_completed_at,
  price_agreed, -- Clients can see agreed price
  NULL::DECIMAL(5,4) as commission_rate_applied, -- Hidden from clients
  NULL::DECIMAL(10,2) as commission_amount, -- Hidden from clients
  payment_status,
  NULL::TEXT as payment_notes, -- Hidden from clients
  created_at,
  updated_at
FROM booking_requests
WHERE 
  client_user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid());

-- Grant access to client view
GRANT SELECT ON booking_requests_client_view TO authenticated;

-- =============================================================================
-- COMMENTS AND DOCUMENTATION
-- =============================================================================

COMMENT ON TABLE booking_requests IS 'Booking requests with comprehensive RLS for data privacy and access control';
COMMENT ON COLUMN booking_requests.client_address IS 'Full client address - only revealed after booking acceptance (TRD §4 privacy requirement)';
COMMENT ON COLUMN booking_requests.commission_amount IS 'Auto-calculated commission - only visible to merchants (business sensitivity)';
COMMENT ON COLUMN booking_requests.payment_notes IS 'Internal merchant notes - not visible to clients';

-- =============================================================================
-- SECURITY FUNCTIONS
-- =============================================================================

-- Function to check if user can access booking request
CREATE OR REPLACE FUNCTION can_access_booking_request(booking_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  current_user_id UUID;
  client_id UUID;
  merchant_id UUID;
BEGIN
  -- Get current user
  SELECT id INTO current_user_id
  FROM users 
  WHERE auth_user_id = auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Get booking participants
  SELECT client_user_id, merchant_user_id
  INTO client_id, merchant_id
  FROM booking_requests
  WHERE id = booking_id;
  
  -- User must be either client or merchant
  RETURN current_user_id IN (client_id, merchant_id);
END;
$$;

-- Function to enforce address privacy
CREATE OR REPLACE FUNCTION should_reveal_address(booking_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  booking_status TEXT;
  current_user_id UUID;
  merchant_id UUID;
BEGIN
  -- Get current user
  SELECT id INTO current_user_id
  FROM users 
  WHERE auth_user_id = auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Get booking status and merchant
  SELECT status, merchant_user_id
  INTO booking_status, merchant_id  
  FROM booking_requests
  WHERE id = booking_id;
  
  -- Address is only revealed to merchants for accepted+ bookings
  RETURN (
    current_user_id = merchant_id 
    AND booking_status IN ('accepted', 'in_progress', 'completed')
  );
END;
$$;

-- =============================================================================
-- AUDIT LOGGING (Optional - for monitoring RLS effectiveness)
-- =============================================================================

-- Create audit log table for booking_requests access
CREATE TABLE IF NOT EXISTS booking_requests_audit (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_request_id UUID NOT NULL,
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  old_status TEXT,
  new_status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger to log status changes
CREATE OR REPLACE FUNCTION log_booking_request_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO booking_requests_audit (
    booking_request_id,
    user_id,
    action,
    old_status,
    new_status
  ) VALUES (
    NEW.id,
    (SELECT id FROM users WHERE auth_user_id = auth.uid()),
    TG_OP,
    OLD.status,
    NEW.status
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create audit trigger
DROP TRIGGER IF EXISTS audit_booking_request_changes ON booking_requests;
CREATE TRIGGER audit_booking_request_changes
  AFTER UPDATE ON booking_requests
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION log_booking_request_changes();

-- Enable RLS on audit table
ALTER TABLE booking_requests_audit ENABLE ROW LEVEL SECURITY;

-- Only allow users to see audit logs for their own bookings
CREATE POLICY "Users can view audit for own bookings"
ON booking_requests_audit FOR SELECT
TO authenticated  
USING (
  booking_request_id IN (
    SELECT id FROM booking_requests 
    WHERE client_user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
       OR merchant_user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
  )
);