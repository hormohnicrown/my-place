-- =============================================================================
-- MY PLACE - FRESH RESET & ROOT ADMIN PROVISIONING
-- Run this script in Supabase SQL Editor
-- =============================================================================

-- Step 1: Commit new enum value 'admin' FIRST (fixes Postgres 55P04 error)
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'admin';

-- Step 2: Wipe all existing users and associated operational data (Fresh Start)
TRUNCATE TABLE public.gps_checkins CASCADE;
TRUNCATE TABLE public.ratings CASCADE;
TRUNCATE TABLE public.notifications CASCADE;
TRUNCATE TABLE public.bookings CASCADE;
TRUNCATE TABLE public.merchant_listings CASCADE;
TRUNCATE TABLE public.merchant_profiles CASCADE;
DELETE FROM public.users;
DELETE FROM auth.users;

-- Step 3: Insert Ibrahim Mariam Omolade as the single Root Super-Admin
DO $$
DECLARE
  v_user_id UUID := gen_random_uuid();
  v_encrypted_password TEXT := crypt('Melophile=123@', gen_salt('bf'));
BEGIN
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
END $$;
