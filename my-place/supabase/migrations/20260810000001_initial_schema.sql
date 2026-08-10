-- My Place Database Schema
-- Migration: Initial schema (Phase 0)
-- Based on TRD.md data models
-- Date: 2026-08-10

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis"; -- For geo coordinates

-- Create custom types (enums)
CREATE TYPE user_role AS ENUM ('client', 'merchant');
CREATE TYPE verification_status AS ENUM ('unverified', 'pending', 'id_verified', 'failed');
CREATE TYPE service_category AS ENUM ('tailoring', 'carpentry', 'welding', 'plumbing');
CREATE TYPE merchant_status AS ENUM ('active', 'inactive', 'under_review');
CREATE TYPE booking_status AS ENUM ('requested', 'accepted', 'declined', 'checked_in', 'completed', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'off_platform_completed', 'settled'); -- v1: off-platform tracking

-- =============================================================================
-- USERS TABLE (Base user model)
-- =============================================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Auth fields (managed by Supabase Auth, but we store reference)
    auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Profile fields
    name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL, -- Primary identifier for OTP auth
    email TEXT, -- Optional, fallback auth method
    
    -- Role
    role user_role NOT NULL,
    
    -- Verification
    verification_status verification_status NOT NULL DEFAULT 'unverified',
    id_document_ref TEXT, -- Pointer to Smile ID verification result (not raw image)
    
    -- Location (nationwide support - no city enum)
    address TEXT,
    city TEXT, -- Free-text or from a large city list
    state TEXT, -- Nigerian states
    geo_coordinates GEOGRAPHY(POINT, 4326), -- PostGIS point (lat/lng)
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_phone CHECK (phone ~ '^\+?[0-9]{10,15}$')
);

-- Indexes
CREATE INDEX idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_verification_status ON users(verification_status);
CREATE INDEX idx_users_geo_coordinates ON users USING GIST(geo_coordinates); -- Spatial index

-- =============================================================================
-- VERIFICATION_RECORDS TABLE
-- =============================================================================
CREATE TABLE verification_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Provider info
    provider TEXT NOT NULL DEFAULT 'smile_identity', -- smile_identity, youverify, etc.
    provider_job_id TEXT, -- External job ID from verification provider
    
    -- Result
    result verification_status NOT NULL,
    result_details JSONB, -- Raw response from provider (for audit/debugging)
    
    -- Metadata
    checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_verification_records_user_id ON verification_records(user_id);
CREATE INDEX idx_verification_records_provider_job_id ON verification_records(provider_job_id);

-- =============================================================================
-- MERCHANT_PROFILES TABLE
-- =============================================================================
CREATE TABLE merchant_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Service details
    category service_category NOT NULL,
    description TEXT NOT NULL,
    price_range_min DECIMAL(10, 2), -- Naira
    price_range_max DECIMAL(10, 2), -- Naira
    
    -- Service area
    service_area_radius_km DECIMAL(5, 2) NOT NULL DEFAULT 5.0, -- How far they'll travel
    
    -- Ratings (aggregated)
    rating_avg DECIMAL(3, 2) DEFAULT 0.0 CHECK (rating_avg >= 0 AND rating_avg <= 5),
    rating_count INTEGER DEFAULT 0,
    
    -- Off-platform testimonials (imported from WhatsApp/Instagram)
    -- Each entry: {source: 'off_platform', text: '...', author: '...', platform: 'whatsapp'}
    imported_testimonials JSONB DEFAULT '[]'::jsonb,
    
    -- Status
    status merchant_status NOT NULL DEFAULT 'active',
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_price_range CHECK (price_range_min <= price_range_max),
    CONSTRAINT valid_service_area CHECK (service_area_radius_km > 0)
);

-- Indexes
CREATE INDEX idx_merchant_profiles_user_id ON merchant_profiles(user_id);
CREATE INDEX idx_merchant_profiles_category ON merchant_profiles(category);
CREATE INDEX idx_merchant_profiles_status ON merchant_profiles(status);
CREATE INDEX idx_merchant_profiles_rating_avg ON merchant_profiles(rating_avg DESC);

-- =============================================================================
-- LISTINGS TABLE
-- =============================================================================
CREATE TABLE listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id UUID NOT NULL REFERENCES merchant_profiles(id) ON DELETE CASCADE,
    
    -- Listing details
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category service_category NOT NULL,
    price DECIMAL(10, 2) NOT NULL, -- Naira
    
    -- Status
    active BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_price CHECK (price >= 0)
);

-- Indexes
CREATE INDEX idx_listings_merchant_id ON listings(merchant_id);
CREATE INDEX idx_listings_category ON listings(category);
CREATE INDEX idx_listings_active ON listings(active);
CREATE INDEX idx_listings_price ON listings(price);

