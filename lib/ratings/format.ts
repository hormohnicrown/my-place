// Pure display/formatting helpers for ratings.
// Kept out of actions.ts because that file is 'use server' and may only
// export async functions.

/**
 * Format rating average for display
 */
export function formatRating(rating: number): string {
  return rating.toFixed(1)
}

/**
 * Get star display array for ratings
 */
export function getStarArray(rating: number): ('full' | 'half' | 'empty')[] {
  const stars: ('full' | 'half' | 'empty')[] = []
  const fullStars = Math.floor(rating)
  const hasHalfStar = rating % 1 >= 0.5

  for (let i = 0; i < fullStars; i++) {
    stars.push('full')
  }

  if (hasHalfStar) {
    stars.push('half')
  }

  while (stars.length < 5) {
    stars.push('empty')
  }

  return stars
}
