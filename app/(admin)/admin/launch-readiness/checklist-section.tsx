'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, AlertTriangle, Clock, ChevronDown, ChevronUp, Info } from 'lucide-react'
import type { LaunchChecklistSection } from '@/lib/launch/checklist'
import type { LucideIcon } from 'lucide-react'

interface ChecklistSectionProps {
  section: LaunchChecklistSection
  icon: LucideIcon
}

export function ChecklistSection({ section, icon: Icon }: ChecklistSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [expandedChecks, setExpandedChecks] = useState<Set<string>>(new Set())

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pass':
        return <Badge variant="outline" className="border-green-300 text-green-700 bg-green-50">Passed</Badge>
      case 'fail':
        return <Badge variant="outline" className="border-red-300 text-red-700 bg-red-50">Failed</Badge>
      case 'warning':
        return <Badge variant="outline" className="border-yellow-300 text-yellow-700 bg-yellow-50">Warning</Badge>
      case 'pending':
        return <Badge variant="outline" className="border-gray-300 text-gray-700">Pending</Badge>
      default:
        return <Badge variant="outline" className="border-gray-300 text-gray-700">Unknown</Badge>
    }
  }

  const toggleCheckExpansion = (checkId: string) => {
    setExpandedChecks(prev => {
      const next = new Set(prev)
      if (next.has(checkId)) {
        next.delete(checkId)
      } else {
        next.add(checkId)
      }
      return next
    })
  }

  // Calculate section stats
  const totalChecks = section.checks.length
  const passedChecks = section.checks.filter(c => c.status === 'pass').length
  const failedChecks = section.checks.filter(c => c.status === 'fail').length
  const requiredChecks = section.checks.filter(c => c.required).length

  return (
    <Card>
      <CardHeader 
        className="cursor-pointer hover:bg-gray-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Icon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center space-x-2">
                <span>{section.title}</span>
                <Badge variant="secondary" className="text-xs">
                  {passedChecks}/{totalChecks}
                </Badge>
                {requiredChecks > 0 && (
                  <Badge variant="outline" className="text-xs border-orange-300 text-orange-700">
                    {requiredChecks} required
                  </Badge>
                )}
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">{section.description}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {failedChecks > 0 && (
              <Badge variant="outline" className="border-red-300 text-red-700 bg-red-50">
                {failedChecks} failed
              </Badge>
            )}
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent>
          <div className="space-y-3">
            {section.checks.map((check) => (
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
                        {check.required && (
                          <Badge variant="outline" className="text-xs border-red-300 text-red-700">
                            Required
                          </Badge>
                        )}
                        {check.autoCheck && (
                          <Badge variant="outline" className="text-xs border-blue-300 text-blue-700">
                            Auto-check
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{check.description}</p>
                      
                      {check.details && (
                        <div className="text-sm text-gray-600 bg-white/50 p-2 rounded mb-2">
                          <strong>Details:</strong> {check.details}
                        </div>
                      )}

                      {/* Verification Steps */}
                      {check.verificationSteps && check.verificationSteps.length > 0 && (
                        <div className="mt-2">
                          <button
                            onClick={() => toggleCheckExpansion(check.id)}
                            className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
                          >
                            <Info className="w-3 h-3 mr-1" />
                            {expandedChecks.has(check.id) ? 'Hide' : 'Show'} verification steps
                          </button>
                          
                          {expandedChecks.has(check.id) && (
                            <div className="mt-2 p-3 bg-white rounded border border-gray-200">
                              <h5 className="text-sm font-medium text-gray-900 mb-2">Verification Steps:</h5>
                              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
                                {check.verificationSteps.map((step, index) => (
                                  <li key={index}>{step}</li>
                                ))}
                              </ol>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="ml-4">
                    {getStatusBadge(check.status)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  )
}