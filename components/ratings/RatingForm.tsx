'use client'

import { useState } from 'react'
import { submitRating, type RatingSubmission } from '@/lib/ratings/actions'
import { Star, Loader2, Check, AlertTriangle } from 'lucide-react'

type RatingFormProps = {
  bookingId: string
  ratedUserId: string
  ratedUserName: string
  ratedUserRole: 'client' | 'merchant'
  serviceDetails: string
  onSuccess?: () => void
  onCancel?: () => void
  className?: string
}

export default function RatingForm({
  bookingId,
  ratedUserId,
  ratedUserName,
  ratedUserRole,
  serviceDetails,
  onSuccess,
  onCancel,
  className = ''
}: RatingFormProps) {
  const [rating, setRating] = useState(0)
  const [hoveredStar, setHoveredStar] = useState(0)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleStarClick = (starValue: number) => {
    setRating(starValue)
    setError('')
  }

  const handleStarHover = (starValue: number) => {
    setHoveredStar(starValue)
  }

  const handleStarLeave = () => {
    setHoveredStar(0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (rating === 0) {
      setError('Please select a rating')
      return
    }

    try {
      setIsSubmitting(true)
      setError('')

      const submission: RatingSubmission = {
        booking_request_id: bookingId,
        rated_user_id: ratedUserId,
        score: rating,
        comment: comment.trim() || undefined
      }

      const result = await submitRating(submission)

      if (result.success) {
        setSuccess(true)
        setTimeout(() => {
          onSuccess?.()
        }, 1500) // Show success message then call callback
      } else {
        setError(result.error || 'Failed to submit rating')
      }
    } catch (err) {
      console.error('Rating submission error:', err)
      setError('Failed to submit rating')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getRatingLabel = (stars: number) => {
    switch (stars) {
      case 1: return 'Poor'
      case 2: return 'Fair' 
      case 3: return 'Good'
      case 4: return 'Very Good'
      case 5: return 'Excellent'
      default: return ''
    }
  }

  if (success) {
    return (
      <div className={`bg-white border border-green-200 rounded-lg p-6 ${className}`}>
        <div className="text-center">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <Check className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Rating Submitted!</h3>
          <p className="text-gray-600">
            Thank you for rating {ratedUserName}. Your feedback helps improve our community.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Rate {ratedUserRole === 'client' ? 'Client' : 'Merchant'}
        </h3>
        <div className="text-sm text-gray-600">
          <p className="mb-1">
            <strong>{ratedUserName}</strong> ({ratedUserRole})
          </p>
          <p className="italic">"{serviceDetails}"</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Star Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            How would you rate this {ratedUserRole === 'client' ? 'client' : 'service'}?
          </label>
          
          <div className="flex items-center space-x-1 mb-2">
            {[1, 2, 3, 4, 5].map((star) => {
              const isActive = star <= (hoveredStar || rating)
              return (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleStarClick(star)}
                  onMouseEnter={() => handleStarHover(star)}
                  onMouseLeave={handleStarLeave}
                  className={`
                    p-1 rounded transition-colors
                    ${isActive ? 'text-yellow-400' : 'text-gray-300'}
                    hover:text-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-1
                  `}
                >
                  <Star 
                    className="h-8 w-8" 
                    fill={isActive ? 'currentColor' : 'none'}
                  />
                </button>
              )
            })}
          </div>
          
          {(hoveredStar > 0 || rating > 0) && (
            <p className="text-sm text-gray-600">
              {getRatingLabel(hoveredStar || rating)}
            </p>
          )}
        </div>

        {/* Comment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Comments (optional)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={
              ratedUserRole === 'client' 
                ? 'Share your experience working with this client...'
                : 'Share your experience with this service...'
            }
            rows={4}
            maxLength={500}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          />
          <div className="flex justify-between items-center mt-1">
            <p className="text-xs text-gray-500">
              Help others by sharing specific details about your experience
            </p>
            <span className="text-xs text-gray-500">
              {comment.length}/500
            </span>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start">
              <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            type="submit"
            disabled={isSubmitting || rating === 0}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-medium"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Submitting...
              </>
            ) : (
              <>
                <Star className="h-4 w-4 mr-2" />
                Submit Rating
              </>
            )}
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-4 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Rating Guidelines */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Rating Guidelines</h4>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• <strong>5 stars:</strong> Excellent - exceeded expectations</li>
          <li>• <strong>4 stars:</strong> Very good - met expectations well</li>
          <li>• <strong>3 stars:</strong> Good - satisfied with experience</li>
          <li>• <strong>2 stars:</strong> Fair - some issues but acceptable</li>
          <li>• <strong>1 star:</strong> Poor - significant problems</li>
        </ul>
        <p className="text-xs text-blue-700 mt-2 font-medium">
          💡 Ratings are permanent and help build trust in our community
        </p>
      </div>
    </div>
  )
}