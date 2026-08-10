'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Types
export type Rating = {
  id: string
  booking_request_id: string
  rater_id: string
  rated_id: string
  score: number
  comment: string | null
  created_at: string
  rater_name?: string
  rated_name?: string
}

export type RatingSubmission = {
  booking_request_id: string
  rated_user_id: string
  score: number
  comment?: string
}

export type RatingValidation = {
  success: boolean
  can_rate?: boolean
  booking_status?: string
  error?: string
}

export type ActionResult = {
  success: boolean
  error?: string
  data?: any
}

// =============================================================================
// RATING SUBMISSION ACTIONS
// =============================================================================

/**
 * Submit a rating for a completed booking
 * Two-way system: both client and merchant can rate each other
 */
export async function submitRating(submission: RatingSubmission): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) {
      return { success: false, error: 'Not authenticated' }
    }

    const { data: currentUser } = await supabase
      .from('users')
      .select('id, name, role')
      .eq('auth_user_id', authUser.id)
      .single()

    if (!currentUser) {
      return { success: false, error: 'User not found' }
    }

    // Validate submission
    if (!submission.booking_request_id || !submission.rated_user_id) {
      return { success: false, error: 'Missing required fields' }
    }

    if (submission.score < 1 || submission.score > 5) {
      return { success: false, error: 'Rating score must be between 1 and 5' }
    }

    // Check if user can rate this booking
    const validation = await validateRatingAccess(
      submission.booking_request_id, 
      currentUser.id, 
      submission.rated_user_id
    )

    if (!validation.success) {
      return { success: false, error: validation.error }
    }

    // Submit the rating
    const { data: rating, error } = await supabase
      .from('ratings')
      .insert({
        booking_request_id: submission.booking_request_id,
        rater_id: currentUser.id,
        rated_id: submission.rated_user_id,
        score: submission.score,
        comment: submission.comment?.trim() || null
      })
      .select()
      .single()

    if (error) {
      console.error('Rating submission error:', error)
      return { 
        success: false, 
        error: error.message || 'Failed to submit rating' 
      }
    }

    // Revalidate paths to update UI
    revalidatePath('/merchant/bookings')
    revalidatePath('/client/bookings')
    revalidatePath('/merchant/dashboard')

    return {
      success: true,
      data: rating
    }

  } catch (err) {
    console.error('Rating submission error:', err)
    return { 
      success: false, 
      error: 'Failed to submit rating' 
    }
  }
}

/**
 * Validate if a user can rate a specific booking and user
 */
export async function validateRatingAccess(
  bookingId: string,
  raterUserId: string,
  ratedUserId: string
): Promise<RatingValidation> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .rpc('can_user_rate_booking', {
        p_booking_request_id: bookingId,
        p_rater_user_id: raterUserId,
        p_rated_user_id: ratedUserId
      })

    if (error) {
      console.error('Rating validation error:', error)
      return { 
        success: false, 
        error: error.message || 'Failed to validate rating access' 
      }
    }

    return {
      success: data.success,
      can_rate: data.can_rate,
      booking_status: data.booking_status,
      error: data.error
    }

  } catch (err) {
    console.error('Rating validation error:', err)
    return { 
      success: false, 
      error: 'Failed to validate rating access' 
    }
  }
}

// =============================================================================
// RATING RETRIEVAL ACTIONS
// =============================================================================

/**
 * Get all ratings for a specific booking
 * Shows both client→merchant and merchant→client ratings
 */
export async function getBookingRatings(bookingId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    const { data: ratings, error } = await supabase
      .rpc('get_booking_ratings', {
        p_booking_request_id: bookingId
      })

    if (error) {
      console.error('Get booking ratings error:', error)
      return { 
        success: false, 
        error: error.message || 'Failed to get booking ratings' 
      }
    }

    return {
      success: true,
      data: ratings || []
    }

  } catch (err) {
    console.error('Get booking ratings error:', err)
    return { 
      success: false, 
      error: 'Failed to get booking ratings' 
    }
  }
}

