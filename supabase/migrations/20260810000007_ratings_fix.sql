-- =============================================================================
-- RATINGS TABLE FIX
-- =============================================================================
-- Fix ratings table to reference booking_requests instead of bookings
-- Update schema and functions for two-way rating system

-- Drop existing ratings table if it exists (since we need to change the reference)
DROP TABLE IF EXISTS ratings CASCADE;

-- Recreate ratings table with correct reference to booking_requests
CREATE TABLE ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_request_id UUID NOT NULL REFERENCES booking_requests(id) ON DELETE CASCADE,
    
    -- Who rated whom
    rater_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- Who gave the rating
    rated_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- Who received the rating
    
    -- Rating details
    score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
    comment TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints: one rating per direction per booking
    CONSTRAINT unique_rating_per_booking_direction UNIQUE (booking_request_id, rater_id, rated_id)
);

-- Indexes for performance
CREATE INDEX idx_ratings_booking_request_id ON ratings(booking_request_id);
CREATE INDEX idx_ratings_rater_id ON ratings(rater_id);
CREATE INDEX idx_ratings_rated_id ON ratings(rated_id);
CREATE INDEX idx_ratings_score ON ratings(score);

-- Enable RLS
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- RATING AGGREGATION FUNCTIONS
-- =============================================================================

-- Function to update merchant rating averages
CREATE OR REPLACE FUNCTION update_merchant_rating_avg()
RETURNS TRIGGER AS $$
BEGIN
    -- Update rating_avg and rating_count for the rated user if they're a merchant
    UPDATE merchant_profiles
    SET 
        rating_avg = (
            SELECT COALESCE(AVG(score::DECIMAL), 0)
            FROM ratings
            WHERE rated_id = NEW.rated_id
        ),
        rating_count = (
            SELECT COUNT(*)
            FROM ratings
            WHERE rated_id = NEW.rated_id
        ),
        updated_at = NOW()
    WHERE user_id = NEW.rated_id;
    
    -- Also update users table rating fields for clients
    UPDATE users
    SET 
        rating_avg = (
            SELECT COALESCE(AVG(score::DECIMAL), 0)
            FROM ratings
            WHERE rated_id = NEW.rated_id
        ),
        rating_count = (
            SELECT COUNT(*)
            FROM ratings
            WHERE rated_id = NEW.rated_id
        ),
        updated_at = NOW()
    WHERE id = NEW.rated_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update ratings when new rating is added
CREATE TRIGGER update_rating_averages_on_new_rating
AFTER INSERT ON ratings
FOR EACH ROW
EXECUTE FUNCTION update_merchant_rating_avg();

-- =============================================================================
-- RLS POLICIES FOR RATINGS
-- =============================================================================

-- Anyone can view ratings (public reputation system)
CREATE POLICY "Public can view ratings"
ON ratings FOR SELECT
TO authenticated
USING (true);

-- Users can create ratings for completed bookings they participated in
CREATE POLICY "Users can rate their completed bookings"
ON ratings FOR INSERT
TO authenticated
WITH CHECK (
  -- Must be authenticated
  auth.uid() IS NOT NULL
  AND
  -- Rater must be the current user
  rater_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
  AND
  -- Must be a participant in the booking
  EXISTS (
    SELECT 1 FROM booking_requests br
    WHERE br.id = booking_request_id
    AND (br.client_user_id = rater_id OR br.merchant_user_id = rater_id)
    AND br.status = 'completed'
  )
  AND
  -- Cannot rate yourself
  rater_id != rated_id
);

-- Ratings are immutable - no updates or deletes allowed
-- (No UPDATE or DELETE policies = no modifications allowed)

-- =============================================================================
-- RATING HELPER FUNCTIONS
-- =============================================================================

-- Function to check if user can rate a specific booking
CREATE OR REPLACE FUNCTION can_user_rate_booking(
  p_booking_request_id UUID,
  p_rater_user_id UUID,
  p_rated_user_id UUID
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_booking_status TEXT;
  v_client_user_id UUID;
  v_merchant_user_id UUID;
  v_existing_rating_id UUID;
BEGIN
  -- Get booking details
  SELECT status, client_user_id, merchant_user_id
  INTO v_booking_status, v_client_user_id, v_merchant_user_id
  FROM booking_requests
  WHERE id = p_booking_request_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Booking not found');
  END IF;

  -- Check if booking is completed
  IF v_booking_status != 'completed' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Can only rate completed bookings');
  END IF;

  -- Check if user was a participant
  IF p_rater_user_id NOT IN (v_client_user_id, v_merchant_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Access denied - not a booking participant');
  END IF;

  -- Check if rated user was a participant
  IF p_rated_user_id NOT IN (v_client_user_id, v_merchant_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot rate user not involved in booking');
  END IF;

  -- Check if trying to rate themselves
  IF p_rater_user_id = p_rated_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot rate yourself');
  END IF;

  -- Check if rating already exists
  SELECT id INTO v_existing_rating_id
  FROM ratings
  WHERE booking_request_id = p_booking_request_id
    AND rater_id = p_rater_user_id
    AND rated_id = p_rated_user_id;

  IF v_existing_rating_id IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Rating already exists for this booking');
  END IF;

  -- All checks passed
  RETURN jsonb_build_object(
    'success', true,
    'can_rate', true,
    'booking_status', v_booking_status
  );
END;
$$;

-- Function to get ratings for a booking
CREATE OR REPLACE FUNCTION get_booking_ratings(p_booking_request_id UUID)
RETURNS TABLE (
  id UUID,
  rater_id UUID,
  rated_id UUID,
  score INTEGER,
  comment TEXT,
  created_at TIMESTAMPTZ,
  rater_name TEXT,
  rated_name TEXT
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.rater_id,
    r.rated_id,
    r.score,
    r.comment,
    r.created_at,
    u_rater.name as rater_name,
    u_rated.name as rated_name
  FROM ratings r
  JOIN users u_rater ON r.rater_id = u_rater.id
  JOIN users u_rated ON r.rated_id = u_rated.id
  WHERE r.booking_request_id = p_booking_request_id
  ORDER BY r.created_at ASC;
END;
$$;

-- Comments for documentation
COMMENT ON TABLE ratings IS 'Two-way ratings: client ↔ merchant for completed bookings (immutable)';
COMMENT ON COLUMN ratings.booking_request_id IS 'Reference to the completed booking being rated';
COMMENT ON COLUMN ratings.rater_id IS 'User who gave the rating';
COMMENT ON COLUMN ratings.rated_id IS 'User who received the rating';
COMMENT ON COLUMN ratings.score IS 'Rating score from 1-5 stars';
COMMENT ON COLUMN ratings.comment IS 'Optional text review/comment';