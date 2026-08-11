'use server'

import { createClient } from '@/lib/supabase/server'
import { 
  seedTestimonials, 
  sampleMerchantProfiles, 
  getRandomTestimonials,
  type OffPlatformTestimonial 
} from './testimonials'
import { getCurrentUser } from '@/lib/auth/actions'

// Types
export type SeedDataResult = {
  success: boolean
  error?: string
  data?: any
}

// Admin check for seed data operations
async function requireAdmin() {
  const user = await getCurrentUser()
  
  // In production, you'd want proper admin roles
  // For now, we'll use merchant role as admin (temporary)
  if (!user || user.role !== 'merchant') {
    throw new Error('Admin access required for seed data operations')
  }
  
  return user
}

/**
 * Seed the database with sample merchants and testimonials
 * This creates a foundation of credible merchants to bootstrap the marketplace
 */
export async function seedMerchantTestimonials(): Promise<SeedDataResult> {
  try {
    await requireAdmin()
    const supabase = await createClient()
    
    const results = []
    
    for (const profile of sampleMerchantProfiles) {
      try {
        // 1. Create a user account for this merchant
        const { data: newUser, error: userError } = await supabase
          .from('users')
          .insert({
            name: profile.name,
            phone: `+234${Math.floor(Math.random() * 9000000000) + 1000000000}`, // Generate fake but valid phone
            role: 'merchant',
            address: `${Math.floor(Math.random() * 999) + 1} Sample Street`,
            city: profile.city,
            state: profile.state,
            verification_status: 'id_verified', // Pre-verify seed merchants
            geo_coordinates: `POINT(3.${Math.floor(Math.random() * 9000) + 1000} 6.${Math.floor(Math.random() * 9000) + 1000})` // Lagos area coordinates
          })
          .select()
          .single()

        if (userError) {
          console.error('Error creating user:', userError)
          continue
        }

        // 2. Create merchant profile with testimonials
        const testimonials = getRandomTestimonials(profile.category, profile.testimonial_count)
        
        const { data: merchantProfile, error: profileError } = await supabase
          .from('merchant_profiles')
          .insert({
            user_id: newUser.id,
            category: profile.category,
            description: profile.description,
            price_range_min: getPriceRange(profile.category).min,
            price_range_max: getPriceRange(profile.category).max,
            service_area_radius_km: 10.0,
            imported_testimonials: testimonials,
            rating_avg: calculateAverageRating(testimonials),
            rating_count: testimonials.length,
            status: 'active'
          })
          .select()
          .single()

        if (profileError) {
          console.error('Error creating merchant profile:', profileError)
          continue
        }

        // 3. Create sample listings for each merchant
        await createSampleListings(supabase, merchantProfile.id, profile.category)

        results.push({
          merchant: profile.name,
          category: profile.category,
          testimonials: testimonials.length,
          userId: newUser.id,
          profileId: merchantProfile.id
        })

      } catch (error) {
        console.error(`Error seeding merchant ${profile.name}:`, error)
        continue
      }
    }

    return {
      success: true,
      data: {
        message: `Successfully seeded ${results.length} merchants with testimonials`,
        merchants: results
      }
    }

  } catch (error) {
    return {
      success: false,
      error: (error as Error).message
    }
  }
}

/**
 * Add testimonials to an existing merchant
 */
export async function addTestimonialsToMerchant(
  merchantId: string, 
  category: string, 
  count: number = 2
): Promise<SeedDataResult> {
  try {
    await requireAdmin()
    const supabase = await createClient()

    // Get existing testimonials
    const { data: merchant, error: fetchError } = await supabase
      .from('merchant_profiles')
      .select('imported_testimonials, rating_count, rating_avg')
      .eq('id', merchantId)
      .single()

    if (fetchError) throw fetchError

    // Get new testimonials
    const newTestimonials = getRandomTestimonials(category, count)
    const existingTestimonials = merchant.imported_testimonials || []
    const allTestimonials = [...existingTestimonials, ...newTestimonials]

    // Update merchant profile
    const { error: updateError } = await supabase
      .from('merchant_profiles')
      .update({
        imported_testimonials: allTestimonials,
        rating_avg: calculateAverageRating(allTestimonials),
        rating_count: allTestimonials.length
      })
      .eq('id', merchantId)

    if (updateError) throw updateError

    return {
      success: true,
      data: {
        message: `Added ${count} testimonials to merchant`,
        newTestimonials: newTestimonials.length,
        totalTestimonials: allTestimonials.length
      }
    }

  } catch (error) {
    return {
      success: false,
      error: (error as Error).message
    }
  }
}

/**
 * Clear all seed data (for testing)
 */
export async function clearSeedData(): Promise<SeedDataResult> {
  try {
    await requireAdmin()
    const supabase = await createClient()

    // Get seed merchants (those with phone numbers matching our pattern)
    const { data: seedUsers, error: fetchError } = await supabase
      .from('users')
      .select('id, name')
      .like('phone', '+234%')
      .eq('role', 'merchant')

    if (fetchError) throw fetchError

    if (!seedUsers || seedUsers.length === 0) {
      return {
        success: true,
        data: { message: 'No seed data found to clear' }
      }
    }

    // Delete users (cascading will handle merchant_profiles and listings)
    const userIds = seedUsers.map(u => u.id)
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .in('id', userIds)

    if (deleteError) throw deleteError

    return {
      success: true,
      data: {
        message: `Cleared ${seedUsers.length} seed merchants`,
        deletedMerchants: seedUsers.map(u => u.name)
      }
    }

  } catch (error) {
    return {
      success: false,
      error: (error as Error).message
    }
  }
}

