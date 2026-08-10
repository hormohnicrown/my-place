'use client'

import { useState, useEffect } from 'react'
import { getMerchantBookingRequests, updateBookingRequestStatus, type MerchantBookingRequest } from '@/lib/merchant/actions'
import { getCurrentUser } from '@/lib/auth/actions'
import { MapPin, Star, Clock, User, Calendar, MessageSquare, AlertCircle, Eye, Mail, Phone, Check, X, Loader2, Navigation } from 'lucide-react'
import Link from 'next/link'
import GPSCheckInButton from '@/components/gps/GPSCheckInButton'
import GPSHistory from '@/components/gps/GPSHistory'
import CommissionTracker from '@/components/commission/CommissionTracker'
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

export default function MerchantBookingsPage() {
  const [requests, setRequests] = useState<MerchantBookingRequest[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedRequest, setSelectedRequest] = useState<MerchantBookingRequest | null>(null)
  const [processingAction, setProcessingAction] = useState<string | null>(null)

  useEffect(() => {
    loadRequests()
  }, [])

  const loadRequests = async () => {
    try {
      setLoading(true)
      setError('')

      // Load user data and requests in parallel
      const [userResult, requestsResult] = await Promise.all([
        getCurrentUser(),
        getMerchantBookingRequests()
      ])

      if (userResult) {
        setCurrentUser(userResult)
      }

      if (requestsResult.success) {
        setRequests(requestsResult.data || [])
      } else {
        setError(requestsResult.error || 'Failed to load booking requests')
      }
    } catch (err) {
      console.error('Load requests error:', err)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (requestId: string, status: 'accepted' | 'declined') => {
    try {
      setProcessingAction(requestId)
      
      const result = await updateBookingRequestStatus(requestId, status)
      
      if (result.success) {
        // Reload requests to get updated data
        await loadRequests()
        setSelectedRequest(null) // Close modal if open
        
        // Show success message (you could add a toast notification here)
        setError('')
      } else {
        setError(result.error || `Failed to ${status} booking request`)
      }
    } catch (err) {
      console.error('Status update error:', err)
      setError('An unexpected error occurred')
    } finally {
      setProcessingAction(null)
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
  const otherRequests = requests.filter(req => req.status !== 'pending')

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading booking requests...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Booking Requests
          </h1>
          <p className="text-gray-600">
            Manage incoming service requests from clients. Review details and contact clients directly.
          </p>
        </div>

        {/* Phase 4 - Booking Actions Now Available */}
        <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start">
            <Calendar className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-green-800">Phase 4 - Booking Management Active</h3>
              <p className="text-sm text-green-700 mt-1">
                You can now accept or decline booking requests. Accepting a request will share your full address with the client and begin the service workflow including GPS check-in/out requirements.
              </p>
            </div>
          </div>
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
            <p className="text-sm text-gray-600">Pending Requests</p>
          </div>
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-2xl font-bold text-gray-900">{requests.length}</h3>
            <p className="text-sm text-gray-600">Total Requests</p>
          </div>
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-2xl font-bold text-gray-900">
              {requests.filter(r => r.created_at >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()).length}
            </h3>
            <p className="text-sm text-gray-600">This Week</p>
          </div>
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-2xl font-bold text-gray-900">
              {new Set(requests.map(r => r.client_user_id)).size}
            </h3>
            <p className="text-sm text-gray-600">Unique Clients</p>
          </div>
        </div>

        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Pending Requests ({pendingRequests.length})
            </h2>
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <BookingRequestCard 
                  key={request.id} 
                  request={request}
                  onViewDetails={() => setSelectedRequest(request)}
                  onAccept={() => handleStatusUpdate(request.id, 'accepted')}
                  onDecline={() => handleStatusUpdate(request.id, 'declined')}
                  isPending={true}
                  isProcessing={processingAction === request.id}
                />
              ))}
            </div>
          </div>
        )}

        {/* All Other Requests */}
        {otherRequests.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Request History ({otherRequests.length})
            </h2>
            <div className="space-y-4">
              {otherRequests.map((request) => (
                <BookingRequestCard 
                  key={request.id} 
                  request={request}
                  onViewDetails={() => setSelectedRequest(request)}
                  isPending={false}
                  isProcessing={false}
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
              When clients request your services, they'll appear here for you to review and respond to.
            </p>
            <Link
              href="/merchant/listings"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Create Your First Listing
            </Link>
          </div>
        )}

        {/* Request Detail Modal */}
        {selectedRequest && (
          <RequestDetailModal 
            request={selectedRequest}
            onClose={() => setSelectedRequest(null)}
            onAccept={() => handleStatusUpdate(selectedRequest.id, 'accepted')}
            onDecline={() => handleStatusUpdate(selectedRequest.id, 'declined')}
            isProcessing={processingAction === selectedRequest.id}
          />
        )}
      </div>
    </div>
  )
}

