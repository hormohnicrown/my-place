'use client'

import { useState } from 'react'
import CommissionSummary from '@/components/commission/CommissionSummary'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function MerchantCommissionPage() {
  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <Link 
          href="/merchant/dashboard"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Link>
        
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Commission Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Track your earnings and platform commission for completed bookings
          </p>
        </div>
      </div>

      {/* Commission Summary */}
      <CommissionSummary />

      {/* Information */}
      <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">
          About Commission Tracking
        </h3>
        
        <div className="space-y-3 text-blue-800">
          <div className="flex items-start">
            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <p className="text-sm">
              <strong>Commission Rate:</strong> Default 7% on completed bookings (can be adjusted per booking)
            </p>
          </div>
          
          <div className="flex items-start">
            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <p className="text-sm">
              <strong>Manual Processing:</strong> No automated payments - commission tracking for reconciliation only
            </p>
          </div>
          
          <div className="flex items-start">
            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <p className="text-sm">
              <strong>Payment Status:</strong> Update payment status as you receive payments for record keeping
            </p>
          </div>
          
          <div className="flex items-start">
            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <p className="text-sm">
              <strong>Transparency:</strong> Clients can see agreed prices but not commission breakdown details
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/merchant/bookings"
          className="p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all"
        >
          <h4 className="font-medium text-gray-900 mb-2">Manage Bookings</h4>
          <p className="text-sm text-gray-600">
            View and manage your booking requests, set final prices, and track GPS check-ins
          </p>
        </Link>
        
        <Link
          href="/merchant/dashboard"
          className="p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all"
        >
          <h4 className="font-medium text-gray-900 mb-2">Dashboard Overview</h4>
          <p className="text-sm text-gray-600">
            Return to your main dashboard for quick stats and recent activity
          </p>
        </Link>
      </div>
    </div>
  )
}