'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/actions'

// Types for admin data
export type AdminUser = {
  id: string
  name: string
  phone: string
  email: string | null
  role: 'client' | 'merchant' | 'admin'
  verification_status: 'unverified' | 'pending' | 'id_verified' | 'failed'
  city: string | null
  state: string | null
  created_at: string
  updated_at: string
}

export type VerificationRecord = {
  id: string
  user: AdminUser
  provider: string
  provider_job_id: string | null
  result: 'unverified' | 'pending' | 'id_verified' | 'failed'
  result_details: any
  checked_at: string
  created_at: string
}

export type BookingWithDetails = {
  id: string
  status: 'requested' | 'accepted' | 'declined' | 'checked_in' | 'completed' | 'cancelled'
  price_agreed: number
  client: AdminUser
  merchant: AdminUser
  listing: {
    id: string
    title: string
    category: string
  }
  created_at: string
  requested_at: string
  flagged_reason?: string
  flagged_at?: string
  dispute_reason?: string
  dispute_status?: 'open' | 'resolved' | 'escalated'
}

// Admin auth check
async function requireAdmin() {
  const user = await getCurrentUser()
  
  // Enforce strict Super-Admin access
  if (!user || user.role !== 'admin') {
    throw new Error('Unauthorized: Super-Admin access required')
  }
  
  return user
}

// =============================================================================
// VERIFICATION MANAGEMENT
// =============================================================================

/**
 * Get pending ID verifications
 */