/**
 * Get ratings received by a specific user (for their profile)
 */
export async function getUserRatings(userId: string, limit = 10): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    const { data: ratings, error } = await supabase
      .from('ratings')
      .select(`
        id,
        score,
        comment,
        created_at,
        booking_request_id,
        rater:rater_id (
          name,
          role
        ),
        booking_request:booking_request_id (
          service_details
        )
      `)
      .eq('rated_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Get user ratings error:', error)
      return { 
        success: false, 
        error: error.message || 'Failed to get user ratings' 
      }
    }

    return {
      success: true,
      data: ratings || []
    }

  } catch (err) {
    console.error('Get user ratings error:', err)
    return { 
      success: false, 
      error: 'Failed to get user ratings' 
    }
  }
}

/**
 * Get ratings given by a specific user (for their own review history)
 */
export async function getRatingsGivenByUser(userId: string, limit = 10): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    const { data: ratings, error } = await supabase
      .from('ratings')
      .select(`
        id,
        score,
        comment,
        created_at,
        booking_request_id,
        rated:rated_id (
          name,
          role
        ),
        booking_request:booking_request_id (
          service_details
        )
      `)
      .eq('rater_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Get ratings given error:', error)
      return { 
        success: false, 
        error: error.message || 'Failed to get ratings given' 
      }
    }

    return {
      success: true,
      data: ratings || []
    }

  } catch (err) {
    console.error('Get ratings given error:', err)
    return { 
      success: false, 
      error: 'Failed to get ratings given' 
    }
  }
}

/**
 * Get rating summary stats for a user
 */
export async function getUserRatingStats(userId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    const { data: user, error } = await supabase
      .from('users')
      .select('rating_avg, rating_count')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Get rating stats error:', error)
      return { 
        success: false, 
        error: error.message || 'Failed to get rating stats' 
      }
    }

    // Get rating distribution
    const { data: distribution, error: distError } = await supabase
      .from('ratings')
      .select('score')
      .eq('rated_id', userId)

    if (distError) {
      console.error('Get rating distribution error:', distError)
    }

    const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    if (distribution) {
      distribution.forEach(rating => {
        ratingCounts[rating.score as keyof typeof ratingCounts]++
      })
    }

    return {
      success: true,
      data: {
        rating_avg: user?.rating_avg || 0,
        rating_count: user?.rating_count || 0,
        distribution: ratingCounts
      }
    }

  } catch (err) {
    console.error('Get rating stats error:', err)
    return { 
      success: false, 
      error: 'Failed to get rating stats' 
    }
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================
// Display/formatting helpers live in ./format.ts (this file is 'use server'
// and may only export async functions).

/**
 * Check if ratings are complete for a booking (both parties rated)
 */
export async function areRatingsComplete(bookingId: string): Promise<boolean> {
  try {
    const supabase = await createClient()

    // Get booking participants
    const { data: booking } = await supabase
      .from('booking_requests')
      .select('client_user_id, merchant_user_id')
      .eq('id', bookingId)
      .single()

    if (!booking) return false

    // Check if both ratings exist
    const { data: ratings } = await supabase
      .from('ratings')
      .select('rater_id, rated_id')
      .eq('booking_request_id', bookingId)

    if (!ratings || ratings.length < 2) return false

    // Check if we have rating in both directions
    const hasClientToMerchant = ratings.some(r => 
      r.rater_id === booking.client_user_id && r.rated_id === booking.merchant_user_id
    )
    const hasMerchantToClient = ratings.some(r => 
      r.rater_id === booking.merchant_user_id && r.rated_id === booking.client_user_id
    )

    return hasClientToMerchant && hasMerchantToClient

  } catch (err) {
    console.error('Check ratings complete error:', err)
    return false
  }
}