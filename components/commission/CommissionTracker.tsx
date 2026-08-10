'use client'

import { useState } from 'react'
import { calculateCommission, updatePaymentStatus } from '@/lib/commission/actions'
import { formatCurrency, formatPercentage } from '@/lib/commission/format'
import { DollarSign, Calculator, Check, AlertTriangle, Loader2, Receipt, Edit3 } from 'lucide-react'

type CommissionTrackerProps = {
  bookingId: string
  currentPrice?: number
  currentCommissionRate?: number
  currentCommissionAmount?: number
  paymentStatus?: 'pending' | 'paid' | 'disputed'
  paymentNotes?: string
  onUpdate?: () => void
  className?: string
}

export default function CommissionTracker({
  bookingId,
  currentPrice,
  currentCommissionRate = 0.07, // 7% default
  currentCommissionAmount,
  paymentStatus = 'pending',
  paymentNotes,
  onUpdate,
  className = ''
}: CommissionTrackerProps) {
  const [isCalculating, setIsCalculating] = useState(false)
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false)
  const [showPriceForm, setShowPriceForm] = useState(!currentPrice)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [priceInput, setPriceInput] = useState(currentPrice?.toString() || '')
  const [rateInput, setRateInput] = useState((currentCommissionRate * 100).toString())
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState(paymentStatus)
  const [notesInput, setNotesInput] = useState(paymentNotes || '')

  const handleCalculateCommission = async () => {
    try {
      setIsCalculating(true)
      setError('')

      const price = parseFloat(priceInput)
      const rate = parseFloat(rateInput) / 100 // Convert percentage to decimal

      if (isNaN(price) || price <= 0) {
        setError('Please enter a valid price')
        return
      }

      if (isNaN(rate) || rate < 0 || rate > 1) {
        setError('Commission rate must be between 0% and 100%')
        return
      }

      const result = await calculateCommission(bookingId, price, rate)

      if (result.success) {
        setShowPriceForm(false)
        onUpdate?.()
      } else {
        setError(result.error || 'Failed to calculate commission')
      }
    } catch (err) {
      console.error('Commission calculation error:', err)
      setError('Failed to calculate commission')
    } finally {
      setIsCalculating(false)
    }
  }

  const handleUpdatePaymentStatus = async () => {
    try {
      setIsUpdatingPayment(true)
      setError('')

      const result = await updatePaymentStatus(
        bookingId, 
        selectedPaymentStatus,
        notesInput.trim() || undefined
      )

      if (result.success) {
        setShowPaymentForm(false)
        onUpdate?.()
      } else {
        setError(result.error || 'Failed to update payment status')
      }
    } catch (err) {
      console.error('Payment status update error:', err)
      setError('Failed to update payment status')
    } finally {
      setIsUpdatingPayment(false)
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'text-green-600 bg-green-100'
      case 'disputed':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-yellow-600 bg-yellow-100'
    }
  }

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return Check
      case 'disputed':
        return AlertTriangle
      default:
        return DollarSign
    }
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Calculator className="h-5 w-5 text-blue-600 mr-2" />
          <h3 className="font-semibold text-gray-900">Commission Tracking</h3>
        </div>
        
        {currentCommissionAmount && (
          <span className="text-lg font-bold text-green-600">
            {formatCurrency(currentCommissionAmount)}
          </span>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start">
            <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Price & Commission Calculation */}
      {showPriceForm ? (
        <div className="space-y-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Final Agreed Price
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                ₦
              </span>
              <input
                type="number"
                value={priceInput}
                onChange={(e) => setPriceInput(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Commission Rate
            </label>
            <div className="relative">
              <input
                type="number"
                value={rateInput}
                onChange={(e) => setRateInput(e.target.value)}
                placeholder="7.0"
                min="0"
                max="100"
                step="0.1"
                className="w-full pr-8 pl-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                %
              </span>
            </div>
          </div>

          {/* Preview */}
          {priceInput && rateInput && !isNaN(parseFloat(priceInput)) && !isNaN(parseFloat(rateInput)) && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-blue-700">Commission Amount:</span>
                <span className="font-semibold text-blue-900">
                  {formatCurrency(parseFloat(priceInput) * (parseFloat(rateInput) / 100))}
                </span>
              </div>
            </div>
          )}

          <div className="flex space-x-3">
            <button
              onClick={handleCalculateCommission}
              disabled={isCalculating}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isCalculating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Calculating...
                </>
              ) : (
                <>
                  <Calculator className="h-4 w-4 mr-2" />
                  Calculate Commission
                </>
              )}
            </button>
            
            {currentPrice && (
              <button
                onClick={() => setShowPriceForm(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      ) : currentCommissionAmount ? (
        <div className="space-y-3 mb-4">
          {/* Commission Summary */}
          <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="text-xs text-gray-600">Agreed Price</p>
              <p className="font-semibold text-gray-900">
                {formatCurrency(currentPrice || 0)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Commission Rate</p>
              <p className="font-semibold text-gray-900">
                {formatPercentage(currentCommissionRate)}
              </p>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Platform Commission:</span>
            <span className="text-lg font-bold text-blue-600">
              {formatCurrency(currentCommissionAmount)}
            </span>
          </div>

          <button
            onClick={() => setShowPriceForm(true)}
            className="w-full px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center justify-center text-sm"
          >
            <Edit3 className="h-3 w-3 mr-2" />
            Edit Commission
          </button>
        </div>
      ) : (
        <div className="text-center py-4 text-gray-500">
          <Calculator className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm">Set final price to calculate commission</p>
        </div>
      )}

      {/* Payment Status Section */}
      {currentCommissionAmount && (
        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">Payment Status</span>
            
            {!showPaymentForm && (
              <button
                onClick={() => setShowPaymentForm(true)}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
              >
                <Edit3 className="h-3 w-3 mr-1" />
                Update
              </button>
            )}
          </div>

          {showPaymentForm ? (
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600 mb-2">Status</label>
                <select
                  value={selectedPaymentStatus}
                  onChange={(e) => setSelectedPaymentStatus(e.target.value as 'pending' | 'paid' | 'disputed')}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="disputed">Disputed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">Notes (optional)</label>
                <textarea
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="Payment reconciliation notes..."
                  rows={2}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={handleUpdatePaymentStatus}
                  disabled={isUpdatingPayment}
                  className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm"
                >
                  {isUpdatingPayment ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <Check className="h-3 w-3 mr-1" />
                  )}
                  Update Status
                </button>
                
                <button
                  onClick={() => setShowPaymentForm(false)}
                  className="px-3 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${getPaymentStatusColor(paymentStatus)}`}>
                {(() => {
                  const Icon = getPaymentStatusIcon(paymentStatus)
                  return <Icon className="h-3 w-3 mr-2" />
                })()}
                <span className="capitalize">{paymentStatus}</span>
              </div>
              
              {paymentNotes && (
                <p className="text-xs text-gray-600 mt-2 italic">
                  "{paymentNotes}"
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Note about manual processing */}
      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start">
          <Receipt className="h-4 w-4 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-yellow-800">Manual Payment Processing</p>
            <p className="text-xs text-yellow-700 mt-1">
              Commission tracking only - no automated payments. Use payment status for manual reconciliation.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}