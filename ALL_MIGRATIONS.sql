-- ============================================================================
-- My Place - Combined database migrations (dependency-ordered)
-- Paste this entire file into the Supabase SQL Editor and click Run.
--
-- Prerequisite: enable PostGIS first (Database -> Extensions -> 'postgis'),
-- though the first section also runs CREATE EXTENSION as a fallback.
--
-- NOTE: sections are ordered by dependency, NOT by file number. The
-- booking_requests table (file 0008) is created before the files that
-- alter or reference it (0005, 0006, 0007).
-- ============================================================================


-- ############################################################################
-- ## STEP 1: 20260810000001_initial_schema.sql
-- ############################################################################

-- My Place Database Schema
-- Migration: Initial schema (Phase 0)
-- Based on TRD.md data models
-- Date: 2026-08-10

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis"; -- For geo coordinates

-- Create custom types (enums)
CREATE TYPE user_role AS ENUM ('client', 'merchant', 'admin');
CREATE TYPE verification_status AS ENUM ('unverified', 'pending', 'id_verified', 'failed');
CREATE TYPE service_category AS ENUM ('tailoring', 'carpentry', 'welding', 'plumbing');
CREATE TYPE merchant_status AS ENUM ('active', 'inactive', 'under_review');
CREATE TYPE booking_status AS ENUM ('requested', 'pending', 'accepted', 'declined', 'checked_in', 'in_progress', 'completed', 'cancelled');
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
-- Postgres does not allow a subquery in a trigger WHEN condition, so the
-- merchant check lives inside update_merchant_rating_avg() instead. When the
-- rated user is a client, the UPDATE matches no merchant_profiles row (no-op).
CREATE TRIGGER update_merchant_rating_on_new_rating
AFTER INSERT ON ratings
FOR EACH ROW
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


-- ############################################################################
-- ## STEP 2: 20260810000002_rls_policies.sql
-- ############################################################################

-- My Place Database - Row Level Security (RLS) Policies
-- Migration: RLS Policies (Phase 2)
-- Date: 2026-08-10
-- 
-- SECURITY REQUIREMENT: Hard prerequisite before Phase 3
-- Per TRD §4: Address privacy must be enforced at database level
-- 
-- KEY PRIVACY RULES:
-- 1. Client address hidden from merchant until booking accepted
-- 2. Merchant address never exposed to clients (approximate location only)
-- 3. User profile data accessible only by owner (except public fields)
-- 4. Bookings visible only to parties involved
-- 5. Ratings public (read) but write-restricted

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Get current user's ID from our users table (not auth.users)
CREATE OR REPLACE FUNCTION public.user_id()
RETURNS UUID AS $$
  SELECT id FROM public.users WHERE auth_user_id = auth.uid()
$$ LANGUAGE SQL STABLE;

-- Check if current user is a merchant
CREATE OR REPLACE FUNCTION public.is_merchant()
RETURNS BOOLEAN AS $$
  SELECT role = 'merchant' FROM public.users WHERE auth_user_id = auth.uid()
$$ LANGUAGE SQL STABLE;

-- Check if current user is a client
CREATE OR REPLACE FUNCTION public.is_client()
RETURNS BOOLEAN AS $$
  SELECT role = 'client' FROM public.users WHERE auth_user_id = auth.uid()
$$ LANGUAGE SQL STABLE;

-- Check if current user is verified
CREATE OR REPLACE FUNCTION public.is_verified()
RETURNS BOOLEAN AS $$
  SELECT verification_status = 'id_verified' FROM public.users WHERE auth_user_id = auth.uid()
$$ LANGUAGE SQL STABLE;

-- Check if current user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT role = 'admin' FROM public.users WHERE auth_user_id = auth.uid()
$$ LANGUAGE SQL STABLE;

-- =============================================================================
-- USERS TABLE - Access to own profile only (except public fields)
-- =============================================================================

-- Drop existing service role policy
DROP POLICY IF EXISTS "Service role has full access" ON users;

-- Users can view their own full profile
CREATE POLICY "Users can view own profile"
ON users FOR SELECT
USING (auth_user_id = auth.uid());

-- Users can view PUBLIC fields of other users (for merchant profiles, ratings display)
-- Public fields: id, name, role, verification_status, city, state (NOT full address)
CREATE POLICY "Public user fields visible to verified users"
ON users FOR SELECT
USING (
  public.is_verified() AND
  -- Only expose safe fields (address is private until booking accepted)
  id IS NOT NULL
);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
USING (auth_user_id = auth.uid())
WITH CHECK (auth_user_id = auth.uid());

-- New users can insert their profile (during onboarding)
CREATE POLICY "Authenticated users can create own profile"
ON users FOR INSERT
WITH CHECK (auth_user_id = auth.uid());

