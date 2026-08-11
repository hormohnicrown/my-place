import { getCurrentUser } from '@/lib/auth/actions'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TestimonialDisplay, CompactTestimonialDisplay } from '@/components/testimonials/testimonial-display'
import { seedTestimonials } from '@/lib/seed-data/testimonials'
import { ArrowLeft, Star, MapPin, User } from 'lucide-react'
import Link from 'next/link'

export default async function TestimonialPreviewPage() {
  const user = await getCurrentUser()

  // Basic admin check
  if (!user || user.role !== 'merchant') {
    redirect('/login')
  }

  // Sample merchant data for preview
  const sampleMerchants = [
    {
      name: 'Joy Adebayo',
      category: 'tailoring',
      description: 'Expert seamstress specializing in wedding gowns, corporate wear, and traditional Nigerian attire.',
      rating: 4.6,
      reviewCount: 12,
      location: 'Ikeja, Lagos',
      testimonials: seedTestimonials.tailoring.slice(0, 3)
    },
    {
      name: 'Samuel Okafor', 
      category: 'carpentry',
      description: 'Skilled carpenter and furniture maker. Custom kitchen cabinets, wardrobes, and furniture repair.',
      rating: 4.8,
      reviewCount: 8,
      location: 'Lekki, Lagos',
      testimonials: seedTestimonials.carpentry.slice(0, 2)
    }
  ]

  const getCategoryColor = (category: string) => {
    const colors = {
      tailoring: 'bg-purple-100 text-purple-800',
      carpentry: 'bg-orange-100 text-orange-800',
      welding: 'bg-red-100 text-red-800',
      plumbing: 'bg-blue-100 text-blue-800'
    }
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-4">
            <Link 
              href="/admin/seed-data"
              className="text-gray-500 hover:text-gray-700 flex items-center"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Seed Data
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Testimonial Preview</h1>
              <p className="text-gray-600 mt-1">See how testimonials will appear on merchant profiles</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Full Testimonial Display Demo */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Full Merchant Profile View</h2>
          
          {sampleMerchants.map((merchant, index) => (
            <Card key={index} className="mb-8 max-w-4xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-gray-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{merchant.name}</CardTitle>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="secondary" className={getCategoryColor(merchant.category)}>
                          {merchant.category.charAt(0).toUpperCase() + merchant.category.slice(1)}
                        </Badge>
                        <div className="flex items-center text-sm text-gray-600">
                          <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                          {merchant.rating} ({merchant.reviewCount} reviews)
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-600">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      {merchant.location}
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="mb-6">
                  <p className="text-gray-700">{merchant.description}</p>
                </div>

                <TestimonialDisplay 
                  testimonials={merchant.testimonials}
                  maxDisplay={3}
                />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Compact Display Demo */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Compact View (Search Results)</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sampleMerchants.map((merchant, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{merchant.name}</h3>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className={`${getCategoryColor(merchant.category)} text-xs`}>
                          {merchant.category}
                        </Badge>
                        <div className="flex items-center text-xs text-gray-600">
                          <Star className="w-3 h-3 text-yellow-400 fill-current mr-1" />
                          {merchant.rating}
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {merchant.description}
                  </p>

                  <CompactTestimonialDisplay 
                    testimonials={merchant.testimonials}
                    maxDisplay={2}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* All Categories Preview */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Available Testimonials by Category</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {Object.entries(seedTestimonials).map(([category, testimonials]) => (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="capitalize">{category}</span>
                    <Badge variant="secondary" className={getCategoryColor(category)}>
                      {testimonials.length} testimonials
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <TestimonialDisplay 
                    testimonials={testimonials}
                    showTitle={false}
                    compact={true}
                    maxDisplay={2}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Implementation Notes */}
        <Card className="mt-12 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800">Implementation Notes</CardTitle>
          </CardHeader>
          <CardContent className="text-blue-700 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">🎨 Design Features</h4>
                <ul className="space-y-1 text-sm">
                  <li>• Platform-specific icons (WhatsApp, Instagram, etc.)</li>
                  <li>• Clear "off-platform" labeling for transparency</li>
                  <li>• Star ratings and service type badges</li>
                  <li>• Location and date information</li>
                  <li>• Responsive layout for different screen sizes</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">🔧 Technical Implementation</h4>
                <ul className="space-y-1 text-sm">
                  <li>• Stored as JSONB in merchant_profiles table</li>
                  <li>• TypeScript interfaces for type safety</li>
                  <li>• Reusable components for different contexts</li>
                  <li>• Automated rating calculation and display</li>
                  <li>• Compliance disclaimer for transparency</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-blue-100 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-1">User Trust Strategy</h4>
              <p className="text-sm">
                The "off-platform" labeling builds trust by being transparent about testimonial sources. 
                Users understand these are real reviews from other channels, while they wait for the 
                platform to generate its own verified review ecosystem.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}