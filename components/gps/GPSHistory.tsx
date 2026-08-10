'use client'

import { useState, useEffect } from 'react'
import { getBookingGPSHistory, type GPSCheckInRecord } from '@/lib/gps/actions'
import { MapPin, Clock, User, Navigation, Check, AlertCircle, Shield } from 'lucide-react'

type GPSHistoryProps = {
  bookingId: string
  className?: string
}

const CHECKIN_TYPE_LABELS = {
  service_start: 'Service Started',
  service_complete: 'Service Completed',
  client_confirm: 'Client Confirmation'
}

const CHECKIN_TYPE_ICONS = {
  service_start: MapPin,
  service_complete: Check,
  client_confirm: Navigation
}

const CHECKIN_TYPE_COLORS = {
  service_start: 'text-green-600 bg-green-100',
  service_complete: 'text-blue-600 bg-blue-100', 
  client_confirm: 'text-purple-600 bg-purple-100'
}

export default function GPSHistory({ bookingId, className = '' }: GPSHistoryProps) {
  const [gpsHistory, setGpsHistory] = useState<GPSCheckInRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadGPSHistory()
  }, [bookingId])

  const loadGPSHistory = async () => {
    try {
      setLoading(true)
      setError('')

      const result = await getBookingGPSHistory(bookingId)
      
      if (result.success) {
        setGpsHistory(result.data || [])
      } else {
        setError(result.error || 'Failed to load GPS history')
      }
    } catch (err) {
      console.error('GPS history error:', err)
      setError('Failed to load GPS tracking information')
    } finally {
      setLoading(false)
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    })
  }

  const formatCoordinates = (lat: number, lng: number) => {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
  }

  const formatAccuracy = (accuracy?: number) => {
    if (!accuracy) return 'Unknown'
    if (accuracy < 10) return 'High precision'
    if (accuracy < 50) return 'Good precision'
    return `±${Math.round(accuracy)}m`
  }

  const getGoogleMapsLink = (lat: number, lng: number) => {
    return `https://maps.google.com/?q=${lat},${lng}`
  }

  if (loading) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading GPS tracking...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-red-800">GPS Tracking Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`${className}`}>
      <div className="mb-4">
        <div className="flex items-center mb-2">
          <Shield className="h-5 w-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">GPS Tracking History</h3>
        </div>
        <p className="text-sm text-gray-600">
          Immutable location records for service verification and safety
        </p>
      </div>

      {gpsHistory.length === 0 ? (
        <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg text-center">
          <Navigation className="h-8 w-8 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-1">No GPS records yet</p>
          <p className="text-sm text-gray-500">
            GPS check-ins will appear here when service starts
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {gpsHistory.map((record, index) => {
            const Icon = CHECKIN_TYPE_ICONS[record.checkin_type]
            const isLatest = index === gpsHistory.length - 1

            return (
              <div
                key={record.id}
                className={`
                  p-4 border rounded-lg transition-all
                  ${isLatest ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-white'}
                `}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center">
                    <div className={`
                      p-2 rounded-full mr-3
                      ${CHECKIN_TYPE_COLORS[record.checkin_type]}
                    `}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {CHECKIN_TYPE_LABELS[record.checkin_type]}
                      </h4>
                      <div className="flex items-center text-sm text-gray-600 mt-1">
                        <User className="h-3 w-3 mr-1" />
                        <span>{record.user_name}</span>
                        <span className="mx-2">•</span>
                        <span className="capitalize">{record.user_role}</span>
                      </div>
                    </div>
                  </div>
                  
                  {isLatest && (
                    <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
                      Latest
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {/* Timestamp */}
                  <div>
                    <div className="flex items-center text-gray-600 mb-1">
                      <Clock className="h-3 w-3 mr-1" />
                      <span className="font-medium">Timestamp</span>
                    </div>
                    <p className="text-gray-900">{formatTimestamp(record.checkin_timestamp)}</p>
                  </div>

                  {/* Location */}
                  <div>
                    <div className="flex items-center text-gray-600 mb-1">
                      <MapPin className="h-3 w-3 mr-1" />
                      <span className="font-medium">GPS Coordinates</span>
                    </div>
                    <div className="flex items-center">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded mr-2">
                        {formatCoordinates(record.gps_latitude, record.gps_longitude)}
                      </code>
                      <a
                        href={getGoogleMapsLink(record.gps_latitude, record.gps_longitude)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 text-xs font-medium"
                      >
                        View on Maps →
                      </a>
                    </div>
                  </div>

                  {/* Accuracy */}
                  <div>
                    <div className="flex items-center text-gray-600 mb-1">
                      <span className="w-3 h-3 rounded-full bg-green-500 mr-1"></span>
                      <span className="font-medium">GPS Accuracy</span>
                    </div>
                    <p className="text-gray-900">{formatAccuracy(record.gps_accuracy)}</p>
                  </div>

                  {/* Address (if available) */}
                  {record.captured_address && (
                    <div>
                      <div className="flex items-center text-gray-600 mb-1">
                        <MapPin className="h-3 w-3 mr-1" />
                        <span className="font-medium">Location Address</span>
                      </div>
                      <p className="text-gray-900">{record.captured_address}</p>
                    </div>
                  )}
                </div>

                {/* Trust & Safety Notice */}
                <div className="mt-3 p-2 bg-gray-50 border border-gray-200 rounded text-xs text-gray-600">
                  🔒 This GPS record is immutable and cannot be modified. Stored for trust, safety, and service verification.
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Summary */}
      {gpsHistory.length > 0 && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center mb-2">
            <Check className="h-4 w-4 text-green-600 mr-2" />
            <span className="text-sm font-medium text-green-800">
              GPS Verification Complete
            </span>
          </div>
          <p className="text-sm text-green-700">
            {gpsHistory.length} GPS check-in{gpsHistory.length !== 1 ? 's' : ''} recorded. 
            Service delivery verified with location tracking for trust and safety.
          </p>
        </div>
      )}
    </div>
  )
}