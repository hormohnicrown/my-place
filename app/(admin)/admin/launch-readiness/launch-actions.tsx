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
import { Play, Download, RefreshCcw, CheckCircle, AlertTriangle } from 'lucide-react'
import { runAutomatedChecks, generateLaunchReport } from '@/lib/launch/actions'
import { useRouter } from 'next/navigation'

export function LaunchActions() {
  const [isRunningChecks, setIsRunningChecks] = useState(false)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const [checkResults, setCheckResults] = useState<any>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const router = useRouter()

  const handleRunAutomatedChecks = async () => {
    setIsRunningChecks(true)
    setCheckResults(null)
    
    try {
      const result = await runAutomatedChecks()
      setCheckResults(result)
      
      if (result.success) {
        // Refresh the page to show updated statuses
        router.refresh()
      }
    } catch (error) {
      setCheckResults({
        success: false,
        error: 'Failed to run automated checks'
      })
    } finally {
      setIsRunningChecks(false)
    }
  }

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true)
    
    try {
      const result = await generateLaunchReport()
      
      if (result.success) {
        // Create downloadable report
        const reportContent = JSON.stringify(result.data, null, 2)
        const blob = new Blob([reportContent], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `launch-report-${new Date().toISOString().split('T')[0]}.json`
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
          >
            <Play className="w-4 h-4 mr-1" />
            Run Checks
          </Button>
        </DialogTrigger>
        
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Run Automated Checks</DialogTitle>
            <DialogDescription>
              Automatically verify checks that can be validated programmatically.
            </DialogDescription>
          </DialogHeader>

          {checkResults && (
            <div className={`p-4 rounded-lg border ${
              checkResults.success 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center mb-2">
                {checkResults.success ? (
                  <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-600 mr-2" />
                )}
                <span className={`font-medium ${
                  checkResults.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {checkResults.success ? 'Checks Completed' : 'Error Running Checks'}
                </span>
              </div>

              {checkResults.success && checkResults.data && (
                <div className="space-y-2 text-sm">
                  {Object.entries(checkResults.data).map(([checkId, result]: [string, any]) => (
                    <div key={checkId} className="bg-white p-2 rounded border border-gray-200">
                      <div className="font-medium capitalize">{checkId.replace(/-/g, ' ')}</div>
                      <div className="text-gray-600">{result.details}</div>
                      <div className={`text-xs mt-1 ${
                        result.status === 'pass' ? 'text-green-600' :
                        result.status === 'fail' ? 'text-red-600' :
                        'text-yellow-600'
                      }`}>
                        Status: {result.status}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!checkResults.success && (
                <p className="text-sm text-red-700">{checkResults.error}</p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsDialogOpen(false)
                setCheckResults(null)
              }}
            >
              Close
            </Button>
            <Button 
              onClick={handleRunAutomatedChecks}
              disabled={isRunningChecks}
            >
              {isRunningChecks ? 'Running...' : 'Run Automated Checks'}
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