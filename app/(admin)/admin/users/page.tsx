import { getCurrentUser } from '@/lib/auth/actions'
import { getUsers } from '@/lib/admin/actions'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Users, User, Phone, Mail, MapPin, Calendar, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { UserManagementActions } from './user-actions'
import { AdminNavbar } from '@/components/navigation/AdminNavbar'

type SearchParams = {
  page?: string
  role?: 'client' | 'merchant'
}

export default async function UsersManagementPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>
}) {
  const user = await getCurrentUser()

  // Basic admin check
  if (!user || user.role !== 'admin') {
    redirect('/login')
  }

  const { page: pageParam, role } = await searchParams
  const page = parseInt(pageParam || '1', 10)
  
  const usersResult = await getUsers(page, 20, role)
  const { data: users = [], count = 0, totalPages = 1 } = usersResult.success 
    ? usersResult 
    : { data: [], count: 0, totalPages: 1 }

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case 'id_verified':
        return <Badge variant="outline" className="border-green-300 text-green-700 bg-green-50">Verified</Badge>
      case 'pending':
        return <Badge variant="outline" className="border-yellow-300 text-yellow-700 bg-yellow-50">Pending</Badge>
      case 'failed':
        return <Badge variant="outline" className="border-red-300 text-red-700 bg-red-50">Failed</Badge>
      default:
        return <Badge variant="outline" className="border-gray-300 text-gray-700">Unverified</Badge>
    }
  }

  const getRoleBadge = (userRole: string) => {
    return userRole === 'merchant' 
      ? <Badge variant="secondary" className="bg-blue-100 text-blue-800">Merchant</Badge>
      : <Badge variant="secondary" className="bg-green-100 text-green-800">Client</Badge>
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
                  <Users className="w-6 h-6 mr-2 text-blue-600" />
                  User Management
                </h1>
                <p className="text-gray-600 mt-1">View and manage user accounts, verification status, and access</p>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">{count.toLocaleString()}</div>
              <div className="text-sm text-gray-500">Total Users</div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Filter by Role:</span>
                </div>
                
                <div className="flex space-x-2">
                  <Link href="/admin/users">
                    <Button 
                      variant={!role ? "default" : "outline"} 
                      size="sm"
                    >
                      All Users
                    </Button>
                  </Link>
                  <Link href="/admin/users?role=client">
                    <Button 
                      variant={role === 'client' ? "default" : "outline"} 
                      size="sm"
                    >
                      Clients
                    </Button>
                  </Link>
                  <Link href="/admin/users?role=merchant">
                    <Button 
                      variant={role === 'merchant' ? "default" : "outline"} 
                      size="sm"
                    >
                      Merchants
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Search className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-500">
                  Showing {((page - 1) * 20) + 1}-{Math.min(page * 20, count)} of {count} users
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        <div className="space-y-4">
          {users.map((userData) => (
            <Card key={userData.id} className="hover:shadow-md transition-shadow">
              <CardContent className="py-6">
                <div className="flex items-center justify-between">
                  {/* User Info */}
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-gray-600" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-lg font-medium text-gray-900">{userData.name}</h3>
                        {getRoleBadge(userData.role)}
                        {getVerificationBadge(userData.verification_status)}
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Phone className="w-3 h-3 mr-1" />
                          {userData.phone}
                        </div>
                        {userData.email && (
                          <div className="flex items-center">
                            <Mail className="w-3 h-3 mr-1" />
                            {userData.email}
                          </div>
                        )}
                        {userData.city && (
                          <div className="flex items-center">
                            <MapPin className="w-3 h-3 mr-1" />
                            {userData.city}, {userData.state}
                          </div>
                        )}
                        <div className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          Joined {new Date(userData.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    <UserManagementActions 
                      userId={userData.id}
                      userName={userData.name}
                      userRole={userData.role}
                      verificationStatus={userData.verification_status}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* No Users */}
        {users.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Users Found</h3>
              <p className="text-gray-500">
                {role ? `No ${role}s found in the system.` : 'No users found matching your criteria.'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </div>
            
            <div className="flex items-center space-x-2">
              <Link 
                href={`/admin/users?page=${page - 1}${role ? `&role=${role}` : ''}`}
                className={page <= 1 ? 'pointer-events-none opacity-50' : ''}
              >
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={page <= 1}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
              </Link>
              
              <Link 
                href={`/admin/users?page=${page + 1}${role ? `&role=${role}` : ''}`}
                className={page >= totalPages ? 'pointer-events-none opacity-50' : ''}
              >
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={page >= totalPages}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* User Management Guidelines */}
        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800">User Management Guidelines</CardTitle>
          </CardHeader>
          <CardContent className="text-blue-700 space-y-2">
            <div>• <strong>Verification:</strong> Prioritize ID verification for new users, especially merchants</div>
            <div>• <strong>Suspension:</strong> Suspend accounts showing suspicious behavior or policy violations</div>
            <div>• <strong>Communication:</strong> Contact users before taking account actions when possible</div>
            <div>• <strong>Privacy:</strong> Protect user personal information and follow data protection guidelines</div>
            <div>• <strong>Documentation:</strong> Record reasons for account actions and status changes</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}