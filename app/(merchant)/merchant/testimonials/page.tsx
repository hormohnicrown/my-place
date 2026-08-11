'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getMerchantProfile, addOffPlatformTestimonial, removeOffPlatformTestimonial } from '@/lib/merchant/actions'

type Testimonial = {
  text: string
  author: string
  platform: 'whatsapp' | 'instagram' | 'facebook' | 'other'
  source: 'off_platform'
  date_added: string
}

export default function TestimonialsPage() {
  const router = useRouter()
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)

  const [formData, setFormData] = useState({
    text: '',
    author: '',
    platform: 'whatsapp' as 'whatsapp' | 'instagram' | 'facebook' | 'other',
  })

  useEffect(() => {
    loadTestimonials()
  }, [])

  const loadTestimonials = async () => {
    const result = await getMerchantProfile()

    if (!result.success) {
      setError(result.error || 'Failed to load testimonials')
      setLoading(false)
      return
    }

    setTestimonials(result.data?.imported_testimonials || [])
    setLoading(false)
  }

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
      const result = await addOffPlatformTestimonial({
        text: formData.text,
        author: formData.author,
        platform: formData.platform,
      })

      if (!result.success) {
        setError(result.error || 'Failed to add testimonial')
        setSaving(false)
        return
      }

      // Add to list
      setTestimonials(prev => [...prev, result.data])
      
      // Reset form
      setFormData({
        text: '',
        author: '',
        platform: 'whatsapp',
      })
      setShowForm(false)
      setSaving(false)
    } catch (err) {
      setError('An unexpected error occurred')
      setSaving(false)
    }
  }

  const handleRemove = async (index: number) => {
    if (!confirm('Remove this testimonial?')) {
      return
    }

    const result = await removeOffPlatformTestimonial(index)

    if (!result.success) {
      alert(result.error || 'Failed to remove testimonial')
      return
    }

    setTestimonials(prev => prev.filter((_, i) => i !== index))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Off-Platform Testimonials</h1>
              <p className="text-sm text-muted-foreground">
                Import testimonials from WhatsApp, Instagram, or other platforms
              </p>
            </div>
            <Button 
              variant="outline"
              onClick={() => router.push('/merchant')}
            >
              ← Dashboard
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Important Notice - Visual Distinction Requirement */}
        <div className="mb-6 p-4 bg-amber-50 border-2 border-amber-200 rounded-lg">
          <h3 className="font-semibold text-amber-900 mb-2">
            ⚠️ About Off-Platform Testimonials
          </h3>
          <p className="text-sm text-amber-800 mb-2">
            These testimonials will be displayed with a <strong>distinct visual treatment</strong> on your profile
            to clearly indicate they were not verified through My Place bookings.
          </p>
          <p className="text-xs text-amber-700">
            This visual distinction is a non-negotiable requirement for trust and transparency.
          </p>
        </div>

        {/* Add Testimonial Button */}
        {!showForm && (
          <Card className="mb-6">
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground mb-4">
                {testimonials.length === 0 
                  ? 'Import testimonials from your existing clients on other platforms'
                  : `You have ${testimonials.length} imported testimonial${testimonials.length !== 1 ? 's' : ''}`
                }
              </p>
              <Button onClick={() => setShowForm(true)}>
                + Add Testimonial
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Add Testimonial Form */}
        {showForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Add Off-Platform Testimonial</CardTitle>
              <CardDescription>
                Import a testimonial from WhatsApp, Instagram, or other platforms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Platform */}
                <div className="space-y-2">
                  <Label htmlFor="platform">Platform *</Label>
                  <Select
                    id="platform"
                    name="platform"
                    value={formData.platform}
                    onChange={handleInputChange}
                    required
                    disabled={saving}
                  >
                    <option value="whatsapp">WhatsApp</option>
                    <option value="instagram">Instagram</option>
                    <option value="facebook">Facebook</option>
                    <option value="other">Other</option>
                  </Select>
                </div>

                {/* Author */}
                <div className="space-y-2">
                  <Label htmlFor="author">Client Name *</Label>
                  <Input
                    id="author"
                    name="author"
                    type="text"
                    placeholder="e.g., Ada M."
                    value={formData.author}
                    onChange={handleInputChange}
                    required
                    disabled={saving}
                    minLength={2}
                  />
                  <p className="text-xs text-muted-foreground">
                    First name or initials are fine for privacy
                  </p>
                </div>

                {/* Testimonial Text */}
                <div className="space-y-2">
                  <Label htmlFor="text">Testimonial *</Label>
                  <textarea
                    id="text"
                    name="text"
                    value={formData.text}
                    onChange={handleInputChange}
                    required
                    disabled={saving}
                    rows={4}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="What did the client say about your service?"
                    minLength={10}
                  />
                  <p className="text-xs text-muted-foreground">
                    Minimum 10 characters. Copy the exact message if possible.
                  </p>
                </div>

                {error && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button type="submit" disabled={saving} className="flex-1">
                    {saving ? 'Adding...' : 'Add Testimonial'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false)
                      setError('')
                    }}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Testimonials List */}
        {testimonials.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Your Testimonials ({testimonials.length})</h2>
            
            {testimonials.map((testimonial, index) => (
              <Card 
                key={index}
                className="border-l-4 border-l-amber-400 bg-amber-50/30"
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium capitalize">
                          {testimonial.platform === 'whatsapp' && '📱 WhatsApp'}
                          {testimonial.platform === 'instagram' && '📷 Instagram'}
                          {testimonial.platform === 'facebook' && '👥 Facebook'}
                          {testimonial.platform === 'other' && '💬 Other Platform'}
                        </span>
                        
                        {/* NON-NEGOTIABLE: Visual distinction label */}
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-300 rounded text-xs font-medium">
                          Shared by merchant
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        From {testimonial.author} • {new Date(testimonial.date_added).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemove(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      Remove
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* NON-NEGOTIABLE: Textual distinction */}
                  <div className="mb-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
                    ℹ️ <strong>Not verified on this platform</strong> — This testimonial was shared by the artisan
                    from {testimonial.platform} and has not been verified through a My Place booking.
                  </div>
                  
                  <blockquote className="italic text-sm border-l-2 border-amber-300 pl-3 text-gray-700">
                    "{testimonial.text}"
                  </blockquote>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Help Section */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Why the visual distinction?</h3>
          <p className="text-sm text-blue-800 mb-3">
            Off-platform testimonials are shown with a distinct colored border and label to maintain
            trust and transparency. This helps clients understand the difference between:
          </p>
          <ul className="text-sm text-blue-800 space-y-1 ml-4">
            <li>• <strong>Verified reviews:</strong> From completed bookings on My Place</li>
            <li>• <strong>Off-platform testimonials:</strong> Shared by you from other platforms</li>
          </ul>
          <p className="text-xs text-blue-700 mt-3">
            This is a non-negotiable product requirement for maintaining marketplace integrity.
          </p>
        </div>
      </main>
    </div>
  )
}