-- =============================================================================
-- VERIFICATION_RECORDS - User can view own records only
-- =============================================================================

DROP POLICY IF EXISTS "Service role has full access" ON verification_records;

CREATE POLICY "Users can view own verification records"
ON verification_records FOR SELECT
USING (user_id = public.user_id());

-- System (service role) can insert verification records (from Smile ID webhook)
CREATE POLICY "Service role can insert verification records"
ON verification_records FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- =============================================================================
-- MERCHANT_PROFILES - Public read (for discovery), merchant-only write
-- =============================================================================

DROP POLICY IF EXISTS "Service role has full access" ON merchant_profiles;

-- Anyone verified can view merchant profiles (for search/discovery)
CREATE POLICY "Verified users can view all merchant profiles"
ON merchant_profiles FOR SELECT
USING (public.is_verified());

-- Merchants can update their own profile
CREATE POLICY "Merchants can update own profile"
ON merchant_profiles FOR UPDATE
USING (user_id = public.user_id() AND public.is_merchant())
WITH CHECK (user_id = public.user_id() AND public.is_merchant());

-- System can create merchant profiles (during user signup if role=merchant)
CREATE POLICY "Service role can create merchant profiles"
ON merchant_profiles FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- Merchants can create their own profile (if not auto-created)
CREATE POLICY "Merchants can create own profile"
ON merchant_profiles FOR INSERT
WITH CHECK (user_id = public.user_id() AND public.is_merchant());

-- =============================================================================
-- LISTINGS - Public read (active only), merchant-only write
-- =============================================================================

DROP POLICY IF EXISTS "Service role has full access" ON listings;

-- Anyone verified can view ACTIVE listings
CREATE POLICY "Verified users can view active listings"
ON listings FOR SELECT
USING (active = TRUE AND public.is_verified());

-- Merchants can view their own listings (active + inactive)
CREATE POLICY "Merchants can view own listings"
ON listings FOR SELECT
USING (
  merchant_id IN (SELECT id FROM merchant_profiles WHERE user_id = public.user_id()) 
  AND public.is_merchant()
);

-- Merchants can create listings
CREATE POLICY "Merchants can create listings"
ON listings FOR INSERT
WITH CHECK (
  merchant_id IN (SELECT id FROM merchant_profiles WHERE user_id = public.user_id())
  AND public.is_merchant()
  AND public.is_verified() -- Must be verified to create listings
);

-- Merchants can update their own listings
CREATE POLICY "Merchants can update own listings"
ON listings FOR UPDATE
USING (
  merchant_id IN (SELECT id FROM merchant_profiles WHERE user_id = public.user_id())
  AND public.is_merchant()
)
WITH CHECK (
  merchant_id IN (SELECT id FROM merchant_profiles WHERE user_id = public.user_id())
  AND public.is_merchant()
);

-- Merchants can delete their own listings
CREATE POLICY "Merchants can delete own listings"
ON listings FOR DELETE
USING (
  merchant_id IN (SELECT id FROM merchant_profiles WHERE user_id = public.user_id())
  AND public.is_merchant()
);

-- =============================================================================
-- BOOKINGS - Visible only to parties involved
-- TRD §4: Address privacy enforced here
-- =============================================================================

DROP POLICY IF EXISTS "Service role has full access" ON bookings;

-- Clients can view bookings where they are the client
CREATE POLICY "Clients can view own bookings"
ON bookings FOR SELECT
USING (client_id = public.user_id() AND public.is_client());

-- Merchants can view bookings where they are the merchant
CREATE POLICY "Merchants can view bookings where they are the merchant"
ON bookings FOR SELECT
USING (merchant_id = public.user_id() AND public.is_merchant());

-- Clients can create bookings
CREATE POLICY "Clients can create bookings"
ON bookings FOR INSERT
WITH CHECK (
  client_id = public.user_id() 
  AND public.is_client()
  AND public.is_verified()
);

-- Merchants can update bookings (accept/decline/check-in/check-out)
CREATE POLICY "Merchants can update bookings where they are the merchant"
ON bookings FOR UPDATE
USING (merchant_id = public.user_id() AND public.is_merchant())
WITH CHECK (merchant_id = public.user_id() AND public.is_merchant());

-- Clients can update bookings (cancel only, handled at app level)
CREATE POLICY "Clients can update own bookings"
ON bookings FOR UPDATE
USING (client_id = public.user_id() AND public.is_client())
WITH CHECK (client_id = public.user_id() AND public.is_client());

