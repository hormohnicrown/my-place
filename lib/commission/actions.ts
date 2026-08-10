'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Types
export type CommissionData = {
  booking_id: string
  price_agreed: number
  commission_rate_applied: number
  commission_amount: number
  currency: string
}

export type CommissionSummary = {
  total_bookings_with_commission: number
  total_revenue: number
  total_commission_owed: number
  pending_payment_count: number
  paid_commission: number
}

export type ActionResult = {
  success: boolean
  error?: string
  data?: any
}

// =============================================================================
// COMMISSION CALCULATION ACTIONS
// =============================================================================

/**
 * Calculate and set commission for a completed booking
 * Only merchants can set commission for their own bookings
 * Only works for accepted/in-progress/completed bookings
 */
export async function calculateCommission(
  bookingId: string,
  agreedPrice: number,
  commissionRate?: number
): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    // Validate inputs
    if (!bookingId || agreedPrice <= 0) {
      return { 
        success: false, 
        error: 'Invalid booking ID or price' 
      }
    }

    if (commissionRate !== undefined && (commissionRate < 0 || commissionRate > 1)) {
      return { 
        success: false, 
        error: 'Commission rate must be between 0% and 100%' 
      }
    }

    // Call database function to calculate commission
    const { data, error } = await supabase
      .rpc('calculate_commission_for_booking', {
        p_booking_request_id: bookingId,
        p_agreed_price: agreedPrice,
        p_commission_rate: commissionRate
      })

    if (error) {
      console.error('Commission calculation error:', error)
      return { 
        success: false, 
        error: error.message || 'Failed to calculate commission' 
      }
    }

    if (!data?.success) {
      return { 
        success: false, 
        error: data?.error || 'Commission calculation failed' 
      }
    }

    // Revalidate paths to update UI
    revalidatePath('/merchant/bookings')
    revalidatePath('/merchant/dashboard')

    return {
      success: true,
      data: data.data as CommissionData
    }

  } catch (err) {
    console.error('Commission calculation error:', err)
    return { 
      success: false, 
      error: 'Failed to calculate commission' 
    }
  }
}

/**
 * Update payment status for a booking (manual reconciliation)
 * Only merchants can update their own booking payment status
 */
export async function updatePaymentStatus(
  bookingId: string, 
  paymentStatus: 'pending' | 'paid' | 'disputed',
  notes?: string
): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) {
      return { success: false, error: 'Not authenticated' }
    }

    const { data: merchantUser } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', authUser.id)
      .single()

    if (!merchantUser) {
      return { success: false, error: 'User not found' }
    }

    // Update payment status (RLS will ensure only merchant can update their bookings)
    const { error } = await supabase
      .from('booking_requests')
      .update({ 
        payment_status: paymentStatus,
        payment_notes: notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId)
      .eq('merchant_user_id', merchantUser.id) // Extra safety check

    if (error) {
      console.error('Payment status update error:', error)
      return { 
        success: false, 
        error: error.message || 'Failed to update payment status' 
      }
    }

    // Revalidate paths
    revalidatePath('/merchant/bookings')
    revalidatePath('/merchant/dashboard')

    return { success: true }

  } catch (err) {
    console.error('Payment status update error:', err)
    return { 
      success: false, 
      error: 'Failed to update payment status' 
    }
  }
}

// =============================================================================
// COMMISSION REPORTING ACTIONS
// =============================================================================

/**
 * Get commission summary for current merchant
 * Shows total revenue, commission owed, payment status
 */
export async function getMerchantCommissionSummary(): Promise<ActionResult> {
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
      return { success: false, error: 'Merchant access required' }
    }

    // Get commission summary using database function
    const { data, error } = await supabase
      .rpc('get_merchant_commission_summary', {
        p_merchant_user_id: merchantUser.id
      })

    if (error) {
      console.error('Commission summary error:', error)
      return { 
        success: false, 
        error: error.message || 'Failed to get commission summary' 
      }
    }

    const summary = data?.[0] || {
      total_bookings_with_commission: 0,
      total_revenue: 0,
      total_commission_owed: 0,
      pending_payment_count: 0,
      paid_commission: 0
    }

    return {
      success: true,
      data: {
        total_bookings_with_commission: Number(summary.total_bookings_with_commission),
        total_revenue: Number(summary.total_revenue),
        total_commission_owed: Number(summary.total_commission_owed),
        pending_payment_count: Number(summary.pending_payment_count),
        paid_commission: Number(summary.paid_commission),
        outstanding_commission: Number(summary.total_commission_owed) - Number(summary.paid_commission)
      } as CommissionSummary & { outstanding_commission: number }
    }

  } catch (err) {
    console.error('Commission summary error:', err)
    return { 
      success: false, 
      error: 'Failed to get commission summary' 
    }
  }
}

/**
 * Get detailed booking list with commission information
 * For merchant dashboard and reporting
 */
export async function getMerchantBookingsWithCommission(): Promise<ActionResult> {
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
      return { success: false, error: 'Merchant access required' }
    }

    // Get bookings with commission data
    const { data: bookings, error } = await supabase
      .from('booking_requests')
      .select(`
        id,
        service_details,
        status,
        created_at,
        price_agreed,
        commission_rate_applied,
        commission_amount,
        payment_status,
        payment_notes,
        client:client_user_id (
          name,
          city
        )
      `)
      .eq('merchant_user_id', merchantUser.id)
      .in('status', ['accepted', 'in_progress', 'completed'])
      .not('commission_amount', 'is', null)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Commission bookings error:', error)
      return { 
        success: false, 
        error: error.message || 'Failed to get commission data' 
      }
    }

    return {
      success: true,
      data: bookings || []
    }

  } catch (err) {
    console.error('Commission bookings error:', err)
    return { 
      success: false, 
      error: 'Failed to get commission data' 
    }
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================
// Display/formatting helpers live in ./format.ts (this file is 'use server'
// and may only export async functions).