/**
 * Get platform statistics including seed data info
 */
export async function getSeedDataStats(): Promise<SeedDataResult> {
  try {
    await requireAdmin()
    const supabase = await createClient()

    // Count merchants with testimonials
    const { data: merchantsWithTestimonials, error: merchantsError } = await supabase
      .from('merchant_profiles')
      .select('id, imported_testimonials, rating_count')
      .neq('imported_testimonials', '[]')

    if (merchantsError) throw merchantsError

    // Count total testimonials
    let totalTestimonials = 0
    let avgTestimonialsPerMerchant = 0

    if (merchantsWithTestimonials && merchantsWithTestimonials.length > 0) {
      totalTestimonials = merchantsWithTestimonials.reduce((sum, merchant) => {
        const testimonials = merchant.imported_testimonials || []
        return sum + (Array.isArray(testimonials) ? testimonials.length : 0)
      }, 0)
      
      avgTestimonialsPerMerchant = totalTestimonials / merchantsWithTestimonials.length
    }

    return {
      success: true,
      data: {
        merchantsWithTestimonials: merchantsWithTestimonials?.length || 0,
        totalTestimonials,
        avgTestimonialsPerMerchant: Math.round(avgTestimonialsPerMerchant * 10) / 10,
        availableSeedProfiles: sampleMerchantProfiles.length,
        availableTestimonialsByCategory: Object.keys(seedTestimonials).reduce((acc, category) => {
          acc[category] = seedTestimonials[category].length
          return acc
        }, {} as Record<string, number>)
      }
    }

  } catch (error) {
    return {
      success: false,
      error: (error as Error).message
    }
  }
}

// Helper functions

function getPriceRange(category: string): { min: number; max: number } {
  const ranges = {
    tailoring: { min: 5000, max: 50000 },
    carpentry: { min: 10000, max: 100000 },
    welding: { min: 8000, max: 75000 },
    plumbing: { min: 7000, max: 60000 }
  }
  
  return ranges[category as keyof typeof ranges] || { min: 5000, max: 50000 }
}

function calculateAverageRating(testimonials: OffPlatformTestimonial[]): number {
  if (!testimonials || testimonials.length === 0) return 0
  
  const ratingsSum = testimonials.reduce((sum, testimonial) => {
    return sum + (testimonial.rating || 4) // Default to 4 stars if no rating
  }, 0)
  
  return Math.round((ratingsSum / testimonials.length) * 10) / 10
}

async function createSampleListings(
  supabase: any,
  merchantId: string,
  category: string
): Promise<void> {
  const listings = getSampleListings(category)
  
  for (const listing of listings) {
    await supabase
      .from('listings')
      .insert({
        merchant_id: merchantId,
        title: listing.title,
        description: listing.description,
        category: category,
        price: listing.price,
        active: true
      })
  }
}

function getSampleListings(category: string) {
  const listingsByCategory = {
    tailoring: [
      {
        title: 'Custom Wedding Dress Design',
        description: 'Beautiful wedding gowns tailored to your exact measurements and style preferences.',
        price: 35000
      },
      {
        title: 'Corporate Suit Tailoring',
        description: 'Professional suits for men and women. Perfect fit guaranteed.',
        price: 20000
      },
      {
        title: 'Traditional Nigerian Attire',
        description: 'Authentic agbada, ankara, and other traditional wear.',
        price: 15000
      }
    ],
    carpentry: [
      {
        title: 'Kitchen Cabinet Installation',
        description: 'Custom kitchen cabinets designed and installed to maximize your space.',
        price: 45000
      },
      {
        title: 'Wardrobe Construction',
        description: 'Built-in and standalone wardrobes with quality finishes.',
        price: 30000
      },
      {
        title: 'Furniture Repair Service',
        description: 'Restore and repair damaged furniture to like-new condition.',
        price: 12000
      }
    ],
    welding: [
      {
        title: 'Security Gate Installation',
        description: 'Strong, secure gates for homes and businesses. Custom designs available.',
        price: 25000
      },
      {
        title: 'Window Security Bars',
        description: 'Decorative and functional security bars for windows.',
        price: 18000
      },
      {
        title: 'Metal Fabrication Services',
        description: 'Custom metal work for industrial and residential projects.',
        price: 35000
      }
    ],
    plumbing: [
      {
        title: 'Bathroom Plumbing Installation',
        description: 'Complete bathroom plumbing setup and repairs.',
        price: 22000
      },
      {
        title: 'Kitchen Sink Installation', 
        description: 'Professional sink and faucet installation with warranty.',
        price: 15000
      },
      {
        title: 'Drainage System Cleaning',
        description: 'Clear blocked drains and sewage systems quickly and safely.',
        price: 8000
      }
    ]
  }
  
  return listingsByCategory[category as keyof typeof listingsByCategory] || []
}