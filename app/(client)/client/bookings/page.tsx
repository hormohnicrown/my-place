'use client'

import { useState, useEffect } from 'react'
import { getClientBookingRequests, type BookingRequest } from '@/lib/client/actions'
import { getCurrentUser } from '@/lib/auth/actions'
import { MapPin, Star, Clock, User, Calendar, MessageSquare, AlertCircle, Eye, X, Plus } from 'lucide-react'
import Link from 'next/link'
import TwoWayRating from '@/components/ratings/TwoWayRating'

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  accepted: 'bg-green-100 text-green-800 border-green-200',
  declined: 'bg-red-100 text-red-800 border-red-200',
  cancelled: 'bg-gray-100 text-gray-800 border-gray-200'
}

const STATUS_LABELS = {
  pending: 'Pending Review',
  accepted: 'Accepted',
  declined: 'Declined',
  cancelled: 'Cancelled'
}

export default function ClientBookingsPage() {
  const [requests, setRequests] = useState<BookingRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedRequest, setSelectedRequest] = useState<BookingRequest | null>(null)

  useEffect(() => {
    loadRequests()
  }, [])

  const loadRequests = async () => {
    try {
      setLoading(true)
      setError('')

      const result = await getClientBookingRequests()

      if (result.success) {
        setRequests(result.data || [])
      } else {
        setError(result.error || 'Failed to load booking requests')
      }
    } catch (err) {
      console.error('Load requests error:', err)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':')
    const hour = parseInt(hours, 10)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`
    
    const diffInWeeks = Math.floor(diffInDays / 7)
    return `${diffInWeeks}w ago`
  }

  const formatPrice = (price: number) => {
    return `₦${price.toLocaleString()}`
  }

  const pendingRequests = requests.filter(req => req.status === 'pending')
  const activeRequests = requests.filter(req => req.status === 'accepted')
  const completedRequests = requests.filter(req => ['declined', 'cancelled'].includes(req.status))

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your booking requests...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              My Booking Requests
            </h1>
            <p className="text-gray-600">
              Track your service requests and communicate with merchants.
            </p>
          </div>
          <Link
            href="/client/search"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Request
          </Link>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-2xl font-bold text-gray-900">{pendingRequests.length}</h3>
            <p className="text-sm text-gray-600">Pending Review</p>
          </div>
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-2xl font-bold text-gray-900">{activeRequests.length}</h3>
            <p className="text-sm text-gray-600">Accepted</p>
          </div>
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-2xl font-bold text-gray-900">{requests.length}</h3>
            <p className="text-sm text-gray-600">Total Requests</p>
          </div>
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-2xl font-bold text-gray-900">
              {new Set(requests.map(r => r.merchant_user_id)).size}
            </h3>
            <p className="text-sm text-gray-600">Merchants Contacted</p>
          </div>
        </div>

        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Clock className="h-5 w-5 mr-2 text-yellow-500" />
              Awaiting Response ({pendingRequests.length})
            </h2>
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <ClientBookingRequestCard 
                  key={request.id} 
                  request={request}
                  onViewDetails={() => setSelectedRequest(request)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Active Requests */}
        {activeRequests.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-green-500" />
              Confirmed Bookings ({activeRequests.length})
            </h2>
            <div className="space-y-4">
              {activeRequests.map((request) => (
                <ClientBookingRequestCard 
                  key={request.id} 
                  request={request}
                  onViewDetails={() => setSelectedRequest(request)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Completed Requests */}
        {completedRequests.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Request History ({completedRequests.length})
            </h2>
            <div className="space-y-4">
              {completedRequests.map((request) => (
                <ClientBookingRequestCard 
                  key={request.id} 
                  request={request}
                  onViewDetails={() => setSelectedRequest(request)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && requests.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No booking requests yet
            </h3>
            <p className="text-gray-600 mb-6">
              Start by finding services and merchants in your area.
            </p>
            <div className="space-x-4">
              <Link
                href="/client/search"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Find Merchants
              </Link>
              <Link
                href="/client/listings"
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Browse Services
              </Link>
            </div>
          </div>
        )}

        {/* Request Detail Modal */}
        {selectedRequest && (
          <ClientRequestDetailModal 
            request={selectedRequest}
            onClose={() => setSelectedRequest(null)}
          />
        )}
      </div>
    </div>
  )
}

// Client Booking Request Card Component
function ClientBookingRequestCard({ 
  request, 
  onViewDetails 
}: { 
  request: BookingRequest
  onViewDetails: () => void
}) {
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d ago`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':')
    const hour = parseInt(hours, 10)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  return (
    <div className="bg-white rounded-lg border p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          {/* Merchant Avatar */}
          {request.merchant.profile_photo_url ? (
            <img
              src={request.merchant.profile_photo_url}
              alt={request.merchant.name}
              className="w-12 h-12 rounded-full object-cover mr-4"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center mr-4">
              <User className="h-6 w-6 text-gray-600" />
            </div>
          )}

          <div>
            <h3 className="font-semibold text-gray-900">{request.merchant.name}</h3>
            <p className="text-sm text-blue-600 capitalize">{request.merchant.category}</p>
            
            {/* Merchant Location - ADDRESS PRIVACY ENFORCED */}
            <div className="flex items-center text-sm text-gray-600">
              <MapPin className="h-3 w-3 mr-1" />
              <span>{request.merchant.city}</span>
            </div>
            
            {/* Merchant Rating */}
            {request.merchant.rating_count > 0 && (
              <div className="flex items-center text-sm">
                <Star className="h-3 w-3 text-yellow-400 fill-current mr-1" />
                <span>{request.merchant.rating_avg.toFixed(1)} ({request.merchant.rating_count})</span>
              </div>
            )}
          </div>
        </div>

        <div className="text-right">
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[request.status]}`}>
            {STATUS_LABELS[request.status]}
          </span>
          <p className="text-xs text-gray-500 mt-1">Sent {formatTimeAgo(request.created_at)}</p>
        </div>
      </div>

      {/* Service Details Preview */}
      <div className="mb-4">
        {request.listing && (
          <div className="text-sm text-blue-600 mb-1">
            Requesting: {request.listing.title} (₦{request.listing.price.toLocaleString()})
          </div>
        )}
        <p className="text-gray-700 line-clamp-2">{request.service_details}</p>
      </div>

      {/* Schedule */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <Calendar className="h-4 w-4 mr-2" />
          <span>{formatDate(request.preferred_date)}</span>
          <span className="mx-2">•</span>
          <Clock className="h-4 w-4 mr-1" />
          <span>{formatTime(request.preferred_time_start)} - {formatTime(request.preferred_time_end)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center pt-4 border-t">
        <button
          onClick={onViewDetails}
          className="flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          <Eye className="h-4 w-4 mr-1" />
          View Details
        </button>

        <div className="flex space-x-2">
          <Link
            href={`/client/merchants/${request.merchant_profile_id}`}
            className="flex items-center px-3 py-1 text-xs border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
          >
            <User className="h-3 w-3 mr-1" />
            View Profile
          </Link>
          <button className="flex items-center px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700">
            <MessageSquare className="h-3 w-3 mr-1" />
            Message
          </button>
          {request.status === 'pending' && (
            <button className="flex items-center px-3 py-1 text-xs border border-red-300 text-red-700 rounded hover:bg-red-50">
              <X className="h-3 w-3 mr-1" />
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// Client Request Detail Modal Component
function ClientRequestDetailModal({ 
  request, 
  onClose 
}: { 
  request: BookingRequest
  onClose: () => void 
}) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':')
    const hour = parseInt(hours, 10)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Booking Request Details</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          {/* Status */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900">Request Status</h3>
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${STATUS_COLORS[request.status]}`}>
                {STATUS_LABELS[request.status]}
              </span>
            </div>
            {request.status === 'pending' && (
              <p className="text-sm text-gray-600 mt-2">
                Your request has been sent to {request.merchant.name}. They'll contact you to discuss details and confirm the booking.
              </p>
            )}
            {request.status === 'accepted' && (
              <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded">
                <p className="text-sm text-green-800">
                  ✅ <strong>Booking Accepted!</strong> {request.merchant.name} can now see your full address and will contact you to arrange the service.
                </p>
              </div>
            )}
            {request.status === 'declined' && (
              <p className="text-sm text-red-600 mt-2">
                This request was declined by {request.merchant.name}. You can try contacting other merchants or modify your request.
              </p>
            )}
          </div>

          {/* Merchant Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-3">Service Provider</h3>
            <div className="flex items-center mb-3">
              {request.merchant.profile_photo_url ? (
                <img
                  src={request.merchant.profile_photo_url}
                  alt={request.merchant.name}
                  className="w-12 h-12 rounded-full object-cover mr-4"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center mr-4">
                  <User className="h-6 w-6 text-gray-600" />
                </div>
              )}
              <div>
                <h4 className="font-semibold text-gray-900">{request.merchant.name}</h4>
                <p className="text-sm text-blue-600 capitalize">{request.merchant.category}</p>
                {/* ADDRESS PRIVACY: Only city shown */}
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="h-3 w-3 mr-1" />
                  <span>{request.merchant.city}</span>
                </div>
                {request.merchant.rating_count > 0 && (
                  <div className="flex items-center text-sm">
                    <Star className="h-3 w-3 text-yellow-400 fill-current mr-1" />
                    <span>{request.merchant.rating_avg.toFixed(1)} ({request.merchant.rating_count} reviews)</span>
                  </div>
                )}
              </div>
            </div>
            <Link
              href={`/client/merchants/${request.merchant_profile_id}`}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View Full Profile →
            </Link>
          </div>

          {/* Service Details */}
          <div className="mb-6">
            <h3 className="font-medium text-gray-900 mb-3">Service Requested</h3>
            {request.listing && (
              <div className="mb-3 p-3 bg-blue-50 rounded">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{request.listing.title}</span>
                  <span className="font-semibold text-blue-600">
                    ₦{request.listing.price.toLocaleString()}
                  </span>
                </div>
              </div>
            )}
            <div className="whitespace-pre-wrap text-gray-700 bg-gray-50 p-3 rounded">
              {request.service_details}
            </div>
          </div>

          {/* Schedule */}
          <div className="mb-6">
            <h3 className="font-medium text-gray-900 mb-3">Preferred Schedule</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded">
                <div className="flex items-center text-sm text-gray-600 mb-1">
                  <Calendar className="h-4 w-4 mr-2" />
                  Date
                </div>
                <p className="font-medium">{formatDate(request.preferred_date)}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <div className="flex items-center text-sm text-gray-600 mb-1">
                  <Clock className="h-4 w-4 mr-2" />
                  Time
                </div>
                <p className="font-medium">
                  {formatTime(request.preferred_time_start)} - {formatTime(request.preferred_time_end)}
                </p>
              </div>
            </div>
          </div>

          {/* Special Requirements */}
          {request.special_requirements && (
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-3">Special Requirements</h3>
              <div className="whitespace-pre-wrap text-gray-700 bg-gray-50 p-3 rounded">
                {request.special_requirements}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between items-center pt-6 border-t">
            <div className="text-sm text-gray-500">
              Sent {new Date(request.created_at).toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
              })}
            </div>

            <div className="flex space-x-3">
              <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50">
                Contact Merchant
              </button>
              {request.status === 'pending' && (
                <button className="px-4 py-2 border border-red-300 text-red-700 rounded hover:bg-red-50">
                  Cancel Request
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}