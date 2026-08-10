'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getMerchantListings, toggleListingActive, deleteListing } from '@/lib/merchant/actions'

type Listing = {
  id: string
  title: string
  description: string
  category: string
  price: number
  active: boolean
  created_at: string
}

export default function ListingsPage() {
  const router = useRouter()
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadListings()
  }, [])

  const loadListings = async () => {
    setLoading(true)
    setError('')

    const result = await getMerchantListings()

    if (!result.success) {
      setError(result.error || 'Failed to load listings')
      setLoading(false)
      return
    }

    setListings(result.data || [])
    setLoading(false)
  }

  const handleToggleActive = async (listingId: string, currentActive: boolean) => {
    const result = await toggleListingActive(listingId, !currentActive)

    if (!result.success) {
      alert(result.error || 'Failed to update listing')
      return
    }

    // Optimistic update
    setListings(prev =>
      prev.map(listing =>
        listing.id === listingId ? { ...listing, active: !currentActive } : listing
      )
    )
  }

  const handleDelete = async (listingId: string) => {
    if (!confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
      return
    }

    const result = await deleteListing(listingId)

    if (!result.success) {
      alert(result.error || 'Failed to delete listing')
      return
    }

    // Remove from list
    setListings(prev => prev.filter(listing => listing.id !== listingId))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading listings...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">My Listings</h1>
              <p className="text-sm text-muted-foreground">Manage your service listings</p>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline"
                onClick={() => router.push('/merchant')}
              >
                ← Dashboard
              </Button>
              <Button onClick={() => router.push('/merchant/listings/new')}>
                + Create Listing
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {listings.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-5xl mb-4">📋</div>
              <h3 className="text-lg font-semibold mb-2">No listings yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first listing to start receiving booking requests from clients
              </p>
              <Button onClick={() => router.push('/merchant/listings/new')}>
                Create Your First Listing
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Listings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{listings.length}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Active
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-green-600">
                    {listings.filter(l => l.active).length}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Inactive
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-gray-500">
                    {listings.filter(l => !l.active).length}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Listings Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {listings.map((listing) => (
                <Card key={listing.id} className={!listing.active ? 'opacity-60' : ''}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-lg">{listing.title}</CardTitle>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            listing.active 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {listing.active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <CardDescription className="capitalize">
                          {listing.category} • ₦{listing.price.toLocaleString()}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                      {listing.description}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/merchant/listings/${listing.id}/edit`)}
                      >
                        Edit
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive(listing.id, listing.active)}
                      >
                        {listing.active ? 'Deactivate' : 'Activate'}
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => handleDelete(listing.id)}
                      >
                        Delete
                      </Button>
                    </div>

                    <p className="text-xs text-muted-foreground mt-4">
                      Created {new Date(listing.created_at).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
