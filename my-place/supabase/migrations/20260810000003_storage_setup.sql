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