-- =============================================================================
-- BOOKINGS TABLE
-- =============================================================================
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Parties
    client_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    merchant_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE RESTRICT,
    
    -- Status
    status booking_status NOT NULL DEFAULT 'requested',
    
    -- Timeline
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    declined_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    
    -- GPS Check-in/Check-out (IMMUTABLE - audit trail)
    checkin_time TIMESTAMPTZ,
    checkin_geo GEOGRAPHY(POINT, 4326),
    checkout_time TIMESTAMPTZ,
    checkout_geo GEOGRAPHY(POINT, 4326),
    
    -- Pricing & commission
    price_agreed DECIMAL(10, 2) NOT NULL,
    commission_rate_applied DECIMAL(5, 4) NOT NULL DEFAULT 0.0700, -- 7% midpoint of 6-8% range
    commission_amount DECIMAL(10, 2) GENERATED ALWAYS AS (price_agreed * commission_rate_applied) STORED,
    
    -- Payment (v1: off-platform tracking only)
    payment_status payment_status NOT NULL DEFAULT 'pending',
    payment_notes TEXT, -- For manual reconciliation notes
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_commission_rate CHECK (commission_rate_applied >= 0 AND commission_rate_applied <= 1),
    CONSTRAINT valid_price_agreed CHECK (price_agreed >= 0),
    CONSTRAINT checkin_before_checkout CHECK (checkout_time IS NULL OR checkin_time < checkout_time)
);

-- Indexes
CREATE INDEX idx_bookings_client_id ON bookings(client_id);
CREATE INDEX idx_bookings_merchant_id ON bookings(merchant_id);
CREATE INDEX idx_bookings_listing_id ON bookings(listing_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_created_at ON bookings(created_at DESC);

-- =============================================================================
-- RATINGS TABLE (Two-way: client ↔ merchant)
-- =============================================================================
CREATE TABLE ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    
    -- Who rated whom
    rater_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- Who gave the rating
    rated_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- Who received the rating
    
    -- Rating details
    score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
    comment TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints: one rating per direction per booking
    CONSTRAINT unique_rating_per_booking_direction UNIQUE (booking_id, rater_id, rated_id)
);

-- Indexes
CREATE INDEX idx_ratings_booking_id ON ratings(booking_id);
CREATE INDEX idx_ratings_rater_id ON ratings(rater_id);
CREATE INDEX idx_ratings_rated_id ON ratings(rated_id);
CREATE INDEX idx_ratings_score ON ratings(score);

-- =============================================================================
-- TRIGGERS: Auto-update timestamps
-- =============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_merchant_profiles_updated_at BEFORE UPDATE ON merchant_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_listings_updated_at BEFORE UPDATE ON listings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- FUNCTIONS: Rating aggregation for merchants
-- =============================================================================
CREATE OR REPLACE FUNCTION update_merchant_rating_avg()
RETURNS TRIGGER AS $$
BEGIN
    -- Recalculate rating_avg and rating_count for the rated merchant
    UPDATE merchant_profiles
    SET 
        rating_avg = (
            SELECT COALESCE(AVG(score), 0)
            FROM ratings
            WHERE rated_id = (SELECT user_id FROM merchant_profiles WHERE id = merchant_profiles.id)
        ),
        rating_count = (
            SELECT COUNT(*)
            FROM ratings
            WHERE rated_id = (SELECT user_id FROM merchant_profiles WHERE id = merchant_profiles.id)
        )
    WHERE user_id = NEW.rated_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update merchant rating when a new rating is added
CREATE TRIGGER update_merchant_rating_on_new_rating
AFTER INSERT ON ratings
FOR EACH ROW
WHEN (NEW.rated_id IN (SELECT user_id FROM users WHERE role = 'merchant'))
EXECUTE FUNCTION update_merchant_rating_avg();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) Setup
-- =============================================================================
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- RLS Policies will be added in Phase 1 after auth is implemented
-- Placeholder: Allow service role full access for now
CREATE POLICY "Service role has full access" ON users FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role has full access" ON verification_records FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role has full access" ON merchant_profiles FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role has full access" ON listings FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role has full access" ON bookings FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role has full access" ON ratings FOR ALL USING (auth.role() = 'service_role');

-- =============================================================================
-- COMMENTS (Documentation)
-- =============================================================================
COMMENT ON TABLE users IS 'Base user table for both clients and merchants';
COMMENT ON COLUMN users.geo_coordinates IS 'PostGIS point for distance-based search (nationwide support)';
COMMENT ON COLUMN users.verification_status IS 'Hard gate: no full access until id_verified';
COMMENT ON COLUMN users.id_document_ref IS 'Pointer to Smile ID verification result (not raw image - NDPR compliance)';

COMMENT ON TABLE merchant_profiles IS 'Extended profile for merchants only';
COMMENT ON COLUMN merchant_profiles.imported_testimonials IS 'Off-platform testimonials - must be visually distinguished in UI (non-negotiable)';

COMMENT ON TABLE bookings IS 'Booking lifecycle with GPS audit trail';
COMMENT ON COLUMN bookings.checkin_geo IS 'IMMUTABLE GPS capture at service start (non-negotiable requirement)';
COMMENT ON COLUMN bookings.checkout_geo IS 'IMMUTABLE GPS capture at service end (non-negotiable requirement)';
COMMENT ON COLUMN bookings.commission_amount IS 'Auto-calculated from price_agreed * commission_rate_applied';

COMMENT ON TABLE ratings IS 'Two-way ratings: client→merchant AND merchant→client (non-negotiable)';
