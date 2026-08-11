-- =============================================================================
-- MY PLACE - FRESH RESET & ROOT ADMIN PROVISIONING
-- Run this script in Supabase SQL Editor
-- =============================================================================

-- Step 1: Ensure 'admin' is in user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'admin';

-- Step 2: Clear all existing users & operational data (Fresh Start)
TRUNCATE TABLE public.gps_checkins CASCADE;
TRUNCATE TABLE public.ratings CASCADE;
TRUNCATE TABLE public.notifications CASCADE;
TRUNCATE TABLE public.bookings CASCADE;
TRUNCATE TABLE public.listings CASCADE;
TRUNCATE TABLE public.merchant_profiles CASCADE;
TRUNCATE TABLE public.verification_records CASCADE;
DELETE FROM public.users;
DELETE FROM auth.users;

-- Step 3: Insert Auth User (Plain SQL - No PL/pgSQL DO block)
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
  'a0000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'omolademariam57@gmail.com',
  crypt('Melophile=123@', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"name":"Ibrahim Mariam Omolade"}'::jsonb,
  now(),
  now(),
  'authenticated',
  'authenticated'
);

-- Step 4: Insert Public User Profile
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
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'Ibrahim Mariam Omolade',
  '07017144001',
  'omolademariam57@gmail.com',
  'admin'::user_role,
  'id_verified'::verification_status,
  'Lagos',
  'Lagos',
  'Lagos State'
);
