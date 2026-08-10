'use client'

import { useState, useEffect } from 'react'
import { searchListings, type ListingSearchFilters, type ListingSearchResult } from '@/lib/client/actions'
import { MapPin, Star, Filter, Loader2, AlertCircle, Clock, User, ArrowUpDown } from 'lucide-react'
import Link from 'next/link'

const CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'tailoring', label: 'Tailoring' },
  { value: 'carpentry', label: 'Carpentry' },
  { value: 'welding', label: 'Welding' },
  { value: 'plumbing', label: 'Plumbing' },
]

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated Merchants' },
]

const DISTANCE_OPTIONS = [
  { value: 5, label: '5 km' },
  { value: 10, label: '10 km' },
  { value: 20, label: '20 km' },
  { value: 50, label: '50 km' },
]

export default function ListingsBrowsePage() {
  const [results, setResults] = useState<ListingSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationError, setLocationError] = useState('')

  const [filters, setFilters] = useState<ListingSearchFilters>({
    category: 'all',
    sortBy: 'newest',
    minPrice: undefined,
    maxPrice: undefined,
    maxDistance: undefined,
  })

  // Get user location on component mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setUserLocation({ lat: latitude, lng: longitude })
          setLocationError('')
        },
        (error) => {
          setLocationError('Location access denied. Listings will show without distance filtering.')
          console.log('Geolocation error:', error)
        }
      )
    } else {
      setLocationError('Geolocation not supported. Listings will show without distance filtering.')
    }
  }, [])

  // Search listings when filters change or location is available
  useEffect(() => {
    handleSearch()
  }, [filters, userLocation])

  const handleSearch = async () => {
    setLoading(true)
    setError('')

    try {
      const searchFilters: ListingSearchFilters = {
        ...filters,
        userLat: userLocation?.lat,
        userLng: userLocation?.lng,
      }

      const result = await searchListings(searchFilters)

      if (result.success) {
        setResults(result.data || [])
      } else {
        setError(result.error || 'Failed to search listings')
      }
    } catch (err) {
      console.error('Search error:', err)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return `₦${price.toLocaleString()}`
  }

  const formatDistance = (distance?: number) => {
    if (distance === undefined) return ''
    return `${distance.toFixed(1)} km away`
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 24) {
      return `${diffInHours}h ago`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      return `${diffInDays}d ago`
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Browse Services
          </h1>
          <p className="text-gray-600">
            Explore active service listings from verified artisans in your area.
          </p>
        </div>

        {/* Location Status */}
        {locationError && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800">Location Notice</h3>
                <p className="text-sm text-yellow-700 mt-1">{locationError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Search Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex items-center mb-4">
            <Filter className="h-5 w-5 text-gray-500 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Filter & Sort</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  category: e.target.value as any 
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <ArrowUpDown className="h-4 w-4 inline mr-1" />
                Sort By
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  sortBy: e.target.value as any 
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Distance Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Distance {!userLocation && '(Location Required)'}
              </label>
              <select
                value={filters.maxDistance || ''}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  maxDistance: e.target.value ? Number(e.target.value) : undefined 
                }))}
                disabled={!userLocation}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
              >
                <option value="">No limit</option>
                {DISTANCE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Min Price (₦)
              </label>
              <input
                type="number"
                value={filters.minPrice || ''}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  minPrice: e.target.value ? Number(e.target.value) : undefined 
                }))}
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Price (₦)
              </label>
              <input
                type="number"
                value={filters.maxPrice || ''}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  maxPrice: e.target.value ? Number(e.target.value) : undefined 
                }))}
                placeholder="No limit"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Search Results */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {loading ? 'Searching...' : `${results.length} listings found`}
            </h2>
            {userLocation && filters.maxDistance && (
              <p className="text-sm text-gray-600">
                Within {filters.maxDistance}km of your location
              </p>
            )}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading listings...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
                <p className="text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* Results Grid */}
          {!loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((listing) => (
                <Link
                  key={listing.id}
                  href={`/client/listings/${listing.id}`}
                  className="bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="p-6">
                    {/* Listing Header */}
                    <div className="mb-4">
                      <h3 className="font-semibold text-gray-900 text-lg mb-2 line-clamp-2">
                        {listing.title}
                      </h3>
                      <div className="flex items-center justify-between text-sm">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full capitalize">
                          {listing.category}
                        </span>
                        <div className="flex items-center text-gray-500">
                          <Clock className="h-4 w-4 mr-1" />
                          <span>{formatTimeAgo(listing.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="mb-4">
                      <span className="text-2xl font-bold text-gray-900">
                        {formatPrice(listing.price)}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {listing.description}
                    </p>

                    {/* Merchant Info */}
                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          {listing.merchant.profile_photo_url ? (
                            <img
                              src={listing.merchant.profile_photo_url}
                              alt={listing.merchant.name}
                              className="w-8 h-8 rounded-full object-cover mr-3"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                              <User className="h-4 w-4 text-gray-600" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900 text-sm">
                              {listing.merchant.name}
                            </p>
                            {listing.merchant.rating_count > 0 && (
                              <div className="flex items-center">
                                <Star className="h-3 w-3 text-yellow-400 fill-current mr-1" />
                                <span className="text-xs text-gray-600">
                                  {listing.merchant.rating_avg.toFixed(1)} ({listing.merchant.rating_count})
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Location & Distance - ADDRESS PRIVACY ENFORCED */}
                      <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                        <div className="flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          <span>{listing.merchant.city}</span>
                          {listing.merchant.distance_km !== undefined && (
                            <span className="ml-2">• {formatDistance(listing.merchant.distance_km)}</span>
                          )}
                        </div>
                        <span className="text-blue-600 font-medium hover:underline">
                          View Details →
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && results.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Filter className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No listings found
              </h3>
              <p className="text-gray-600 mb-6">
                Try adjusting your filters or check back later for new listings.
              </p>
              <div className="space-x-4">
                <button
                  onClick={() => setFilters({
                    category: 'all',
                    sortBy: 'newest',
                    minPrice: undefined,
                    maxPrice: undefined,
                    maxDistance: undefined,
                  })}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Clear All Filters
                </button>
                <Link
                  href="/client/search"
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Search Merchants
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}