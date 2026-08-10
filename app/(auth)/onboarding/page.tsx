'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createUserProfile } from '@/lib/auth/actions'

// Nigerian states list
const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe', 'Imo',
  'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa',
  'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba',
  'Yobe', 'Zamfara'
]

export default function OnboardingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [gettingLocation, setGettingLocation] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    role: '' as 'client' | 'merchant' | '',
    address: '',
    city: '',
    state: '',
    lat: undefined as number | undefined,
    lng: undefined as number | undefined,
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      return
    }

    setGettingLocation(true)
    setError('')

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }))
        setGettingLocation(false)
      },
      (error) => {
        setError('Unable to get your location. You can continue without it.')
        setGettingLocation(false)
      }
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Validation
    if (!formData.role) {
      setError('Please select your role')
      setLoading(false)
      return
    }

    try {
      const result = await createUserProfile({
        name: formData.name,
        phone: formData.phone,
        email: formData.email || undefined,
        role: formData.role,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        lat: formData.lat,
        lng: formData.lng,
      })

      if (!result.success) {
        setError(result.error || 'Failed to create profile')
        setLoading(false)
        return
      }

      // Profile created, go straight to the role-based dashboard.
      router.push(formData.role === 'merchant' ? '/merchant' : '/client')
    } catch (err) {
      setError('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Complete Your Profile</CardTitle>
          <CardDescription>
            Tell us about yourself to get started on My Place
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Selection */}
            <div className="space-y-2">
              <Label htmlFor="role">I am a *</Label>
              <Select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                required
                disabled={loading}
              >
                <option value="">Select your role</option>
                <option value="client">Client - Looking for services</option>
                <option value="merchant">Artisan - Offering services</option>
              </Select>
              <p className="text-xs text-muted-foreground">
                {formData.role === 'merchant' 
                  ? 'You will be able to create service listings and receive bookings'
                  : formData.role === 'client'
                  ? 'You will be able to search and book services'
                  : 'Choose whether you want to offer or book services'}
              </p>
            </div>

            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Chidi Okafor"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="08012345678"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email (Optional)</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleInputChange}
                disabled={loading}
              />
            </div>

            {/* Location Information */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Street Address *</Label>
                <Input
                  id="address"
                  name="address"
                  type="text"
                  placeholder="123 Main Street, Surulere"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    name="city"
                    type="text"
                    placeholder="Lagos"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State *</Label>
                  <Select
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    required
                    disabled={loading}
                  >
                    <option value="">Select state</option>
                    {NIGERIAN_STATES.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </Select>
                </div>
              </div>

              {/* Geolocation */}
              <div className="space-y-2">
                <Label>Location Coordinates (Optional but recommended)</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGetLocation}
                    disabled={loading || gettingLocation}
                  >
                    {gettingLocation ? 'Getting location...' : 
                     formData.lat && formData.lng ? '✓ Location captured' : 'Get my location'}
                  </Button>
                  {formData.lat && formData.lng && (
                    <span className="text-xs text-muted-foreground self-center">
                      {formData.lat.toFixed(4)}, {formData.lng.toFixed(4)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Helps us show you nearby artisans and calculate distances
                </p>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? 'Creating profile...' : 'Finish and continue'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
