'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Types
export type ActionResult = {
  success: boolean
  error?: string
  data?: any
}

export type GPSCheckInData = {
  booking_request_id: string
  checkin_type: 'service_start' | 'service_complete' | 'client_confirm'
  gps_latitude: number
  gps_longitude: number
  gps_accuracy?: number
  captured_address?: string
}

export type GPSCheckInRecord = {
  id: string
  user_name: string
  user_role: 'client' | 'merchant'
  checkin_type: 'service_start' | 'service_complete' | 'client_confirm'
  checkin_timestamp: string
  gps_latitude: number
  gps_longitude: number
  gps_accuracy?: number
  captured_address?: string
}

// =============================================================================
// GPS CHECK-IN/OUT ACTIONS
// =============================================================================

/**
 * Record GPS check-in for service delivery
 * Captures location at service start, completion, or client confirmation
 */
export async function recordGPSCheckIn(data: GPSCheckInData): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) {
      return { success: false, error: 'Not authenticated' }
    }

    const { data: user } = await supabase
      .from('users')
      .select('id, role, verification_status')
      .eq('auth_user_id', authUser.id)
      .single()

    if (!user) {
      return { success: false, error: 'User profile not found' }
    }

    if (user.verification_status !== 'id_verified') {
      return { success: false, error: 'You must be ID verified to perform GPS check-in' }
    }

    // Validate GPS coordinates
    if (!data.gps_latitude || !data.gps_longitude) {
      return { success: false, error: 'GPS coordinates are required' }
    }

    if (Math.abs(data.gps_latitude) > 90 || Math.abs(data.gps_longitude) > 180) {
      return { success: false, error: 'Invalid GPS coordinates' }
    }

    // Collect device information for forensics
    const deviceInfo = {
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server-side',
      platform: typeof navigator !== 'undefined' ? navigator.platform : 'unknown',
      language: typeof navigator !== 'undefined' ? navigator.language : 'unknown'
    }

    // Call database function to record GPS check-in
    const { data: result, error } = await supabase.rpc('record_gps_checkin', {
      p_booking_request_id: data.booking_request_id,
      p_user_id: user.id,
      p_checkin_type: data.checkin_type,
      p_gps_latitude: data.gps_latitude,
      p_gps_longitude: data.gps_longitude,
      p_gps_accuracy: data.gps_accuracy || null,
      p_captured_address: data.captured_address || null,
      p_device_info: deviceInfo,
      p_ip_address: null // Would be populated by edge function in production
    }).single()

    if (error) {
      console.error('GPS check-in error:', error)
      return { success: false, error: 'Failed to record GPS check-in' }
    }

    if (!result?.success) {
      return { success: false, error: result?.message || 'GPS check-in failed' }
    }

    // Revalidate relevant pages
    revalidatePath('/merchant/bookings')
    revalidatePath('/client/bookings')

    return { 
      success: true, 
      data: { 
        checkin_id: result.checkin_id,
        message: result.message,
        checkin_type: data.checkin_type
      }
    }
  } catch (error) {
    console.error('Unexpected GPS check-in error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get GPS history for a booking (for both client and merchant)
 */
export async function getBookingGPSHistory(bookingId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) {
      return { success: false, error: 'Not authenticated' }
    }

    const { data: user } = await supabase
      .from('users')
      .select('id, role')
      .eq('auth_user_id', authUser.id)
      .single()

    if (!user) {
      return { success: false, error: 'User profile not found' }
    }

    // Verify user is part of this booking
    const { data: booking } = await supabase
      .from('booking_requests')
      .select('id, client_user_id, merchant_user_id')
      .eq('id', bookingId)
      .single()

    if (!booking) {
      return { success: false, error: 'Booking not found' }
    }

    if (booking.client_user_id !== user.id && booking.merchant_user_id !== user.id) {
      return { success: false, error: 'Access denied - not your booking' }
    }

    // Get GPS history using database function
    const { data: gpsHistory, error } = await supabase.rpc('get_booking_gps_history', {
      p_booking_request_id: bookingId
    })

    if (error) {
      console.error('GPS history error:', error)
      return { success: false, error: 'Failed to load GPS history' }
    }

    const formattedHistory: GPSCheckInRecord[] = (gpsHistory || []).map(record => ({
      id: record.id,
      user_name: record.user_name,
      user_role: record.user_role,
      checkin_type: record.checkin_type,
      checkin_timestamp: record.checkin_timestamp,
      gps_latitude: record.gps_latitude,
      gps_longitude: record.gps_longitude,
      gps_accuracy: record.gps_accuracy,
      captured_address: record.captured_address,
    }))

    return { success: true, data: formattedHistory }
  } catch (error) {
    console.error('Unexpected GPS history error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get current device location using browser geolocation API
 * This runs client-side and returns coordinates for server-side GPS recording
 */
export async function getCurrentLocation(): Promise<{
  latitude: number
  longitude: number
  accuracy?: number
  address?: string
} | null> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        })
      },
      (error) => {
        let errorMessage = 'Location access denied'
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable'
            break
          case error.TIMEOUT:
            errorMessage = 'Location request timed out'
            break
        }
        reject(new Error(errorMessage))
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000
      }
    )
  })
}

/**
 * Validate if user can perform GPS check-in for a booking
 */
export async function validateGPSCheckInAccess(
  bookingId: string, 
  checkinType: 'service_start' | 'service_complete' | 'client_confirm'
): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) {
      return { success: false, error: 'Not authenticated' }
    }

    const { data: user } = await supabase
      .from('users')
      .select('id, role')
      .eq('auth_user_id', authUser.id)
      .single()

    if (!user) {
      return { success: false, error: 'User profile not found' }
    }

    // Get booking with GPS history
    const { data: booking } = await supabase
      .from('booking_requests')
      .select(`
        id,
        client_user_id,
        merchant_user_id,
        status,
        service_started_at,
        service_completed_at
      `)
      .eq('id', bookingId)
      .single()

    if (!booking) {
      return { success: false, error: 'Booking not found' }
    }

    // Check user access
    if (booking.client_user_id !== user.id && booking.merchant_user_id !== user.id) {
      return { success: false, error: 'Access denied' }
    }

    // Validate booking status
    if (!['accepted', 'checked_in', 'in_progress'].includes(booking.status)) {
      return { success: false, error: 'Booking must be accepted before GPS check-in' }
    }

    // Validate check-in type permissions
    if (checkinType === 'service_start' || checkinType === 'service_complete') {
      if (user.role !== 'merchant' || booking.merchant_user_id !== user.id) {
        return { success: false, error: 'Only the assigned merchant can perform service check-in/out' }
      }
    }

    if (checkinType === 'client_confirm') {
      if (user.role !== 'client' || booking.client_user_id !== user.id) {
        return { success: false, error: 'Only the client can confirm service completion' }
      }
    }

    // Check if already performed
    if (checkinType === 'service_start' && booking.service_started_at) {
      return { success: false, error: 'Service already started' }
    }

    if (checkinType === 'service_complete' && booking.service_completed_at) {
      return { success: false, error: 'Service already completed' }
    }

    if (checkinType === 'service_complete' && !booking.service_started_at) {
      return { success: false, error: 'Must check in at service start before completing' }
    }

    return { success: true, data: { canCheckIn: true } }
  } catch (error) {
    console.error('GPS validation error:', error)
    return { success: false, error: 'Validation failed' }
  }
}