export async function getPendingVerifications() {
  try {
    await requireAdmin()
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('users')
      .select(`
        id,
        name,
        phone,
        email,
        role,
        verification_status,
        city,
        state,
        created_at,
        updated_at,
        verification_records (
          id,
          provider,
          provider_job_id,
          result,
          result_details,
          checked_at,
          created_at
        )
      `)
      .in('verification_status', ['pending', 'failed'])
      .order('created_at', { ascending: false })

    if (error) throw error

    return { success: true, data: data || [] }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

/**
 * Approve user verification manually (admin override)
 */
export async function approveUserVerification(userId: string, notes: string) {
  try {
    await requireAdmin()
    const supabase = await createClient()

    // Update user verification status
    const { error: userError } = await supabase
      .from('users')
      .update({ 
        verification_status: 'id_verified',
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (userError) throw userError

    // Create verification record
    const { error: recordError } = await supabase
      .from('verification_records')
      .insert({
        user_id: userId,
        provider: 'manual_admin_approval',
        result: 'id_verified',
        result_details: { notes, admin_override: true },
        checked_at: new Date().toISOString()
      })

    if (recordError) throw recordError

    return { success: true }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

/**
 * Reject user verification with reason
 */
export async function rejectUserVerification(userId: string, reason: string) {
  try {
    await requireAdmin()
    const supabase = await createClient()

    // Update user verification status
    const { error: userError } = await supabase
      .from('users')
      .update({ 
        verification_status: 'failed',
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (userError) throw userError

    // Create verification record
    const { error: recordError } = await supabase
      .from('verification_records')
      .insert({
        user_id: userId,
        provider: 'manual_admin_rejection',
        result: 'failed',
        result_details: { reason, admin_override: true },
        checked_at: new Date().toISOString()
      })

    if (recordError) throw recordError

    return { success: true }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

// =============================================================================
// DISPUTES MANAGEMENT
// =============================================================================

/**
 * Get active disputes (simulated - would need disputes table in production)
 */
export async function getActiveDisputes() {
  try {
    await requireAdmin()
    const supabase = await createClient()

    // For now, we'll simulate disputes by finding bookings that might have issues
    // In production, you'd have a separate disputes table
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        id,
        status,
        price_agreed,
        created_at,
        requested_at,
        client:client_id(
          id,
          name,
          phone,
          email,
          role,
          verification_status,
          city,
          state,
          created_at,
          updated_at
        ),
        merchant:merchant_id(
          id,
          name,
          phone,
          email,
          role,
          verification_status,
          city,
          state,
          created_at,
          updated_at
        ),
        listing:listing_id(
          id,
          title,
          category
        )
      `)
      .eq('status', 'cancelled')
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) throw error

    // Simulate dispute data - in production this would come from disputes table
    const disputesData = (data || []).map((booking: any) => ({
      ...booking,
      client: Array.isArray(booking.client) ? booking.client[0] : booking.client,
      merchant: Array.isArray(booking.merchant) ? booking.merchant[0] : booking.merchant,
      listing: Array.isArray(booking.listing) ? booking.listing[0] : booking.listing,
      dispute_reason: 'Payment dispute',
      dispute_status: 'open' as const,
    }))

    return { success: true, data: disputesData }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

// =============================================================================
// FLAGGED BOOKINGS MANAGEMENT
// =============================================================================

/**
 * Get flagged bookings that need admin review
 */
export async function getFlaggedBookings() {
  try {
    await requireAdmin()
    const supabase = await createClient()

    // For now, we'll simulate flagged bookings by finding suspicious patterns
    // In production, you'd have a flags table or booking_flags
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        id,
        status,
        price_agreed,
        created_at,
        requested_at,
        client:client_id(
          id,
          name,
          phone,
          email,
          role,
          verification_status,
          city,
          state,
          created_at,
          updated_at
        ),
        merchant:merchant_id(
          id,
          name,
          phone,
          email,
          role,
          verification_status,
          city,
          state,
          created_at,
          updated_at
        ),
        listing:listing_id(
          id,
          title,
          category
        )
      `)
      .or('price_agreed.gte.100000,status.eq.cancelled')
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) throw error

    // Simulate flagged data - in production this would come from flags table
    const flaggedData = (data || []).map((booking: any) => ({
      ...booking,
      client: Array.isArray(booking.client) ? booking.client[0] : booking.client,
      merchant: Array.isArray(booking.merchant) ? booking.merchant[0] : booking.merchant,
      flagged_reason: booking.price_agreed >= 100000 
        ? 'High value transaction' 
        : 'Multiple cancellations',
      flagged_at: booking.created_at,
    }))

    return { success: true, data: flaggedData }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

// =============================================================================
// USER MANAGEMENT
// =============================================================================

/**
 * Get all users with pagination and filtering
 */
export async function getUsers(page: number = 1, limit: number = 20, role?: 'client' | 'merchant' | 'admin') {
  try {
    await requireAdmin()
    const supabase = await createClient()

    const offset = (page - 1) * limit
    
    let query = supabase
      .from('users')
      .select(`
        id,
        name,
        phone,
        email,
        role,
        verification_status,
        city,
        state,
        created_at,
        updated_at
      `, { count: 'exact' })

    if (role) {
      query = query.eq('role', role)
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    return { 
      success: true, 
      data: data || [], 
      count: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit)
    }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

/**
 * Update user status (suspend, activate, etc.)
 */
export async function updateUserStatus(userId: string, status: 'active' | 'suspended', reason?: string) {
  try {
    await requireAdmin()
    const supabase = await createClient()

    // For now, we'll use verification_status field to track suspensions
    // In production, you'd have a separate user_status field
    const verificationStatus = status === 'suspended' ? 'failed' : 'id_verified'

    const { error } = await supabase
      .from('users')
      .update({ 
        verification_status: verificationStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (error) throw error

    // Log the admin action (in production, you'd have an admin_logs table)
    console.log(`Admin action: User ${userId} ${status} - ${reason || 'No reason provided'}`)

    return { success: true }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

// =============================================================================
// PLATFORM STATS
// =============================================================================

/**
 * Get platform statistics for admin dashboard
 */
export async function getPlatformStats() {
  try {
    await requireAdmin()
    const supabase = await createClient()

    // Get user counts
    const { data: userCounts } = await supabase
      .from('users')
      .select('role, verification_status, created_at')

    // Get booking counts
    const { data: bookingCounts } = await supabase
      .from('bookings')
      .select('status, created_at')

    // Calculate stats
    const totalUsers = userCounts?.length || 0
    const pendingVerifications = userCounts?.filter(u => u.verification_status === 'pending').length || 0
    const totalBookings = bookingCounts?.length || 0
    const completedBookings = bookingCounts?.filter(b => b.status === 'completed').length || 0
    
    // Today's stats
    const today = new Date().toISOString().split('T')[0]
    const todaySignups = userCounts?.filter(u => 
      u.created_at?.startsWith(today)
    ).length || 0
    const todayBookings = bookingCounts?.filter(b => 
      b.created_at?.startsWith(today)
    ).length || 0

    return {
      success: true,
      data: {
        totalUsers,
        pendingVerifications,
        totalBookings,
        completedBookings,
        todaySignups,
        todayBookings,
        // Simulated additional stats
        activeDisputes: 7,
        flaggedBookings: 12,
        averageRating: 4.2,
        totalRevenue: 2847650,
      }
    }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}