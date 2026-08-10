'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ProfilePhotoUpload } from '@/components/profile-photo-upload'
import { updateMerchantProfile, getMerchantProfile } from '@/lib/merchant/actions'
import { getCurrentUser } from '@/lib/auth/actions'

export default function MerchantProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    category: 'tailoring' as 'tailoring' | 'carpentry' | 'welding' | 'plumbing',
    description: '',
    price_range_min: '',
    price_range_max: '',
    service_area_radius_km: '5',
  })

  useEffect(() => {
    async function loadProfile() {
      const [profileResult, userResult] = await Promise.all([
        getMerchantProfile(),
        getCurrentUser()
      ])
      
      if (!profileResult.success) {
        setError(profileResult.error || 'Failed to load profile')
        setLoading(false)
        return
      }

      const profile = profileResult.data
      setFormData({
        category: profile.category,
        description: profile.description || '',
        price_range_min: profile.price_range_min?.toString() || '',
        price_range_max: profile.price_range_max?.toString() || '',
        service_area_radius_km: profile.service_area_radius_km?.toString() || '5',
      })

      if (userResult) {
        setProfilePhotoUrl(userResult.profile_photo_url || null)
      }

      setLoading(false)
    }

    loadProfile()
  }, [])

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
      const result = await updateMerchantProfile({
        category: formData.category,
        description: formData.description,
        price_range_min: formData.price_range_min ? parseFloat(formData.price_range_min) : undefined,
        price_range_max: formData.price_range_max ? parseFloat(formData.price_range_max) : undefined,
        service_area_radius_km: parseFloat(formData.service_area_radius_km),
      })

      if (!result.success) {
        setError(result.error || 'Failed to update profile')
        setSaving(false)
        return
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/merchant')
      }, 1500)
    } catch (err) {
      setError('An unexpected error occurred')
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading profile...</p>
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
              onClick={() => router.push('/merchant')}
            >
              ← Back to Dashboard
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Edit Profile</h1>
              <p className="text-sm text-muted-foreground">Update your artisan profile</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              This information will be visible to potential clients browsing for services
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Profile Photo */}
              <div className="space-y-2">
                <Label>Profile Photo</Label>
                <ProfilePhotoUpload 
                  currentPhotoUrl={profilePhotoUrl}
                  onUploadComplete={(url) => setProfilePhotoUrl(url)}
                />
              </div>

              <div className="border-t pt-6" />

              {/* Service Category */}
              <div className="space-y-2">
                <Label htmlFor="category">Service Category *</Label>
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
                  Your primary service category (can be changed later)
                </p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Service Description *</Label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  disabled={saving}
                  rows={6}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Describe your services, experience, specialties, and what makes you stand out..."
                  minLength={10}
                />
                <p className="text-xs text-muted-foreground">
                  Minimum 10 characters. Be specific about your skills and experience.
                </p>
              </div>

              {/* Price Range */}
              <div className="space-y-2">
                <Label>Price Range (Naira)</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price_range_min" className="text-xs text-muted-foreground">
                      Minimum
                    </Label>
                    <Input
                      id="price_range_min"
                      name="price_range_min"
                      type="number"
                      min="0"
                      step="100"
                      placeholder="5000"
                      value={formData.price_range_min}
                      onChange={handleInputChange}
                      disabled={saving}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price_range_max" className="text-xs text-muted-foreground">
                      Maximum
                    </Label>
                    <Input
                      id="price_range_max"
                      name="price_range_max"
                      type="number"
                      min="0"
                      step="100"
                      placeholder="50000"
                      value={formData.price_range_max}
                      onChange={handleInputChange}
                      disabled={saving}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Optional. Give clients an idea of your typical service costs.
                </p>
              </div>

              {/* Service Area Radius */}
              <div className="space-y-2">
                <Label htmlFor="service_area_radius_km">
                  Service Area Radius: {formData.service_area_radius_km} km
                </Label>
                <input
                  id="service_area_radius_km"
                  name="service_area_radius_km"
                  type="range"
                  min="1"
                  max="50"
                  step="1"
                  value={formData.service_area_radius_km}
                  onChange={handleInputChange}
                  disabled={saving}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <p className="text-xs text-muted-foreground">
                  How far are you willing to travel for jobs? (1-50 km)
                </p>
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
                    ✓ Profile updated successfully! Redirecting...
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
                  onClick={() => router.push('/merchant')}
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
          <h3 className="font-semibold text-blue-900 mb-2">Profile Tips</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• A detailed description helps clients understand your expertise</li>
            <li>• Include years of experience and any certifications</li>
            <li>• Mention specific skills or specialties within your category</li>
            <li>• A clear price range helps clients know if you fit their budget</li>
          </ul>
        </div>
      </main>
    </div>
  )
}
