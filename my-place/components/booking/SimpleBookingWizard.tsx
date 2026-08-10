'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Calendar, Clock, MapPin, CheckCircle, ArrowLeft, ArrowRight, User, Loader2 } from 'lucide-react'
import { createBookingRequest } from '@/lib/client/actions'

type BookingStep = 'service' | 'datetime' | 'location' | 'review' | 'success'

type BookingData = {
  merchantId: string
  merchantName: string
  serviceType: string
  serviceDetails: string
  preferredDate: string
  preferredTimeStart: string
  preferredTimeEnd: string
  clientAddress: string
  specialRequirements: string
}

type SimpleBookingWizardProps = {
  merchantId: string
  merchantName: string
  serviceType: string
  onCancel?: () => void
}

export default function SimpleBookingWizard({ 
  merchantId, 
  merchantName, 
  serviceType, 
  onCancel 
}: SimpleBookingWizardProps) {
  const router = useRouter()
  const [step, setStep] = useState<BookingStep>('service')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [bookingData, setBookingData] = useState<BookingData>({
    merchantId,
    merchantName,
    serviceType,
    serviceDetails: '',
    preferredDate: '',
    preferredTimeStart: '',
    preferredTimeEnd: '',
    clientAddress: '',
    specialRequirements: ''
  })

  const steps = [
    { id: 'service', title: 'Service Details', icon: User },
    { id: 'datetime', title: 'Date & Time', icon: Calendar },
    { id: 'location', title: 'Your Address', icon: MapPin },
    { id: 'review', title: 'Review & Send', icon: CheckCircle }
  ]

  const currentStepIndex = steps.findIndex(s => s.id === step)

  const updateBookingData = (updates: Partial<BookingData>) => {
    setBookingData(prev => ({ ...prev, ...updates }))
  }

  const canProceedFromStep = (currentStep: BookingStep): boolean => {
    switch (currentStep) {
      case 'service':
        return bookingData.serviceDetails.trim().length >= 10
      case 'datetime':
        return bookingData.preferredDate && bookingData.preferredTimeStart && bookingData.preferredTimeEnd
      case 'location':
        return bookingData.clientAddress.trim().length >= 10
      case 'review':
        return true
      default:
        return false
    }
  }

  const handleNext = () => {
    if (!canProceedFromStep(step)) return
    
    const nextStepIndex = currentStepIndex + 1
    if (nextStepIndex < steps.length) {
      setStep(steps[nextStepIndex].id as BookingStep)
    } else if (step === 'review') {
      handleSubmit()
    }
  }

  const handleBack = () => {
    const prevStepIndex = currentStepIndex - 1
    if (prevStepIndex >= 0) {
      setStep(steps[prevStepIndex].id as BookingStep)
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')

    try {
      const result = await createBookingRequest({
        merchant_id: bookingData.merchantId,
        service_details: bookingData.serviceDetails,
        preferred_date: bookingData.preferredDate,
        preferred_time_start: bookingData.preferredTimeStart,
        preferred_time_end: bookingData.preferredTimeEnd,
        client_address: bookingData.clientAddress,
        special_requirements: bookingData.specialRequirements || undefined
      })

      if (result.success) {
        setStep('success')
        setTimeout(() => {
          router.push('/client/bookings')
        }, 3000)
      } else {
        setError(result.error || 'Could not send your booking request. Please try again.')
      }
    } catch (err) {
      setError('Something went wrong. Please check your details and try again.')
    } finally {
      setLoading(false)
    }
  }

  const generateTimeOptions = () => {
    const times = []
    for (let hour = 7; hour <= 20; hour++) {
      for (let min of ['00', '30']) {
        const time = `${hour.toString().padStart(2, '0')}:${min}`
        const display = hour >= 12 
          ? `${hour === 12 ? 12 : hour - 12}:${min} PM`
          : `${hour}:${min} AM`
        times.push({ value: time, display })
      }
    }
    return times
  }

  const timeOptions = generateTimeOptions()

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0]
  
  // Get date 30 days from now
  const maxDate = new Date()
  maxDate.setDate(maxDate.getDate() + 30)
  const maxDateStr = maxDate.toISOString().split('T')[0]

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center shadow-lg border-0">
          <CardContent className="py-12">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-green-600 mb-4">
              Request Sent Successfully!
            </h1>
            <p className="text-gray-600 text-base leading-relaxed mb-6">
              Your booking request has been sent to <strong>{bookingData.merchantName}</strong>. 
              They will respond within 24 hours.
            </p>
            <div className="text-sm text-gray-500">
              Taking you to your bookings...
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((stepItem, index) => {
              const Icon = stepItem.icon
              const isActive = step === stepItem.id
              const isCompleted = index < currentStepIndex
              
              return (
                <div key={stepItem.id} className="flex items-center">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all
                    ${isCompleted 
                      ? 'bg-green-600 border-green-600 text-white' 
                      : isActive 
                      ? 'bg-blue-600 border-blue-600 text-white' 
                      : 'bg-gray-100 border-gray-300 text-gray-400'
                    }
                  `}>
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`
                      flex-1 h-1 mx-3 transition-all
                      ${isCompleted ? 'bg-green-600' : 'bg-gray-200'}
                    `} />
                  )}
                </div>
              )
            })}
          </div>
          
          <div className="text-center">
            <h2 className="text-sm font-medium text-gray-600">
              Step {currentStepIndex + 1} of {steps.length}: {steps[currentStepIndex]?.title}
            </h2>
          </div>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader className="text-center pb-4">
            <div className="flex items-center justify-between">
              {currentStepIndex > 0 && (
                <button
                  onClick={handleBack}
                  className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                  aria-label="Go back to previous step"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              
              <div className="flex-1">
                <h1 className="text-xl font-bold text-gray-900">
                  Book {serviceType} Service
                </h1>
                <p className="text-gray-600 text-sm mt-1">
                  with {merchantName}
                </p>
              </div>
              
              {onCancel && (
                <button
                  onClick={onCancel}
                  className="text-gray-500 hover:text-gray-700 text-sm transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* Service Details Step */}
            {step === 'service' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    What service do you need?
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Tell {merchantName} exactly what you need. Be specific to get the best results.
                  </p>
                </div>

                <div>
                  <Label htmlFor="serviceDetails" className="text-base font-medium mb-3 block">
                    Describe your service needs *
                  </Label>
                  <Textarea
                    id="serviceDetails"
                    value={bookingData.serviceDetails}
                    onChange={(e) => updateBookingData({ serviceDetails: e.target.value })}
                    placeholder="For example: I need a haircut and blow dry. I have shoulder-length hair and want to trim 2 inches and style it for a special event."
                    rows={4}
                    className="text-base"
                    maxLength={500}
                  />
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-sm text-gray-500">
                      Minimum 10 characters to help the service provider understand your needs
                    </p>
                    <span className="text-xs text-gray-400">
                      {bookingData.serviceDetails.length}/500
                    </span>
                  </div>
                </div>

                <div>
                  <Label htmlFor="specialRequirements" className="text-base font-medium mb-3 block">
                    Any special requests? (Optional)
                  </Label>
                  <Textarea
                    id="specialRequirements"
                    value={bookingData.specialRequirements}
                    onChange={(e) => updateBookingData({ specialRequirements: e.target.value })}
                    placeholder="Any allergies, preferences, or special instructions..."
                    rows={2}
                    className="text-base"
                    maxLength={200}
                  />
                  <span className="text-xs text-gray-400 mt-1 block">
                    {bookingData.specialRequirements.length}/200
                  </span>
                </div>
              </div>
            )}

            {/* Date & Time Step */}
            {step === 'datetime' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    When would you like the service?
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Choose your preferred date and time. The service provider can suggest alternatives if needed.
                  </p>
                </div>

                <div>
                  <Label htmlFor="preferredDate" className="text-base font-medium mb-3 block">
                    Preferred Date *
                  </Label>
                  <Input
                    id="preferredDate"
                    type="date"
                    value={bookingData.preferredDate}
                    onChange={(e) => updateBookingData({ preferredDate: e.target.value })}
                    min={today}
                    max={maxDateStr}
                    className="text-base h-12"
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    You can book up to 30 days in advance
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="timeStart" className="text-base font-medium mb-3 block">
                      Start Time *
                    </Label>
                    <select
                      id="timeStart"
                      value={bookingData.preferredTimeStart}
                      onChange={(e) => updateBookingData({ preferredTimeStart: e.target.value })}
                      className="w-full h-12 px-3 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select start time</option>
                      {timeOptions.map(time => (
                        <option key={time.value} value={time.value}>
                          {time.display}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="timeEnd" className="text-base font-medium mb-3 block">
                      End Time *
                    </Label>
                    <select
                      id="timeEnd"
                      value={bookingData.preferredTimeEnd}
                      onChange={(e) => updateBookingData({ preferredTimeEnd: e.target.value })}
                      className="w-full h-12 px-3 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select end time</option>
                      {timeOptions.map(time => (
                        <option key={time.value} value={time.value}>
                          {time.display}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-800 text-sm">
                    💡 <strong>Tip:</strong> Allow extra time for the service. It's better to book a longer slot than to run over time.
                  </p>
                </div>
              </div>
            )}

            {/* Location Step */}
            {step === 'location' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Where should they come?
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Your address stays private until the service provider accepts your booking.
                  </p>
                </div>

                <div>
                  <Label htmlFor="clientAddress" className="text-base font-medium mb-3 block">
                    Your Full Address *
                  </Label>
                  <Textarea
                    id="clientAddress"
                    value={bookingData.clientAddress}
                    onChange={(e) => updateBookingData({ clientAddress: e.target.value })}
                    placeholder="Enter your complete address including:&#10;• House/apartment number&#10;• Street name&#10;• Area/neighborhood&#10;• City&#10;• Landmarks (if helpful)"
                    rows={4}
                    className="text-base"
                    maxLength={300}
                  />
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-sm text-gray-500">
                      Include all details to help the service provider find you easily
                    </p>
                    <span className="text-xs text-gray-400">
                      {bookingData.clientAddress.length}/300
                    </span>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <MapPin className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-yellow-800 text-sm font-medium mb-1">
                        Your Privacy is Protected
                      </p>
                      <p className="text-yellow-700 text-sm">
                        Service providers only see your general area until they accept your booking. 
                        Your full address is shared only after acceptance.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Review Step */}
            {step === 'review' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Review Your Booking Request
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Double-check everything looks correct before sending to {merchantName}.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Service Provider</h4>
                    <p className="text-gray-700">{bookingData.merchantName}</p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Service Needed</h4>
                    <p className="text-gray-700">{bookingData.serviceDetails}</p>
                    {bookingData.specialRequirements && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <p className="text-sm text-gray-600">
                          <strong>Special requests:</strong> {bookingData.specialRequirements}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Date & Time</h4>
                    <p className="text-gray-700">
                      {new Date(bookingData.preferredDate).toLocaleDateString('en-NG', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                    <p className="text-gray-700">
                      {bookingData.preferredTimeStart} - {bookingData.preferredTimeEnd}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Service Location</h4>
                    <p className="text-gray-700">{bookingData.clientAddress}</p>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800 text-sm">
                    ✅ <strong>What happens next:</strong> {merchantName} will see your request and respond within 24 hours. 
                    You'll get a notification when they accept or suggest changes.
                  </p>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center pt-6 border-t">
              <div>
                {currentStepIndex > 0 && (
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    className="flex items-center"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                )}
              </div>

              <div>
                {step === 'review' ? (
                  <Button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="px-8 h-12 text-base font-medium"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        Sending Request...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Send Booking Request
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={handleNext}
                    disabled={!canProceedFromStep(step)}
                    className="px-8 h-12 text-base font-medium"
                  >
                    Continue
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>

            {/* Help Text */}
            <div className="text-center pt-4">
              <p className="text-sm text-gray-500">
                Need help? 
                <a href="tel:+2341234567890" className="text-blue-600 hover:text-blue-700 ml-1">
                  Call us
                </a> or 
                <a href="mailto:help@myplace.com" className="text-blue-600 hover:text-blue-700 ml-1">
                  send an email
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}