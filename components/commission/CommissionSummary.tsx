'use client'

import { useState, useEffect } from 'react'
import { getMerchantCommissionSummary, getMerchantBookingsWithCommission, type CommissionSummary as CommissionSummaryType } from '@/lib/commission/actions'
import { formatCurrency } from '@/lib/commission/format'
import { DollarSign, TrendingUp, Clock, CheckCircle, AlertTriangle, Receipt, Loader2 } from 'lucide-react'

type CommissionSummaryProps = {
  className?: string
}

export default function CommissionSummary({ className = '' }: CommissionSummaryProps) {
  const [summary, setSummary] = useState<(CommissionSummaryType & { outstanding_commission: number }) | null>(null)
  const [recentBookings, setRecentBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadCommissionData()
  }, [])

  const loadCommissionData = async () => {
    try {
      setLoading(true)
      setError('')

      // Load summary and recent bookings
      const [summaryResult, bookingsResult] = await Promise.all([
        getMerchantCommissionSummary(),
        getMerchantBookingsWithCommission()
      ])

      if (summaryResult.success) {
        setSummary(summaryResult.data)
      } else {
        setError(summaryResult.error || 'Failed to load commission summary')
      }

      if (bookingsResult.success) {
        setRecentBookings(bookingsResult.data?.slice(0, 5) || []) // Show latest 5
      }

    } catch (err) {
      console.error('Commission data error:', err)
      setError('Failed to load commission data')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'text-green-600 bg-green-100'
      case 'disputed':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-yellow-600 bg-yellow-100'
    }
  }

  if (loading) {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600 mr-3" />
          <span className="text-gray-600">Loading commission data...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Commission Data Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Receipt className="h-6 w-6 text-blue-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Commission Summary</h2>
          </div>
          
          <button
            onClick={loadCommissionData}
            className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {summary ? (
        <>
          {/* Stats Grid */}
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
              {/* Total Revenue */}
              <div className="text-center">
                <div className="p-3 bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(summary.total_revenue)}
                </p>
                <p className="text-sm text-gray-600">Total Revenue</p>
              </div>

              {/* Total Commission Owed */}
              <div className="text-center">
                <div className="p-3 bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                  <DollarSign className="h-6 w-6 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(summary.total_commission_owed)}
                </p>
                <p className="text-sm text-gray-600">Commission Owed</p>
              </div>

              {/* Outstanding Commission */}
              <div className="text-center">
                <div className="p-3 bg-yellow-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(summary.outstanding_commission)}
                </p>
                <p className="text-sm text-gray-600">Outstanding</p>
              </div>

              {/* Completed Bookings */}
              <div className="text-center">
                <div className="p-3 bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                  <CheckCircle className="h-6 w-6 text-purple-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {summary.total_bookings_with_commission}
                </p>
                <p className="text-sm text-gray-600">Paid Bookings</p>
              </div>
            </div>

            {/* Commission Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    <span className="font-medium text-green-800">Paid Commission</span>
                  </div>
                  <span className="text-lg font-bold text-green-900">
                    {formatCurrency(summary.paid_commission)}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-yellow-600 mr-2" />
                    <span className="font-medium text-yellow-800">Pending Payments</span>
                  </div>
                  <span className="text-lg font-bold text-yellow-900">
                    {summary.pending_payment_count}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Bookings */}
          {recentBookings.length > 0 && (
            <div className="border-t border-gray-200">
              <div className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Recent Commissioned Bookings</h3>
                
                <div className="space-y-3">
                  {recentBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-gray-900 line-clamp-1">
                            {booking.service_details}
                          </p>
                          <p className="text-sm text-gray-600">
                            {booking.client?.name} • {formatDate(booking.created_at)}
                          </p>
                        </div>
                        
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            {formatCurrency(booking.commission_amount)}
                          </p>
                          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${getPaymentStatusColor(booking.payment_status)}`}>
                            <span className="capitalize">{booking.payment_status}</span>
                          </div>
                        </div>
                      </div>

                      {booking.payment_notes && (
                        <p className="text-xs text-gray-600 italic mt-2">
                          "{booking.payment_notes}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="p-6">
          <div className="text-center py-8">
            <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">No commission data yet</p>
            <p className="text-sm text-gray-500">
              Complete bookings with agreed prices to start tracking commissions
            </p>
          </div>
        </div>
      )}

      {/* Note */}
      <div className="p-4 bg-blue-50 border-t border-blue-200">
        <div className="flex items-start">
          <Receipt className="h-4 w-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-800">Commission Tracking Only</p>
            <p className="text-xs text-blue-700 mt-1">
              This system tracks commission owed for manual reconciliation. No automated payments are processed per v1 requirements.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}