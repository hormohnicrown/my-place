'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createListing } from '@/lib/merchant/actions'

export default function NewListingPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'tailoring' as 'tailoring' | 'carpentry' | 'welding' | 'plumbing',
    price: '',
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      const result = await createListing({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        price: parseFloat(formData.price),
      })

      if (!result.success) {
        setError(result.error || 'Failed to create listing')
        setSaving(false)
        return
      }

      // Success - redirect to listings page
      router.push('/merchant/listings')
    } catch (err) {
      setError('An unexpected error occurred')
      setSaving(false)
    }
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
              ← Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Create New Listing</h1>
              <p className="text-sm text-muted-foreground">Add a service to your profile</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Service Details</CardTitle>
            <CardDescription>
              Create a listing that will be visible to clients searching for services
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Service Title *</Label>
                <Input
                  id="title"
                  name="title"
                  type="text"
                  placeholder="e.g., Professional Tailoring Services"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  disabled={saving}
                  minLength={5}
                />
                <p className="text-xs text-muted-foreground">
                  A clear, descriptive title (minimum 5 characters)
                </p>
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
                <p className="text-xs text-muted-foreground">
                  Choose the category that best describes this service
                </p>
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
                  placeholder="Describe the service in detail: what's included, your experience, materials used, turnaround time, etc."
                  minLength={20}
                />
                <p className="text-xs text-muted-foreground">
                  Minimum 20 characters. Be specific to attract the right clients.
                </p>
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
                  placeholder="5000"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                  disabled={saving}
                />
                <p className="text-xs text-muted-foreground">
                  Base price for this service. You can negotiate final price with clients.
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex gap-4">
                <Button 
                  type="submit" 
                  disabled={saving}
                  className="flex-1"
                >
                  {saving ? 'Creating...' : 'Create Listing'}
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

        {/* Help Text */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Listing Tips</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Use a clear, specific title that tells clients exactly what you offer</li>
            <li>• Include key details like materials, turnaround time, and what's included</li>
            <li>• Mention any specialties or unique skills that set you apart</li>
            <li>• Set a fair base price — you can always negotiate with individual clients</li>
            <li>• You can create multiple listings for different services</li>
          </ul>
        </div>
      </main>
    </div>
  )
}
