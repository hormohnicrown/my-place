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
import { CheckCircle, AlertTriangle, RefreshCcw, Database, Trash } from 'lucide-react'
import { seedMerchantTestimonials, clearSeedData } from '@/lib/seed-data/actions'
import { useRouter } from 'next/navigation'

type SeedDataActionsProps = {
  action: 'seed' | 'clear' | 'refresh'
}

export function SeedDataActions({ action }: SeedDataActionsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string; details?: any } | null>(null)
  const router = useRouter()

  const actionConfig = {
    seed: {
      title: 'Deploy Seed Merchants',
      description: 'This will create sample merchant accounts with authentic testimonials to bootstrap your marketplace.',
      buttonText: 'Deploy Seed Data',
      buttonClass: 'bg-green-600 hover:bg-green-700',
      icon: CheckCircle,
      confirmText: 'Deploy',
      loadingText: 'Deploying...'
    },
    clear: {
      title: 'Clear All Seed Data',
      description: 'This will permanently delete all seed merchants, their profiles, and testimonials. This action cannot be undone.',
      buttonText: 'Clear Seed Data',
      buttonClass: 'bg-red-600 hover:bg-red-700',
      icon: Trash,
      confirmText: 'Clear All Data',
      loadingText: 'Clearing...'
    },
    refresh: {
      title: 'Refresh Statistics',
      description: 'Reload the page to show updated seed data statistics.',
      buttonText: 'Refresh Stats',
      buttonClass: 'bg-blue-600 hover:bg-blue-700',
      icon: RefreshCcw,
      confirmText: 'Refresh',
      loadingText: 'Refreshing...'
    }
  }

  const config = actionConfig[action]
  const Icon = config.icon

  const handleAction = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      if (action === 'seed') {
        const result = await seedMerchantTestimonials()
        setResult({
          success: result.success,
          message: result.success ? result.data?.message || 'Successfully deployed seed data' : result.error || 'Failed to deploy seed data',
          details: result.data
        })
      } else if (action === 'clear') {
        const result = await clearSeedData()
        setResult({
          success: result.success,
          message: result.success ? result.data?.message || 'Successfully cleared seed data' : result.error || 'Failed to clear seed data',
          details: result.data
        })
      } else if (action === 'refresh') {
        router.refresh()
        setResult({
          success: true,
          message: 'Statistics refreshed successfully'
        })
        setIsOpen(false)
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'An unexpected error occurred'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    setResult(null)
    if (result?.success && (action === 'seed' || action === 'clear')) {
      router.refresh()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className={config.buttonClass}>
          <Icon className="w-4 h-4 mr-2" />
          {config.buttonText}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Icon className="w-5 h-5 mr-2" />
            {config.title}
          </DialogTitle>
          <DialogDescription>
            {config.description}
          </DialogDescription>
        </DialogHeader>

        {/* Show result if available */}
        {result && (
          <div className={`p-4 rounded-lg border ${
            result.success 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center mb-2">
              {result.success ? (
                <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-600 mr-2" />
              )}
              <span className={`font-medium ${
                result.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {result.success ? 'Success!' : 'Error'}
              </span>
            </div>
            <p className={`text-sm ${
              result.success ? 'text-green-700' : 'text-red-700'
            }`}>
              {result.message}
            </p>

            {/* Show details for successful seed deployment */}
            {result.success && result.details && action === 'seed' && (
              <div className="mt-3 text-sm text-green-700">
                <div className="font-medium">Deployed merchants:</div>
                <ul className="mt-1 space-y-1">
                  {result.details.merchants?.map((merchant: any, index: number) => (
                    <li key={index} className="flex items-center justify-between">
                      <span>{merchant.merchant}</span>
                      <span className="text-xs bg-green-100 px-2 py-1 rounded">
                        {merchant.testimonials} testimonials
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Show details for successful clear */}
            {result.success && result.details && action === 'clear' && result.details.deletedMerchants && (
              <div className="mt-3 text-sm text-green-700">
                <div className="font-medium">Deleted merchants:</div>
                <div className="mt-1">
                  {result.details.deletedMerchants.join(', ')}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Warning for destructive actions */}
        {!result && action === 'clear' && (
          <div className="flex items-center p-4 bg-red-50 rounded-lg border border-red-200">
            <AlertTriangle className="w-4 h-4 text-red-600 mr-2" />
            <div className="text-sm text-red-700">
              <strong>Warning:</strong> This will permanently delete all seed merchants and their data. 
              Make sure you understand the impact before proceeding.
            </div>
          </div>
        )}

        {/* Info for seed deployment */}
        {!result && action === 'seed' && (
          <div className="flex items-center p-4 bg-blue-50 rounded-lg border border-blue-200">
            <Database className="w-4 h-4 text-blue-600 mr-2" />
            <div className="text-sm text-blue-700">
              This will create verified merchant accounts with realistic testimonials 
              to give your marketplace initial credibility and social proof.
            </div>
          </div>
        )}

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={handleClose}
            disabled={isLoading}
          >
            {result ? 'Close' : 'Cancel'}
          </Button>
          
          {!result && (
            <Button 
              onClick={handleAction}
              disabled={isLoading}
              className={config.buttonClass}
            >
              {isLoading ? config.loadingText : config.confirmText}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}