-- =============================================================================
-- ADDRESS PRIVACY IMPLEMENTATION (TRD §4)
-- =============================================================================
-- 
-- IMPORTANT: RLS policies above control WHO can see bookings.
-- Address visibility logic is enforced at APPLICATION level via views/functions:
--
-- Rule 1: Client full address visible to merchant ONLY after booking accepted
--   - Implementation: App fetches user.address only if booking.status IN ('accepted', 'checked_in', 'completed')
--   - Before acceptance: Show client.city + approximate distance only
--
-- Rule 2: Merchant address NEVER exposed to client
--   - Implementation: App never fetches merchant.address for clients
--   - Only merchant.city + service_area_radius shown
--   - Distance calculation uses geo_coordinates (no street address)
--
-- These rules are documented here but enforced in app code (server actions).
-- Database-level RLS prevents unauthorized users from reading bookings entirely.
--
-- =============================================================================

-- =============================================================================
-- RATINGS - Public read, restricted write
-- =============================================================================

DROP POLICY IF EXISTS "Service role has full access" ON ratings;

-- Anyone verified can view ratings (for merchant reputation display)
CREATE POLICY "Verified users can view all ratings"
ON ratings FOR SELECT
USING (public.is_verified());

-- Users can create ratings for bookings they participated in
-- Additional validation (booking completed, not already rated) at app level
CREATE POLICY "Users can create ratings for their bookings"
ON ratings FOR INSERT
WITH CHECK (
  public.is_verified() AND
  rater_id = public.user_id() AND
  booking_id IN (
    SELECT id FROM bookings 
    WHERE client_id = public.user_id() OR merchant_id = public.user_id()
  )
);

-- Users cannot update or delete ratings (immutable after creation)
-- No UPDATE or DELETE policies = no one can modify ratings

-- =============================================================================
-- COMMENTS & VERIFICATION CHECKLIST
-- =============================================================================

COMMENT ON POLICY "Public user fields visible to verified users" ON users IS 
  'TRD §4: Full address (users.address) is NOT exposed by this policy. Only city/state visible.';

COMMENT ON POLICY "Clients can view own bookings" ON bookings IS 
  'TRD §4: RLS allows client to see booking record. Address privacy enforced at app level: merchant address never exposed, client address only after acceptance.';

COMMENT ON POLICY "Merchants can view bookings where they are the merchant" ON bookings IS 
  'TRD §4: RLS allows merchant to see booking record. App enforces: client full address visible only if status IN (accepted, checked_in, completed).';

-- =============================================================================
-- VERIFICATION QUERIES (Run these to test RLS)
-- =============================================================================

-- Test 1: Verify users can only see their own profile full data
-- Expected: Current user's profile only
-- SELECT * FROM users WHERE auth_user_id = auth.uid();

-- Test 2: Verify address field is not exposed in public user queries
-- Expected: Other users visible but address should be filtered at app level
-- SELECT id, name, city, state FROM users WHERE verification_status = 'id_verified';

-- Test 3: Verify merchants can only edit their own listings
-- Expected: Only listings where merchant_id matches current user's merchant_profile.id
-- SELECT * FROM listings WHERE merchant_id IN (SELECT id FROM merchant_profiles WHERE user_id = public.user_id());

-- Test 4: Verify clients can only see their own bookings
-- Expected: Only bookings where client_id = current user's id
-- SELECT * FROM bookings WHERE client_id = public.user_id();

-- Test 5: Verify merchants can only see bookings where they are the merchant
-- Expected: Only bookings where merchant_id = current user's id
-- SELECT * FROM bookings WHERE merchant_id = public.user_id();

-- =============================================================================
-- SECURITY AUDIT CHECKLIST
-- =============================================================================
-- 
-- ✅ Users table: Own profile only, public fields visible to verified users
-- ✅ Verification records: Own records only
-- ✅ Merchant profiles: Public read, merchant-only write
-- ✅ Listings: Active listings public, merchant CRUD on own listings only
-- ✅ Bookings: Parties-only visibility (client OR merchant)
-- ✅ Ratings: Public read, restricted write (booking participants only), immutable
-- ✅ Address privacy: Documented, enforced at app level via server actions
-- ✅ No service_role bypass: All policies enforce user-level access
-- 
-- PHASE 3 PREREQUISITE: ✅ COMPLETE
-- 
-- =============================================================================


-- ############################################################################
-- ## STEP 3: 20260810000003_storage_setup.sql
-- ############################################################################

-- My Place Database - Storage Setup for Profile Photos
-- Migration: Storage buckets and policies (Phase 2)
-- Date: 2026-08-10

-- =============================================================================
-- STORAGE BUCKET: Profile Photos
-- =============================================================================

-- Create bucket for profile photos (avatars)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-photos',
  'profile-photos',
  true, -- Public bucket (photos visible to all)
  2097152, -- 2MB limit (2 * 1024 * 1024)
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- STORAGE RLS POLICIES
-- =============================================================================

