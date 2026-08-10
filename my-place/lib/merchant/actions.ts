'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Types
export type MerchantProfileUpdateData = {
  category: 'tailoring' | 'carpentry' | 'welding' | 'plumbing'
  description: string
  price_range_min?: number
  price_range_max?: number
  service_area_radius_km: number
}

export type ActionResult = {
  success: boolean
  error?: string
  data?: any
}

// =============================================================================
// MERCHANT PROFILE ACTIONS
// =============================================================================

/**
 * Update merchant profile
 * RLS: User must be merchant and own the profile
 */
export async function updateMerchantProfile(
  data: MerchantProfileUpdateData
): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get user's ID from users table
    const { data: user } = await supabase
      .from('users')
      .select('id, role')
      .eq('auth_user_id', authUser.id)
      .single()

    if (!user || user.role !== 'merchant') {
      return { success: false, error: 'Unauthorized - merchant access only' }
    }

    // Validation
    if (data.price_range_min && data.price_range_max && data.price_range_min > data.price_range_max) {
      return { success: false, error: 'Minimum price cannot exceed maximum price' }
    }

    if (data.service_area_radius_km <= 0 || data.service_area_radius_km > 100) {
      return { success: false, error: 'Service area must be between 0 and 100 km' }
    }

    if (!data.description || data.description.trim().length < 10) {
      return { success: false, error: 'Description must be at least 10 characters' }
    }

    // Update profile (RLS enforces ownership)
    const { data: updatedProfile, error } = await supabase
      .from('merchant_profiles')
      .update({
        category: data.category,
        description: data.description.trim(),
        price_range_min: data.price_range_min || null,
        price_range_max: data.price_range_max || null,
        service_area_radius_km: data.service_area_radius_km,
      })
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Merchant profile update error:', error)
      return { success: false, error: 'Failed to update profile. Please try again.' }
    }

    revalidatePath('/merchant')
    return { success: true, data: updatedProfile }
  } catch (error) {
    console.error('Unexpected error updating merchant profile:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get merchant profile with user data
 */
export async function getMerchantProfile(): Promise<ActionResult> {
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

    if (!user || user.role !== 'merchant') {
      return { success: false, error: 'Unauthorized - merchant access only' }
    }

    // Get merchant profile (RLS enforces access)
    const { data: profile, error } = await supabase
      .from('merchant_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error) {
      console.error('Error fetching merchant profile:', error)
      return { success: false, error: 'Failed to load profile' }
    }

    return { success: true, data: profile }
  } catch (error) {
    console.error('Unexpected error fetching merchant profile:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Add off-platform testimonial to merchant profile
 */
export type OffPlatformTestimonial = {
  text: string
  author: string
  platform: 'whatsapp' | 'instagram' | 'facebook' | 'other'
  source: 'off_platform' // Always set to off_platform for visual distinction
  date_added: string // ISO date string
}

export async function addOffPlatformTestimonial(
  testimonial: Omit<OffPlatformTestimonial, 'source' | 'date_added'>
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

    if (!user || user.role !== 'merchant') {
      return { success: false, error: 'Unauthorized - merchant access only' }
    }

    // Validation
    if (!testimonial.text || testimonial.text.trim().length < 10) {
      return { success: false, error: 'Testimonial must be at least 10 characters' }
    }

    if (!testimonial.author || testimonial.author.trim().length < 2) {
      return { success: false, error: 'Author name is required' }
    }

    // Get current testimonials
    const { data: profile } = await supabase
      .from('merchant_profiles')
      .select('imported_testimonials')
      .eq('user_id', user.id)
      .single()

    const currentTestimonials = profile?.imported_testimonials || []

    // Add new testimonial with required source flag
    const newTestimonial: OffPlatformTestimonial = {
      ...testimonial,
      text: testimonial.text.trim(),
      author: testimonial.author.trim(),
      source: 'off_platform', // Non-negotiable: always mark as off-platform
      date_added: new Date().toISOString(),
    }

    const updatedTestimonials = [...currentTestimonials, newTestimonial]

    // Update profile
    const { error } = await supabase
      .from('merchant_profiles')
      .update({ imported_testimonials: updatedTestimonials })
      .eq('user_id', user.id)

    if (error) {
      console.error('Error adding testimonial:', error)
      return { success: false, error: 'Failed to add testimonial' }
    }

    revalidatePath('/merchant')
    return { success: true, data: newTestimonial }
  } catch (error) {
    console.error('Unexpected error adding testimonial:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Upload profile photo to Supabase Storage
 * Returns the public URL
 */
export async function uploadProfilePhoto(file: File): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) {
      return { success: false, error: 'Not authenticated' }
    }

    // Validation
    const maxSize = 2 * 1024 * 1024 // 2MB
    if (file.size > maxSize) {
      return { success: false, error: 'File size must be less than 2MB' }
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return { success: false, error: 'Only JPG, PNG, and WebP images are allowed' }
    }

    // File path: {auth_user_id}/avatar.{ext}
    const fileExt = file.name.split('.').pop()
    const filePath = `${authUser.id}/avatar.${fileExt}`

    // Delete old photo if exists
    await supabase.storage
      .from('profile-photos')
      .remove([filePath])

    // Upload new photo (RLS enforces user can only upload to their own folder)
    const { error: uploadError } = await supabase.storage
      .from('profile-photos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return { success: false, error: 'Failed to upload photo' }
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('profile-photos')
      .getPublicUrl(filePath)

    // Update users table with photo URL
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', authUser.id)
      .single()

    if (user) {
      await supabase
        .from('users')
        .update({ profile_photo_url: publicUrl })
        .eq('id', user.id)
    }

    revalidatePath('/merchant')
    return { success: true, data: { url: publicUrl } }
  } catch (error) {
    console.error('Unexpected error uploading photo:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

// =============================================================================
// LISTING ACTIONS
// =============================================================================

export type CreateListingData = {
  title: string
  description: string
  category: 'tailoring' | 'carpentry' | 'welding' | 'plumbing'
  price: number
}

export type UpdateListingData = CreateListingData & {
  active?: boolean
}

/**
 * Create a new listing
 * RLS: User must be verified merchant
 */
export async function createListing(data: CreateListingData): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) {
      return { success: false, error: 'Not authenticated' }
    }

    const { data: user } = await supabase
      .from('users')
      .select('id, role, verification_status')
      .eq('auth_user_id', authUser.id)
      .single()

    if (!user || user.role !== 'merchant') {
      return { success: false, error: 'Unauthorized - merchant access only' }
    }

    if (user.verification_status !== 'id_verified') {
      return { success: false, error: 'You must complete ID verification before creating listings' }
    }

    // Get merchant profile ID
    const { data: merchantProfile } = await supabase
      .from('merchant_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!merchantProfile) {
      return { success: false, error: 'Merchant profile not found' }
    }

    // Validation
    if (!data.title || data.title.trim().length < 5) {
      return { success: false, error: 'Title must be at least 5 characters' }
    }

    if (!data.description || data.description.trim().length < 20) {
      return { success: false, error: 'Description must be at least 20 characters' }
    }

    if (data.price <= 0) {
      return { success: false, error: 'Price must be greater than 0' }
    }

    // Create listing (RLS enforces merchant ownership)
    const { data: listing, error } = await supabase
      .from('listings')
      .insert({
        merchant_id: merchantProfile.id,
        title: data.title.trim(),
        description: data.description.trim(),
        category: data.category,
        price: data.price,
        active: true,
      })
      .select()
      .single()

    if (error) {
      console.error('Listing creation error:', error)
      return { success: false, error: 'Failed to create listing' }
    }

    revalidatePath('/merchant')
    revalidatePath('/merchant/listings')
    return { success: true, data: listing }
  } catch (error) {
    console.error('Unexpected error creating listing:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get all listings for current merchant
 */
export async function getMerchantListings(): Promise<ActionResult> {
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

    if (!user || user.role !== 'merchant') {
      return { success: false, error: 'Unauthorized - merchant access only' }
    }

    const { data: merchantProfile } = await supabase
      .from('merchant_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!merchantProfile) {
      return { success: false, error: 'Merchant profile not found' }
    }

    // Get listings (RLS allows merchant to see all their listings, active + inactive)
    const { data: listings, error } = await supabase
      .from('listings')
      .select('*')
      .eq('merchant_id', merchantProfile.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching listings:', error)
      return { success: false, error: 'Failed to load listings' }
    }

    return { success: true, data: listings || [] }
  } catch (error) {
    console.error('Unexpected error fetching listings:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Update a listing
 * RLS: User must own the listing
 */
export async function updateListing(
  listingId: string,
  data: UpdateListingData
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

    if (!user || user.role !== 'merchant') {
      return { success: false, error: 'Unauthorized - merchant access only' }
    }

    // Validation
    if (data.title && data.title.trim().length < 5) {
      return { success: false, error: 'Title must be at least 5 characters' }
    }

    if (data.description && data.description.trim().length < 20) {
      return { success: false, error: 'Description must be at least 20 characters' }
    }

    if (data.price && data.price <= 0) {
      return { success: false, error: 'Price must be greater than 0' }
    }

    // Update listing (RLS enforces ownership)
    const { data: listing, error } = await supabase
      .from('listings')
      .update({
        title: data.title?.trim(),
        description: data.description?.trim(),
        category: data.category,
        price: data.price,
        active: data.active,
      })
      .eq('id', listingId)
      .select()
      .single()

    if (error) {
      console.error('Listing update error:', error)
      return { success: false, error: 'Failed to update listing' }
    }

    revalidatePath('/merchant')
    revalidatePath('/merchant/listings')
    return { success: true, data: listing }
  } catch (error) {
    console.error('Unexpected error updating listing:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Toggle listing active status
 */
export async function toggleListingActive(
  listingId: string,
  active: boolean
): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) {
      return { success: false, error: 'Not authenticated' }
    }

    // Update active status (RLS enforces ownership)
    const { error } = await supabase
      .from('listings')
      .update({ active })
      .eq('id', listingId)

    if (error) {
      console.error('Listing toggle error:', error)
      return { success: false, error: 'Failed to update listing status' }
    }

    revalidatePath('/merchant')
    revalidatePath('/merchant/listings')
    return { success: true }
  } catch (error) {
    console.error('Unexpected error toggling listing:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Delete a listing
 * RLS: User must own the listing
 */
export async function deleteListing(listingId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) {
      return { success: false, error: 'Not authenticated' }
    }

    // Delete listing (RLS enforces ownership)
    const { error } = await supabase
      .from('listings')
      .delete()
      .eq('id', listingId)

    if (error) {
      console.error('Listing deletion error:', error)
      return { success: false, error: 'Failed to delete listing' }
    }

    revalidatePath('/merchant')
    revalidatePath('/merchant/listings')
    return { success: true }
  } catch (error) {
    console.error('Unexpected error deleting listing:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Remove off-platform testimonial by index
 */
export async function removeOffPlatformTestimonial(index: number): Promise<ActionResult> {
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

    if (!user || user.role !== 'merchant') {
      return { success: false, error: 'Unauthorized - merchant access only' }
    }

    // Get current testimonials
    const { data: profile } = await supabase
      .from('merchant_profiles')
      .select('imported_testimonials')
      .eq('user_id', user.id)
      .single()

    const currentTestimonials = profile?.imported_testimonials || []

    if (index < 0 || index >= currentTestimonials.length) {
      return { success: false, error: 'Invalid testimonial index' }
    }

    // Remove testimonial
    const updatedTestimonials = currentTestimonials.filter((_: any, i: number) => i !== index)

    // Update profile
    const { error } = await supabase
      .from('merchant_profiles')
      .update({ imported_testimonials: updatedTestimonials })
      .eq('user_id', user.id)

    if (error) {
      console.error('Error removing testimonial:', error)
      return { success: false, error: 'Failed to remove testimonial' }
    }

    revalidatePath('/merchant')
    return { success: true }
  } catch (error) {
    console.error('Unexpected error removing testimonial:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

// =============================================================================
// BOOKING REQUEST MANAGEMENT (with Address Privacy - TRD §4)
// =============================================================================

export type MerchantBookingRequest = {
  id: string
  client_user_id: string
  merchant_user_id: string
  merchant_profile_id: string
  listing_id: string | null
  service_details: string
  preferred_date: string
  preferred_time_start: string
  preferred_time_end: string
  special_requirements: string | null
  status: 'pending' | 'accepted' | 'declined' | 'cancelled' | 'in_progress' | 'completed'
  created_at: string
  client_address?: string // Only present for accepted/active bookings
  // Commission fields
  price_agreed?: number
  commission_rate_applied?: number
  commission_amount?: number
  payment_status?: 'pending' | 'paid' | 'disputed'
  payment_notes?: string
  client: {
    name: string
    city: string // ADDRESS PRIVACY: Only city shown, never full address for pending
    profile_photo_url: string | null
    rating_avg: number
    rating_count: number
  }
  listing?: {
    title: string
    price: number
  }
}

/**
 * Get incoming booking requests for merchant
 * 
 * ADDRESS PRIVACY (TRD §4): 
 * - Returns client.city only for pending requests (NEVER client.address)
 * - Returns full client_address for accepted/checked_in/completed requests
 * - Address revelation only happens after booking acceptance
 */
export async function getMerchantBookingRequests(): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) {
      return { success: false, error: 'Not authenticated' }
    }

    const { data: merchantUser } = await supabase
      .from('users')
      .select('id, role')
      .eq('auth_user_id', authUser.id)
      .single()

    if (!merchantUser || merchantUser.role !== 'merchant') {
      return { success: false, error: 'Access denied' }
    }

    // Get merchant's incoming booking requests with client info
    // NOTE: Now includes client_address for accepted bookings
    const { data: requests, error } = await supabase
      .from('booking_requests')
      .select(`
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
        client_address,
        status,
        created_at,
        price_agreed,
        commission_rate_applied,
        commission_amount,
        payment_status,
        payment_notes,
        clients:client_user_id (
          name,
          city,
          profile_photo_url
        ),
        listings (
          title,
          price
        )
      `)
      .eq('merchant_user_id', merchantUser.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Merchant booking requests fetch error:', error)
      return { success: false, error: 'Failed to fetch booking requests' }
    }

    // Get client ratings (this is a separate query due to RLS complexity)
    const clientIds = (requests || []).map(req => req.client_user_id)
    const { data: clientRatings } = await supabase
      .from('users')
      .select('id, rating_avg, rating_count')
      .in('id', clientIds)

    const clientRatingMap = (clientRatings || []).reduce((acc, rating) => {
      acc[rating.id] = { rating_avg: rating.rating_avg, rating_count: rating.rating_count }
      return acc
    }, {} as Record<string, { rating_avg: number, rating_count: number }>)

    // Format results with conditional address privacy enforcement
    const formattedRequests: (MerchantBookingRequest & { client_address?: string })[] = (requests || []).map(req => {
      const baseRequest = {
        id: req.id,
        client_user_id: req.client_user_id,
        merchant_user_id: req.merchant_user_id,
        merchant_profile_id: req.merchant_profile_id,
        listing_id: req.listing_id,
        service_details: req.service_details,
        preferred_date: req.preferred_date,
        preferred_time_start: req.preferred_time_start,
        preferred_time_end: req.preferred_time_end,
        special_requirements: req.special_requirements,
        status: req.status,
        created_at: req.created_at,
        // Commission fields
        price_agreed: req.price_agreed,
        commission_rate_applied: req.commission_rate_applied,
        commission_amount: req.commission_amount,
        payment_status: req.payment_status,
        payment_notes: req.payment_notes,
        client: {
          name: req.clients.name,
          // ADDRESS PRIVACY: Only city shown for pending requests
          city: req.clients.city,
          profile_photo_url: req.clients.profile_photo_url,
          rating_avg: clientRatingMap[req.client_user_id]?.rating_avg || 0,
          rating_count: clientRatingMap[req.client_user_id]?.rating_count || 0,
        },
        listing: req.listings ? {
          title: req.listings.title,
          price: req.listings.price
        } : undefined
      }

      // CRITICAL: Address revelation only for accepted/active bookings
      if (['accepted', 'checked_in', 'completed'].includes(req.status)) {
        return {
          ...baseRequest,
          client_address: req.client_address // Full address revealed post-acceptance
        }
      }

      // For pending/declined requests: no address exposure
      return baseRequest
    })

    return { success: true, data: formattedRequests }
  } catch (error) {
    console.error('Unexpected error fetching merchant booking requests:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Update booking request status (merchant action)
 * Phase 4: Enable accept/decline functionality
 */
export async function updateBookingRequestStatus(
  requestId: string,
  status: 'accepted' | 'declined'
): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) {
      return { success: false, error: 'Not authenticated' }
    }

    const { data: merchantUser } = await supabase
      .from('users')
      .select('id, role')
      .eq('auth_user_id', authUser.id)
      .single()

    if (!merchantUser || merchantUser.role !== 'merchant') {
      return { success: false, error: 'Access denied' }
    }

    // Update booking request status
    const { data: request, error } = await supabase
      .from('booking_requests')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId)
      .eq('merchant_user_id', merchantUser.id)
      .eq('status', 'pending') // Only allow status change from pending
      .select(`
        *,
        clients:client_user_id (name, email),
        listings (title, price)
      `)
      .single()

    if (error) {
      console.error('Booking request update error:', error)
      if (error.code === 'PGRST116') {
        return { success: false, error: 'Booking request not found or already processed' }
      }
      return { success: false, error: 'Failed to update booking request' }
    }

    if (!request) {
      return { success: false, error: 'Booking request not found or already processed' }
    }

    // TODO: Send notification to client about status change
    // This would integrate with email/SMS service in production

    revalidatePath('/merchant/bookings')
    
    return { 
      success: true, 
      data: { 
        id: request.id,
        status: request.status,
        message: `Booking request ${status} successfully`
      }
    }
  } catch (error) {
    console.error('Unexpected error updating booking request:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
