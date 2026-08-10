'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// Types
export type AuthResult = {
  success: boolean
  error?: string
  data?: any
}

// =============================================================================
// EMAIL + PASSWORD AUTH
// =============================================================================

/**
 * Sign up with email and password.
 */
export async function signUpWithEmail(email: string, password: string): Promise<AuthResult> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    // With email confirmation disabled in Supabase, signUp returns an active
    // session and the user goes straight to onboarding. With it enabled, session
    // is null and the user must confirm via email before signing in.
    return {
      success: true,
      data: {
        user: data.user,
        session: data.session,
      },
    }
  } catch (error) {
    return { success: false, error: 'Sign up failed. Please try again.' }
  }
}

/**
 * Sign in with email/password
 */
export async function signInWithEmail(email: string, password: string): Promise<AuthResult> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    // Check if user exists in our users table
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, role, verification_status')
      .eq('auth_user_id', data.user?.id)
      .single()

    return { 
      success: true, 
      data: { 
        user: data.user,
        existingUser,
        isNewUser: !existingUser
      } 
    }
  } catch (error) {
    return { success: false, error: 'Sign in failed. Please try again.' }
  }
}

// =============================================================================
// USER PROFILE CREATION (After auth)
// =============================================================================

export type CreateUserProfileData = {
  name: string
  phone: string
  email?: string
  role: 'client' | 'merchant'
  address: string
  city: string
  state: string
  lat?: number
  lng?: number
}

/**
 * Create user profile in our users table after Supabase Auth signup
 * This is called during onboarding after OTP verification
 */
export async function createUserProfile(data: CreateUserProfileData): Promise<AuthResult> {
  try {
    const supabase = await createClient()

    // Get current auth user
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) {
      return { success: false, error: 'Not authenticated' }
    }

    // Format geo coordinates if provided
    const geoCoordinates = data.lat && data.lng 
      ? `POINT(${data.lng} ${data.lat})` // PostGIS format: lng, lat
      : null

    // Insert into users table
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        auth_user_id: authUser.id,
        name: data.name,
        phone: data.phone,
        email: data.email || authUser.email,
        role: data.role,
        address: data.address,
        city: data.city,
        state: data.state,
        geo_coordinates: geoCoordinates,
        // Demo build: ID verification is disabled, so accounts are usable on
        // signup. Restore 'unverified' here when the verification flow is added.
        verification_status: 'id_verified',
      })
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    // If merchant, create merchant_profile
    if (data.role === 'merchant') {
      const { error: merchantError } = await supabase
        .from('merchant_profiles')
        .insert({
          user_id: newUser.id,
          category: 'tailoring', // Default, will be updated in profile setup
          description: '',
          service_area_radius_km: 5.0,
        })

      if (merchantError) {
        // Rollback user creation? Or handle gracefully?
        console.error('Failed to create merchant profile:', merchantError)
      }
    }

    revalidatePath('/', 'layout')
    return { success: true, data: { user: newUser } }
  } catch (error) {
    return { success: false, error: 'Failed to create profile. Please try again.' }
  }
}

// =============================================================================
// SIGN OUT
// =============================================================================

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}

// =============================================================================
// GET CURRENT USER (with our user data)
// =============================================================================

export async function getCurrentUser() {
  try {
    const supabase = await createClient()

    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) {
      return null
    }

    // Get user from our users table
    const { data: user, error } = await supabase
      .from('users')
      .select('*, merchant_profiles(*)')
      .eq('auth_user_id', authUser.id)
      .single()

    if (error) {
      return null
    }

    return user
  } catch (error) {
    return null
  }
}
