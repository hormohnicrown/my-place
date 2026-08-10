'use client'

import { useState, useEffect } from 'react'
import { getBookingRatings, validateRatingAccess, areRatingsComplete } from '@/lib/ratings/actions'
import RatingForm from './RatingForm'
import RatingDisplay from './RatingDisplay'
import { Star, Users, CheckCircle, Clock, Loader2, AlertTriangle } from 'lucide-react'

type TwoWayRatingProps = {
  bookingId: string
  currentUserId: string
  currentUserRole: 'client' | 'merchant'
  clientUserId: string
  clientName: string
  merchantUserId: string
  merchantName: string
  serviceDetails: string
  bookingStatus: string
  onRatingComplete?: () => void
  className?: string
}

export default function TwoWayRating({
  bookingId,
  currentUserId,
  currentUserRole,
  clientUserId,
  clientName,
  merchantUserId,
  merchantName,
  serviceDetails,
  bookingStatus,
  onRatingComplete,
  className = ''
}: TwoWayRatingProps) {
  const [ratings, setRatings] = useState<any[]>([])
  const [canRateClient, setCanRateClient] = useState(false)
  const [canRateMerchant, setCanRateMerchant] = useState(false)
  const [showClientForm, setShowClientForm] = useState(false)
  const [showMerchantForm, setShowMerchantForm] = useState(false)
  const [allRatingsComplete, setAllRatingsComplete] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadRatingData()
  }, [bookingId, currentUserId])

  const loadRatingData = async () => {
    try {
      setLoading(true)
      setError('')

      // Load existing ratings
      const ratingsResult = await getBookingRatings(bookingId)
      if (ratingsResult.success) {
        setRatings(ratingsResult.data || [])
      }

      // Check if user can rate each participant
      if (bookingStatus === 'completed') {
        // Check if current user can rate the other party
        if (currentUserRole === 'merchant') {
          const clientValidation = await validateRatingAccess(bookingId, currentUserId, clientUserId)
          setCanRateClient(clientValidation.success && clientValidation.can_rate)
        } else {
          const merchantValidation = await validateRatingAccess(bookingId, currentUserId, merchantUserId)
          setCanRateMerchant(merchantValidation.success && merchantValidation.can_rate)
        }
      }

      // Check if all ratings are complete
      const complete = await areRatingsComplete(bookingId)
      setAllRatingsComplete(complete)

    } catch (err) {
      console.error('Load rating data error:', err)
      setError('Failed to load rating data')
    } finally {
      setLoading(false)
    }
  }

  const handleRatingSuccess = () => {
    // Reload data after rating submission
    loadRatingData()
    setShowClientForm(false)
    setShowMerchantForm(false)
    onRatingComplete?.()
  }

  const hasRatedClient = ratings.some(r => r.rater_id === currentUserId && r.rated_id === clientUserId)
  const hasRatedMerchant = ratings.some(r => r.rater_id === currentUserId && r.rated_id === merchantUserId)

  if (loading) {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600 mr-2" />
          <span className="text-gray-600">Loading rating information...</span>
        </div>
      </div>
    )
  }

  if (bookingStatus !== 'completed') {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
        <div className="text-center py-6">
          <Clock className="h-8 w-8 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-2">Rating Available After Completion</p>
          <p className="text-sm text-gray-500">
            Both parties can rate each other once the service is marked as completed
          </p>
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
            <Users className="h-6 w-6 text-blue-600 mr-3" />
            <h3 className="text-xl font-semibold text-gray-900">Two-Way Ratings</h3>
          </div>
          
          {allRatingsComplete && (
            <div className="flex items-center text-green-600">
              <CheckCircle className="h-5 w-5 mr-2" />
              <span className="text-sm font-medium">Complete</span>
            </div>
          )}
        </div>
        
        <p className="text-gray-600 mt-2">
          Rate your experience and view mutual feedback for this booking
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-b border-red-200">
          <div className="flex items-start">
            <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      <div className="p-6 space-y-6">
        {/* Current User's Rating Actions */}
        <div>
          <h4 className="font-medium text-gray-900 mb-4">Your Ratings</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Rate Client (Merchant's perspective) */}
            {currentUserRole === 'merchant' && (
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-500 mr-2" />
                    <span className="font-medium text-gray-900">Rate Client</span>
                  </div>
                  
                  {hasRatedClient ? (
                    <span className="text-sm text-green-600 flex items-center">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Rated
                    </span>
                  ) : canRateClient ? (
                    <button
                      onClick={() => setShowClientForm(true)}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Add Rating
                    </button>
                  ) : (
                    <span className="text-sm text-gray-500">Not available</span>
                  )}
                </div>
                
                <p className="text-sm text-gray-600">
                  Rate your experience working with <strong>{clientName}</strong>
                </p>
              </div>
            )}

            {/* Rate Merchant (Client's perspective) */}
            {currentUserRole === 'client' && (
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-500 mr-2" />
                    <span className="font-medium text-gray-900">Rate Service</span>
                  </div>
                  
                  {hasRatedMerchant ? (
                    <span className="text-sm text-green-600 flex items-center">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Rated
                    </span>
                  ) : canRateMerchant ? (
                    <button
                      onClick={() => setShowMerchantForm(true)}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Add Rating
                    </button>
                  ) : (
                    <span className="text-sm text-gray-500">Not available</span>
                  )}
                </div>
                
                <p className="text-sm text-gray-600">
                  Rate the service provided by <strong>{merchantName}</strong>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Rating Forms */}
        {showClientForm && canRateClient && (
          <RatingForm
            bookingId={bookingId}
            ratedUserId={clientUserId}
            ratedUserName={clientName}
            ratedUserRole="client"
            serviceDetails={serviceDetails}
            onSuccess={handleRatingSuccess}
            onCancel={() => setShowClientForm(false)}
          />
        )}

        {showMerchantForm && canRateMerchant && (
          <RatingForm
            bookingId={bookingId}
            ratedUserId={merchantUserId}
            ratedUserName={merchantName}
            ratedUserRole="merchant"
            serviceDetails={serviceDetails}
            onSuccess={handleRatingSuccess}
            onCancel={() => setShowMerchantForm(false)}
          />
        )}

        {/* Existing Ratings Display */}
        {ratings.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-4">Ratings & Reviews</h4>
            <RatingDisplay
              bookingId={bookingId}
              showBookingRatings={true}
            />
          </div>
        )}

        {/* Rating Progress */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-900">Rating Progress</span>
            <span className="text-sm text-blue-700">
              {ratings.length}/2 completed
            </span>
          </div>
          
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(ratings.length / 2) * 100}%` }}
            />
          </div>
          
          <p className="text-xs text-blue-800 mt-2">
            {allRatingsComplete 
              ? '✅ Both parties have rated each other'
              : '⏳ Waiting for mutual ratings to complete the feedback loop'
            }
          </p>
        </div>

        {/* Trust & Safety Notice */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h5 className="text-sm font-medium text-gray-900 mb-2">Rating Guidelines</h5>
          <ul className="text-xs text-gray-700 space-y-1">
            <li>• Ratings are permanent and help build community trust</li>
            <li>• Be honest and constructive in your feedback</li>
            <li>• Focus on the service quality and professionalism</li>
            <li>• Mutual ratings strengthen our marketplace integrity</li>
          </ul>
        </div>
      </div>
    </div>
  )
}