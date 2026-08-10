'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { getListingDetails } from '@/lib/client/actions'
import { MapPin, Star, Shield, Clock, ArrowLeft, MessageCircle, Calendar, User } from 'lucide-react'
import Link from 'next/link'

type ListingDetails = {
  id: string
  merchant_profile_id: string
  title: string
  description: string
  price: number
  category: string
  created_at: string
  updated_at: string
  merchant: {
    id: string
    user_id: string
    name: string
    category: string
    description: string
    rating_avg: number
    rating_count: number
    profile_photo_url: string | null
    service_area_radius_km: number
    city: string
    state: string
    verification_status: string
  }
}

export default function ListingDetailPage() {
  const params = useParams()
  const listingId = params.id as string

  const [listing, setListing] = useState<ListingDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadListing()
  }, [listingId])

  const loadListing = async () => {
    try {
      setLoading(true)
      setError('')

      const result = await getListingDetails(listingId)

      if (result.success) {
        setListing(result.data)
      } else {
        setError(result.error || 'Failed to load listing')
      }
    } catch (err) {
      console.error('Listing load error:', err)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return `₦${price.toLocaleString()}`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 24) {
      return `${diffInHours} hours ago`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      return `${diffInDays} days ago`
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading listing details...</p>
        </div>
      </div>
    )
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Listing Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'This listing could not be found or may no longer be available.'}</p>
          <Link
            href="/client/listings"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Listings
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Navigation */}
        <Link
          href="/client/listings"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Listings
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Listing Header */}
            <div className="bg-white rounded-lg shadow-sm border p-8 mb-8">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm capitalize">
                    {listing.category}
                  </span>
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>Posted {formatTimeAgo(listing.created_at)}</span>
                  </div>
                </div>

                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  {listing.title}
                </h1>

                <div className="text-4xl font-bold text-blue-600 mb-6">
                  {formatPrice(listing.price)}
                </div>
              </div>

              {/* Description */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Description</h2>
                <div className="prose max-w-none text-gray-700">
                  {listing.description.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-4 last:mb-0">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            </div>

            {/* Merchant Info */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">About the Service Provider</h2>
              
              <div className="flex items-start">
                {/* Profile Photo */}
                {listing.merchant.profile_photo_url ? (
                  <img
                    src={listing.merchant.profile_photo_url}
                    alt={listing.merchant.name}
                    className="w-16 h-16 rounded-full object-cover mr-4"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mr-4">
                    <User className="h-8 w-8 text-gray-600" />
                  </div>
                )}

                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {listing.merchant.name}
                    </h3>
                    <Link
                      href={`/client/merchants/${listing.merchant.id}`}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      View Full Profile →
                    </Link>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 mb-3">
                    {/* Category */}
                    <span className="text-gray-600 capitalize">{listing.merchant.category}</span>

                    {/* Rating */}
                    {listing.merchant.rating_count > 0 && (
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                        <span className="font-medium">{listing.merchant.rating_avg.toFixed(1)}</span>
                        <span className="text-gray-500 ml-1">({listing.merchant.rating_count} reviews)</span>
                      </div>
                    )}

                    {/* Verification */}
                    <div className="flex items-center text-green-600 text-sm">
                      <Shield className="h-4 w-4 mr-1" />
                      <span>ID Verified</span>
                    </div>
                  </div>

                  {/* Location - ADDRESS PRIVACY ENFORCED */}
                  <div className="flex items-center text-gray-600 mb-3">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span>{listing.merchant.city}, {listing.merchant.state}</span>
                    <span className="ml-2 text-sm text-gray-500">
                      (serves {listing.merchant.service_area_radius_km}km radius)
                    </span>
                  </div>

                  {/* Merchant Description */}
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {listing.merchant.description}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Action Card */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Get This Service</h3>
              
              <div className="space-y-3">
                <Link
                  href={`/client/booking/new?listing=${listing.id}`}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center font-medium block"
                >
                  <Calendar className="h-4 w-4 inline mr-2" />
                  Request Booking
                </Link>
                
                <Link
                  href={`/client/merchants/${listing.merchant.id}`}
                  className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-center block"
                >
                  <User className="h-4 w-4 inline mr-2" />
                  View Merchant Profile
                </Link>

                <button className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Send Message
                </button>
              </div>

              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-700 leading-relaxed">
                  💡 All bookings include GPS check-in/out for your safety and transparent service delivery.
                </p>
              </div>
            </div>

            {/* Listing Details */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Listing Details</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500 block">Category</label>
                  <p className="capitalize text-gray-900">{listing.category}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500 block">Price</label>
                  <p className="text-lg font-semibold text-gray-900">{formatPrice(listing.price)}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500 block">Posted</label>
                  <p className="text-gray-900">{formatDate(listing.created_at)}</p>
                </div>

                {listing.updated_at !== listing.created_at && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 block">Last Updated</label>
                    <p className="text-gray-900">{formatDate(listing.updated_at)}</p>
                  </div>
                )}

                {/* Service Area - ADDRESS PRIVACY */}
                <div>
                  <label className="text-sm font-medium text-gray-500 block">Service Area</label>
                  <p className="text-gray-900">{listing.merchant.city} and surrounding {listing.merchant.service_area_radius_km}km</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Exact location shared after booking confirmation
                  </p>
                </div>
              </div>
            </div>

            {/* Safety Notice */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Safety & Trust</h3>
              
              <div className="space-y-2">
                <div className="flex items-center text-green-600 text-sm">
                  <Shield className="h-4 w-4 mr-2" />
                  <span>ID verified merchant</span>
                </div>
                <div className="flex items-center text-blue-600 text-sm">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>GPS tracking required</span>
                </div>
                <div className="flex items-center text-purple-600 text-sm">
                  <Star className="h-4 w-4 mr-2" />
                  <span>Two-way rating system</span>
                </div>
              </div>

              <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600">
                Report any issues or concerns to our trust & safety team immediately.
              </div>
            </div>

            {/* Report */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <button className="text-sm text-red-600 hover:text-red-700">
                Report this listing
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}