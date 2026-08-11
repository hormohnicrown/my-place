-- My Place Database - GPS Check-in/Check-out System
-- Migration: GPS tracking for service delivery trust & safety
-- Date: 2026-08-10
-- 
-- Supports Phase 4 GPS check-in/out at service start and completion
-- Immutable GPS records for trust & safety compliance per TRD requirements

-- =============================================================================
-- GPS CHECK-IN/OUT TABLE
-- =============================================================================

-- Create custom enum for check-in types (must exist before the table below uses it)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'check_in_type') THEN
    CREATE TYPE check_in_type AS ENUM (
      'service_start',    -- Merchant arrives and starts service
      'service_complete', -- Merchant completes service
      'client_confirm'    -- Client confirms service received (optional)
    );
  END IF;
END $$;

-- Create GPS tracking table for service delivery
CREATE TABLE IF NOT EXISTS gps_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Booking reference
  booking_request_id UUID NOT NULL REFERENCES booking_requests(id) ON DELETE CASCADE,
  
  -- User who performed the check-in (merchant or client)
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_role user_role NOT NULL, -- 'merchant' or 'client'
  
  -- Check-in type and timing
  checkin_type check_in_type NOT NULL,
  checkin_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- GPS coordinates (required for trust & safety)
  gps_latitude DECIMAL(10, 8) NOT NULL, -- GPS latitude with high precision
  gps_longitude DECIMAL(11, 8) NOT NULL, -- GPS longitude with high precision
  gps_accuracy DECIMAL(8, 2), -- GPS accuracy in meters (optional)
  
  -- Address verification
  captured_address TEXT, -- Address at GPS location (optional geocoding result)
  address_matches_expected BOOLEAN, -- Does GPS location match expected service address?
  
  -- Device and verification info
  device_info JSONB, -- Device details, browser info for forensics
  ip_address INET, -- IP address for additional verification
  
  -- Immutable audit trail
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_gps_lat CHECK (gps_latitude >= -90 AND gps_latitude <= 90),
  CONSTRAINT valid_gps_lng CHECK (gps_longitude >= -180 AND gps_longitude <= 180),
  CONSTRAINT valid_accuracy CHECK (gps_accuracy IS NULL OR gps_accuracy >= 0)
);

-- Create custom enum for check-in types
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'check_in_type') THEN
    CREATE TYPE check_in_type AS ENUM (
      'service_start',    -- Merchant arrives and starts service
      'service_complete', -- Merchant completes service
      'client_confirm'    -- Client confirms service received (optional)
    );
  END IF;
END $$;

-- Add check-in type column with the new enum
ALTER TABLE gps_checkins 
ALTER COLUMN checkin_type TYPE check_in_type USING checkin_type::check_in_type;

-- =============================================================================
-- BOOKING REQUEST STATUS UPDATES
-- =============================================================================

-- Add GPS-related status fields to booking_requests
ALTER TABLE booking_requests 
ADD COLUMN IF NOT EXISTS gps_checkin_required BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS service_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS service_completed_at TIMESTAMPTZ;

-- Note: booking_status enum already includes all states ('checked_in', 'in_progress', 'completed') from initial creation.

-- =============================================================================
-- GPS FUNCTIONS
-- =============================================================================

-- Function to record GPS check-in
CREATE OR REPLACE FUNCTION record_gps_checkin(
  p_booking_request_id UUID,
  p_user_id UUID,
  p_checkin_type check_in_type,
  p_gps_latitude DECIMAL(10, 8),
  p_gps_longitude DECIMAL(11, 8),
  p_gps_accuracy DECIMAL(8, 2) DEFAULT NULL,
  p_captured_address TEXT DEFAULT NULL,
  p_device_info JSONB DEFAULT NULL,
  p_ip_address INET DEFAULT NULL
)
RETURNS TABLE(
  checkin_id UUID,
  success BOOLEAN,
  message TEXT
) AS $$
DECLARE
  v_user_role user_role;
  v_booking_status booking_status;
  v_merchant_user_id UUID;
  v_client_user_id UUID;
BEGIN
  -- Get user role
  SELECT role INTO v_user_role FROM users WHERE id = p_user_id;
  
  -- Get booking details
  SELECT status, merchant_user_id, client_user_id 
  INTO v_booking_status, v_merchant_user_id, v_client_user_id
  FROM booking_requests 
  WHERE id = p_booking_request_id;

  -- Validation: booking must be accepted
  IF v_booking_status NOT IN ('accepted', 'checked_in', 'in_progress') THEN
    RETURN QUERY SELECT NULL::UUID, false, 'Booking must be accepted before GPS check-in'::TEXT;
    RETURN;
  END IF;

  -- Validation: user must be part of this booking
  IF p_user_id != v_merchant_user_id AND p_user_id != v_client_user_id THEN
    RETURN QUERY SELECT NULL::UUID, false, 'User not authorized for this booking'::TEXT;
    RETURN;
  END IF;

  -- Record GPS check-in
  INSERT INTO gps_checkins (
    booking_request_id,
    user_id,
    user_role,
    checkin_type,
    gps_latitude,
    gps_longitude,
    gps_accuracy,
    captured_address,
    device_info,
    ip_address
  ) VALUES (
    p_booking_request_id,
    p_user_id,
    v_user_role,
    p_checkin_type,
    p_gps_latitude,
    p_gps_longitude,
    p_gps_accuracy,
    p_captured_address,
    p_device_info,
    p_ip_address
  ) RETURNING id INTO checkin_id;

  -- Update booking status based on check-in type
  IF p_checkin_type = 'service_start' THEN
    UPDATE booking_requests 
    SET 
      status = 'in_progress'::booking_status,
      service_started_at = NOW()
    WHERE id = p_booking_request_id;
    
  ELSIF p_checkin_type = 'service_complete' THEN
    UPDATE booking_requests 
    SET 
      status = 'completed'::booking_status,
      service_completed_at = NOW()
    WHERE id = p_booking_request_id;
  END IF;

  RETURN QUERY SELECT checkin_id, true, 'GPS check-in recorded successfully'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get GPS history for a booking
