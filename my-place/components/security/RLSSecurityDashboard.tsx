'use client'

import { useState } from 'react'
import { validateBookingRequestsRLS, type SecurityAuditResult } from '@/lib/security/rls-validation'
import { Shield, AlertTriangle, CheckCircle, X, Play, Loader2, Eye, Lock, AlertCircle } from 'lucide-react'

type RLSSecurityDashboardProps = {
  className?: string
}

export default function RLSSecurityDashboard({ className = '' }: RLSSecurityDashboardProps) {
  const [auditResult, setAuditResult] = useState<SecurityAuditResult | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [error, setError] = useState('')

  const runSecurityAudit = async () => {
    try {
      setIsRunning(true)
      setError('')
      setAuditResult(null)

      const result = await validateBookingRequestsRLS()
      setAuditResult(result)

      if (!result.success) {
        setError(result.error || 'Security audit failed')
      }
    } catch (err) {
      console.error('Security audit error:', err)
      setError(err instanceof Error ? err.message : 'Failed to run security audit')
    } finally {
      setIsRunning(false)
    }
  }

  const getTestStatusIcon = (passed: boolean) => {
    return passed ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <X className="h-4 w-4 text-red-600" />
    )
  }

  const getTestStatusColor = (passed: boolean) => {
    return passed 
      ? 'bg-green-50 border-green-200 text-green-800'
      : 'bg-red-50 border-red-200 text-red-800'
  }

  const getSeverityIcon = (testCase: string) => {
    if (testCase.includes('Cross-user data leakage')) {
      return <AlertTriangle className="h-4 w-4 text-red-600" />
    }
    if (testCase.includes('Address') || testCase.includes('Commission')) {
      return <AlertCircle className="h-4 w-4 text-orange-500" />
    }
    return <Lock className="h-4 w-4 text-blue-600" />
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Shield className="h-6 w-6 text-blue-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">RLS Security Dashboard</h2>
          </div>
          
          <button
            onClick={runSecurityAudit}
            disabled={isRunning}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Running Audit...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Run Security Audit
              </>
            )}
          </button>
        </div>
        
        <p className="text-gray-600 mt-2">
          Validate Row Level Security (RLS) policies for data protection and access control
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border-b border-red-200">
          <div className="flex items-start">
            <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800">Security Audit Error</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Audit Results */}
      {auditResult && (
        <div className="p-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-900">{auditResult.total_tests}</div>
              <div className="text-sm text-blue-700">Total Tests</div>
            </div>
            
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-900">{auditResult.passed_tests}</div>
              <div className="text-sm text-green-700">Passed</div>
            </div>
            
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
              <div className="text-2xl font-bold text-red-900">{auditResult.failed_tests}</div>
              <div className="text-sm text-red-700">Failed</div>
            </div>
          </div>

          {/* Overall Status */}
          <div className={`p-4 rounded-lg mb-6 ${auditResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-center">
              {auditResult.success ? (
                <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
              ) : (
                <AlertTriangle className="h-6 w-6 text-red-600 mr-3" />
              )}
              <div>
                <p className={`font-semibold ${auditResult.success ? 'text-green-800' : 'text-red-800'}`}>
                  {auditResult.success ? 'Security Audit Passed' : 'Security Issues Detected'}
                </p>
                <p className={`text-sm ${auditResult.success ? 'text-green-700' : 'text-red-700'}`}>
                  {auditResult.success 
                    ? 'All RLS policies are functioning correctly'
                    : `${auditResult.failed_tests} security issue(s) require attention`
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Individual Test Results */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">Test Results</h3>
            
            <div className="space-y-3">
              {auditResult.results.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${getTestStatusColor(result.passed)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start flex-1">
                      <div className="flex items-center mr-3">
                        {getSeverityIcon(result.test_case)}
                        {getTestStatusIcon(result.passed)}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium">{result.test_case}</h4>
                          <span className="text-xs font-mono bg-white bg-opacity-50 px-2 py-1 rounded">
                            {result.table}
                          </span>
                        </div>
                        
                        <p className="text-sm mb-2">
                          <strong>Policy:</strong> {result.policy}
                        </p>
                        
                        {result.details && (
                          <p className="text-sm mb-2">{result.details}</p>
                        )}
                        
                        {result.error && (
                          <div className="text-sm bg-white bg-opacity-50 p-2 rounded border">
                            <strong>Error:</strong> {result.error}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          {auditResult.recommendations && auditResult.recommendations.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Security Recommendations</h3>
              
              <div className="space-y-2">
                {auditResult.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-blue-600 mr-3 mt-0.5">
                      {recommendation.startsWith('✅') ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : recommendation.startsWith('🚨') ? (
                        <AlertTriangle className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </div>
                    <p className="text-sm text-blue-800">{recommendation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Initial State */}
      {!auditResult && !isRunning && (
        <div className="p-6 text-center">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">
            No security audit results yet
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Run a security audit to validate RLS policies and identify potential vulnerabilities
          </p>
          
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-left">
            <h4 className="font-medium text-gray-900 mb-2">What this audit checks:</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• User access restrictions (own data only)</li>
              <li>• Address privacy enforcement (TRD §4 compliance)</li>
              <li>• Commission data protection (merchant-only access)</li>
              <li>• Status update authorization</li>
              <li>• Cross-user data leakage prevention</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}