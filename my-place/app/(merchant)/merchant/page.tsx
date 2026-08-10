import { redirect } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/actions'
import { getMerchantListings } from '@/lib/merchant/actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default async function MerchantDashboard() {
  const router = useRouter()
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  if (user.role !== 'merchant') {
    redirect('/client')
  }

  if (user.verification_status !== 'id_verified') {
    redirect('/verification')
  }

  // Get merchant profile data
  const merchantProfile = user.merchant_profiles?.[0]

  // Get listings data
  const listingsResult = await getMerchantListings()
  const listings = listingsResult.success ? listingsResult.data : []
  const totalListingsCount = listings?.length || 0
  const activeListingsCount = listings?.filter((l: any) => l.active).length || 0
  const recentListings = listings || []

  // Calculate profile completion
  const completionItems = [
    merchantProfile?.description && merchantProfile.description.length >= 10,
    merchantProfile?.price_range_min && merchantProfile?.price_range_max,
    !!user?.profile_photo_url,
    totalListingsCount > 0,
    // Optional testimonials don't count toward completion
  ]
  const profileCompletion = Math.round((completionItems.filter(Boolean).length / completionItems.length) * 100)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">My Place</h1>
              <p className="text-sm text-muted-foreground">Artisan Dashboard</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground">Artisan</p>
                {merchantProfile && (
                  <p className="text-xs text-primary capitalize">{merchantProfile.category}</p>
                )}
              </div>
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-medium">
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
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg p-6 text-white mb-8">
          <h2 className="text-2xl font-bold mb-2">Welcome back, {user.name.split(' ')[0]}!</h2>
          <p className="text-green-100 mb-4">
            Your profile is live in {user.city}. Start receiving booking requests from clients.
          </p>
          <Button variant="secondary" size="lg">
            Complete Your Profile
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Profile Views</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">0</p>
              <p className="text-sm text-muted-foreground">This week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Active Listings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{activeListingsCount}</p>
              <p className="text-sm text-muted-foreground">
                {totalListingsCount} total listings
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pending Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">0</p>
              <p className="text-sm text-muted-foreground">Awaiting response</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Rating</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {merchantProfile?.rating_avg?.toFixed(1) || '—'}
              </p>
              <p className="text-sm text-muted-foreground">
                {merchantProfile?.rating_count || 0} reviews
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Your Listings</CardTitle>
              <CardDescription>Services you offer</CardDescription>
            </CardHeader>
            <CardContent>
              {totalListingsCount === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="mb-4">You haven't created any listings yet</p>
                  <Button onClick={() => router.push('/merchant/listings/new')}>
                    Create Your First Listing
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      {activeListingsCount} active of {totalListingsCount} total
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => router.push('/merchant/listings')}
                    >
                      Manage All
                    </Button>
                  </div>
                  {recentListings.slice(0, 2).map((listing) => (
                    <div 
                      key={listing.id} 
                      className="p-3 border rounded-lg flex justify-between items-center"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm">{listing.title}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {listing.category} • ₦{listing.price.toLocaleString()}
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        listing.active 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {listing.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Earnings Overview</CardTitle>
              <CardDescription>Your commission summary</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Earned</span>
                  <span className="font-medium">₦0.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Commission Owed</span>
                  <span className="font-medium text-orange-600">₦0.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Completed Jobs</span>
                  <span className="font-medium">0</span>
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  Commission rate: 7% per booking (6-8% range)
                </p>
                <div className="pt-2 mt-4 border-t">
                  <a
                    href="/merchant/commission"
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View Commission Dashboard →
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profile Completion Checklist */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Complete Your Profile ({profileCompletion}% Complete)</CardTitle>
            <CardDescription>Make your profile stand out to potential clients</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { 
                  task: 'Add service description', 
                  done: merchantProfile?.description && merchantProfile.description.length >= 10,
                  action: () => router.push('/merchant/profile')
                },
                { 
                  task: 'Set your price range', 
                  done: merchantProfile?.price_range_min && merchantProfile?.price_range_max,
                  action: () => router.push('/merchant/profile')
                },
                { 
                  task: 'Upload profile photo', 
                  done: !!user?.profile_photo_url,
                  action: () => router.push('/merchant/profile')
                },
                { 
                  task: 'Create your first listing', 
                  done: totalListingsCount > 0,
                  action: () => router.push('/merchant/listings/new')
                },
                { 
                  task: 'Add off-platform testimonials (optional)', 
                  done: (merchantProfile?.imported_testimonials?.length || 0) > 0,
                  action: () => router.push('/merchant/testimonials')
                },
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`h-5 w-5 rounded-full flex items-center justify-center ${
                      item.done ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {item.done ? '✓' : '○'}
                    </div>
                    <span className="text-sm">{item.task}</span>
                  </div>
                  {!item.done && (
                    <Button variant="outline" size="sm" onClick={item.action}>
                      Complete
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Phase 1 Notice */}
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-900">Phase 1 - Dashboard Shell</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-green-800">
            <p className="mb-2">
              <strong>You've successfully completed Phase 1 authentication!</strong>
            </p>
            <p className="mb-3">
              This dashboard is a shell showing the role-based routing is working. 
              Phase 2 will add:
            </p>
            <ul className="list-disc list-inside space-y-1 mb-3">
              <li>Create and manage service listings</li>
              <li>Receive and respond to booking requests</li>
              <li>GPS check-in/check-out for service tracking</li>
              <li>Two-way ratings and reviews</li>
              <li>Import off-platform testimonials (WhatsApp/Instagram)</li>
            </ul>
            <p className="text-xs">
              <strong>Verification Status:</strong> ✓ ID Verified | 
              <strong> Service Area:</strong> {user.city}, {user.state} | 
              <strong> Category:</strong> {merchantProfile?.category || 'Not set'}
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
