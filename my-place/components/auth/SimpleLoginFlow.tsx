'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { ArrowLeft, Phone, MessageSquare, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { sendPhoneOTP, verifyPhoneOTP } from '@/lib/auth/actions'

type LoginStep = 'phone' | 'code' | 'success'

export default function SimpleLoginFlow() {
  const router = useRouter()
  const [step, setStep] = useState<LoginStep>('phone')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Format phone number as user types
  const formatPhone = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '')
    
    // Format as: 080 1234 5678
    if (digits.length <= 3) return digits
    if (digits.length <= 7) return `${digits.slice(0, 3)} ${digits.slice(3)}`
    return `${digits.slice(0, 3)} ${digits.slice(3, 7)} ${digits.slice(7, 11)}`
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value)
    setPhone(formatted)
  }

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Remove formatting for API call
      const cleanPhone = phone.replace(/\s/g, '')
      const result = await sendPhoneOTP(cleanPhone)

      if (!result.success) {
        setError(result.error || 'Could not send code. Please check your phone number.')
        return
      }

      setStep('code')
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const cleanPhone = phone.replace(/\s/g, '')
      const result = await verifyPhoneOTP(cleanPhone, code)

      if (!result.success) {
        setError(result.error || 'Wrong code. Please check and try again.')
        return
      }

      setStep('success')
      
      // Redirect after showing success
      setTimeout(() => {
        if (result.needsOnboarding) {
          router.push('/onboarding')
        } else {
          router.push('/dashboard')
        }
      }, 2000)
      
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const goBack = () => {
    if (step === 'code') {
      setStep('phone')
      setCode('')
    } else {
      router.back()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
            {step === 'phone' && (
              <span className="flex items-center">
                <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs mr-2">1</span>
                Phone Number
              </span>
            )}
            {step === 'code' && (
              <span className="flex items-center">
                <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs mr-2">2</span>
                Enter Code
              </span>
            )}
            {step === 'success' && (
              <span className="flex items-center text-green-600">
                <CheckCircle className="w-5 h-5 mr-2" />
                All Done!
              </span>
            )}
          </div>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader className="text-center pb-4">
            {step !== 'phone' && (
              <button
                onClick={goBack}
                className="absolute left-6 top-6 p-2 text-gray-500 hover:text-gray-700"
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            
            {/* Step-specific headers */}
            {step === 'phone' && (
              <div>
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-8 h-8 text-blue-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Let's Get Started
                </h1>
                <p className="text-gray-600 text-base leading-relaxed">
                  We'll send a code to your phone to keep your account safe
                </p>
              </div>
            )}
            
            {step === 'code' && (
              <div>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-green-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Check Your Phone
                </h1>
                <p className="text-gray-600 text-base leading-relaxed">
                  We sent a 6-digit code to<br />
                  <span className="font-semibold">{phone}</span>
                </p>
              </div>
            )}
            
            {step === 'success' && (
              <div>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h1 className="text-2xl font-bold text-green-600 mb-2">
                  Welcome to My Place!
                </h1>
                <p className="text-gray-600 text-base">
                  Your phone is verified. Taking you to your dashboard...
                </p>
              </div>
            )}
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-red-800 mb-1">
                      Oops! Something's not right
                    </h3>
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Phone Number Step */}
            {step === 'phone' && (
              <form onSubmit={handleSendCode} className="space-y-6">
                <div>
                  <Label htmlFor="phone" className="text-base font-medium text-gray-900 mb-3 block">
                    Your Phone Number
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={handlePhoneChange}
                    placeholder="080 1234 5678"
                    maxLength={13} // Formatted length
                    className="text-lg h-12 text-center"
                    autoComplete="tel"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Enter your Nigerian phone number
                  </p>
                </div>

                <Button 
                  type="submit" 
                  disabled={loading || phone.length < 13}
                  className="w-full h-12 text-lg font-medium"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Sending Code...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="w-5 h-5 mr-2" />
                      Send Verification Code
                    </>
                  )}
                </Button>

                <div className="text-center">
                  <p className="text-sm text-gray-500">
                    Don't have a phone? 
                    <a href="/login/email" className="text-blue-600 hover:text-blue-700 ml-1">
                      Use email instead
                    </a>
                  </p>
                </div>
              </form>
            )}

            {/* Verification Code Step */}
            {step === 'code' && (
              <form onSubmit={handleVerifyCode} className="space-y-6">
                <div>
                  <Label htmlFor="code" className="text-base font-medium text-gray-900 mb-3 block">
                    Verification Code
                  </Label>
                  <Input
                    id="code"
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    maxLength={6}
                    className="text-lg h-12 text-center font-mono tracking-widest"
                    autoComplete="one-time-code"
                    autoFocus
                    required
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Enter the 6-digit code from your SMS
                  </p>
                </div>

                <Button 
                  type="submit" 
                  disabled={loading || code.length !== 6}
                  className="w-full h-12 text-lg font-medium"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Verify Code
                    </>
                  )}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('phone')
                      setCode('')
                      setError('')
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Didn't get a code? Try again
                  </button>
                </div>
              </form>
            )}

            {/* Success Step */}
            {step === 'success' && (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600">
                  Setting up your account...
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Help Section */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 text-sm mb-3">
            Need help? We're here for you
          </p>
          <div className="flex justify-center space-x-4">
            <a 
              href="tel:+2341234567890" 
              className="flex items-center text-blue-600 hover:text-blue-700 text-sm"
            >
              <Phone className="w-4 h-4 mr-1" />
              Call Support
            </a>
            <a 
              href="mailto:help@myplace.com" 
              className="flex items-center text-blue-600 hover:text-blue-700 text-sm"
            >
              <MessageSquare className="w-4 h-4 mr-1" />
              Email Help
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}