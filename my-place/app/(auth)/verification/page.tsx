'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getCurrentUser } from '@/lib/auth/actions'

/**
 * ID Verification Gate (Non-Negotiable Requirement)
 * 
 * This page enforces the hard gate: users cannot access full platform until id_verified.
 * 
 * Phase 1: Placeholder UI explaining the requirement
 * Phase 2 (later): Integrate Smile Identity SDK for actual verification
 * 
 * Per TRD: Flow is user uploads government ID + live selfie → Smile ID API returns match result
 * Per PRD: This is a non-negotiable security requirement, not optional polish
 */

export default function VerificationPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadUser() {
      const currentUser = await getCurrentUser()
      
      if (!currentUser) {
        // Not logged in, redirect to login
        router.push('/login')
        return
      }

      // If already verified, redirect to dashboard
      if (currentUser.verification_status === 'id_verified') {
        router.push(currentUser.role === 'merchant' ? '/merchant' : '/client')
        return
      }

      setUser(currentUser)
      setLoading(false)
    }

    loadUser()
  }, [router])

  const handleStartVerification = () => {
    // Phase 2 TODO: Launch Smile Identity SDK modal/flow
    alert('ID Verification integration coming in Phase 2.\n\nFor Phase 1 demo:\n- This is a placeholder showing the hard gate\n- Actual Smile ID integration requires sandbox credentials\n- Flow: Upload ID + Selfie → Smile ID webhook → Status updated to id_verified')
  }

  const handleSkipForDemo = async () => {
    // DEMO ONLY: Bypass for development testing
    // WARNING: This will be removed before production
    if (process.env.NEXT_PUBLIC_APP_URL?.includes('localhost')) {
      alert('DEMO MODE: Bypassing verification.\n\nThis bypass only works in local development and will be removed in production.')
      
      // Manually update verification status (admin action in real scenario)
      // In production, this would only be updated by Smile ID webhook
      router.push(user?.role === 'merchant' ? '/merchant' : '/client')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>ID Verification Required</CardTitle>
          <CardDescription>
            For your safety and the safety of others, all users must verify their identity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Explanation */}
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Why verify your ID?</h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li>✓ Builds trust between clients and artisans</li>
                <li>✓ Reduces fraud and scams</li>
                <li>✓ Creates a safer marketplace for everyone</li>
                <li>✓ Required for all users - clients and artisans alike</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold">What you'll need:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="border rounded-lg p-3">
                  <p className="font-medium text-sm mb-1">📄 Government-issued ID</p>
                  <p className="text-xs text-muted-foreground">
                    Nigerian National ID (NIN), Voter's Card, Driver's License, or International Passport
                  </p>
                </div>
                <div className="border rounded-lg p-3">
                  <p className="font-medium text-sm mb-1">🤳 Live Selfie</p>
                  <p className="text-xs text-muted-foreground">
                    A clear photo of your face to match against your ID
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">How it works:</h3>
              <ol className="space-y-2 text-sm text-muted-foreground">
                <li>1. Upload a photo of your government ID</li>
                <li>2. Take a live selfie for face matching</li>
                <li>3. We verify your ID with official databases (via Smile Identity)</li>
                <li>4. Get verified in 1-2 minutes</li>
              </ol>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-2">🔒 Your data is secure</h3>
              <p className="text-sm text-green-800">
                Your ID documents are encrypted and stored securely. We comply with Nigeria's 
                Data Protection Regulation (NDPR) and retain ID images for a maximum of 30 days.
              </p>
            </div>
          </div>

          {/* Status Display */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium">Current Status</p>
                <p className="text-xs text-muted-foreground">
                  {user?.verification_status === 'unverified' && 'Not yet verified'}
                  {user?.verification_status === 'pending' && 'Verification in progress...'}
                  {user?.verification_status === 'failed' && 'Verification failed - you can retry'}
                </p>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                user?.verification_status === 'unverified' ? 'bg-gray-100 text-gray-700' :
                user?.verification_status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {user?.verification_status}
              </div>
            </div>

            <Button 
              onClick={handleStartVerification} 
              className="w-full" 
              size="lg"
            >
              Start ID Verification
            </Button>

            {/* Demo bypass for development */}
            {process.env.NODE_ENV === 'development' && (
              <Button
                onClick={handleSkipForDemo}
                variant="ghost"
                className="w-full mt-2 text-xs"
              >
                [DEV ONLY] Skip verification for testing
              </Button>
            )}
          </div>

          {/* Phase 2 Note */}
          <div className="border-t pt-4">
            <p className="text-xs text-muted-foreground">
              <strong>Phase 1 Note:</strong> This is a placeholder demonstrating the ID verification hard gate. 
              Smile Identity SDK integration will be completed in Phase 2 with live verification flow.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
