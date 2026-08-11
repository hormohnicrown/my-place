import { getCurrentUser } from '@/lib/auth/actions'
import { getActiveDisputes } from '@/lib/admin/actions'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Flag, User, Calendar, DollarSign, MapPin, Clock, AlertTriangle, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { AdminNavbar } from '@/components/navigation/AdminNavbar'

export default async function DisputesManagementPage() {
  const user = await getCurrentUser()

  // Basic admin check
  if (!user || user.role !== 'admin') {
    redirect('/login')
  }

  const disputesResult = await getActiveDisputes()
  const disputes: any[] = (disputesResult.success && disputesResult.data) ? disputesResult.data : []

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant="outline" className="border-red-300 text-red-700 bg-red-50">Open</Badge>
      case 'resolved':
        return <Badge variant="outline" className="border-green-300 text-green-700 bg-green-50">Resolved</Badge>
      case 'escalated':
        return <Badge variant="outline" className="border-yellow-300 text-yellow-700 bg-yellow-50">Escalated</Badge>
      default:
        return <Badge variant="outline" className="border-gray-300 text-gray-700">Unknown</Badge>
    }
  }

  const getCategoryBadge = (category: string) => {
    const colors = {
      tailoring: 'bg-purple-100 text-purple-800',
      carpentry: 'bg-orange-100 text-orange-800',
      welding: 'bg-red-100 text-red-800',
      plumbing: 'bg-blue-100 text-blue-800',
    }
    return (
      <Badge variant="secondary" className={colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {category.charAt(0).toUpperCase() + category.slice(1)}
      </Badge>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar userName={user.name} />
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
                  <Flag className="w-6 h-6 mr-2 text-red-600" />
                  Disputes Management
                </h1>
                <p className="text-gray-600 mt-1">Review and resolve booking conflicts and payment disputes</p>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-2xl font-bold text-red-600">{disputes.length}</div>
              <div className="text-sm text-gray-500">Active Disputes</div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {disputes.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Flag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Disputes</h3>
              <p className="text-gray-500">All disputes have been resolved. Great job maintaining platform harmony!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {disputes.map((dispute) => (
              <Card key={dispute.id} className="hover:shadow-md transition-shadow border-l-4 border-red-400">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg flex items-center space-x-2">
                          <span>{dispute.listing.title}</span>
                          {getCategoryBadge(dispute.listing.category)}
                        </CardTitle>
                        <div className="flex items-center space-x-2 mt-1">
                          {getStatusBadge(dispute.dispute_status)}
                          <span className="text-sm text-gray-500">
                            Dispute ID: {dispute.id.slice(0, 8)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <MessageSquare className="w-4 h-4 mr-1" />
                        Contact Parties
                      </Button>
                      <Button variant="outline" size="sm" className="border-green-300 text-green-700 hover:bg-green-50">
                        Mark Resolved
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  {/* Dispute Info */}
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center mb-2">
                      <AlertTriangle className="w-4 h-4 text-red-600 mr-2" />
                      <h4 className="font-medium text-red-800">Dispute Details</h4>
                    </div>
                    <p className="text-red-700 text-sm">
                      <strong>Reason:</strong> {dispute.dispute_reason}
                    </p>
                    <p className="text-red-600 text-xs mt-1">
                      Reported via booking cancellation on {new Date(dispute.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Client Information */}
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="font-medium text-blue-800 mb-3 flex items-center">
                        <User className="w-4 h-4 mr-2" />
                        Client: {dispute.client.name}
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center text-blue-700">
                          <span className="w-16 text-blue-600">Phone:</span>
                          <span>{dispute.client.phone}</span>
                        </div>
                        {dispute.client.email && (
                          <div className="flex items-center text-blue-700">
                            <span className="w-16 text-blue-600">Email:</span>
                            <span>{dispute.client.email}</span>
                          </div>
                        )}
                        <div className="flex items-center text-blue-700">
                          <MapPin className="w-3 h-3 mr-1" />
                          <span>{dispute.client.city}, {dispute.client.state}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className={
                            dispute.client.verification_status === 'id_verified' 
                              ? "border-green-300 text-green-700 bg-green-50"
                              : "border-yellow-300 text-yellow-700 bg-yellow-50"
                          }>
                            {dispute.client.verification_status === 'id_verified' ? 'Verified' : 'Unverified'}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Merchant Information */}
                    <div className="bg-purple-50 rounded-lg p-4">
                      <h4 className="font-medium text-purple-800 mb-3 flex items-center">
                        <User className="w-4 h-4 mr-2" />
                        Merchant: {dispute.merchant.name}
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center text-purple-700">
                          <span className="w-16 text-purple-600">Phone:</span>
                          <span>{dispute.merchant.phone}</span>
                        </div>
                        {dispute.merchant.email && (
                          <div className="flex items-center text-purple-700">
                            <span className="w-16 text-purple-600">Email:</span>
                            <span>{dispute.merchant.email}</span>
                          </div>
                        )}
                        <div className="flex items-center text-purple-700">
                          <MapPin className="w-3 h-3 mr-1" />
                          <span>{dispute.merchant.city}, {dispute.merchant.state}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className={
                            dispute.merchant.verification_status === 'id_verified' 
                              ? "border-green-300 text-green-700 bg-green-50"
                              : "border-yellow-300 text-yellow-700 bg-yellow-50"
                          }>
                            {dispute.merchant.verification_status === 'id_verified' ? 'Verified' : 'Unverified'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Booking Details */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      Booking Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Agreed Price:</span>
                        <div className="text-lg font-bold text-green-600">₦{dispute.price_agreed.toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Status:</span>
                        <div>
                          <Badge variant="outline" className="border-gray-300 text-gray-700 capitalize">
                            {dispute.status}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Timeline:</span>
                        <div className="text-gray-600">
                          <div className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            Requested: {new Date(dispute.requested_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Admin Actions */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-medium text-gray-900">Resolution Actions</h5>
                        <p className="text-sm text-gray-500">Choose how to resolve this dispute</p>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" className="border-blue-300 text-blue-700 hover:bg-blue-50">
                          Refund Client
                        </Button>
                        <Button variant="outline" size="sm" className="border-purple-300 text-purple-700 hover:bg-purple-50">
                          Support Merchant
                        </Button>
                        <Button variant="outline" size="sm" className="border-yellow-300 text-yellow-700 hover:bg-yellow-50">
                          Mediate Solution
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Resolution Guidelines */}
        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800">Dispute Resolution Guidelines</CardTitle>
          </CardHeader>
          <CardContent className="text-blue-700 space-y-2">
            <div>• Contact both parties to understand the situation before making decisions</div>
            <div>• Review booking history, messages, and any evidence provided</div>
            <div>• For payment disputes, verify payment completion and service delivery</div>
            <div>• Consider merchant reputation and client history when mediating</div>
            <div>• Document resolution decisions and communicate clearly to both parties</div>
            <div>• Escalate complex disputes to senior management if needed</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}