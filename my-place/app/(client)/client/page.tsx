'use client'

import { useState, useEffect } from 'react'
import { getClientBookingRequests, searchMerchants, searchListings } from '@/lib/client/actions'
import { getCurrentUser } from '@/lib/auth/actions'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { MapPin, Star, Clock, Calendar, Search, Filter, Eye, Plus, ArrowRight, User, MessageSquare } from 'lucide-react'

type DashboardStats = {
  pendingRequests: number
  acceptedRequests: number
  totalRequests: number
  recentRequests: any[]
}

type User = {
  id: string
  name: string
  email: string
  role: 'client' | 'merchant'
  city: string
  state: string
  verification_status: string
}

export default function ClientDashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [stats, setStats] = useState<DashboardStats>({
    pendingRequests: 0,
    acceptedRequests: 0,
    totalRequests: 0,
    recentRequests: []
  })
  const [recentListings, setRecentListings] = useState([])
  const [nearbyMerchants, setNearbyMerchants] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      // Get current user
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        redirect('/login')
        return
      }
      if (currentUser.role !== 'client') {
        redirect('/merchant')
        return
      }
      if (currentUser.verification_status !== 'id_verified') {
        redirect('/verification')
        return
      }

      setUser(currentUser)

      // Load booking requests
      const bookingResult = await getClientBookingRequests()
      if (bookingResult.success) {
        const requests = bookingResult.data || []
        setStats({
          pendingRequests: requests.filter(r => r.status === 'pending').length,
          acceptedRequests: requests.filter(r => r.status === 'accepted').length,
          totalRequests: requests.length,
          recentRequests: requests.slice(0, 3)
        })
      }

      // Load recent listings (no location filter for variety)
      const listingsResult = await searchListings({ 
        sortBy: 'newest',
        category: 'all'
      })
      if (listingsResult.success) {
        setRecentListings((listingsResult.data || []).slice(0, 4))
      }

      // Try to get user location for nearby merchants
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords
            const merchantsResult = await searchMerchants({
              userLat: latitude,
              userLng: longitude,
              maxDistance: 10,
              category: 'all'
            })
            if (merchantsResult.success) {
              setNearbyMerchants((merchantsResult.data || []).slice(0, 3))
            }
          },
          () => {
            // Fallback: get merchants without location
            searchMerchants({ category: 'all' }).then(result => {
              if (result.success) {
                setNearbyMerchants((result.data || []).slice(0, 3))
              }
            })
          }
        )
      }

    } catch (error) {
      console.error('Dashboard load error:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d ago`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">My Place</h1>
              <p className="text-sm text-gray-600">Find skilled artisans near you</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-gray-600">Client • {user.city}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 font-medium">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white mb-8">
          <h2 className="text-2xl font-bold mb-2">Welcome back, {user.name.split(' ')[0]}!</h2>
          <p className="text-blue-100 mb-4">
            Ready to find skilled artisans in {user.city}? Browse our verified professionals with full address privacy protection.
          </p>
          <div className="flex space-x-3">
            <Link
              href="/client/search"
              className="px-4 py-2 bg-white text-blue-600 rounded-md hover:bg-blue-50 font-medium"
            >
              Search Artisans
            </Link>
            <Link
              href="/client/listings"
              className="px-4 py-2 border border-blue-300 text-white rounded-md hover:bg-blue-600"
            >
              Browse Services
            </Link>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingRequests}</p>
                <p className="text-sm text-gray-600">Pending Requests</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.acceptedRequests}</p>
                <p className="text-sm text-gray-600">Confirmed Bookings</p>
              </div>
              <Calendar className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalRequests}</p>
                <p className="text-sm text-gray-600">Total Requests</p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">{nearbyMerchants.length}</p>
                <p className="text-sm text-gray-600">Nearby Artisans</p>
              </div>
              <MapPin className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Recent Requests */}
            <div className="bg-white rounded-lg border">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Requests</h3>
                  <Link
                    href="/client/bookings"
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
                  >
                    View All
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </div>
              </div>

              <div className="p-6">
                {stats.recentRequests.length > 0 ? (
                  <div className="space-y-4">
                    {stats.recentRequests.map((request) => (
                      <div key={request.id} className="flex items-start p-4 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-900">{request.merchant.name}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              request.status === 'accepted' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {request.status === 'pending' ? 'Pending' : 
                               request.status === 'accepted' ? 'Accepted' : 
                               request.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">{request.service_details.substring(0, 60)}...</p>
                          {/* ADDRESS PRIVACY: Only city shown */}
                          <div className="flex items-center text-xs text-gray-500">
                            <MapPin className="h-3 w-3 mr-1" />
                            <span>{request.merchant.city}</span>
                            <span className="mx-2">•</span>
                            <span>{formatTimeAgo(request.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">No booking requests yet</p>
                    <Link
                      href="/client/search"
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Make Your First Request
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Listings */}
            <div className="bg-white rounded-lg border">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Latest Services</h3>
                  <Link
                    href="/client/listings"
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
                  >
                    Browse All
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recentListings.slice(0, 4).map((listing) => (
                    <Link
                      key={listing.id}
                      href={`/client/listings/${listing.id}`}
                      className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900 line-clamp-1">{listing.title}</h4>
                        <span className="text-blue-600 font-semibold">₦{listing.price.toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{listing.description}</p>
                      <div className="flex items-center justify-between text-xs">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded capitalize">
                          {listing.category}
                        </span>
                        {/* ADDRESS PRIVACY: Only city shown */}
                        <span className="text-gray-500">{listing.merchant.city}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  href="/client/search"
                  className="flex items-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100 group"
                >
                  <Search className="h-5 w-5 text-blue-600 mr-3" />
                  <span className="font-medium text-blue-900">Find Merchants</span>
                </Link>
                <Link
                  href="/client/listings"
                  className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                >
                  <Eye className="h-5 w-5 text-gray-600 mr-3" />
                  <span className="font-medium text-gray-900">Browse Services</span>
                </Link>
                <Link
                  href="/client/bookings"
                  className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                >
                  <Calendar className="h-5 w-5 text-gray-600 mr-3" />
                  <span className="font-medium text-gray-900">My Requests</span>
                </Link>
              </div>
            </div>

            {/* Service Categories */}
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Categories</h3>
              <div className="space-y-3">
                {[
                  { name: 'Tailoring', icon: '👔', path: '/client/search?category=tailoring' },
                  { name: 'Carpentry', icon: '🔨', path: '/client/search?category=carpentry' },
                  { name: 'Welding', icon: '🔧', path: '/client/search?category=welding' },
                  { name: 'Plumbing', icon: '🚰', path: '/client/search?category=plumbing' },
                ].map((category) => (
                  <Link
                    key={category.name}
                    href={category.path}
                    className="flex items-center p-3 border rounded-lg hover:shadow-sm transition-shadow"
                  >
                    <span className="text-2xl mr-3">{category.icon}</span>
                    <span className="font-medium text-gray-900">{category.name}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Nearby Merchants */}
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Nearby Artisans</h3>
              {nearbyMerchants.length > 0 ? (
                <div className="space-y-4">
                  {nearbyMerchants.map((merchant) => (
                    <Link
                      key={merchant.id}
                      href={`/client/merchants/${merchant.id}`}
                      className="flex items-center p-3 border rounded-lg hover:shadow-sm transition-shadow"
                    >
                      {merchant.profile_photo_url ? (
                        <img
                          src={merchant.profile_photo_url}
                          alt={merchant.name}
                          className="w-10 h-10 rounded-full object-cover mr-3"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                          <User className="h-5 w-5 text-gray-600" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{merchant.name}</p>
                        <div className="flex items-center text-sm text-gray-600">
                          <span className="capitalize">{merchant.category}</span>
                          {merchant.distance_km && (
                            <>
                              <span className="mx-1">•</span>
                              <span>{merchant.distance_km.toFixed(1)} km</span>
                            </>
                          )}
                        </div>
                        {merchant.rating_count > 0 && (
                          <div className="flex items-center text-sm">
                            <Star className="h-3 w-3 text-yellow-400 fill-current mr-1" />
                            <span>{merchant.rating_avg.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-600">Enable location access to see nearby artisans</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
