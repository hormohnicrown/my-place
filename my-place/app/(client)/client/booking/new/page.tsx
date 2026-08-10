'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createBookingRequest, getMerchantPublicProfile, getListingDetails } from '@/lib/client/actions'
import { MapPin, Star, Clock, ArrowLeft, AlertCircle, Check, Calendar, User, MessageSquare } from 'lucide-react'
import Link from 'next/link'

type MerchantInfo = {
  id: string
  name: string
  category: string
  city: string
  state: string
  rating_avg: number
  rating_count: number
  profile_photo_url: string | null
}

type ListingInfo = {
  id: string
  title: string
  price: number
  description: string
}

export default function NewBookingPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const merchantId = searchParams.get('merchant')
  const listingId = searchParams.get('listing')

  const [merchant, setMerchant] = useState<MerchantInfo | null>(null)
  const [listing, setListing] = useState<ListingInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    service_details: '',
    preferred_date: '',
    preferred_time_start: '09:00',
    preferred_time_end: '17:00',
    special_requirements: '',
    client_address: ''
  })

  useEffect(() => {
    loadData()
  }, [merchantId, listingId])

  const loadData = async () => {
    try {
      setLoading(true)
      setError('')

      if (listingId) {
        // Load listing details (includes merchant info)
        const listingResult = await getListingDetails(listingId)
        if (listingResult.success) {
          const listingData = listingResult.data
          setListing({
            id: listingData.id,
            title: listingData.title,
            price: listingData.price,
            description: listingData.description
          })
          setMerchant({
            id: listingData.merchant.id,
            name: listingData.merchant.name,
            category: listingData.merchant.category,
            city: listingData.merchant.city,
            state: listingData.merchant.state,
            rating_avg: listingData.merchant.rating_avg,
            rating_count: listingData.merchant.rating_count,
            profile_photo_url: listingData.merchant.profile_photo_url
          })
          // Pre-fill service details with listing info
          setFormData(prev => ({
            ...prev,
            service_details: `Requesting service: ${listingData.title}\n\n${listingData.description}`
          }))
        } else {
          setError('Listing not found')
        }
      } else if (merchantId) {
        // Load merchant profile only
        const merchantResult = await getMerchantPublicProfile(merchantId)
        if (merchantResult.success) {
          const merchantData = merchantResult.data
          setMerchant({
            id: merchantData.id,
            name: merchantData.name,
            category: merchantData.category,
            city: merchantData.city,
            state: merchantData.state,
            rating_avg: merchantData.rating_avg,
            rating_count: merchantData.rating_count,
            profile_photo_url: merchantData.profile_photo_url
          })
        } else {
          setError('Merchant not found')
        }
      } else {
        setError('No merchant or listing specified')
      }
    } catch (err) {
      console.error('Load error:', err)
      setError('Failed to load information')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!merchant) return
    
    setSubmitting(true)
    setError('')

    try {
      // Validate form
      if (!formData.service_details.trim()) {
        setError('Service details are required')
        return
      }

      if (!formData.preferred_date) {
        setError('Preferred date is required')
        return
      }

      if (!formData.client_address.trim()) {
        setError('Your address is required for service delivery')
        return
      }

      // Check date is not in the past
      const selectedDate = new Date(formData.preferred_date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      if (selectedDate < today) {
        setError('Preferred date cannot be in the past')
        return
      }

      // Validate time range
      if (formData.preferred_time_start >= formData.preferred_time_end) {
        setError('End time must be after start time')
        return
      }

      const requestData = {
        merchant_profile_id: listingId ? undefined : merchant.id,
        listing_id: listingId || undefined,
        service_details: formData.service_details.trim(),
        preferred_date: formData.preferred_date,
        preferred_time_start: formData.preferred_time_start,
        preferred_time_end: formData.preferred_time_end,
        special_requirements: formData.special_requirements.trim() || undefined,
        client_address: formData.client_address.trim()
      }

      const result = await createBookingRequest(requestData)

      if (result.success) {
        setSuccess(true)
        // Redirect after 3 seconds
        setTimeout(() => {
          router.push('/client/bookings')
        }, 3000)
      } else {
        setError(result.error || 'Failed to send booking request')
      }
    } catch (err) {
      console.error('Submit error:', err)
      setError('An unexpected error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading booking information...</p>
        </div>
      </div>
    )
  }

  if (error && !merchant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Booking Not Available</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/client/search"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Search
          </Link>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Booking Request Sent!</h1>
          <p className="text-gray-600 mb-6">
            Your request has been sent to {merchant?.name}. You'll be notified when they respond.
          </p>
          <div className="space-x-4">
            <Link
              href="/client/bookings"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              View My Requests
            </Link>
            <Link
              href="/client/search"
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Find More Services
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const formatPrice = (price: number) => {
    return `₦${price.toLocaleString()}`
  }

  const getTomorrowDate = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Navigation */}
        <Link
          href={listingId ? `/client/listings/${listingId}` : `/client/merchants/${merchantId}`}
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to {listingId ? 'Listing' : 'Profile'}
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border p-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-6">
                Request Service Booking
              </h1>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
                    <p className="text-red-800">{error}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Service Details */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Service Details *
                  </label>
                  <textarea
                    value={formData.service_details}
                    onChange={(e) => setFormData(prev => ({ ...prev, service_details: e.target.value }))}
                    placeholder="Describe what you need help with..."
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Provide clear details about the work you need done
                  </p>
                </div>

                {/* Preferred Date & Time */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preferred Date *
                    </label>
                    <input
                      type="date"
                      value={formData.preferred_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, preferred_date: e.target.value }))}
                      min={getTomorrowDate()}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Time *
                    </label>
                    <input
                      type="time"
                      value={formData.preferred_time_start}
                      onChange={(e) => setFormData(prev => ({ ...prev, preferred_time_start: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Time *
                    </label>
                    <input
                      type="time"
                      value={formData.preferred_time_end}
                      onChange={(e) => setFormData(prev => ({ ...prev, preferred_time_end: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                {/* Client Address - STORED BUT PRIVACY ENFORCED */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Address *
                  </label>
                  <textarea
                    value={formData.client_address}
                    onChange={(e) => setFormData(prev => ({ ...prev, client_address: e.target.value }))}
                    placeholder="Enter your full address where the service will be performed..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-blue-700 leading-relaxed">
                      🔒 <strong>Privacy Protection:</strong> Your full address is stored securely but only your city is visible to the merchant until they accept your booking request.
                    </p>
                  </div>
                </div>

                {/* Special Requirements */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Special Requirements
                  </label>
                  <textarea
                    value={formData.special_requirements}
                    onChange={(e) => setFormData(prev => ({ ...prev, special_requirements: e.target.value }))}
                    placeholder="Any specific requirements, materials needed, accessibility considerations, etc..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Submit Button */}
                <div className="flex justify-end space-x-4 pt-6 border-t">
                  <Link
                    href={listingId ? `/client/listings/${listingId}` : `/client/merchants/${merchantId}`}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Sending Request...
                      </>
                    ) : (
                      <>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Send Booking Request
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Merchant Info */}
            {merchant && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Provider</h3>
                
                <div className="flex items-center mb-4">
                  {merchant.profile_photo_url ? (
                    <img
                      src={merchant.profile_photo_url}
                      alt={merchant.name}
                      className="w-12 h-12 rounded-full object-cover mr-4"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center mr-4">
                      <User className="h-6 w-6 text-gray-600" />
                    </div>
                  )}

                  <div>
                    <h4 className="font-semibold text-gray-900">{merchant.name}</h4>
                    <p className="text-sm text-blue-600 capitalize">{merchant.category}</p>
                    {merchant.rating_count > 0 && (
                      <div className="flex items-center text-sm">
                        <Star className="h-3 w-3 text-yellow-400 fill-current mr-1" />
                        <span>{merchant.rating_avg.toFixed(1)} ({merchant.rating_count})</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Location - ADDRESS PRIVACY */}
                <div className="flex items-center text-sm text-gray-600 mb-4">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>{merchant.city}, {merchant.state}</span>
                </div>

                <Link
                  href={`/client/merchants/${merchant.id}`}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  View Full Profile →
                </Link>
              </div>
            )}

            {/* Listing Info */}
            {listing && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Selected Service</h3>
                
                <h4 className="font-medium text-gray-900 mb-2">{listing.title}</h4>
                <p className="text-2xl font-bold text-blue-600 mb-3">{formatPrice(listing.price)}</p>
                <p className="text-sm text-gray-600 leading-relaxed">{listing.description}</p>
              </div>
            )}

            {/* Booking Info */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Process</h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                    <span className="text-blue-600 font-semibold">1</span>
                  </div>
                  <p className="text-gray-700">Send your booking request with details</p>
                </div>

                <div className="flex items-start">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                    <span className="text-blue-600 font-semibold">2</span>
                  </div>
                  <p className="text-gray-700">Merchant reviews and contacts you</p>
                </div>

                <div className="flex items-start">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                    <span className="text-blue-600 font-semibold">3</span>
                  </div>
                  <p className="text-gray-700">Confirm details and schedule service</p>
                </div>

                <div className="flex items-start">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                    <span className="text-blue-600 font-semibold">4</span>
                  </div>
                  <p className="text-gray-700">GPS check-in/out ensures safety</p>
                </div>
              </div>
            </div>

            {/* Trust & Safety */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Trust & Safety</h3>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center text-green-600">
                  <Check className="h-4 w-4 mr-2" />
                  <span>ID verified merchants only</span>
                </div>
                <div className="flex items-center text-blue-600">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>GPS tracking for all services</span>
                </div>
                <div className="flex items-center text-purple-600">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>Two-way ratings system</span>
                </div>
              </div>

              <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600">
                Your address is protected until booking confirmation for privacy and safety.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}