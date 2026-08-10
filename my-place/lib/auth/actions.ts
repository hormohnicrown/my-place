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
// PHONE OTP AUTH (Primary method per TRD)
// =============================================================================

/**
 * Send OTP to phone number
 * Used for both signup and login
 */
export async function sendPhoneOTP(phone: string): Promise<AuthResult> {
  try {
    const supabase = await createClient()

    // Format phone number (ensure it starts with +234 for Nigeria)
    const formattedPhone = phone.startsWith('+') ? phone : `+234${phone.replace(/^0/, '')}`

    const { error } = await supabase.auth.signInWithOtp({
      phone: formattedPhone,
      options: {
        channel: 'sms',
      },
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to send OTP. Please try again.' }
  }
}

/**
 * Verify OTP and complete phone auth
 */
export async function verifyPhoneOTP(phone: string, otp: string): Promise<AuthResult> {
  try {
    const supabase = await createClient()

    // Format phone number
    const formattedPhone = phone.startsWith('+') ? phone : `+234${phone.replace(/^0/, '')}`

    const { data, error } = await supabase.auth.verifyOtp({
      phone: formattedPhone,
      token: otp,
      type: 'sms',
    })

    if (error) {
      return { success: false, error: error.message }
    }

    // After successful OTP verification, check if user exists in our users table
    // If not, we need to create the user record (happens in onboarding)
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
    return { success: false, error: 'Invalid OTP. Please try again.' }
  }
}

// =============================================================================
// EMAIL AUTH (Fallback method)
// =============================================================================

/**
 * Sign up with email/password (fallback for users without reliable SMS)
 */
export async function signUpWithEmail(email: string, password: string): Promise<AuthResult> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { 
      success: true, 
      data: { 
        user: data.user,
        needsEmailConfirmation: true
      } 
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
        verification_status: 'unverified', // Hard gate: must verify ID
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