CREATE OR REPLACE FUNCTION get_booking_gps_history(p_booking_request_id UUID)
RETURNS TABLE(
  id UUID,
  user_name TEXT,
  user_role user_role,
  checkin_type check_in_type,
  checkin_timestamp TIMESTAMPTZ,
  gps_latitude DECIMAL(10, 8),
  gps_longitude DECIMAL(11, 8),
  gps_accuracy DECIMAL(8, 2),
  captured_address TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    gc.id,
    u.name,
    gc.user_role,
    gc.checkin_type,
    gc.checkin_timestamp,
    gc.gps_latitude,
    gc.gps_longitude,
    gc.gps_accuracy,
    gc.captured_address
  FROM gps_checkins gc
  JOIN users u ON gc.user_id = u.id
  WHERE gc.booking_request_id = p_booking_request_id
  ORDER BY gc.checkin_timestamp ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on GPS checkins table
ALTER TABLE gps_checkins ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see GPS records for their own bookings
CREATE POLICY "Users can view GPS records for their bookings" ON gps_checkins
  FOR SELECT
  USING (
    booking_request_id IN (
      SELECT id FROM booking_requests 
      WHERE client_user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
         OR merchant_user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
    )
  );

-- Policy: Users can insert GPS records for their accepted bookings
CREATE POLICY "Users can create GPS records for accepted bookings" ON gps_checkins
  FOR INSERT
  WITH CHECK (
    user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
    AND booking_request_id IN (
      SELECT id FROM booking_requests 
      WHERE status IN ('accepted', 'checked_in', 'in_progress')
        AND (client_user_id = user_id OR merchant_user_id = user_id)
    )
  );

-- Policy: No updates or deletes (immutable audit trail)
CREATE POLICY "GPS records are immutable" ON gps_checkins
  FOR UPDATE USING (false);

CREATE POLICY "GPS records cannot be deleted" ON gps_checkins
  FOR DELETE USING (false);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Index for booking lookups
CREATE INDEX IF NOT EXISTS idx_gps_checkins_booking 
ON gps_checkins (booking_request_id, checkin_timestamp);

-- Index for user lookups
CREATE INDEX IF NOT EXISTS idx_gps_checkins_user 
ON gps_checkins (user_id, checkin_timestamp);

-- Index for type-based queries
CREATE INDEX IF NOT EXISTS idx_gps_checkins_type 
ON gps_checkins (checkin_type, checkin_timestamp);

-- Geospatial index for location queries (if needed for analytics)
CREATE INDEX IF NOT EXISTS idx_gps_checkins_location 
ON gps_checkins USING GIST(ST_Point(gps_longitude, gps_latitude));

-- =============================================================================
-- GRANT PERMISSIONS
-- =============================================================================

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION record_gps_checkin TO authenticated;
GRANT EXECUTE ON FUNCTION get_booking_gps_history TO authenticated;

-- Grant table permissions
GRANT SELECT, INSERT ON gps_checkins TO authenticated;

-- =============================================================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON TABLE gps_checkins IS 'Immutable GPS check-in/out records for service delivery trust & safety. Records GPS coordinates at service start and completion per TRD requirements.';

COMMENT ON COLUMN gps_checkins.gps_latitude IS 'GPS latitude with 8 decimal places precision (~1.1m accuracy)';
COMMENT ON COLUMN gps_checkins.gps_longitude IS 'GPS longitude with 8 decimal places precision (~1.1m accuracy)';
COMMENT ON COLUMN gps_checkins.address_matches_expected IS 'Verification flag: does GPS location match expected service address?';
COMMENT ON COLUMN gps_checkins.device_info IS 'Device fingerprint and browser details for forensic analysis';

COMMENT ON FUNCTION record_gps_checkin IS 'Records GPS check-in and updates booking status. Enforces business rules and validation.';
COMMENT ON FUNCTION get_booking_gps_history IS 'Returns complete GPS audit trail for a booking with user details.';

-- =============================================================================
-- USAGE EXAMPLES
-- =============================================================================
-- 
-- Record service start check-in:
-- SELECT * FROM record_gps_checkin(
--   'booking-uuid', 'user-uuid', 'service_start'::check_in_type,
--   6.5244, 3.3792, 10.5, '123 Lagos Street', '{"device": "mobile"}'::jsonb, '192.168.1.1'::inet
-- );
-- 
-- Get GPS history:
-- SELECT * FROM get_booking_gps_history('booking-uuid');
-- 
-- =============================================================================