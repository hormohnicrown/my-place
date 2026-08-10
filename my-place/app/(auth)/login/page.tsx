'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { sendPhoneOTP, verifyPhoneOTP } from '@/lib/auth/actions'

export default function LoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await sendPhoneOTP(phone)

      if (!result.success) {
        setError(result.error || 'Failed to send OTP')
        setLoading(false)
        return
      }

      setStep('otp')
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await verifyPhoneOTP(phone, otp)

      if (!result.success) {
        setError(result.error || 'Invalid OTP')
        setLoading(false)
        return
      }

      // Check if this is a new user or existing user
      if (result.data?.isNewUser) {
        // Redirect to onboarding
        router.push('/onboarding')
      } else {
        // Check verification status
        if (result.data?.existingUser?.verification_status !== 'id_verified') {
          // Redirect to verification
          router.push('/verification')
        } else {
          // Redirect to appropriate dashboard based on role
          const role = result.data?.existingUser?.role
          router.push(role === 'merchant' ? '/merchant' : '/client')
        }
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome to My Place</CardTitle>
          <CardDescription>
            {step === 'phone' 
              ? 'Enter your phone number to get started' 
              : 'Enter the OTP sent to your phone'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'phone' ? (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="08012345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  Enter your Nigerian phone number
                </p>
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Sending...' : 'Send OTP'}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                <p>
                  No SMS access?{' '}
                  <a href="/login/email" className="text-primary hover:underline">
                    Use email instead
                  </a>
                </p>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">OTP Code</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  disabled={loading}
                  maxLength={6}
                />
                <p className="text-xs text-muted-foreground">
                  Check your SMS for the 6-digit code
                </p>
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Verifying...' : 'Verify OTP'}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setStep('phone')}
                  className="text-sm text-primary hover:underline"
                  disabled={loading}
                >
                  Change phone number
                </button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
