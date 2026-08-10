import { getCurrentUser } from '@/lib/auth/actions'
import { getPendingVerifications } from '@/lib/admin/actions'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Shield, User, Phone, MapPin, Clock, CheckCircle, XCircle, Eye } from 'lucide-react'
import Link from 'next/link'
import { VerificationActions } from './verification-actions'

export default async function VerificationManagementPage() {
  const user = await getCurrentUser()

  // Basic admin check
  if (!user || user.role !== 'merchant') {
    redirect('/login')
  }

  const verificationsResult = await getPendingVerifications()
  const verifications = verificationsResult.success ? verificationsResult.data : []

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="border-yellow-300 text-yellow-700 bg-yellow-50">Pending Review</Badge>
      case 'failed':
        return <Badge variant="outline" className="border-red-300 text-red-700 bg-red-50">Failed/Rejected</Badge>
      case 'id_verified':
        return <Badge variant="outline" className="border-green-300 text-green-700 bg-green-50">Verified</Badge>
      default:
        return <Badge variant="outline" className="border-gray-300 text-gray-700">Unverified</Badge>
    }
  }

  const getRoleBadge = (role: string) => {
    return role === 'merchant' 
      ? <Badge variant="secondary" className="bg-blue-100 text-blue-800">Merchant</Badge>
      : <Badge variant="secondary" className="bg-green-100 text-green-800">Client</Badge>
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
                  <Shield className="w-6 h-6 mr-2 text-blue-600" />
                  ID Verification Management
                </h1>
                <p className="text-gray-600 mt-1">Review and manage user identity verifications</p>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-2xl font-bold text-yellow-600">{verifications.length}</div>
              <div className="text-sm text-gray-500">Pending Reviews</div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {verifications.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">All Clear!</h3>
              <p className="text-gray-500">No pending ID verifications to review at this time.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {verifications.map((userRecord) => (
              <Card key={userRecord.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{userRecord.name}</CardTitle>
                        <div className="flex items-center space-x-2 mt-1">
                          {getStatusBadge(userRecord.verification_status)}
                          {getRoleBadge(userRecord.role)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <VerificationActions 
                        userId={userRecord.id}
                        userName={userRecord.name}
                        currentStatus={userRecord.verification_status}
                      />
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Contact Information */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                        <Phone className="w-4 h-4 mr-1" />
                        Contact Information
                      </h4>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div>Phone: {userRecord.phone}</div>
                        {userRecord.email && <div>Email: {userRecord.email}</div>}
                      </div>
                    </div>

                    {/* Location */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        Location
                      </h4>
                      <div className="space-y-1 text-sm text-gray-600">
                        {userRecord.city && <div>City: {userRecord.city}</div>}
                        {userRecord.state && <div>State: {userRecord.state}</div>}
                      </div>
                    </div>

                    {/* Account Timeline */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        Timeline
                      </h4>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div>Joined: {new Date(userRecord.created_at).toLocaleDateString()}</div>
                        <div>Updated: {new Date(userRecord.updated_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                  </div>

                  {/* Verification Records */}
                  {userRecord.verification_records && userRecord.verification_records.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h4 className="font-medium text-gray-900 mb-3">Verification History</h4>
                      <div className="space-y-3">
                        {userRecord.verification_records.map((record) => (
                          <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className={`w-3 h-3 rounded-full ${
                                record.result === 'id_verified' ? 'bg-green-500' :
                                record.result === 'failed' ? 'bg-red-500' :
                                record.result === 'pending' ? 'bg-yellow-500' : 'bg-gray-400'
                              }`} />
                              
                              <div>
                                <div className="font-medium text-sm">
                                  {record.provider === 'smile_identity' ? 'Smile Identity' :
                                   record.provider === 'manual_admin_approval' ? 'Manual Admin Approval' :
                                   record.provider === 'manual_admin_rejection' ? 'Manual Admin Rejection' :
                                   record.provider}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {new Date(record.checked_at).toLocaleString()}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              {getStatusBadge(record.result)}
                              {record.provider_job_id && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="h-7 px-2 text-xs"
                                >
                                  <Eye className="w-3 h-3 mr-1" />
                                  Details
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quick Actions for Failed Verifications */}
                  {userRecord.verification_status === 'failed' && (
                    <div className="mt-6 pt-6 border-t border-red-200 bg-red-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-medium text-red-800">Failed Verification</h5>
                          <p className="text-sm text-red-600">This user's ID verification has failed and requires review.</p>
                        </div>
                        <div className="flex space-x-2">
                          <VerificationActions 
                            userId={userRecord.id}
                            userName={userRecord.name}
                            currentStatus={userRecord.verification_status}
                            size="sm"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Help Section */}
        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800">Verification Guidelines</CardTitle>
          </CardHeader>
          <CardContent className="text-blue-700 space-y-2">
            <div>• Only approve verifications with clear, valid government-issued ID documents</div>
            <div>• Check that the name on ID matches the registered user name exactly</div>
            <div>• Reject blurry, edited, or suspicious document images</div>
            <div>• When in doubt, request re-submission rather than approving</div>
            <div>• Document your approval/rejection reasons for audit purposes</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}