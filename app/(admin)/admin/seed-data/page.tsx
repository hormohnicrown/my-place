import { getCurrentUser } from '@/lib/auth/actions'
import { getSeedDataStats } from '@/lib/seed-data/actions'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sprout, Users, Star, MessageSquare, Database, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { SeedDataActions } from './seed-data-actions'

export default async function SeedDataManagementPage() {
  const user = await getCurrentUser()

  // Basic admin check
  if (!user || user.role !== 'merchant') {
    redirect('/login')
  }

  const statsResult = await getSeedDataStats()
  const stats = statsResult.success ? statsResult.data : {
    merchantsWithTestimonials: 0,
    totalTestimonials: 0,
    avgTestimonialsPerMerchant: 0,
    availableSeedProfiles: 0,
    availableTestimonialsByCategory: {}
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link 
                href="/admin"
                className="text-gray-500 hover:text-gray-700"
              >
                ← Back to Dashboard
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  <Sprout className="w-6 h-6 mr-2 text-green-600" />
                  Seed Data Management
                </h1>
                <p className="text-gray-600 mt-1">Populate the marketplace with initial merchant testimonials for credibility</p>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">{stats.totalTestimonials}</div>
              <div className="text-sm text-gray-500">Total Testimonials</div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Current Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Merchants with Testimonials */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Active Merchants</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.merchantsWithTestimonials}</div>
              <p className="text-xs text-gray-500 mt-1">With testimonials</p>
            </CardContent>
          </Card>

          {/* Total Testimonials */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Testimonials</CardTitle>
              <MessageSquare className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.totalTestimonials}</div>
              <p className="text-xs text-gray-500 mt-1">Total imported</p>
            </CardContent>
          </Card>

          {/* Average per Merchant */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Avg Per Merchant</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.avgTestimonialsPerMerchant}</div>
              <p className="text-xs text-gray-500 mt-1">Testimonials each</p>
            </CardContent>
          </Card>

          {/* Available Seed Profiles */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Seed Profiles</CardTitle>
              <Database className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.availableSeedProfiles}</div>
              <p className="text-xs text-gray-500 mt-1">Ready to deploy</p>
            </CardContent>
          </Card>
        </div>

        {/* Seed Data Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-gray-800 flex items-center">
              <Sprout className="w-5 h-5 mr-2" />
              Marketplace Bootstrap Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Deploy Seed Merchants */}
              <div className="p-6 border border-green-200 rounded-lg bg-green-50">
                <div className="flex items-center mb-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  <h3 className="font-semibold text-green-800">Deploy Seed Merchants</h3>
                </div>
                <p className="text-sm text-green-700 mb-4">
                  Add {stats.availableSeedProfiles} sample merchants with authentic testimonials to bootstrap marketplace credibility.
                </p>
                <SeedDataActions action="seed" />
              </div>

              {/* Clear Seed Data */}
              <div className="p-6 border border-red-200 rounded-lg bg-red-50">
                <div className="flex items-center mb-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                  <h3 className="font-semibold text-red-800">Clear Seed Data</h3>
                </div>
                <p className="text-sm text-red-700 mb-4">
                  Remove all seed merchants and their data. Use for testing or to reset the marketplace.
                </p>
                <SeedDataActions action="clear" />
              </div>

              {/* View Statistics */}
              <div className="p-6 border border-blue-200 rounded-lg bg-blue-50">
                <div className="flex items-center mb-3">
                  <TrendingUp className="w-5 h-5 text-blue-600 mr-2" />
                  <h3 className="font-semibold text-blue-800">Refresh Statistics</h3>
                </div>
                <p className="text-sm text-blue-700 mb-4">
                  Update the current statistics to see the latest seed data status.
                </p>
                <SeedDataActions action="refresh" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Available Testimonials by Category */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-gray-800 flex items-center">
              <MessageSquare className="w-5 h-5 mr-2" />
              Available Testimonials by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {Object.entries(stats.availableTestimonialsByCategory).map(([category, count]) => {
                const categoryInfo = {
                  tailoring: { color: 'bg-purple-100 text-purple-800 border-purple-200', icon: '✂️' },
                  carpentry: { color: 'bg-orange-100 text-orange-800 border-orange-200', icon: '🔨' },
                  welding: { color: 'bg-red-100 text-red-800 border-red-200', icon: '⚡' },
                  plumbing: { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: '🔧' }
                }[category] || { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: '🛠️' }

                return (
                  <div 
                    key={category}
                    className={`p-4 rounded-lg border ${categoryInfo.color}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold capitalize">{category}</span>
                      <span className="text-2xl">{categoryInfo.icon}</span>
                    </div>
                    <div className="text-2xl font-bold">{count as number}</div>
                    <div className="text-sm opacity-75">testimonials ready</div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Guidelines and Best Practices */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800">Seed Data Guidelines</CardTitle>
          </CardHeader>
          <CardContent className="text-blue-700 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">✅ Best Practices</h4>
                <ul className="space-y-1 text-sm">
                  <li>• Deploy seed data during initial marketplace setup</li>
                  <li>• Testimonials are clearly marked as "off-platform"</li>
                  <li>• Use realistic Nigerian names and locations</li>
                  <li>• Provides initial trust and social proof</li>
                  <li>• Creates foundation for organic merchant adoption</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">⚠️ Important Notes</h4>
                <ul className="space-y-1 text-sm">
                  <li>• Seed merchants are pre-verified for trust</li>
                  <li>• Testimonials are fictional but realistic</li>
                  <li>• Clear seed data before production launch</li>
                  <li>• Monitor ratio of seed vs real merchants</li>
                  <li>• Gradually replace with genuine testimonials</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-blue-100 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-1">Marketplace Strategy</h4>
              <p className="text-sm">
                Seed data solves the "chicken and egg" problem - new users need to see successful transactions 
                before trusting the platform. These authentic-looking testimonials provide initial credibility 
                while you build a base of real merchants and customers.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}