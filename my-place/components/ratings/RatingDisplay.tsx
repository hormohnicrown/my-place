'use client'

import { useState, useEffect } from 'react'
import { getBookingRatings, getUserRatingStats, formatRating, getStarArray, type Rating } from '@/lib/ratings/actions'
import { Star, User, Calendar, Loader2, AlertCircle, MessageSquare } from 'lucide-react'

type RatingDisplayProps = {
  bookingId?: string
  userId?: string
  showBookingRatings?: boolean
  showUserStats?: boolean
  title?: string
  className?: string
}

export default function RatingDisplay({
  bookingId,
  userId,
  showBookingRatings = false,
  showUserStats = false,
  title,
  className = ''
}: RatingDisplayProps) {
  const [ratings, setRatings] = useState<Rating[]>([])
  const [userStats, setUserStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (showBookingRatings && bookingId) {
      loadBookingRatings()
    } else if (showUserStats && userId) {
      loadUserStats()
    } else {
      setLoading(false)
    }
  }, [bookingId, userId, showBookingRatings, showUserStats])

  const loadBookingRatings = async () => {
    if (!bookingId) return

    try {
      setLoading(true)
      setError('')

      const result = await getBookingRatings(bookingId)
      
      if (result.success) {
        setRatings(result.data || [])
      } else {
        setError(result.error || 'Failed to load ratings')
      }
    } catch (err) {
      console.error('Load booking ratings error:', err)
      setError('Failed to load ratings')
    } finally {
      setLoading(false)
    }
  }

  const loadUserStats = async () => {
    if (!userId) return

    try {
      setLoading(true)
      setError('')

      const result = await getUserRatingStats(userId)
      
      if (result.success) {
        setUserStats(result.data)
      } else {
        setError(result.error || 'Failed to load rating stats')
      }
    } catch (err) {
      console.error('Load user stats error:', err)
      setError('Failed to load rating stats')
    } finally {
      setLoading(false)
    }
  }

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const stars = getStarArray(rating)
    const sizeClasses = {
      sm: 'h-3 w-3',
      md: 'h-4 w-4', 
      lg: 'h-5 w-5'
    }

    return (
      <div className="flex items-center space-x-0.5">
        {stars.map((star, index) => (
          <Star
            key={index}
            className={`${sizeClasses[size]} ${
              star === 'full' 
                ? 'text-yellow-400 fill-current'
                : star === 'half'
                ? 'text-yellow-400 fill-current opacity-50'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600 mr-2" />
          <span className="text-gray-600">Loading ratings...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      {/* Header */}
      {title && (
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">{title}</h3>
        </div>
      )}

      {/* User Rating Stats */}
      {showUserStats && userStats && (
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              {renderStars(userStats.rating_avg, 'lg')}
              <span className="ml-2 text-2xl font-bold text-gray-900">
                {formatRating(userStats.rating_avg)}
              </span>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">
                {userStats.rating_count} review{userStats.rating_count !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Rating Distribution */}
          {userStats.rating_count > 0 && (
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = userStats.distribution[stars] || 0
                const percentage = userStats.rating_count > 0 ? (count / userStats.rating_count) * 100 : 0
                
                return (
                  <div key={stars} className="flex items-center text-sm">
                    <span className="w-8 text-gray-600">{stars}</span>
                    <Star className="h-3 w-3 text-yellow-400 fill-current mx-1" />
                    <div className="flex-1 bg-gray-200 rounded-full h-2 mx-2">
                      <div
                        className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="w-8 text-gray-600 text-right">{count}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Booking Ratings List */}
      {showBookingRatings && (
        <div className="p-4">
          {ratings.length === 0 ? (
            <div className="text-center py-6">
              <MessageSquare className="h-8 w-8 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-1">No ratings yet</p>
              <p className="text-sm text-gray-500">
                Ratings will appear here after service completion
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {ratings.map((rating) => (
                <div
                  key={rating.id}
                  className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  {/* Rating Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center">
                      <User className="h-8 w-8 text-gray-400 bg-gray-200 rounded-full p-1.5 mr-3" />
                      <div>
                        <p className="font-medium text-gray-900">
                          {rating.rater_name}
                        </p>
                        <div className="flex items-center mt-1">
                          {renderStars(rating.score, 'sm')}
                          <span className="ml-2 text-sm font-medium text-gray-700">
                            {rating.score}/5
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center text-xs text-gray-500">
                      <Calendar className="h-3 w-3 mr-1" />
                      {formatDate(rating.created_at)}
                    </div>
                  </div>

                  {/* Rating Comment */}
                  {rating.comment && (
                    <div className="mt-3">
                      <p className="text-gray-700 text-sm leading-relaxed">
                        "{rating.comment}"
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* No Data States */}
      {!showUserStats && !showBookingRatings && (
        <div className="p-4 text-center text-gray-500">
          <p>No rating data to display</p>
        </div>
      )}
    </div>
  )
}