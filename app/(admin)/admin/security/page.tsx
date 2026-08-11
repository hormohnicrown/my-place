import { getCurrentUser } from '@/lib/auth/actions'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Shield, AlertTriangle, CheckCircle, XCircle, Clock, Lock, Server, Code, Database, Key, FileText } from 'lucide-react'
import Link from 'next/link'
import { securityChecks, calculateSecurityScore, productionHardeningChecklist } from '@/lib/security/audit'
import { SecurityActions } from './security-actions'
import type { SecurityCategory } from '@/lib/security/audit'

export default async function SecurityAuditPage() {
  const user = await getCurrentUser()

  // Basic admin check
  if (!user || user.role !== 'admin') {
    redirect('/login')
  }

  const score = calculateSecurityScore(securityChecks)

  const categoryIcons: Record<SecurityCategory, typeof Shield> = {
    authentication: Lock,
    authorization: Shield,
    data_protection: Database,
    api_security: Server,
    infrastructure: Server,
    code_security: Code
  }

  const getCategoryColor = (category: SecurityCategory) => {
    const colors: Record<SecurityCategory, string> = {
      authentication: 'bg-blue-100 text-blue-800',
      authorization: 'bg-purple-100 text-purple-800',
      data_protection: 'bg-green-100 text-green-800',
      api_security: 'bg-orange-100 text-orange-800',
      infrastructure: 'bg-red-100 text-red-800',
      code_security: 'bg-yellow-100 text-yellow-800'
    }
    return colors[category]
  }

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'critical':
        return <Badge variant="outline" className="border-red-300 text-red-700 bg-red-50">Critical</Badge>
      case 'high':
        return <Badge variant="outline" className="border-orange-300 text-orange-700 bg-orange-50">High</Badge>
      case 'medium':
        return <Badge variant="outline" className="border-yellow-300 text-yellow-700 bg-yellow-50">Medium</Badge>
      case 'low':
        return <Badge variant="outline" className="border-blue-300 text-blue-700 bg-blue-50">Low</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'fail':
        return <XCircle className="w-5 h-5 text-red-600" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />
      default:
        return <Clock className="w-5 h-5 text-gray-400" />
    }
  }

  // Group checks by category
  const checksByCategory = securityChecks.reduce((acc, check) => {
    if (!acc[check.category]) {
      acc[check.category] = []
    }
    acc[check.category].push(check)
    return acc
  }, {} as Record<SecurityCategory, typeof securityChecks>)

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
                  <Shield className="w-6 h-6 mr-2 text-red-600" />
                  Security Audit & Hardening
                </h1>
                <p className="text-gray-600 mt-1">Comprehensive security assessment for production readiness</p>
              </div>
            </div>
            
            <div className="text-right">
              <div className={`text-2xl font-bold ${
                score.score >= 90 ? 'text-green-600' :
                score.score >= 70 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {score.score}/100
              </div>
              <div className="text-sm text-gray-500">Security Score</div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overall Status */}
        <Card className={`mb-8 border-l-4 ${
          score.failed === 0 && score.critical === score.passed 
            ? 'border-green-400 bg-green-50' 
            : score.failed > 0 
            ? 'border-red-400 bg-red-50'
            : 'border-yellow-400 bg-yellow-50'
        }`}>
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  score.failed === 0 ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {score.failed === 0 ? (
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  ) : (
                    <XCircle className="w-8 h-8 text-red-600" />
                  )}
                </div>
                
                <div>
                  <h2 className={`text-2xl font-bold ${
                    score.failed === 0 ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {score.failed === 0 
                      ? '✅ Security Checks Passed' 
                      : `⚠️ ${score.failed} Security ${score.failed === 1 ? 'Issue' : 'Issues'} Found`
                    }
                  </h2>
                  <p className={`mt-1 ${
                    score.failed === 0 ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {score.passed} passed • {score.failed} failed • {score.warnings} warnings • {score.notTested} not tested
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <SecurityActions />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-gray-900">{score.score}</div>
              <div className="text-sm text-gray-600">Score</div>
            </CardContent>
          </Card>

          <Card className="border-red-200">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-red-600">{score.critical}</div>
              <div className="text-sm text-gray-600">Critical</div>
            </CardContent>
          </Card>

          <Card className="border-orange-200">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-orange-600">{score.high}</div>
              <div className="text-sm text-gray-600">High</div>
            </CardContent>
          </Card>

          <Card className="border-yellow-200">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-yellow-600">{score.medium}</div>
              <div className="text-sm text-gray-600">Medium</div>
            </CardContent>
          </Card>

          <Card className="border-green-200">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-green-600">{score.passed}</div>
              <div className="text-sm text-gray-600">Passed</div>
            </CardContent>
          </Card>

          <Card className="border-red-200">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-red-600">{score.failed}</div>
              <div className="text-sm text-gray-600">Failed</div>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-gray-600">{score.notTested}</div>
              <div className="text-sm text-gray-600">Untested</div>
            </CardContent>
          </Card>
        </div>

        {/* Security Checks by Category */}
        <div className="space-y-6">
          {Object.entries(checksByCategory).map(([category, checks]) => {
            const Icon = categoryIcons[category as SecurityCategory]
            const categoryScore = calculateSecurityScore(checks)

            return (
              <Card key={category}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getCategoryColor(category as SecurityCategory)}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg capitalize flex items-center space-x-2">
                          <span>{category.replace('_', ' ')}</span>
                          <Badge variant="secondary" className="text-xs">
                            {categoryScore.passed}/{checks.length}
                          </Badge>
                        </CardTitle>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {categoryScore.failed > 0 && (
                        <Badge variant="outline" className="border-red-300 text-red-700 bg-red-50">
                          {categoryScore.failed} failed
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-3">
                    {checks.map((check) => (
                      <div 
                        key={check.id}
                        className={`p-4 rounded-lg border ${
                          check.status === 'pass' ? 'bg-green-50 border-green-200' :
                          check.status === 'fail' ? 'bg-red-50 border-red-200' :
                          check.status === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                          'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 flex-1">
                            {getStatusIcon(check.status)}
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <h4 className="font-medium text-gray-900">{check.title}</h4>
                                {getLevelBadge(check.level)}
                                {check.cweId && (
                                  <Badge variant="outline" className="text-xs">
                                    {check.cweId}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-700 mb-2">{check.description}</p>
                              
                              {check.recommendation && (
                                <div className="text-sm bg-white/50 p-2 rounded mb-2">
                                  <strong className="text-blue-800">Recommendation:</strong>
                                  <span className="text-gray-700"> {check.recommendation}</span>
                                </div>
                              )}

                              {check.implementation && (
                                <div className="text-sm bg-white/50 p-2 rounded">
                                  <strong className="text-purple-800">Implementation:</strong>
                                  <span className="text-gray-700"> {check.implementation}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Production Hardening Checklist */}
        <Card className="mt-8 bg-purple-50 border-purple-200">
          <CardHeader>
            <CardTitle className="text-purple-800 flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Production Hardening Checklist
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {productionHardeningChecklist.map((section, index) => (
                <div key={index}>
                  <h3 className="font-semibold text-purple-800 mb-3">{section.category}</h3>
                  <div className="space-y-2">
                    {section.items.map((item, itemIndex) => (
                      <div key={itemIndex} className="flex items-start space-x-2">
                        <div className="w-5 h-5 rounded border-2 border-purple-300 mt-0.5" />
                        <span className="text-sm text-purple-700">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Security Best Practices */}
        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800">Security Best Practices</CardTitle>
          </CardHeader>
          <CardContent className="text-blue-700 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">🔒 Authentication & Authorization</h4>
                <ul className="space-y-1 text-sm">
                  <li>• Rate limit OTP requests (3 per hour per phone)</li>
                  <li>• OTP codes expire in 5 minutes</li>
                  <li>• RLS enabled on all database tables</li>
                  <li>• Users can only access their own data</li>
                  <li>• Admin functions verify proper roles</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">🛡️ Data Protection</h4>
                <ul className="space-y-1 text-sm">
                  <li>• Never store raw payment card data</li>
                  <li>• ID verification images auto-delete after 90 days</li>
                  <li>• Database backups encrypted</li>
                  <li>• NDPR compliance (data export/deletion)</li>
                  <li>• PII encrypted at rest</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">🌐 API Security</h4>
                <ul className="space-y-1 text-sm">
                  <li>• Rate limiting on all public endpoints</li>
                  <li>• Input validation with Zod schemas</li>
                  <li>• Parameterized queries (no SQL injection)</li>
                  <li>• XSS protection (React auto-escapes)</li>
                  <li>• CSRF protection (Server Actions)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">⚙️ Infrastructure</h4>
                <ul className="space-y-1 text-sm">
                  <li>• HTTPS enforced everywhere</li>
                  <li>• Security headers configured</li>
                  <li>• No secrets in code (env vars only)</li>
                  <li>• Dependencies scanned for vulnerabilities</li>
                  <li>• Error messages sanitized</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}