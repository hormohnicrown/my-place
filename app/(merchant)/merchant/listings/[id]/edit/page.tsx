'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getMerchantListings, updateListing } from '@/lib/merchant/actions'

export default function EditListingPage() {
  const router = useRouter()
  const params = useParams()
  const listingId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'tailoring' as 'tailoring' | 'carpentry' | 'welding' | 'plumbing',
    price: '',
    active: true,
  })

  useEffect(() => {
    async function loadListing() {
      const result = await getMerchantListings()

      if (!result.success) {
        setError(result.error || 'Failed to load listing')
        setLoading(false)
        return
      }

      const listing = result.data?.find((l: any) => l.id === listingId)

      if (!listing) {
        setError('Listing not found')
        setLoading(false)
        return
      }

      setFormData({
        title: listing.title,
        description: listing.description,
        category: listing.category,
        price: listing.price.toString(),
        active: listing.active,
      })

      setLoading(false)
    }

    loadListing()
  }, [listingId])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError('')
    setSuccess(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setSaving(true)

    try {
      const result = await updateListing(listingId, {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        price: parseFloat(formData.price),
        active: formData.active,
      })

      if (!result.success) {
        setError(result.error || 'Failed to update listing')
        setSaving(false)
        return
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/merchant/listings')
      }, 1500)
    } catch (err) {
      setError('An unexpected error occurred')
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (error && !formData.title) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={() => router.push('/merchant/listings')}>
              Back to Listings
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => router.push('/merchant/listings')}
            >
              ← Back to Listings
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Edit Listing</h1>
              <p className="text-sm text-muted-foreground">Update your service details</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Listing Details</CardTitle>
            <CardDescription>
              Make changes to your listing information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Active Status */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label>Listing Status</Label>
                  <p className="text-sm text-muted-foreground">
                    {formData.active ? 'This listing is visible to clients' : 'This listing is hidden from clients'}
                  </p>
                </div>
                <Button
                  type="button"
                  variant={formData.active ? 'default' : 'outline'}
                  onClick={() => setFormData(prev => ({ ...prev, active: !prev.active }))}
                  disabled={saving}
                >
                  {formData.active ? 'Active' : 'Inactive'}
                </Button>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Service Title *</Label>
                <Input
                  id="title"
                  name="title"
                  type="text"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  disabled={saving}
                  minLength={5}
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  disabled={saving}
                >
                  <option value="tailoring">Tailoring</option>
                  <option value="carpentry">Carpentry</option>
                  <option value="welding">Welding</option>
                  <option value="plumbing">Plumbing</option>
                </Select>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  disabled={saving}
                  rows={6}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  minLength={20}
                />
              </div>

              {/* Price */}
              <div className="space-y-2">
                <Label htmlFor="price">Price (Naira) *</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  min="1"
                  step="0.01"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                  disabled={saving}
                />
              </div>

              {/* Error/Success Messages */}
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              {success && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-700">
                    ✓ Listing updated successfully! Redirecting...
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex gap-4">
                <Button 
                  type="submit" 
                  disabled={saving || success}
                  className="flex-1"
                >
                  {saving ? 'Saving...' : success ? 'Saved!' : 'Save Changes'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/merchant/listings')}
                  disabled={saving}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
