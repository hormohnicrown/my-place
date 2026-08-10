'use client'

import { useState, useEffect } from 'react'
import { searchMerchants, type MerchantSearchFilters, type MerchantSearchResult } from '@/lib/client/actions'
import { MapPin, Star, Filter, Loader2, AlertCircle } from 'lucide-react'
import Link from 'next/link'

const CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'tailoring', label: 'Tailoring' },
  { value: 'carpentry', label: 'Carpentry' },
  { value: 'welding', label: 'Welding' },
  { value: 'plumbing', label: 'Plumbing' },
]

const DISTANCE_OPTIONS = [
  { value: 5, label: '5 km' },
  { value: 10, label: '10 km' },
  { value: 20, label: '20 km' },
  { value: 50, label: '50 km' },
]

export default function MerchantSearchPage() {
  const [results, setResults] = useState<MerchantSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationError, setLocationError] = useState('')

  const [filters, setFilters] = useState<MerchantSearchFilters>({
    category: 'all',
    maxDistance: 20,
    minPrice: undefined,
    maxPrice: undefined,
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
          setLocationError('Location access denied. Search will show all merchants without distance sorting.')
          console.log('Geolocation error:', error)
        }
      )
    } else {
      setLocationError('Geolocation not supported. Search will show all merchants without distance.')
    }
  }, [])

  // Search merchants when filters change or location is available
  useEffect(() => {
    handleSearch()
  }, [filters, userLocation])

  const handleSearch = async () => {
    setLoading(true)
    setError('')

    try {
      const searchFilters: MerchantSearchFilters = {
        ...filters,
        userLat: userLocation?.lat,
        userLng: userLocation?.lng,
      }

      const result = await searchMerchants(searchFilters)

      if (result.success) {
        setResults(result.data || [])
      } else {
        setError(result.error || 'Failed to search merchants')
      }
    } catch (err) {
      console.error('Search error:', err)
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

  const formatDistance = (distance?: number) => {
    if (distance === undefined) return ''
    return `${distance.toFixed(1)} km away`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Find Local Artisans
          </h1>
          <p className="text-gray-600">
            Discover verified craftspeople in your area. All merchants are ID-verified for your safety.
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
            <h2 className="text-lg font-semibold text-gray-900">Search Filters</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

            {/* Distance Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Distance {!userLocation && '(Location Required)'}
              </label>
              <select
                value={filters.maxDistance}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  maxDistance: Number(e.target.value) 
                }))}
                disabled={!userLocation}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
              >
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
              {loading ? 'Searching...' : `${results.length} merchants found`}
            </h2>
            {userLocation && (
              <p className="text-sm text-gray-600">
                Sorted by distance from your location
              </p>
            )}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Finding merchants in your area...</p>
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
              {results.map((merchant) => (
                <Link
                  key={merchant.id}
                  href={`/client/merchants/${merchant.id}`}
                  className="bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="p-6">
                    {/* Profile Photo */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center">
                        {merchant.profile_photo_url ? (
                          <img
                            src={merchant.profile_photo_url}
                            alt={merchant.name}
                            className="w-12 h-12 rounded-full object-cover mr-3"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                            <span className="text-gray-600 font-medium">
                              {merchant.name.charAt(0)}
                            </span>
                          </div>
                        )}
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {merchant.name}
                          </h3>
                          <p className="text-sm text-blue-600 capitalize">
                            {merchant.category}
                          </p>
                        </div>
                      </div>
                      
                      {/* Rating */}
                      {merchant.rating_count > 0 && (
                        <div className="flex items-center text-sm">
                          <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                          <span className="font-medium">{merchant.rating_avg.toFixed(1)}</span>
                          <span className="text-gray-500 ml-1">({merchant.rating_count})</span>
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {merchant.description}
                    </p>

                    {/* Location & Distance - ADDRESS PRIVACY ENFORCED */}
                    <div className="flex items-center text-sm text-gray-500 mb-3">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span>{merchant.city}</span>
                      {merchant.distance_km !== undefined && (
                        <span className="ml-2">• {formatDistance(merchant.distance_km)}</span>
                      )}
                    </div>

                    {/* Service Area */}
                    <div className="text-xs text-gray-500 mb-4">
                      Serves {merchant.service_area_radius_km}km radius
                    </div>

                    {/* Price Range */}
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-900">
                        {formatPrice(merchant.price_range_min, merchant.price_range_max)}
                      </span>
                      <span className="text-blue-600 text-sm font-medium hover:underline">
                        View Profile →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && results.length === 0 && (
            <div className="text-center py-12">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No merchants found
              </h3>
              <p className="text-gray-600 mb-6">
                Try adjusting your filters or expanding your search radius.
              </p>
              <button
                onClick={() => setFilters(prev => ({ 
                  ...prev, 
                  category: 'all', 
                  maxDistance: 50, 
                  minPrice: undefined, 
                  maxPrice: undefined 
                }))}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}