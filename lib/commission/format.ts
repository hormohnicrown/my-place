// Pure display/formatting helpers for commission values.
// Kept out of actions.ts because that file is 'use server' and may only
// export async functions.

/**
 * Format currency for display
 */
export function formatCurrency(amount: number, currency = 'NGN'): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount)
}

/**
 * Format percentage for display
 */
export function formatPercentage(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`
}

/**
 * Calculate commission amount
 */
export function calculateCommissionAmount(price: number, rate: number): number {
  return Math.round(price * rate * 100) / 100 // Round to 2 decimal places
}
