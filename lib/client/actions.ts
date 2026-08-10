'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Types
export type ActionResult = {
  success: boolean
  error?: string
  data?: any
}

export type MerchantSearchFilters = {
  category?: 'tailoring' | 'carpentry' | 'welding' | 'plumbing' | 'all'
  maxDistance?: number // km
  minPrice?: number
  maxPrice?: number
  userLat?: number
  userLng?: number
}

export type MerchantSearchResult = {
  id: string
  user_id: string
  name: string
  category: string
  description: string
  price_range_min: number | null
  price_range_max: number | null
  rating_avg: number
  rating_count: number
  profile_photo_url: string | null
  city: string
  service_area_radius_km: number
  distance_km?: number // Calculated from user location
}

export type ListingSearchFilters = {
  category?: 'tailoring' | 'carpentry' | 'welding' | 'plumbing' | 'all'
  minPrice?: number
  maxPrice?: number
  sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'rating'
  userLat?: number
  userLng?: number
  maxDistance?: number // km
}

export type ListingSearchResult = {
  id: string
  merchant_profile_id: string
  title: string
  description: string
  price: number
  category: string
  created_at: string
  merchant: {
    id: string
    user_id: string
    name: string
    rating_avg: number
    rating_count: number
    profile_photo_url: string | null
    city: string
    service_area_radius_km: number
    distance_km?: number
  }
}

// =============================================================================
// MERCHANT DISCOVERY & SEARCH (with Address Privacy - TRD §4)
// =============================================================================

/**
 * Search merchants with distance-based filtering
 * 
 * ADDRESS PRIVACY (TRD §4): 
 * - Returns merchant.city and calculated distance_km
 * - NEVER returns merchant.address (full street address)
 * - Uses geo_coordinates for distance calculation only
 */
