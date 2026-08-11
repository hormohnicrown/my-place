-- =============================================================================
-- ROOT SUPER-ADMIN ACCOUNT PROVISIONING
-- Run this in Supabase SQL Editor to grant/create Ibrahim Mariam Omolade's Admin Account
-- =============================================================================

-- Step 1: Ensure 'admin' exists in user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'admin';

-- Step 2: Provision Auth and Public User Profile
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
