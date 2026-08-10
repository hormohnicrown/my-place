import { getCurrentUser } from '@/lib/auth/actions'
import { getFlaggedBookings } from '@/lib/admin/actions'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertTriangle, User, Calendar, DollarSign, MapPin, Clock, Shield, Eye, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'

export default async function FlaggedBookingsPage() {
  const user = await getCurrentUser()

  // Basic admin check
  if (!user || user.role !== 'merchant') {
    redirect('/login')
  }

  const flaggedResult = await getFlaggedBookings()
  const flaggedBookings = flaggedResult.success ? flaggedResult.data : []

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'requested': { color: 'border-blue-300 text-blue-700 bg-blue-50', label: 'Requested' },
      'accepted': { color: 'border-green-300 text-green-700 bg-green-50', label: 'Accepted' },
      'declined': { color: 'border-gray-300 text-gray-700 bg-gray-50', label: 'Declined' },
      'checked_in': { color: 'border-yellow-300 text-yellow-700 bg-yellow-50', label: 'In Progress' },
      'completed': { color: 'border-green-300 text-green-700 bg-green-50', label: 'Completed' },
      'cancelled': { color: 'border-red-300 text-red-700 bg-red-50', label: 'Cancelled' },
    }

    const config = statusConfig[status] || statusConfig['requested']
    return <Badge variant="outline" className={config.color}>{config.label}</Badge>
  }

  const getCategoryBadge = (category: string) => {
    const colors = {
      tailoring: 'bg-purple-100 text-purple-800',
      carpentry: 'bg-orange-100 text-orange-800',
      welding: 'bg-red-100 text-red-800',
      plumbing: 'bg-blue-100 text-blue-800',
    }
    return (
      <Badge variant="secondary" className={colors[category] || 'bg-gray-100 text-gray-800'}>
        {category.charAt(0).toUpperCase() + category.slice(1)}
      </Badge>
    )
  }

  const getFlagSeverity = (reason: string) => {
    if (reason.includes('High value')) {
      return { 
        color: 'text-orange-600 bg-orange-50 border-orange-200', 
        icon: DollarSign, 
        severity: 'Medium Risk' 
      }
    }
    if (reason.includes('Multiple cancellations')) {
      return { 
        color: 'text-red-600 bg-red-50 border-red-200', 
        icon: XCircle, 
        severity: 'High Risk' 
      }
    }
    return { 
      color: 'text-yellow-600 bg-yellow-50 border-yellow-200', 
      icon: AlertTriangle, 
      severity: 'Low Risk' 
    }
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
                  <AlertTriangle className="w-6 h-6 mr-2 text-yellow-600" />
                  Flagged Bookings
                </h1>
                <p className="text-gray-600 mt-1">Review bookings that may require safety or policy attention</p>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-2xl font-bold text-yellow-600">{flaggedBookings.length}</div>
              <div className="text-sm text-gray-500">Flagged for Review</div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {flaggedBookings.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Flagged Bookings</h3>
              <p className="text-gray-500">All bookings are operating within normal safety parameters.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {flaggedBookings.map((booking) => {
              const flagInfo = getFlagSeverity(booking.flagged_reason || '')
              const FlagIcon = flagInfo.icon

              return (
                <Card key={booking.id} className="hover:shadow-md transition-shadow border-l-4 border-yellow-400">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${flagInfo.color}`}>
                          <FlagIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <CardTitle className="text-lg flex items-center space-x-2">
                            <span>{booking.listing.title}</span>
                            {getCategoryBadge(booking.listing.category)}
                          </CardTitle>
                          <div className="flex items-center space-x-2 mt-1">
                            {getStatusBadge(booking.status)}
                            <Badge variant="outline" className={flagInfo.color}>
                              {flagInfo.severity}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-1" />
                          Investigate
                        </Button>
                        <Button variant="outline" size="sm" className="border-green-300 text-green-700 hover:bg-green-50">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Clear Flag
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    {/* Flag Alert */}
                    <div className={`border rounded-lg p-4 mb-6 ${flagInfo.color}`}>
                      <div className="flex items-center mb-2">
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        <h4 className="font-medium">Safety Flag</h4>
                      </div>
                      <p className="text-sm">
                        <strong>Reason:</strong> {booking.flagged_reason}
                      </p>
                      <p className="text-xs mt-1 opacity-75">
                        Flagged on {new Date(booking.flagged_at || booking.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Client Information */}
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-medium text-blue-800 mb-3 flex items-center">
                          <User className="w-4 h-4 mr-2" />
                          Client: {booking.client.name}
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center text-blue-700">
                            <span className="w-16 text-blue-600">Phone:</span>
                            <span>{booking.client.phone}</span>
                          </div>
                          {booking.client.email && (
                            <div className="flex items-center text-blue-700">
                              <span className="w-16 text-blue-600">Email:</span>
                              <span>{booking.client.email}</span>
                            </div>
                          )}
                          <div className="flex items-center text-blue-700">
                            <MapPin className="w-3 h-3 mr-1" />
                            <span>{booking.client.city}, {booking.client.state}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className={
                              booking.client.verification_status === 'id_verified' 
                                ? "border-green-300 text-green-700 bg-green-50"
                                : "border-red-300 text-red-700 bg-red-50"
                            }>
                              {booking.client.verification_status === 'id_verified' ? 'ID Verified' : 'Unverified'}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Merchant Information */}
                      <div className="bg-purple-50 rounded-lg p-4">
                        <h4 className="font-medium text-purple-800 mb-3 flex items-center">
                          <User className="w-4 h-4 mr-2" />
                          Merchant: {booking.merchant.name}
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center text-purple-700">
                            <span className="w-16 text-purple-600">Phone:</span>
                            <span>{booking.merchant.phone}</span>
                          </div>
                          {booking.merchant.email && (
                            <div className="flex items-center text-purple-700">
                              <span className="w-16 text-purple-600">Email:</span>
                              <span>{booking.merchant.email}</span>
                            </div>
                          )}
                          <div className="flex items-center text-purple-700">
                            <MapPin className="w-3 h-3 mr-1" />
                            <span>{booking.merchant.city}, {booking.merchant.state}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className={
                              booking.merchant.verification_status === 'id_verified' 
                                ? "border-green-300 text-green-700 bg-green-50"
                                : "border-red-300 text-red-700 bg-red-50"
                            }>
                              {booking.merchant.verification_status === 'id_verified' ? 'ID Verified' : 'Unverified'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Booking Details */}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        Booking Details
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Agreed Price:</span>
                          <div className={`text-lg font-bold ${
                            booking.price_agreed >= 100000 ? 'text-red-600' : 'text-green-600'
                          }`}>
                            ₦{booking.price_agreed.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Status:</span>
                          <div className="mt-1">
                            {getStatusBadge(booking.status)}
                          </div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Requested:</span>
                          <div className="text-gray-600 flex items-center mt-1">
                            <Clock className="w-3 h-3 mr-1" />
                            {new Date(booking.requested_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Booking ID:</span>
                          <div className="text-gray-600 font-mono text-xs">
                            {booking.id.slice(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Risk Assessment */}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                        <Shield className="w-4 h-4 mr-2" />
                        Risk Assessment
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Verification Status:</span>
                          <div className="mt-1">
                            {booking.client.verification_status === 'id_verified' && 
                             booking.merchant.verification_status === 'id_verified' ? (
                              <Badge variant="outline" className="border-green-300 text-green-700 bg-green-50">
                                Both Parties Verified
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="border-red-300 text-red-700 bg-red-50">
                                Unverified Participants
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Transaction Size:</span>
                          <div className="mt-1">
                            {booking.price_agreed >= 100000 ? (
                              <Badge variant="outline" className="border-red-300 text-red-700 bg-red-50">
                                High Value (₦100k+)
                              </Badge>
                            ) : booking.price_agreed >= 50000 ? (
                              <Badge variant="outline" className="border-yellow-300 text-yellow-700 bg-yellow-50">
                                Medium Value
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="border-green-300 text-green-700 bg-green-50">
                                Standard Value
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Admin Actions */}
                    <div className="mt-6 pt-6 border-t border-gray-200 bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-medium text-gray-900">Administrative Actions</h5>
                          <p className="text-sm text-gray-500">Choose appropriate action for this flagged booking</p>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" className="border-blue-300 text-blue-700 hover:bg-blue-50">
                            Request More Info
                          </Button>
                          <Button variant="outline" size="sm" className="border-yellow-300 text-yellow-700 hover:bg-yellow-50">
                            Monitor Closely
                          </Button>
                          <Button variant="outline" size="sm" className="border-red-300 text-red-700 hover:bg-red-50">
                            Suspend Booking
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Safety Guidelines */}
        <Card className="mt-8 bg-red-50 border-red-200">
          <CardHeader>
            <CardTitle className="text-red-800">Safety Review Guidelines</CardTitle>
          </CardHeader>
          <CardContent className="text-red-700 space-y-2">
            <div>• <strong>High Value Transactions:</strong> Verify both parties are ID verified before allowing to proceed</div>
            <div>• <strong>Multiple Cancellations:</strong> Check user history for patterns of suspicious behavior</div>
            <div>• <strong>Unverified Users:</strong> Prioritize ID verification for users in flagged bookings</div>
            <div>• <strong>Communication:</strong> Contact parties directly if safety concerns are identified</div>
            <div>• <strong>Escalation:</strong> Suspend bookings immediately if fraud or safety risks are suspected</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}