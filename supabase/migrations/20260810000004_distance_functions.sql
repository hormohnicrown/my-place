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