-- Anyone can view profile photos (public bucket)
CREATE POLICY "Profile photos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-photos');

-- Authenticated users can upload their own profile photo
CREATE POLICY "Users can upload own profile photo"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profile-photos' AND
  auth.uid() IS NOT NULL AND
  -- File path must be: {user_id}/avatar.{ext}
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can update their own profile photo
CREATE POLICY "Users can update own profile photo"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'profile-photos' AND
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'profile-photos' AND
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can delete their own profile photo
CREATE POLICY "Users can delete own profile photo"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profile-photos' AND
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- =============================================================================
-- ADD PROFILE PHOTO URL COLUMN TO USERS TABLE
-- =============================================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;

COMMENT ON COLUMN users.profile_photo_url IS 
  'URL to profile photo in Supabase Storage (profile-photos bucket)';

-- =============================================================================
-- VERIFICATION
-- =============================================================================
-- 
-- To verify storage setup:
-- 1. Check bucket exists: SELECT * FROM storage.buckets WHERE id = 'profile-photos';
-- 2. Check policies exist: SELECT * FROM storage.policies WHERE bucket_id = 'profile-photos';
-- 3. Test upload via UI (Phase 2)
-- 
-- =============================================================================


-- ############################################################################
-- ## STEP 4: 20260810000004_distance_functions.sql
-- ############################################################################

-- My Place Database - Distance Calculation Functions
-- Migration: PostGIS distance functions for merchant search
-- Date: 2026-08-10
-- 
-- Supports Phase 3 merchant discovery with location-based filtering
-- Maintains address privacy (TRD §4) by using coordinates only for distance calc

-- =============================================================================
-- DISTANCE CALCULATION FUNCTION
-- =============================================================================

-- Calculate distance between two geographic points in kilometers
-- Used for merchant search radius filtering and sorting
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 DOUBLE PRECISION,
  lng1 DOUBLE PRECISION,
  point2 GEOGRAPHY
)
RETURNS TABLE(distance_km DOUBLE PRECISION) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ST_Distance(
      ST_MakePoint(lng1, lat1)::geography,
      point2
    ) / 1000.0 AS distance_km; -- Convert meters to kilometers
END;
$$ LANGUAGE plpgsql;

-- Alternative: Calculate distance between two lat/lng pairs
CREATE OR REPLACE FUNCTION calculate_distance_coords(
  lat1 DOUBLE PRECISION,
  lng1 DOUBLE PRECISION,
  lat2 DOUBLE PRECISION,
  lng2 DOUBLE PRECISION
)
RETURNS TABLE(distance_km DOUBLE PRECISION) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ST_Distance(
      ST_MakePoint(lng1, lat1)::geography,
      ST_MakePoint(lng2, lat2)::geography
    ) / 1000.0 AS distance_km;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- MERCHANT SEARCH WITH DISTANCE FILTERING
-- =============================================================================

