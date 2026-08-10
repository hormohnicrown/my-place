'use client'

import { useState } from 'react'
import { recordGPSCheckIn, validateGPSCheckInAccess } from '@/lib/gps/actions'
import { MapPin, Loader2, AlertCircle, Check, Navigation } from 'lucide-react'

type GPSCheckInButtonProps = {
  bookingId: string
  checkinType: 'service_start' | 'service_complete' | 'client_confirm'
  onSuccess?: () => void
  className?: string
  disabled?: boolean
}

const CHECKIN_LABELS = {
  service_start: 'Check In - Start Service',
  service_complete: 'Check Out - Complete Service', 
  client_confirm: 'Confirm Service Received'
}

const CHECKIN_DESCRIPTIONS = {
  service_start: 'Record your arrival and start of service',
  service_complete: 'Record completion of service and departure',
  client_confirm: 'Confirm you received the service as requested'
}

export default function GPSCheckInButton({
  bookingId,
  checkinType,
  onSuccess,
  className = '',
  disabled = false
}: GPSCheckInButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')
  const [locationStep, setLocationStep] = useState<'idle' | 'requesting' | 'capturing' | 'recording'>('idle')

  const handleCheckIn = async () => {
    try {
      setIsProcessing(true)
      setError('')
      setLocationStep('requesting')

      // Validate access first
      const validation = await validateGPSCheckInAccess(bookingId, checkinType)
      if (!validation.success) {
        setError(validation.error || 'Access denied')
        return
      }

      setLocationStep('capturing')

      // Get GPS location
      const location = await getCurrentLocation()
      if (!location) {
        setError('Unable to get your location')
        return
      }

      setLocationStep('recording')

      // Optional: Get address from coordinates (would use geocoding service in production)
      // const address = await reverseGeocode(location.latitude, location.longitude)

      // Record GPS check-in
      const result = await recordGPSCheckIn({
        booking_request_id: bookingId,
        checkin_type: checkinType,
        gps_latitude: location.latitude,
        gps_longitude: location.longitude,
        gps_accuracy: location.accuracy,
        captured_address: undefined // Would be populated by geocoding
      })

      if (result.success) {
        onSuccess?.()
      } else {
        setError(result.error || 'Failed to record GPS check-in')
      }
    } catch (err) {
      console.error('GPS check-in error:', err)
      setError(err instanceof Error ? err.message : 'Location access denied')
    } finally {
      setIsProcessing(false)
      setLocationStep('idle')
    }
  }

  const getCurrentLocation = (): Promise<{
    latitude: number
    longitude: number
    accuracy?: number
  }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'))
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          })
        },
        (error) => {
          let errorMessage = 'Location access denied'
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location permission denied. Please enable location access and try again.'
              break
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location unavailable. Please check your GPS settings.'
              break
            case error.TIMEOUT:
              errorMessage = 'Location request timed out. Please try again.'
              break
          }
          reject(new Error(errorMessage))
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 30000
        }
      )
    })
  }

  const getLocationStepMessage = () => {
    switch (locationStep) {
      case 'requesting':
        return 'Requesting location permission...'
      case 'capturing':
        return 'Getting your GPS location...'
      case 'recording':
        return 'Recording GPS check-in...'
      default:
        return ''
    }
  }

  const getButtonColor = () => {
    switch (checkinType) {
      case 'service_start':
        return 'bg-green-600 hover:bg-green-700 text-white'
      case 'service_complete':
        return 'bg-blue-600 hover:bg-blue-700 text-white'
      case 'client_confirm':
        return 'bg-purple-600 hover:bg-purple-700 text-white'
      default:
        return 'bg-gray-600 hover:bg-gray-700 text-white'
    }
  }

  const getButtonIcon = () => {
    if (isProcessing) {
      return <Loader2 className="h-4 w-4 animate-spin" />
    }
    
    switch (checkinType) {
      case 'service_start':
        return <MapPin className="h-4 w-4" />
      case 'service_complete':
        return <Check className="h-4 w-4" />
      case 'client_confirm':
        return <Navigation className="h-4 w-4" />
      default:
        return <MapPin className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-3">
      <button
        onClick={handleCheckIn}
        disabled={disabled || isProcessing}
        className={`
          w-full px-4 py-3 rounded-lg font-medium transition-colors
          disabled:opacity-50 disabled:cursor-not-allowed
          flex items-center justify-center space-x-2
          ${getButtonColor()}
          ${className}
        `}
      >
        {getButtonIcon()}
        <span>
          {isProcessing ? getLocationStepMessage() : CHECKIN_LABELS[checkinType]}
        </span>
      </button>

      {/* Description */}
      <p className="text-xs text-gray-600 text-center">
        {CHECKIN_DESCRIPTIONS[checkinType]}
      </p>

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800">GPS Check-in Failed</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              {error.includes('permission') && (
                <p className="text-xs text-red-600 mt-2">
                  💡 To enable location: Go to browser settings → Site permissions → Location → Allow
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* GPS Requirements Notice */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start">
          <Navigation className="h-4 w-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-800">GPS Required for Trust & Safety</p>
            <p className="text-xs text-blue-700 mt-1">
              Location is recorded for service verification and safety. Your location data is protected and only used for booking verification.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}