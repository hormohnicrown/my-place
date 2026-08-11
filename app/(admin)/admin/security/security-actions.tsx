'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Play, Download, RefreshCcw, Shield, CheckCircle, AlertTriangle } from 'lucide-react'
import { runSecurityAudit, generateSecurityReport, testRLSPolicies } from '@/lib/security/actions'
import { useRouter } from 'next/navigation'

export function SecurityActions() {
  const [isRunningAudit, setIsRunningAudit] = useState(false)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const [isTestingRLS, setIsTestingRLS] = useState(false)
  const [auditResults, setAuditResults] = useState<any>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const router = useRouter()

  const handleRunAudit = async () => {
    setIsRunningAudit(true)
    setAuditResults(null)
    
    try {
      const result = await runSecurityAudit()
      setAuditResults(result)
      
      if (result.success) {
        router.refresh()
      }
    } catch (error) {
      setAuditResults({
        success: false,
        error: 'Failed to run security audit'
      })
    } finally {
      setIsRunningAudit(false)
    }
  }

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true)
    
    try {
      const result = await generateSecurityReport()
      
      if (result.success) {
        // Create downloadable report
        const reportContent = JSON.stringify(result.data, null, 2)
        const blob = new Blob([reportContent], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `security-audit-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Failed to generate report:', error)
    } finally {
      setIsGeneratingReport(false)
    }
  }

  const handleTestRLS = async () => {
    setIsTestingRLS(true)
    
    try {
      const result = await testRLSPolicies()
      
      if (result.success && result.data) {
        alert(`RLS Tests Complete:\n\n${result.data.map((r: any) => 
          `${r.test}: ${r.status}\n${r.details}`
        ).join('\n\n')}`)
      }
    } catch (error) {
      console.error('Failed to test RLS:', error)
    } finally {
      setIsTestingRLS(false)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => router.refresh()}
      >
        <RefreshCcw className="w-4 h-4 mr-1" />
        Refresh
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handleTestRLS}
        disabled={isTestingRLS}
      >
        <Shield className="w-4 h-4 mr-1" />
        {isTestingRLS ? 'Testing...' : 'Test RLS'}
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
          >
            <Play className="w-4 h-4 mr-1" />
            Run Audit
          </Button>
        </DialogTrigger>
        
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Run Security Audit</DialogTitle>
            <DialogDescription>
              Automatically test security controls and identify vulnerabilities.
            </DialogDescription>
          </DialogHeader>

          {auditResults && (
            <div className={`p-4 rounded-lg border ${
              auditResults.success 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center mb-2">
                {auditResults.success ? (
                  <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-600 mr-2" />
                )}
                <span className={`font-medium ${
                  auditResults.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {auditResults.success ? 'Audit Completed' : 'Audit Failed'}
                </span>
              </div>

              {auditResults.success && auditResults.data && (
                <div className="space-y-3 text-sm">
                  <div className="bg-white p-3 rounded border border-gray-200">
                    <div className="font-medium mb-2">Security Score</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {auditResults.data.score.score}/100
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white p-2 rounded border border-gray-200">
                      <div className="text-xs text-gray-600">Passed</div>
                      <div className="text-lg font-bold text-green-600">
                        {auditResults.data.score.passed}
                      </div>
                    </div>
                    <div className="bg-white p-2 rounded border border-gray-200">
                      <div className="text-xs text-gray-600">Failed</div>
                      <div className="text-lg font-bold text-red-600">
                        {auditResults.data.score.failed}
                      </div>
                    </div>
                    <div className="bg-white p-2 rounded border border-gray-200">
                      <div className="text-xs text-gray-600">Warnings</div>
                      <div className="text-lg font-bold text-yellow-600">
                        {auditResults.data.score.warnings}
                      </div>
                    </div>
                    <div className="bg-white p-2 rounded border border-gray-200">
                      <div className="text-xs text-gray-600">Not Tested</div>
                      <div className="text-lg font-bold text-gray-600">
                        {auditResults.data.score.notTested}
                      </div>
                    </div>
                  </div>

                  {auditResults.data.score.failed > 0 && (
                    <div className="bg-red-100 p-3 rounded border border-red-200">
                      <div className="font-medium text-red-800 mb-1">
                        ⚠️ Critical Issues Found
                      </div>
                      <div className="text-red-700">
                        {auditResults.data.score.failed} security {auditResults.data.score.failed === 1 ? 'check' : 'checks'} failed. 
                        Review the detailed results above and address all failures before production launch.
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-gray-600">
                    Tested {auditResults.data.checks.filter((c: any) => c.tested).length} of {auditResults.data.checks.length} checks automatically.
                    Manual verification required for remaining checks.
                  </div>
                </div>
              )}

              {!auditResults.success && (
                <p className="text-sm text-red-700">{auditResults.error}</p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsDialogOpen(false)
                setAuditResults(null)
              }}
            >
              Close
            </Button>
            <Button 
              onClick={handleRunAudit}
              disabled={isRunningAudit}
            >
              {isRunningAudit ? 'Running Audit...' : 'Run Security Audit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Button
        variant="default"
        size="sm"
        onClick={handleGenerateReport}
        disabled={isGeneratingReport}
      >
        <Download className="w-4 h-4 mr-1" />
        {isGeneratingReport ? 'Generating...' : 'Download Report'}
      </Button>
    </>
  )
}