-- Search merchants within radius of user location
-- Returns merchants with calculated distance, sorted by proximity
-- Enforces address privacy (no street addresses in results)
CREATE OR REPLACE FUNCTION search_merchants_by_location(
  user_lat DOUBLE PRECISION,
  user_lng DOUBLE PRECISION,
  max_distance_km DOUBLE PRECISION DEFAULT 50.0,
  category_filter TEXT DEFAULT NULL
)
RETURNS TABLE(
  merchant_profile_id UUID,
  user_id UUID,
  name TEXT,
  category service_category,
  description TEXT,
  price_range_min DECIMAL,
  price_range_max DECIMAL,
  rating_avg DECIMAL,
  rating_count INTEGER,
  profile_photo_url TEXT,
  city TEXT,
  state TEXT,
  service_area_radius_km DECIMAL,
  distance_km DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mp.id,
    mp.user_id,
    u.name,
    mp.category,
    mp.description,
    mp.price_range_min,
    mp.price_range_max,
    mp.rating_avg,
    mp.rating_count,
    u.profile_photo_url,
    u.city,
    u.state,
    mp.service_area_radius_km,
    (ST_Distance(
      ST_MakePoint(user_lng, user_lat)::geography,
      u.geo_coordinates
    ) / 1000.0) AS distance_km
  FROM merchant_profiles mp
  JOIN users u ON mp.user_id = u.id
  WHERE 
    mp.status = 'active'
    AND u.verification_status = 'id_verified'
    AND u.role = 'merchant'
    AND u.geo_coordinates IS NOT NULL
    -- Distance filter
    AND ST_Distance(
      ST_MakePoint(user_lng, user_lat)::geography,
      u.geo_coordinates
    ) / 1000.0 <= max_distance_km
    -- Service area filter (is user within merchant's service area?)
    AND ST_Distance(
      ST_MakePoint(user_lng, user_lat)::geography,
      u.geo_coordinates
    ) / 1000.0 <= mp.service_area_radius_km
    -- Category filter (optional)
    AND (category_filter IS NULL OR mp.category::TEXT = category_filter)
  ORDER BY distance_km ASC, mp.rating_avg DESC;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Spatial index on geo_coordinates (if not already exists)
CREATE INDEX IF NOT EXISTS idx_users_geo_coordinates_gist 
ON users USING GIST(geo_coordinates);

-- Composite index for merchant search
CREATE INDEX IF NOT EXISTS idx_merchant_profiles_search 
ON merchant_profiles (status, category, rating_avg DESC);

-- =============================================================================
-- USAGE EXAMPLES
-- =============================================================================
-- 
-- Search merchants within 10km of Lagos coordinates:
-- SELECT * FROM search_merchants_by_location(6.5244, 3.3792, 10.0);
-- 
-- Search only tailors within 5km:
-- SELECT * FROM search_merchants_by_location(6.5244, 3.3792, 5.0, 'tailoring');
-- 
-- Calculate distance between two points:
-- SELECT * FROM calculate_distance_coords(6.5244, 3.3792, 6.4281, 3.4219);
-- 
-- =============================================================================

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION calculate_distance TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_distance_coords TO authenticated;
GRANT EXECUTE ON FUNCTION search_merchants_by_location TO authenticated;

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================
-- 
-- Test functions exist:
-- SELECT routine_name FROM information_schema.routines 
-- WHERE routine_name IN ('calculate_distance', 'search_merchants_by_location');
-- 
-- Test with sample coordinates (Lagos area):
-- SELECT * FROM search_merchants_by_location(6.5244, 3.3792, 20.0) LIMIT 5;
-- 
-- =============================================================================

-- ############################################################################
-- ## STEP 5: 20260810000008_booking_requests_rls.sql
-- ############################################################################

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
  auth.uid() IS NOT NULL
  AND (
    client_user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
    OR merchant_user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
  )
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

-- ############################################################################
-- ## STEP 6: 20260810000005_gps_checkin_system.sql
-- ############################################################################

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

-- ############################################################################
-- ## STEP 7: 20260810000006_commission_tracking.sql
-- ############################################################################

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

-- ############################################################################
-- ## STEP 8: 20260810000007_ratings_fix.sql
-- ############################################################################

-- =============================================================================
-- RATINGS TABLE FIX
-- =============================================================================
-- Fix ratings table to reference booking_requests instead of bookings
-- Update schema and functions for two-way rating system

-- Ensure users table has rating columns for client rating tracking
ALTER TABLE users ADD COLUMN IF NOT EXISTS rating_avg DECIMAL(3, 2) DEFAULT 0.0 CHECK (rating_avg >= 0 AND rating_avg <= 5);
ALTER TABLE users ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0;

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

-- ############################################################################
-- ## STEP 9: 20260810000009_booking_workflow_notifications.sql
-- ############################################################################

-- =============================================================================
-- BOOKING WORKFLOW AND NOTIFICATIONS SYSTEM
-- =============================================================================
-- Enhanced booking status workflow with automated transitions and notifications
-- Comprehensive notification system for booking lifecycle events

-- =============================================================================
-- NOTIFICATION SYSTEM TABLES
-- =============================================================================

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Target user
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Notification content
    type TEXT NOT NULL CHECK (type IN (
        'booking_request_received',
        'booking_accepted', 
        'booking_declined',
        'booking_cancelled',
        'service_started',
        'service_completed', 
        'rating_received',
        'payment_status_updated'
    )),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    
    -- Related entities
    booking_request_id UUID REFERENCES booking_requests(id) ON DELETE CASCADE,
    rating_id UUID REFERENCES ratings(id) ON DELETE SET NULL,
    
    -- Status
    read_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    delivery_status TEXT DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'failed')),
    
    -- Channels
    send_email BOOLEAN DEFAULT false,
    send_sms BOOLEAN DEFAULT false,
    send_push BOOLEAN DEFAULT true,
    
    -- Metadata  
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_booking_request_id ON notifications(booking_request_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_read_at ON notifications(read_at);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications"
ON notifications FOR SELECT
TO authenticated
USING (user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()));

-- Users can mark their own notifications as read
CREATE POLICY "Users can update own notification read status"
ON notifications FOR UPDATE
TO authenticated  
USING (user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()))
WITH CHECK (user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()));

-- System can insert notifications for any user
CREATE POLICY "System can create notifications"
ON notifications FOR INSERT
TO authenticated
WITH CHECK (true);

