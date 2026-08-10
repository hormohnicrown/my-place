import { getCurrentUser } from '@/lib/auth/actions'
import { getLaunchReadinessStatus, getPreLaunchRecommendations } from '@/lib/launch/actions'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Rocket, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock,
  Shield,
  Server,
  FileText,
  Scale,
  Headphones,
  Activity,
  TrendingUp,
  Download
} from 'lucide-react'
import Link from 'next/link'
import { ChecklistSection } from './checklist-section'
import { LaunchActions } from './launch-actions'

export default async function LaunchReadinessPage() {
  const user = await getCurrentUser()

  // Basic admin check
  if (!user || user.role !== 'merchant') {
    redirect('/login')
  }

  const readinessResult = await getLaunchReadinessStatus()
  const recommendationsResult = await getPreLaunchRecommendations()

  const readiness = readinessResult.success ? readinessResult.data : null
  const recommendations = recommendationsResult.success ? recommendationsResult.data : null

  if (!readiness) {
    return <div>Error loading launch readiness data</div>
  }

  const score = readiness.readinessScore
  const categoryIcons = {
    security: Shield,
    infrastructure: Server,
    content: FileText,
    legal: Scale,
    operations: Headphones,
    monitoring: Activity
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'fail':
        return <XCircle className="w-5 h-5 text-red-600" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />
      case 'pending':
        return <Clock className="w-5 h-5 text-gray-400" />
      default:
        return <Clock className="w-5 h-5 text-gray-400" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-red-300 bg-red-50 text-red-800'
      case 'high':
        return 'border-orange-300 bg-orange-50 text-orange-800'
      case 'medium':
        return 'border-yellow-300 bg-yellow-50 text-yellow-800'
      default:
        return 'border-blue-300 bg-blue-50 text-blue-800'
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
                  <Rocket className="w-6 h-6 mr-2 text-blue-600" />
                  Launch Readiness Checklist
                </h1>
                <p className="text-gray-600 mt-1">Comprehensive pre-launch verification and monitoring</p>
              </div>
            </div>
            
            <div className="text-right">
              <div className={`text-2xl font-bold ${
                score.readyForLaunch ? 'text-green-600' : 'text-yellow-600'
              }`}>
                {score.completionPercentage}%
              </div>
              <div className="text-sm text-gray-500">Launch Ready</div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overall Status */}
        <Card className={`mb-8 border-l-4 ${
          score.readyForLaunch 
            ? 'border-green-400 bg-green-50' 
            : score.failed > 0 
            ? 'border-red-400 bg-red-50'
            : 'border-yellow-400 bg-yellow-50'
        }`}>
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  score.readyForLaunch 
                    ? 'bg-green-100' 
                    : score.failed > 0 
                    ? 'bg-red-100'
                    : 'bg-yellow-100'
                }`}>
                  {score.readyForLaunch ? (
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  ) : score.failed > 0 ? (
                    <XCircle className="w-8 h-8 text-red-600" />
                  ) : (
                    <AlertTriangle className="w-8 h-8 text-yellow-600" />
                  )}
                </div>
                
                <div>
                  <h2 className={`text-2xl font-bold ${
                    score.readyForLaunch ? 'text-green-800' : score.failed > 0 ? 'text-red-800' : 'text-yellow-800'
                  }`}>
                    {score.readyForLaunch 
                      ? '🎉 Ready for Production Launch!' 
                      : score.failed > 0 
                      ? '❌ Not Ready - Critical Issues Found'
                      : '⚠️ Launch Preparation in Progress'
                    }
                  </h2>
                  <p className={`mt-1 ${
                    score.readyForLaunch ? 'text-green-700' : score.failed > 0 ? 'text-red-700' : 'text-yellow-700'
                  }`}>
                    {score.requiredPassed} of {score.requiredTotal} required checks passed • {score.pending} pending • {score.failed} failed
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <LaunchActions />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-green-600">{score.passed}</div>
              <div className="text-sm text-gray-600">Passed</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-red-600">{score.failed}</div>
              <div className="text-sm text-gray-600">Failed</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-yellow-600">{score.warnings}</div>
              <div className="text-sm text-gray-600">Warnings</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-gray-600">{score.pending}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-blue-600">{score.requiredPassed}</div>
              <div className="text-sm text-gray-600">Required ✓</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-purple-600">{score.completionPercentage}%</div>
              <div className="text-sm text-gray-600">Complete</div>
            </CardContent>
          </Card>
        </div>

        {/* Pre-Launch Recommendations */}
        {recommendations && recommendations.recommendations.length > 0 && (
          <Card className="mb-8 border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="text-orange-800 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Pre-Launch Recommendations ({recommendations.recommendations.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recommendations.recommendations.map((rec, index) => (
                  <div 
                    key={index}
                    className={`p-4 rounded-lg border ${getSeverityColor(rec.severity)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-semibold">{rec.title}</span>
                          <Badge variant="outline" className="text-xs capitalize">
                            {rec.severity}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {rec.category}
                          </Badge>
                        </div>
                        <p className="text-sm mb-2">{rec.description}</p>
                        <p className="text-sm font-medium">
                          → Action: {rec.action}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* System Metrics */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              System Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <div className="text-sm text-gray-600">Total Users</div>
                <div className="text-2xl font-bold text-blue-600">
                  {readiness.systemMetrics.totalUsers}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Total Merchants</div>
                <div className="text-2xl font-bold text-purple-600">
                  {readiness.systemMetrics.totalMerchants}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Total Bookings</div>
                <div className="text-2xl font-bold text-green-600">
                  {readiness.systemMetrics.totalBookings}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Environment</div>
                <div className="text-2xl font-bold capitalize">
                  {readiness.systemMetrics.environment}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Checklist by Category */}
        <div className="space-y-6">
          {readiness.checklist.map((section) => {
            const Icon = categoryIcons[section.category]
            return (
              <ChecklistSection 
                key={section.category}
                section={section}
                icon={Icon}
              />
            )
          })}
        </div>

        {/* Launch Guidelines */}
        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800">Launch Guidelines</CardTitle>
          </CardHeader>
          <CardContent className="text-blue-700 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Before Going Live:</h4>
                <ul className="space-y-1 text-sm">
                  <li>✓ All required checks must pass (green)</li>
                  <li>✓ No critical or failed checks remaining</li>
                  <li>✓ Deploy seed merchants for marketplace credibility</li>
                  <li>✓ Test complete user flows end-to-end</li>
                  <li>✓ Verify payment processing in production</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">After Launch:</h4>
                <ul className="space-y-1 text-sm">
                  <li>✓ Monitor error rates and uptime closely</li>
                  <li>✓ Watch for user signup and booking patterns</li>
                  <li>✓ Respond quickly to support requests</li>
                  <li>✓ Track verification approval times</li>
                  <li>✓ Review and resolve disputes promptly</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}