export async function searchMerchants(
  filters: MerchantSearchFilters = {}
): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    // Get current user (must be verified to search)
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
      return { success: false, error: 'You must complete ID verification to search for merchants' }
    }

    // Use PostGIS function for distance-based search if location provided
    if (filters.userLat && filters.userLng) {
      // Use PostGIS function with all filters
      const { data: merchants, error } = await supabase.rpc(
        'search_merchants_by_location',
        {
          user_lat: filters.userLat,
          user_lng: filters.userLng,
          max_distance_km: filters.maxDistance || 50.0,
          category_filter: filters.category && filters.category !== 'all' ? filters.category : null
        }
      )

      if (error) {
        console.error('PostGIS search error:', error)
        return { success: false, error: 'Failed to search merchants' }
      }

      // Filter by price range (PostGIS function doesn't handle this)
      const results: MerchantSearchResult[] = (merchants || [])
        .filter(merchant => {
          if (filters.minPrice !== undefined && merchant.price_range_min !== null) {
            if (merchant.price_range_min < filters.minPrice) return false
          }
          if (filters.maxPrice !== undefined && merchant.price_range_max !== null) {
            if (merchant.price_range_max > filters.maxPrice) return false
          }
          return true
        })
        .map(merchant => ({
          id: merchant.merchant_profile_id,
          user_id: merchant.user_id,
          name: merchant.name,
          category: merchant.category,
          description: merchant.description,
          price_range_min: merchant.price_range_min,
          price_range_max: merchant.price_range_max,
          rating_avg: merchant.rating_avg,
          rating_count: merchant.rating_count,
          profile_photo_url: merchant.profile_photo_url,
          // ADDRESS PRIVACY: Only city, never full address
          city: merchant.city,
          service_area_radius_km: merchant.service_area_radius_km,
          distance_km: merchant.distance_km,
        }))

      return { success: true, data: results }
    }

    // Fallback: search without location (no distance calculations)
    let query = supabase
      .from('merchant_profiles')
      .select(`
        id,
        user_id,
        category,
        description,
        price_range_min,
        price_range_max,
        service_area_radius_km,
        rating_avg,
        rating_count,
        users!inner (
          name,
          city,
          state,
          profile_photo_url,
          verification_status
        )
      `)
      .eq('status', 'active')
      .eq('users.verification_status', 'id_verified')
      .eq('users.role', 'merchant')

    // Category filter
    if (filters.category && filters.category !== 'all') {
      query = query.eq('category', filters.category)
    }

    // Price range filter
    if (filters.minPrice !== undefined) {
      query = query.gte('price_range_min', filters.minPrice)
    }
    if (filters.maxPrice !== undefined) {
      query = query.lte('price_range_max', filters.maxPrice)
    }

    const { data: merchants, error } = await query.order('rating_avg', { ascending: false })

    if (error) {
      console.error('Merchant search error:', error)
      return { success: false, error: 'Failed to search merchants' }
    }

    // Build results without distance calculation
    const results: MerchantSearchResult[] = (merchants || []).map(merchant => ({
      id: merchant.id,
      user_id: merchant.user_id,
      name: merchant.users.name,
      category: merchant.category,
      description: merchant.description,
      price_range_min: merchant.price_range_min,
      price_range_max: merchant.price_range_max,
      rating_avg: merchant.rating_avg,
      rating_count: merchant.rating_count,
      profile_photo_url: merchant.users.profile_photo_url,
      // ADDRESS PRIVACY: Only city, never full address
      city: merchant.users.city,
      service_area_radius_km: merchant.service_area_radius_km,
      // No distance when no user location provided
      distance_km: undefined,
    }))

    return { success: true, data: results }
  } catch (error) {
    console.error('Unexpected error searching merchants:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get public merchant profile (for profile view page)
 * 
 * ADDRESS PRIVACY (TRD §4):
 * - Returns merchant.city and service_area_radius_km
 * - NEVER returns merchant.address
 * - Safe for client viewing
 */
export async function getMerchantPublicProfile(merchantId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get merchant profile with user data (RLS allows public read)
    const { data: merchant, error } = await supabase
      .from('merchant_profiles')
      .select(`
        *,
        users!inner (
          name,
          city,
          state,
          profile_photo_url,
          verification_status
        )
      `)
      .eq('id', merchantId)
      .eq('users.verification_status', 'id_verified')
      .eq('users.role', 'merchant')
      .single()

    if (error || !merchant) {
      console.error('Merchant profile fetch error:', error)
      return { success: false, error: 'Merchant not found' }
    }

    // Build safe public profile (ADDRESS PRIVACY enforced)
    const publicProfile = {
      id: merchant.id,
      user_id: merchant.user_id,
      name: merchant.users.name,
      category: merchant.category,
      description: merchant.description,
      price_range_min: merchant.price_range_min,
      price_range_max: merchant.price_range_max,
      service_area_radius_km: merchant.service_area_radius_km,
      rating_avg: merchant.rating_avg,
      rating_count: merchant.rating_count,
      profile_photo_url: merchant.users.profile_photo_url,
      imported_testimonials: merchant.imported_testimonials,
      // ADDRESS PRIVACY: Only city + state, never full address
      city: merchant.users.city,
      state: merchant.users.state,
      verification_status: merchant.users.verification_status,
      created_at: merchant.created_at,
    }

    return { success: true, data: publicProfile }
  } catch (error) {
    console.error('Unexpected error fetching merchant profile:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

// =============================================================================
// LISTING BROWSE & SEARCH (with Address Privacy - TRD §4)
// =============================================================================

/**
 * Search active listings with category and price filters
 * 
 * ADDRESS PRIVACY (TRD §4): 
 * - Returns merchant.city and calculated distance_km
 * - NEVER returns merchant.address (full street address)
 * - Uses geo_coordinates for distance calculation only
 */
export async function searchListings(
  filters: ListingSearchFilters = {}
): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    // Get current user (must be verified to browse listings)
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
      return { success: false, error: 'You must complete ID verification to browse listings' }
    }

    // Build query for active listings with merchant data
    let query = supabase
      .from('listings')
      .select(`
        id,
        merchant_profile_id,
        title,
        description,
        price,
        category,
        created_at,
        merchant_profiles!inner (
          id,
          user_id,
          rating_avg,
          rating_count,
          service_area_radius_km,
          users!inner (
            name,
            city,
            state,
            geo_coordinates,
            profile_photo_url,
            verification_status,
            role
          )
        )
      `)
      .eq('status', 'active')
      .eq('merchant_profiles.status', 'active')
      .eq('merchant_profiles.users.verification_status', 'id_verified')
      .eq('merchant_profiles.users.role', 'merchant')

    // Category filter
    if (filters.category && filters.category !== 'all') {
      query = query.eq('category', filters.category)
    }

    // Price range filter
    if (filters.minPrice !== undefined) {
      query = query.gte('price', filters.minPrice)
    }
    if (filters.maxPrice !== undefined) {
      query = query.lte('price', filters.maxPrice)
    }

    // Apply sorting
    switch (filters.sortBy) {
      case 'price_asc':
        query = query.order('price', { ascending: true })
        break
      case 'price_desc':
        query = query.order('price', { ascending: false })
        break
      case 'newest':
        query = query.order('created_at', { ascending: false })
        break
      case 'rating':
        query = query.order('merchant_profiles.rating_avg', { ascending: false })
        break
      default:
        query = query.order('created_at', { ascending: false })
    }

    const { data: listings, error } = await query

    if (error) {
      console.error('Listing search error:', error)
      return { success: false, error: 'Failed to search listings' }
    }

    // Process results with distance calculation and address privacy
    const results: ListingSearchResult[] = []

    for (const listing of listings || []) {
      const merchant = listing.merchant_profiles
      const userData = merchant.users
      
      // Calculate distance if user location provided
      let distance_km: number | undefined

      if (filters.userLat && filters.userLng && userData.geo_coordinates) {
        const { data: distanceResult } = await supabase.rpc(
          'calculate_distance_coords',
          {
            lat1: filters.userLat,
            lng1: filters.userLng,
            lat2: userData.geo_coordinates[1], // PostGIS stores as [lng, lat]
            lng2: userData.geo_coordinates[0]
          }
        ).single()

        distance_km = distanceResult?.distance_km
      }

      // Apply distance filter (if user location and max distance specified)
      if (filters.maxDistance && distance_km && distance_km > filters.maxDistance) {
        continue
      }

      // Apply service area filter (is user within merchant's service area?)
      if (distance_km && distance_km > merchant.service_area_radius_km) {
        continue
      }

      // Build result with ADDRESS PRIVACY enforcement
      results.push({
        id: listing.id,
        merchant_profile_id: listing.merchant_profile_id,
        title: listing.title,
        description: listing.description,
        price: listing.price,
        category: listing.category,
        created_at: listing.created_at,
        merchant: {
          id: merchant.id,
          user_id: merchant.user_id,
          name: userData.name,
          rating_avg: merchant.rating_avg,
          rating_count: merchant.rating_count,
          profile_photo_url: userData.profile_photo_url,
          // ADDRESS PRIVACY: Only city, never full address
          city: userData.city,
          service_area_radius_km: merchant.service_area_radius_km,
          distance_km,
        }
      })
    }

    // Sort by distance if location provided and no specific sort requested
    if (filters.userLat && filters.userLng && !filters.sortBy) {
      results.sort((a, b) => {
        if (a.merchant.distance_km !== undefined && b.merchant.distance_km !== undefined) {
          return a.merchant.distance_km - b.merchant.distance_km
        }
        return 0
      })
    }

    return { success: true, data: results }
  } catch (error) {
    console.error('Unexpected error searching listings:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get single listing details (for listing detail view)
 * 
 * ADDRESS PRIVACY (TRD §4):
 * - Returns merchant.city and service_area_radius_km
 * - NEVER returns merchant.address
 * - Safe for client viewing
 */
export async function getListingDetails(listingId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get listing with merchant data (RLS allows public read of active listings)
    const { data: listing, error } = await supabase
      .from('listings')
      .select(`
        *,
        merchant_profiles!inner (
          id,
          user_id,
          category,
          description as merchant_description,
          rating_avg,
          rating_count,
          service_area_radius_km,
          users!inner (
            name,
            city,
            state,
            profile_photo_url,
            verification_status
          )
        )
      `)
      .eq('id', listingId)
      .eq('status', 'active')
      .eq('merchant_profiles.status', 'active')
      .eq('merchant_profiles.users.verification_status', 'id_verified')
      .eq('merchant_profiles.users.role', 'merchant')
      .single()

    if (error || !listing) {
      console.error('Listing fetch error:', error)
      return { success: false, error: 'Listing not found' }
    }

    const merchant = listing.merchant_profiles
    
    // Build safe listing details (ADDRESS PRIVACY enforced)
    const listingDetails = {
      id: listing.id,
      merchant_profile_id: listing.merchant_profile_id,
      title: listing.title,
      description: listing.description,
      price: listing.price,
      category: listing.category,
      created_at: listing.created_at,
      updated_at: listing.updated_at,
      merchant: {
        id: merchant.id,
        user_id: merchant.user_id,
        name: merchant.users.name,
        category: merchant.category,
        description: merchant.merchant_description,
        rating_avg: merchant.rating_avg,
        rating_count: merchant.rating_count,
        profile_photo_url: merchant.users.profile_photo_url,
        service_area_radius_km: merchant.service_area_radius_km,
        // ADDRESS PRIVACY: Only city + state, never full address
        city: merchant.users.city,
        state: merchant.users.state,
        verification_status: merchant.users.verification_status,
      }
    }

    return { success: true, data: listingDetails }
  } catch (error) {
    console.error('Unexpected error fetching listing details:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

// =============================================================================
// BOOKING REQUEST FLOW (with Address Privacy - TRD §4)
// =============================================================================

export type BookingRequestData = {
  merchant_profile_id?: string
  listing_id?: string
  service_details: string
  preferred_date: string
  preferred_time_start: string
  preferred_time_end: string
  special_requirements?: string
  client_address: string // Stored but NEVER shown to merchant in Phase 3
}

export type BookingRequest = {
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
  status: 'pending' | 'accepted' | 'declined' | 'cancelled'
  created_at: string
  client: {
    name: string
    city: string // ADDRESS PRIVACY: Only city shown to merchant
    profile_photo_url: string | null
    rating_avg: number
    rating_count: number
  }
  merchant: {
    name: string
    category: string
    city: string
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
 * Create new booking request (client → merchant)
 * 
 * ADDRESS PRIVACY (TRD §4): 
 * - Client address is stored in booking_requests.client_address
 * - BUT merchant can only see client.city in Phase 3 UI
 * - Full address exposure only happens in Phase 4 after acceptance
 */
export async function createBookingRequest(
  requestData: BookingRequestData
): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    // Get current user (must be verified client)
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) {
      return { success: false, error: 'Not authenticated' }
    }

    const { data: clientUser } = await supabase
      .from('users')
      .select('id, role, verification_status, address, city')
      .eq('auth_user_id', authUser.id)
      .single()

    if (!clientUser) {
      return { success: false, error: 'User profile not found' }
    }

    if (clientUser.verification_status !== 'id_verified') {
      return { success: false, error: 'You must complete ID verification to make booking requests' }
    }

    if (clientUser.role !== 'client') {
      return { success: false, error: 'Only clients can create booking requests' }
    }

    // Validate merchant exists and is active
    let merchantUserId: string
    
    if (requestData.listing_id) {
      // Booking from specific listing
      const { data: listing } = await supabase
        .from('listings')
        .select(`
          merchant_profile_id,
          merchant_profiles!inner (
            user_id,
            status,
            users!inner (verification_status, role)
          )
        `)
        .eq('id', requestData.listing_id)
        .eq('status', 'active')
        .single()

      if (!listing) {
        return { success: false, error: 'Listing not found or inactive' }
      }

      merchantUserId = listing.merchant_profiles.user_id
      
      if (listing.merchant_profiles.status !== 'active') {
        return { success: false, error: 'Merchant profile is not active' }
      }
      
      if (listing.merchant_profiles.users.verification_status !== 'id_verified') {
        return { success: false, error: 'Merchant is not verified' }
      }

    } else if (requestData.merchant_profile_id) {
      // General booking request to merchant
      const { data: merchant } = await supabase
        .from('merchant_profiles')
        .select(`
          user_id,
          status,
          users!inner (verification_status, role)
        `)
        .eq('id', requestData.merchant_profile_id)
        .single()

      if (!merchant) {
        return { success: false, error: 'Merchant not found' }
      }

      merchantUserId = merchant.user_id
      
      if (merchant.status !== 'active') {
        return { success: false, error: 'Merchant profile is not active' }
      }
      
      if (merchant.users.verification_status !== 'id_verified') {
        return { success: false, error: 'Merchant is not verified' }
      }

    } else {
      return { success: false, error: 'Either listing_id or merchant_profile_id must be provided' }
    }

    // Prevent self-booking
    if (merchantUserId === clientUser.id) {
      return { success: false, error: 'You cannot book your own services' }
    }

    // Create booking request with ADDRESS PRIVACY
    const { data: bookingRequest, error } = await supabase
      .from('booking_requests')
      .insert({
        client_user_id: clientUser.id,
        merchant_user_id: merchantUserId,
        merchant_profile_id: requestData.merchant_profile_id || 
          (await supabase
            .from('listings')
            .select('merchant_profile_id')
            .eq('id', requestData.listing_id!)
            .single()
          ).data?.merchant_profile_id,
        listing_id: requestData.listing_id || null,
        service_details: requestData.service_details.trim(),
        preferred_date: requestData.preferred_date,
        preferred_time_start: requestData.preferred_time_start,
        preferred_time_end: requestData.preferred_time_end,
        special_requirements: requestData.special_requirements?.trim() || null,
        // CRITICAL: Store client address but enforce privacy in UI
        client_address: requestData.client_address.trim(),
        status: 'pending'
      })
      .select()
      .single()

    if (error) {
      console.error('Booking request creation error:', error)
      return { success: false, error: 'Failed to create booking request' }
    }

    return { 
      success: true, 
      data: { 
        id: bookingRequest.id,
        message: 'Booking request sent successfully'
      }
    }
  } catch (error) {
    console.error('Unexpected error creating booking request:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get booking requests for client (outgoing requests)
 * 
 * ADDRESS PRIVACY (TRD §4): 
 * - Returns client's own address (they can see their own data)
 * - Returns merchant.city only (not full address)
 */
export async function getClientBookingRequests(): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) {
      return { success: false, error: 'Not authenticated' }
    }

    const { data: clientUser } = await supabase
      .from('users')
      .select('id, role')
      .eq('auth_user_id', authUser.id)
      .single()

    if (!clientUser || clientUser.role !== 'client') {
      return { success: false, error: 'Access denied' }
    }

    // Get client's booking requests with merchant info
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
        merchant_profiles!inner (
          category,
          users!inner (
            name,
            city,
            profile_photo_url
          ),
          rating_avg,
          rating_count
        ),
        listings (
          title,
          price
        )
      `)
      .eq('client_user_id', clientUser.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Client booking requests fetch error:', error)
      return { success: false, error: 'Failed to fetch booking requests' }
    }

    // Format results with ADDRESS PRIVACY for merchant data
    const formattedRequests: BookingRequest[] = (requests || []).map(req => ({
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
      client: {
        name: 'You', // It's the client's own request
        city: '', // Not needed for client view
        profile_photo_url: null,
        rating_avg: 0,
        rating_count: 0
      },
      merchant: {
        name: req.merchant_profiles.users.name,
        category: req.merchant_profiles.category,
        // ADDRESS PRIVACY: Only city shown
        city: req.merchant_profiles.users.city,
        profile_photo_url: req.merchant_profiles.users.profile_photo_url,
        rating_avg: req.merchant_profiles.rating_avg,
        rating_count: req.merchant_profiles.rating_count,
      },
      listing: req.listings ? {
        title: req.listings.title,
        price: req.listings.price
      } : undefined
    }))

    return { success: true, data: formattedRequests }
  } catch (error) {
    console.error('Unexpected error fetching client booking requests:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}