// Booking Request Card Component
function BookingRequestCard({ 
  request, 
  onViewDetails, 
  onAccept,
  onDecline,
  isPending,
  isProcessing = false
}: { 
  request: MerchantBookingRequest
  onViewDetails: () => void
  onAccept?: () => void
  onDecline?: () => void
  isPending: boolean
  isProcessing?: boolean
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
    <div className={`bg-white rounded-lg border ${isPending ? 'border-yellow-200 bg-yellow-50' : ''} p-6`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          {/* Client Avatar */}
          {request.client.profile_photo_url ? (
            <img
              src={request.client.profile_photo_url}
              alt={request.client.name}
              className="w-12 h-12 rounded-full object-cover mr-4"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center mr-4">
              <User className="h-6 w-6 text-gray-600" />
            </div>
          )}

          <div>
            <h3 className="font-semibold text-gray-900">{request.client.name}</h3>
            
            {/* Location - ADDRESS PRIVACY with conditional revelation */}
            <div className="text-sm text-gray-600">
              {request.client_address ? (
                // Show full address for accepted bookings
                <div>
                  <div className="flex items-center text-green-700 mb-1">
                    <MapPin className="h-3 w-3 mr-1" />
                    <span className="font-medium">Service Location:</span>
                  </div>
                  <div className="text-sm text-gray-700 bg-green-50 border border-green-200 rounded px-2 py-1">
                    {request.client_address.length > 50 
                      ? `${request.client_address.substring(0, 50)}...` 
                      : request.client_address}
                  </div>
                </div>
              ) : (
                // Show city only for pending requests
                <div className="flex items-center">
                  <MapPin className="h-3 w-3 mr-1" />
                  <span>{request.client.city}</span>
                  <span className="ml-2 text-xs text-blue-600">• Address pending acceptance</span>
                </div>
              )}
            </div>
            
            {/* Client Rating */}
            {request.client.rating_count > 0 && (
              <div className="flex items-center text-sm">
                <Star className="h-3 w-3 text-yellow-400 fill-current mr-1" />
                <span>{request.client.rating_avg.toFixed(1)} ({request.client.rating_count})</span>
              </div>
            )}
          </div>
        </div>

        <div className="text-right">
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[request.status]}`}>
            {STATUS_LABELS[request.status]}
          </span>
          <p className="text-xs text-gray-500 mt-1">{formatTimeAgo(request.created_at)}</p>
        </div>
      </div>

      {/* Service Details Preview */}
      <div className="mb-4">
        {request.listing && (
          <div className="text-sm text-blue-600 mb-1">
            Service: {request.listing.title} (₦{request.listing.price.toLocaleString()})
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
          View Full Details
        </button>

        <div className="flex space-x-2">
          {/* Contact buttons */}
          <button className="flex items-center px-3 py-1 text-xs border border-gray-300 text-gray-700 rounded hover:bg-gray-50">
            <Mail className="h-3 w-3 mr-1" />
            Email
          </button>
          <button className="flex items-center px-3 py-1 text-xs border border-gray-300 text-gray-700 rounded hover:bg-gray-50">
            <Phone className="h-3 w-3 mr-1" />
            Call
          </button>
          
          {/* Accept/Decline buttons for pending requests */}
          {isPending && onAccept && onDecline && (
            <>
              <button
                onClick={onDecline}
                disabled={isProcessing}
                className="flex items-center px-3 py-1 text-xs border border-red-300 text-red-700 rounded hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <X className="h-3 w-3 mr-1" />
                )}
                Decline
              </button>
              <button
                onClick={onAccept}
                disabled={isProcessing}
                className="flex items-center px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <Check className="h-3 w-3 mr-1" />
                )}
                Accept
              </button>
            </>
          )}
          
          {/* Message button for all requests */}
          <button className="flex items-center px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700">
            <MessageSquare className="h-3 w-3 mr-1" />
            Message
          </button>
        </div>
      </div>
    </div>
  )
}

// Request Detail Modal Component
function RequestDetailModal({ 
  request, 
  onClose,
  onAccept,
  onDecline,
  isProcessing = false
}: { 
  request: MerchantBookingRequest
  onClose: () => void
  onAccept?: () => void
  onDecline?: () => void
  isProcessing?: boolean
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

          {/* Client Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-3">Client Information</h3>
            <div className="flex items-center mb-3">
              {request.client.profile_photo_url ? (
                <img
                  src={request.client.profile_photo_url}
                  alt={request.client.name}
                  className="w-12 h-12 rounded-full object-cover mr-4"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center mr-4">
                  <User className="h-6 w-6 text-gray-600" />
                </div>
              )}
              <div>
                <h4 className="font-semibold text-gray-900">{request.client.name}</h4>
                
                {/* Address Privacy: Conditional based on booking status */}
                {request.client_address ? (
                  // Full address for accepted bookings
                  <div className="text-sm text-gray-700">
                    <div className="flex items-center text-green-700 mb-1">
                      <MapPin className="h-3 w-3 mr-1" />
                      <span className="font-medium">Service Address:</span>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded p-2 text-sm">
                      {request.client_address}
                    </div>
                    <p className="text-xs text-green-600 mt-1">
                      ✓ Address revealed - booking accepted
                    </p>
                  </div>
                ) : (
                  // City only for pending requests
                  <div className="text-sm text-gray-600">
                    <div className="flex items-center">
                      <MapPin className="h-3 w-3 mr-1" />
                      <span>{request.client.city}</span>
                    </div>
                    <p className="text-xs text-blue-600 mt-1">
                      🔒 Full address will be shared after you accept this booking
                    </p>
                  </div>
                )}
                
                {request.client.rating_count > 0 && (
                  <div className="flex items-center text-sm">
                    <Star className="h-3 w-3 text-yellow-400 fill-current mr-1" />
                    <span>{request.client.rating_avg.toFixed(1)} ({request.client.rating_count} reviews)</span>
                  </div>
                )}
              </div>
            </div>

            {!request.client_address && (
              <div className="p-3 bg-blue-50 rounded">
                <p className="text-xs text-blue-700">
                  🔒 <strong>Privacy Protection:</strong> Full client address will be shared only after you accept this booking request.
                </p>
              </div>
            )}
          </div>

          {/* Service Details */}
          <div className="mb-6">
            <h3 className="font-medium text-gray-900 mb-3">Service Details</h3>
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

          {/* GPS Check-in Section for Accepted Bookings */}
          {request.status === 'accepted' && (
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-3">Service Management</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <GPSCheckInButton
                  bookingId={request.id}
                  checkinType="service_start"
                  onSuccess={() => {
                    // Reload the requests to update status
                    window.location.reload()
                  }}
                />
                <GPSCheckInButton
                  bookingId={request.id}
                  checkinType="service_complete"
                  onSuccess={() => {
                    window.location.reload()
                  }}
                />
              </div>
            </div>
          )}

          {/* GPS History for In-Progress/Completed Bookings */}
          {['in_progress', 'completed'].includes(request.status) && (
            <div className="mb-6">
              <GPSHistory bookingId={request.id} />
            </div>
          )}

          {/* Commission Tracking for Accepted/Completed Bookings */}
          {['accepted', 'in_progress', 'completed'].includes(request.status) && (
            <div className="mb-6">
              <CommissionTracker
                bookingId={request.id}
                currentPrice={request.price_agreed}
                currentCommissionRate={request.commission_rate_applied}
                currentCommissionAmount={request.commission_amount}
                paymentStatus={request.payment_status}
                paymentNotes={request.payment_notes}
                onUpdate={() => {
                  // Reload the requests to update commission data
                  window.location.reload()
                }}
              />
            </div>
          )}

          {/* Two-Way Rating System for Completed Bookings */}
          {request.status === 'completed' && (
            <div className="mb-6">
              <TwoWayRating
                bookingId={request.id}
                currentUserId={currentUser?.id || ''}
                currentUserRole="merchant"
                clientUserId={request.client_user_id}
                clientName={request.client.name}
                merchantUserId={request.merchant_user_id}
                merchantName={currentUser?.name || 'Merchant'}
                serviceDetails={request.service_details}
                bookingStatus={request.status}
                onRatingComplete={() => {
                  // Optionally reload or update UI
                  console.log('Rating completed')
                }}
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between items-center pt-6 border-t">
            <div className="text-sm text-gray-500">
              Received {new Date(request.created_at).toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
              })}
            </div>

            <div className="flex space-x-3">
              <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50">
                Contact Client
              </button>
              
              {request.status === 'pending' && onAccept && onDecline ? (
                <>
                  <button 
                    onClick={onDecline}
                    disabled={isProcessing}
                    className="px-4 py-2 border border-red-300 text-red-700 rounded hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {isProcessing ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <X className="h-4 w-4 mr-2" />
                    )}
                    Decline Request
                  </button>
                  <button 
                    onClick={onAccept}
                    disabled={isProcessing}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {isProcessing ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4 mr-2" />
                    )}
                    Accept Request
                  </button>
                </>
              ) : (
                <div className="text-sm text-gray-500">
                  Status: <span className="capitalize font-medium">{request.status}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}