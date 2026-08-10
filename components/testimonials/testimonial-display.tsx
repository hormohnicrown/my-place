'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { MessageSquare, Star, MapPin, Calendar, Instagram, MessageCircle, Phone, Users } from 'lucide-react'

export interface DisplayTestimonial {
  source: 'off_platform'
  text: string
  author: string
  platform: 'whatsapp' | 'instagram' | 'facebook' | 'text_message' | 'word_of_mouth'
  date?: string
  rating?: number
  service_type?: string
  location?: string
}

interface TestimonialDisplayProps {
  testimonials: DisplayTestimonial[]
  showTitle?: boolean
  compact?: boolean
  maxDisplay?: number
}

export function TestimonialDisplay({ 
  testimonials, 
  showTitle = true, 
  compact = false,
  maxDisplay = 5 
}: TestimonialDisplayProps) {
  const displayTestimonials = testimonials.slice(0, maxDisplay)

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'whatsapp':
        return <MessageCircle className="w-4 h-4 text-green-600" />
      case 'instagram':
        return <Instagram className="w-4 h-4 text-pink-600" />
      case 'facebook':
        return <div className="w-4 h-4 bg-blue-600 rounded text-white flex items-center justify-center text-xs font-bold">f</div>
      case 'text_message':
        return <Phone className="w-4 h-4 text-blue-600" />
      case 'word_of_mouth':
        return <Users className="w-4 h-4 text-purple-600" />
      default:
        return <MessageSquare className="w-4 h-4 text-gray-600" />
    }
  }

  const getPlatformName = (platform: string) => {
    switch (platform) {
      case 'whatsapp':
        return 'WhatsApp'
      case 'instagram':
        return 'Instagram'
      case 'facebook':
        return 'Facebook'
      case 'text_message':
        return 'Text Message'
      case 'word_of_mouth':
        return 'Word of Mouth'
      default:
        return 'Social Media'
    }
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short' 
      })
    } catch {
      return null
    }
  }

  if (!displayTestimonials || displayTestimonials.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      {showTitle && (
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <MessageSquare className="w-5 h-5 mr-2 text-blue-600" />
            Customer Reviews
          </h3>
          <Badge variant="outline" className="border-blue-300 text-blue-700 bg-blue-50">
            {testimonials.length} review{testimonials.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      )}

      <div className="space-y-3">
        {displayTestimonials.map((testimonial, index) => (
          <Card key={index} className="border-l-4 border-blue-400 bg-blue-50/30">
            <CardContent className={compact ? "p-4" : "p-6"}>
              <div className="space-y-3">
                {/* Testimonial Text */}
                <blockquote className="text-gray-700 italic">
                  "{testimonial.text}"
                </blockquote>

                {/* Rating if available */}
                {testimonial.rating && (
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star}
                        className={`w-4 h-4 ${
                          star <= testimonial.rating! 
                            ? 'text-yellow-400 fill-current' 
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="text-sm text-gray-600 ml-2">
                      {testimonial.rating}/5 stars
                    </span>
                  </div>
                )}

                {/* Service type and location */}
                <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                  {testimonial.service_type && (
                    <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                      {testimonial.service_type}
                    </Badge>
                  )}
                  {testimonial.location && (
                    <div className="flex items-center">
                      <MapPin className="w-3 h-3 mr-1" />
                      {testimonial.location}
                    </div>
                  )}
                </div>

                {/* Author and platform info */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                  <div className="flex items-center space-x-2">
                    <div className="font-medium text-gray-900">
                      {testimonial.author}
                    </div>
                    <Badge variant="outline" className="border-orange-300 text-orange-700 bg-orange-50 text-xs">
                      Off-platform review
                    </Badge>
                  </div>

                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    {getPlatformIcon(testimonial.platform)}
                    <span>{getPlatformName(testimonial.platform)}</span>
                    {testimonial.date && formatDate(testimonial.date) && (
                      <>
                        <span>•</span>
                        <div className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {formatDate(testimonial.date)}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Show more indicator */}
      {testimonials.length > maxDisplay && (
        <div className="text-center text-sm text-gray-500 pt-2">
          + {testimonials.length - maxDisplay} more review{testimonials.length - maxDisplay !== 1 ? 's' : ''}
        </div>
      )}

      {/* Off-platform disclaimer */}
      <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
        <div className="flex items-center">
          <MessageSquare className="w-3 h-3 mr-1" />
          <strong>Off-platform reviews:</strong>
        </div>
        <div className="mt-1">
          These reviews were collected from WhatsApp, Instagram, and other platforms before this merchant joined My Place. 
          All future bookings will generate verified on-platform reviews.
        </div>
      </div>
    </div>
  )
}

// Simplified version for merchant cards/listings
export function CompactTestimonialDisplay({ 
  testimonials, 
  maxDisplay = 2 
}: { 
  testimonials: DisplayTestimonial[]
  maxDisplay?: number 
}) {
  if (!testimonials || testimonials.length === 0) {
    return null
  }

  const displayTestimonials = testimonials.slice(0, maxDisplay)

  return (
    <div className="space-y-2">
      {displayTestimonials.map((testimonial, index) => (
        <div key={index} className="bg-gray-50 p-3 rounded-lg text-sm">
          <div className="text-gray-700 mb-2 line-clamp-2">
            "{testimonial.text}"
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="font-medium">{testimonial.author}</span>
            <div className="flex items-center space-x-1">
              {testimonial.rating && (
                <div className="flex items-center">
                  <Star className="w-3 h-3 text-yellow-400 fill-current" />
                  <span className="ml-1">{testimonial.rating}</span>
                </div>
              )}
              <Badge variant="outline" className="text-xs border-orange-300 text-orange-700">
                Off-platform
              </Badge>
            </div>
          </div>
        </div>
      ))}
      
      {testimonials.length > maxDisplay && (
        <div className="text-xs text-gray-500 text-center">
          +{testimonials.length - maxDisplay} more reviews
        </div>
      )}
    </div>
  )
}