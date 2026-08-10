'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { getMerchantPublicProfile } from '@/lib/client/actions'
import { MapPin, Star, Shield, Clock, ArrowLeft, MessageCircle, ExternalLink } from 'lucide-react'
import Link from 'next/link'

type MerchantProfile = {
  id: string
  user_id: string
  name: string
  category: string
  description: string
  price_range_min: number | null
  price_range_max: number | null
  service_area_radius_km: number
  rating_avg: number
  rating_count: number
  profile_photo_url: string | null
  imported_testimonials: any[] | null
  city: string
  state: string
  verification_status: string
  created_at: string
}

export default function MerchantProfilePage() {
  const params = useParams()
  const merchantId = params.id as string

  const [profile, setProfile] = useState<MerchantProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadProfile()
  }, [merchantId])

  const loadProfile = async () => {
    try {
      setLoading(true)
      setError('')

      const result = await getMerchantPublicProfile(merchantId)

      if (result.success) {
        setProfile(result.data)
      } else {
        setError(result.error || 'Failed to load merchant profile')
      }
    } catch (err) {
      console.error('Profile load error:', err)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (min: number | null, max: number | null) => {
    if (min === null && max === null) return 'Price on request'
    if (min !== null && max !== null) return `₦${min.toLocaleString()} - ₦${max.toLocaleString()}`
    if (min !== null) return `From ₦${min.toLocaleString()}`
    if (max !== null) return `Up to ₦${max.toLocaleString()}`
    return 'Price on request'
  }

  const formatJoinDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading merchant profile...</p>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Profile Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'This merchant profile could not be found.'}</p>
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Navigation */}
        <Link
          href="/client/search"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Search
        </Link>

        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="p-8">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between">
              <div className="flex items-center mb-6 md:mb-0">
                {/* Profile Photo */}
                {profile.profile_photo_url ? (
                  <img
                    src={profile.profile_photo_url}
                    alt={profile.name}
                    className="w-20 h-20 rounded-full object-cover mr-6"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center mr-6">
                    <span className="text-gray-600 font-bold text-2xl">
                      {profile.name.charAt(0)}
                    </span>
                  </div>
                )}

                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {profile.name}
                  </h1>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    {/* Category */}
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full capitalize">
                      {profile.category}
                    </span>

                    {/* Verification Status */}
                    <div className="flex items-center text-green-600">
                      <Shield className="h-4 w-4 mr-1" />
                      <span>ID Verified</span>
                    </div>

                    {/* Member Since */}
                    <div className="flex items-center text-gray-500">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>Member since {formatJoinDate(profile.created_at)}</span>
                    </div>
                  </div>

                  {/* Rating */}
                  {profile.rating_count > 0 && (
                    <div className="flex items-center mt-3">
                      <div className="flex items-center mr-4">
                        <Star className="h-5 w-5 text-yellow-400 fill-current mr-1" />
                        <span className="font-semibold text-lg">{profile.rating_avg.toFixed(1)}</span>
                        <span className="text-gray-500 ml-2">({profile.rating_count} reviews)</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 min-w-[200px]">
                <Link
                  href={`/client/booking/new?merchant=${profile.id}`}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center font-medium"
                >
                  Request Booking
                </Link>
                <button className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Message
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* About Section */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">About</h2>
              <p className="text-gray-700 leading-relaxed">
                {profile.description}
              </p>
            </div>

            {/* Testimonials Section (Off-Platform) */}
            {profile.imported_testimonials && profile.imported_testimonials.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  External Testimonials
                </h2>
                <div className="space-y-4">
                  {profile.imported_testimonials.map((testimonial, index) => (
                    <div key={index} className="border-l-4 border-amber-400 pl-4 py-2 bg-amber-50">
                      {/* TRD requirement: Visual distinction for off-platform testimonials */}
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-sm font-medium text-amber-800">
                          External Testimonial
                        </p>
                        <ExternalLink className="h-4 w-4 text-amber-600" />
                      </div>
                      <p className="text-gray-700 text-sm leading-relaxed">
                        "{testimonial.content}"
                      </p>
                      <p className="text-xs text-amber-700 mt-2">
                        — {testimonial.client_name} 
                        {testimonial.platform && (
                          <span> (via {testimonial.platform})</span>
                        )}
                      </p>
                      <p className="text-xs text-amber-600 mt-1">
                        ⚠️ Not verified by My Place - imported from external source
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Service Details */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Details</h3>
              
              <div className="space-y-4">
                {/* Price Range */}
                <div>
                  <label className="text-sm font-medium text-gray-500 block mb-1">
                    Pricing
                  </label>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatPrice(profile.price_range_min, profile.price_range_max)}
                  </p>
                </div>

                {/* Location - ADDRESS PRIVACY ENFORCED */}
                <div>
                  <label className="text-sm font-medium text-gray-500 block mb-1">
                    Location
                  </label>
                  <div className="flex items-center text-gray-700">
                    <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{profile.city}, {profile.state}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Serves {profile.service_area_radius_km}km radius
                  </p>
                  <p className="text-xs text-blue-600 mt-2">
                    ℹ️ Exact address shared only after booking confirmation for privacy
                  </p>
                </div>

                {/* Category */}
                <div>
                  <label className="text-sm font-medium text-gray-500 block mb-1">
                    Specialty
                  </label>
                  <p className="capitalize text-gray-900">{profile.category}</p>
                </div>
              </div>
            </div>

            {/* Trust & Safety */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Trust & Safety</h3>
              
              <div className="space-y-3">
                <div className="flex items-center text-green-600">
                  <Shield className="h-5 w-5 mr-3" />
                  <div>
                    <p className="font-medium">ID Verified</p>
                    <p className="text-xs text-gray-500">Identity confirmed by My Place</p>
                  </div>
                </div>

                <div className="flex items-center text-blue-600">
                  <MapPin className="h-5 w-5 mr-3" />
                  <div>
                    <p className="font-medium">Location Verified</p>
                    <p className="text-xs text-gray-500">Service area confirmed</p>
                  </div>
                </div>

                {profile.rating_count > 0 && (
                  <div className="flex items-center text-yellow-600">
                    <Star className="h-5 w-5 mr-3" />
                    <div>
                      <p className="font-medium">{profile.rating_count} Reviews</p>
                      <p className="text-xs text-gray-500">Verified customer feedback</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600 leading-relaxed">
                  All My Place merchants undergo ID verification and background checks. 
                  GPS check-in/out is required for all bookings.
                </p>
              </div>
            </div>

            {/* Report */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <button className="text-sm text-red-600 hover:text-red-700">
                Report this profile
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}