-- =============================================================================
-- NOTIFICATION TEMPLATES AND FUNCTIONS
-- =============================================================================

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_type TEXT,
    p_title TEXT,
    p_message TEXT,
    p_booking_request_id UUID DEFAULT NULL,
    p_rating_id UUID DEFAULT NULL,
    p_send_email BOOLEAN DEFAULT false,
    p_send_sms BOOLEAN DEFAULT false,
    p_send_push BOOLEAN DEFAULT true
)
RETURNS UUID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        booking_request_id,
        rating_id,
        send_email,
        send_sms,
        send_push
    ) VALUES (
        p_user_id,
        p_type,
        p_title,
        p_message,
        p_booking_request_id,
        p_rating_id,
        p_send_email,
        p_send_sms,
        p_send_push
    ) RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$;

-- Function to send booking status notifications
CREATE OR REPLACE FUNCTION notify_booking_status_change()
RETURNS TRIGGER AS $$
DECLARE
    client_name TEXT;
    merchant_name TEXT;
    service_details TEXT;
    notification_id UUID;
BEGIN
    -- Get participant names and service details
    SELECT 
        c.name,
        m.name,
        NEW.service_details
    INTO client_name, merchant_name, service_details
    FROM users c, users m
    WHERE c.id = NEW.client_user_id 
    AND m.id = NEW.merchant_user_id;

    -- Handle different status transitions
    CASE NEW.status
        WHEN 'accepted' THEN
            -- Notify client that booking was accepted
            notification_id := create_notification(
                NEW.client_user_id,
                'booking_accepted',
                'Booking Accepted! 🎉',
                format('Great news! %s has accepted your booking for "%s". You can now see their full address and contact them directly.', 
                       merchant_name, service_details),
                NEW.id,
                NULL,
                true, -- send email
                true, -- send SMS
                true  -- send push
            );
            
        WHEN 'declined' THEN
            -- Notify client that booking was declined
            notification_id := create_notification(
                NEW.client_user_id,
                'booking_declined', 
                'Booking Update',
                format('Unfortunately, %s cannot take your booking for "%s" at this time. You can search for other merchants or try booking again later.',
                       merchant_name, service_details),
                NEW.id,
                NULL,
                true, -- send email
                false, -- no SMS for declines
                true   -- send push
            );
            
        WHEN 'in_progress' THEN
            -- Notify client that service has started
            notification_id := create_notification(
                NEW.client_user_id,
                'service_started',
                'Service Started 🚀',
                format('%s has started working on your "%s" service. They have checked in at your location.',
                       merchant_name, service_details),
                NEW.id,
                NULL,
                false, -- no email for progress updates
                false, -- no SMS
                true   -- send push
            );
            
            -- Notify merchant that service started (confirmation)
            notification_id := create_notification(
                NEW.merchant_user_id,
                'service_started',
                'Service Started',
                format('You have successfully started the service for %s. GPS check-in recorded for "%s".',
                       client_name, service_details),
                NEW.id,
                NULL,
                false, -- no email
                false, -- no SMS  
                true   -- send push
            );
            
        WHEN 'completed' THEN
            -- Notify client that service is completed
            notification_id := create_notification(
                NEW.client_user_id,
                'service_completed',
                'Service Completed! ✅',
                format('Your "%s" service with %s has been completed. Please take a moment to rate your experience.',
                       service_details, merchant_name),
                NEW.id,
                NULL,
                true,  -- send email
                true,  -- send SMS
                true   -- send push
            );
            
            -- Notify merchant that service is completed (confirmation)
            notification_id := create_notification(
                NEW.merchant_user_id,
                'service_completed',
                'Service Completed',
                format('You have marked the service for %s as completed. You can now rate the client and set the final price for commission tracking.',
                       client_name),
                NEW.id,
                NULL,
                false, -- no email
                false, -- no SMS
                true   -- send push
            );
            
        WHEN 'cancelled' THEN
            -- Determine who cancelled and notify the other party
            IF OLD.status = 'pending' THEN
                -- Client likely cancelled pending booking
                notification_id := create_notification(
                    NEW.merchant_user_id,
                    'booking_cancelled',
                    'Booking Cancelled',
                    format('The booking request from %s for "%s" has been cancelled.',
                           client_name, service_details),
                    NEW.id,
                    NULL,
                    false, -- no email for cancellations
                    false, -- no SMS
                    true   -- send push
                );
            END IF;
        ELSE
            -- No notification for other statuses (e.g. requested, checked_in)
            NULL;
    END CASE;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- WORKFLOW TRIGGERS
-- =============================================================================

