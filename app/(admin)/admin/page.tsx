import { getCurrentUser } from '@/lib/auth/actions'
import { getPlatformStats } from '@/lib/admin/actions'
import { redirect } from 'next/navigation'
import { Users, AlertTriangle, Shield, Activity, Calendar, DollarSign, Star, Flag, Sprout, Rocket } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function AdminDashboard() {
  const user = await getCurrentUser()

  // Basic admin check - in production, you'd want proper role-based access
  if (!user || user.role !== 'merchant') {
    redirect('/login')
  }

  // Get real platform stats
  const statsResult = await getPlatformStats()
  const adminStats = statsResult.success ? statsResult.data : {
    totalUsers: 0,
    pendingVerifications: 0,
    activeDisputes: 0,
    flaggedBookings: 0,
    totalBookings: 0,
    completedBookings: 0,
    averageRating: 0,
    totalRevenue: 0,
    todaySignups: 0,
    todayBookings: 0
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">Monitor and manage My Place platform</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                Welcome back, {user.name}
              </span>
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-medium text-sm">
                  {user.name?.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Users */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
              <Users className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{adminStats.totalUsers.toLocaleString()}</div>
              <p className="text-xs text-green-600 mt-1">+{adminStats.todaySignups} today</p>
            </CardContent>
          </Card>

          {/* Pending Issues */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Pending Issues</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {adminStats.pendingVerifications + adminStats.activeDisputes + adminStats.flaggedBookings}
              </div>
              <p className="text-xs text-gray-500 mt-1">Needs attention</p>
            </CardContent>
          </Card>

          {/* Today's Bookings */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Today's Bookings</CardTitle>
              <Calendar className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{adminStats.todayBookings}</div>
              <p className="text-xs text-gray-500 mt-1">New requests</p>
            </CardContent>
          </Card>

          {/* Platform Health */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Platform Health</CardTitle>
              <Activity className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {((adminStats.completedBookings / adminStats.totalBookings) * 100).toFixed(1)}%
              </div>
              <p className="text-xs text-gray-500 mt-1">Success rate</p>
            </CardContent>
          </Card>
        </div>

        {/* Action Items */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Urgent Actions */}
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-800 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Requires Immediate Attention
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {adminStats.pendingVerifications > 0 && (
                <Link 
                  href="/admin/verification"
                  className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-200 hover:border-red-300 transition-colors"
                >
                  <div className="flex items-center">
                    <Shield className="w-4 h-4 text-red-600 mr-3" />
                    <div>
                      <p className="font-medium text-red-800">Pending ID Verifications</p>
                      <p className="text-sm text-red-600">Users waiting for approval</p>
                    </div>
                  </div>
                  <div className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm font-medium">
                    {adminStats.pendingVerifications}
                  </div>
                </Link>
              )}

              {adminStats.activeDisputes > 0 && (
                <Link 
                  href="/admin/disputes"
                  className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-200 hover:border-red-300 transition-colors"
                >
                  <div className="flex items-center">
                    <Flag className="w-4 h-4 text-red-600 mr-3" />
                    <div>
                      <p className="font-medium text-red-800">Active Disputes</p>
                      <p className="text-sm text-red-600">Booking conflicts to resolve</p>
                    </div>
                  </div>
                  <div className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm font-medium">
                    {adminStats.activeDisputes}
                  </div>
                </Link>
              )}

              {adminStats.flaggedBookings > 0 && (
                <Link 
                  href="/admin/flagged-bookings"
                  className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-200 hover:border-red-300 transition-colors"
                >
                  <div className="flex items-center">
                    <AlertTriangle className="w-4 h-4 text-red-600 mr-3" />
                    <div>
                      <p className="font-medium text-red-800">Flagged Bookings</p>
                      <p className="text-sm text-red-600">Potential safety issues</p>
                    </div>
                  </div>
                  <div className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm font-medium">
                    {adminStats.flaggedBookings}
                  </div>
                </Link>
              )}
            </CardContent>
          </Card>

          {/* Platform Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-800 flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                Platform Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">Total Bookings</span>
                <span className="font-semibold">{adminStats.totalBookings.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">Completion Rate</span>
                <span className="font-semibold text-green-600">
                  {((adminStats.completedBookings / adminStats.totalBookings) * 100).toFixed(1)}%
                </span>
              </div>
              
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">Average Rating</span>
                <div className="flex items-center">
                  <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                  <span className="font-semibold">{adminStats.averageRating}</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">Total Commission</span>
                <span className="font-semibold text-blue-600">
                  ₦{adminStats.totalRevenue.toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Management Tools */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* User Management */}
          <Link href="/admin/users">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="text-blue-800 flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  User Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm mb-4">
                  View and manage user accounts, verification status, and user roles
                </p>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total Users:</span>
                  <span className="font-medium">{adminStats.totalUsers.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Booking Management */}
          <Link href="/admin/bookings">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="text-green-800 flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Booking Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm mb-4">
                  Monitor booking requests, track completion rates, and resolve issues
                </p>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Active Bookings:</span>
                  <span className="font-medium">{adminStats.totalBookings - adminStats.completedBookings}</span>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Security Center */}
          <Link href="/admin/security">
            <Card className="hover:shadow-md transition-shadow cursor-pointer border-2 border-red-300">
              <CardHeader>
                <CardTitle className="text-purple-800 flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Security Audit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm mb-4">
                  Comprehensive security assessment, vulnerability scanning, and production hardening
                </p>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Last Audit:</span>
                  <span className="font-medium text-green-600">Run Now</span>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Financial Overview */}
          <Link href="/admin/financial">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="text-indigo-800 flex items-center">
                  <DollarSign className="w-5 h-5 mr-2" />
                  Financial Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm mb-4">
                  Commission tracking, revenue reports, and payment reconciliation
                </p>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Monthly Revenue:</span>
                  <span className="font-medium">₦{Math.round(adminStats.totalRevenue * 0.07).toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Analytics */}
          <Link href="/admin/analytics">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="text-orange-800 flex items-center">
                  <Activity className="w-5 h-5 mr-2" />
                  Platform Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm mb-4">
                  User engagement, booking trends, and platform performance metrics
                </p>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Monthly Growth:</span>
                  <span className="font-medium text-green-600">+12.3%</span>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* System Health */}
          <Link href="/admin/system">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="text-teal-800 flex items-center">
                  <Activity className="w-5 h-5 mr-2" />
                  System Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm mb-4">
                  Server performance, database health, and system monitoring
                </p>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Uptime:</span>
                  <span className="font-medium text-green-600">99.8%</span>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Seed Data Management */}
          <Link href="/admin/seed-data">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="text-green-800 flex items-center">
                  <Sprout className="w-5 h-5 mr-2" />
                  Seed Data
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm mb-4">
                  Manage initial merchant testimonials and marketplace bootstrap data
                </p>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Available:</span>
                  <span className="font-medium text-green-600">Ready to Deploy</span>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Launch Readiness */}
          <Link href="/admin/launch-readiness">
            <Card className="hover:shadow-md transition-shadow cursor-pointer border-2 border-blue-300">
              <CardHeader>
                <CardTitle className="text-blue-800 flex items-center">
                  <Rocket className="w-5 h-5 mr-2" />
                  Launch Readiness
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm mb-4">
                  Pre-launch checklist, automated verification, and production readiness monitoring
                </p>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Status:</span>
                  <span className="font-medium text-blue-600">Check Now</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-800">Recent Platform Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-sm text-gray-700">New merchant verified: Sarah's Beauty Services</span>
                  </div>
                  <span className="text-xs text-gray-500">5 minutes ago</span>
                </div>
                
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                    <span className="text-sm text-gray-700">Booking completed: Hair styling service</span>
                  </div>
                  <span className="text-xs text-gray-500">12 minutes ago</span>
                </div>
                
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
                    <span className="text-sm text-gray-700">Dispute reported: Payment issue</span>
                  </div>
                  <span className="text-xs text-gray-500">25 minutes ago</span>
                </div>
                
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-sm text-gray-700">5-star rating received for cleaning service</span>
                  </div>
                  <span className="text-xs text-gray-500">1 hour ago</span>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <Link 
                  href="/admin/activity"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  View All Activity →
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}