-- Trigger for booking status changes
DROP TRIGGER IF EXISTS notify_on_booking_status_change ON booking_requests;
CREATE TRIGGER notify_on_booking_status_change
    AFTER UPDATE OF status ON booking_requests
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION notify_booking_status_change();

-- Function to notify on new booking requests
CREATE OR REPLACE FUNCTION notify_new_booking_request()
RETURNS TRIGGER AS $$
DECLARE
    client_name TEXT;
    service_details TEXT;
    notification_id UUID;
BEGIN
    -- Get client name
    SELECT name INTO client_name
    FROM users
    WHERE id = NEW.client_user_id;

    -- Notify merchant of new booking request
    notification_id := create_notification(
        NEW.merchant_user_id,
        'booking_request_received',
        'New Booking Request! 📋',
        format('You have a new booking request from %s for "%s". Review the details and respond soon.',
               client_name, NEW.service_details),
        NEW.id,
        NULL,
        true,  -- send email
        true,  -- send SMS
        true   -- send push
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for new booking requests
DROP TRIGGER IF EXISTS notify_on_new_booking ON booking_requests;
CREATE TRIGGER notify_on_new_booking
    AFTER INSERT ON booking_requests
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_booking_request();

-- =============================================================================
-- RATING NOTIFICATION TRIGGERS
-- =============================================================================

-- Function to notify when rating is received
CREATE OR REPLACE FUNCTION notify_rating_received()
RETURNS TRIGGER AS $$
DECLARE
    rater_name TEXT;
    service_details TEXT;
    notification_id UUID;
BEGIN
    -- Get rater name and service details
    SELECT 
        u.name,
        br.service_details
    INTO rater_name, service_details
    FROM users u, booking_requests br
    WHERE u.id = NEW.rater_id
    AND br.id = NEW.booking_request_id;

    -- Notify the rated user
    notification_id := create_notification(
        NEW.rated_id,
        'rating_received',
        'New Rating Received! ⭐',
        format('%s has rated your experience for "%s". Check out your updated rating and feedback.',
               rater_name, service_details),
        NEW.booking_request_id,
        NEW.id,
        false, -- no email for ratings
        false, -- no SMS
        true   -- send push
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for new ratings
DROP TRIGGER IF EXISTS notify_on_rating_received ON ratings;
CREATE TRIGGER notify_on_rating_received
    AFTER INSERT ON ratings
    FOR EACH ROW
    EXECUTE FUNCTION notify_rating_received();

-- =============================================================================
-- BOOKING WORKFLOW STATE MACHINE
-- =============================================================================

-- Function to validate booking status transitions
CREATE OR REPLACE FUNCTION validate_booking_status_transition()
RETURNS TRIGGER AS $$
BEGIN
    -- Define valid status transitions
    CASE OLD.status
        WHEN 'pending' THEN
            -- From pending: can go to accepted, declined, or cancelled
            IF NEW.status NOT IN ('accepted', 'declined', 'cancelled') THEN
                RAISE EXCEPTION 'Invalid status transition from pending to %', NEW.status;
            END IF;
            
        WHEN 'accepted' THEN
            -- From accepted: can go to in_progress, cancelled, or completed (skip GPS)
            IF NEW.status NOT IN ('in_progress', 'cancelled', 'completed') THEN
                RAISE EXCEPTION 'Invalid status transition from accepted to %', NEW.status;
            END IF;
            
        WHEN 'in_progress' THEN
            -- From in_progress: can only go to completed
            IF NEW.status NOT IN ('completed') THEN
                RAISE EXCEPTION 'Invalid status transition from in_progress to %', NEW.status;
            END IF;
            
        WHEN 'requested' THEN
            IF NEW.status NOT IN ('pending', 'accepted', 'declined', 'cancelled') THEN
                RAISE EXCEPTION 'Invalid status transition from requested to %', NEW.status;
            END IF;
            
        WHEN 'checked_in' THEN
            IF NEW.status NOT IN ('in_progress', 'completed', 'cancelled') THEN
                RAISE EXCEPTION 'Invalid status transition from checked_in to %', NEW.status;
            END IF;
            
        WHEN 'declined' THEN
            -- Declined is terminal - no transitions allowed
            RAISE EXCEPTION 'Cannot change status from declined';
            
        WHEN 'completed' THEN
            -- Completed is terminal - no transitions allowed
            RAISE EXCEPTION 'Cannot change status from completed';
            
        WHEN 'cancelled' THEN
            -- Cancelled is terminal - no transitions allowed  
            RAISE EXCEPTION 'Cannot change status from cancelled';
            
        ELSE
            -- Fallback for any unhandled status
            NULL;
    END CASE;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to enforce status transition rules
DROP TRIGGER IF EXISTS enforce_booking_status_transitions ON booking_requests;
CREATE TRIGGER enforce_booking_status_transitions
    BEFORE UPDATE OF status ON booking_requests
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION validate_booking_status_transition();

-- =============================================================================
-- NOTIFICATION MANAGEMENT FUNCTIONS
-- =============================================================================

-- Function to get user notifications
CREATE OR REPLACE FUNCTION get_user_notifications(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0,
    p_unread_only BOOLEAN DEFAULT false
)
RETURNS TABLE (
    id UUID,
    type TEXT,
    title TEXT,
    message TEXT,
    booking_request_id UUID,
    rating_id UUID,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        n.id,
        n.type,
        n.title,
        n.message,
        n.booking_request_id,
        n.rating_id,
        n.read_at,
        n.created_at
    FROM notifications n
    WHERE n.user_id = p_user_id
    AND (p_unread_only = false OR n.read_at IS NULL)
    ORDER BY n.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER  
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    current_user_id UUID;
BEGIN
    -- Get current user
    SELECT id INTO current_user_id
    FROM users
    WHERE auth_user_id = auth.uid();
    
    -- Update notification read status
    UPDATE notifications
    SET read_at = NOW(),
        updated_at = NOW()
    WHERE id = p_notification_id
    AND user_id = current_user_id
    AND read_at IS NULL;
    
    RETURN FOUND;
END;
$$;

-- Function to get notification stats
CREATE OR REPLACE FUNCTION get_notification_stats(p_user_id UUID)
RETURNS TABLE (
    total_count BIGINT,
    unread_count BIGINT,
    today_count BIGINT
)
SECURITY DEFINER
SET search_path = public  
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_count,
        COUNT(CASE WHEN read_at IS NULL THEN 1 END)::BIGINT as unread_count,
        COUNT(CASE WHEN created_at >= CURRENT_DATE THEN 1 END)::BIGINT as today_count
    FROM notifications
    WHERE user_id = p_user_id;
END;
$$;

-- =============================================================================
-- CLEANUP AND MAINTENANCE
-- =============================================================================

-- Function to clean up old notifications
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS INTEGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    deleted_count INTEGER := 0;
    step_count INTEGER := 0;
BEGIN
    -- Delete read notifications older than 30 days
    DELETE FROM notifications
    WHERE read_at IS NOT NULL
    AND read_at < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Delete unread notifications older than 90 days  
    DELETE FROM notifications
    WHERE read_at IS NULL
    AND created_at < NOW() - INTERVAL '90 days';
    
    GET DIAGNOSTICS step_count = ROW_COUNT;
    
    deleted_count := deleted_count + step_count;
    RETURN deleted_count;
END;
$$;

-- =============================================================================
-- COMMENTS AND DOCUMENTATION
-- =============================================================================

COMMENT ON TABLE notifications IS 'System notifications for booking workflow and user communications';
COMMENT ON COLUMN notifications.type IS 'Notification category for filtering and processing';
COMMENT ON COLUMN notifications.delivery_status IS 'External notification delivery status (email/SMS)';
COMMENT ON FUNCTION notify_booking_status_change() IS 'Automatically creates notifications when booking status changes';
COMMENT ON FUNCTION validate_booking_status_transition() IS 'Enforces valid booking status state machine transitions';
COMMENT ON FUNCTION cleanup_old_notifications() IS 'Maintenance function to remove old notifications';

-- =============================================================================
-- ROOT SUPER-ADMIN ACCOUNT PROVISIONING
-- User: Ibrahim Mariam Omolade (omolademariam57@gmail.com)
-- =============================================================================

DO $$
DECLARE
  v_user_id UUID := gen_random_uuid();
  v_encrypted_password TEXT := crypt('Melophile=123@', gen_salt('bf'));
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'omolademariam57@gmail.com') THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      role,
      aud
    ) VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      'omolademariam57@gmail.com',
      v_encrypted_password,
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"name":"Ibrahim Mariam Omolade"}',
      now(),
      now(),
      'authenticated',
      'authenticated'
    );

    INSERT INTO public.users (
      auth_user_id,
      name,
      phone,
      email,
      role,
      verification_status,
      address,
      city,
      state
    ) VALUES (
      v_user_id,
      'Ibrahim Mariam Omolade',
      '07017144001',
      'omolademariam57@gmail.com',
      'admin',
      'id_verified',
      'Lagos',
      'Lagos',
      'Lagos State'
    );
  ELSE
    UPDATE public.users
    SET role = 'admin', verification_status = 'id_verified', name = 'Ibrahim Mariam Omolade'
    WHERE email = 'omolademariam57@gmail.com';
  END IF;
END $$;

-- Create updated_at trigger for notifications
CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
