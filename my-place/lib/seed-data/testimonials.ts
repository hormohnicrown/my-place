// Seed data for initial merchant testimonials
// These testimonials are fictional but realistic examples for marketplace credibility

export type TestimonialSource = 'whatsapp' | 'instagram' | 'facebook' | 'text_message' | 'word_of_mouth'

export interface OffPlatformTestimonial {
  source: 'off_platform'
  text: string
  author: string
  platform: TestimonialSource
  date?: string
  rating?: number // 1-5 stars if available
  service_type?: string
  location?: string
}

// Realistic Nigerian testimonials for different service categories
export const seedTestimonials: Record<string, OffPlatformTestimonial[]> = {
  // Tailoring testimonials
  tailoring: [
    {
      source: 'off_platform',
      text: 'Mama Joy sewed my wedding dress perfectly! The fit was amazing and she finished on time. My guests kept asking who made my dress.',
      author: 'Chioma O.',
      platform: 'whatsapp',
      date: '2024-03-15',
      rating: 5,
      service_type: 'Wedding dress',
      location: 'Ikeja, Lagos'
    },
    {
      source: 'off_platform',
      text: 'Best tailor in Surulere! She altered my suit for my job interview and I looked so sharp. I got the job!',
      author: 'Emeka A.',
      platform: 'instagram',
      date: '2024-02-28',
      rating: 5,
      service_type: 'Suit alteration',
      location: 'Surulere, Lagos'
    },
    {
      source: 'off_platform',
      text: 'Quick and affordable! Made my corporate shirts in 2 days. Quality is top notch, no loose threads or anything.',
      author: 'Fatima M.',
      platform: 'whatsapp',
      date: '2024-04-10',
      rating: 4,
      service_type: 'Corporate wear',
      location: 'Victoria Island, Lagos'
    },
    {
      source: 'off_platform',
      text: 'She makes the best agbada in the whole of Lagos! My father wore it to my traditional wedding and everyone was asking for her contact.',
      author: 'Kemi S.',
      platform: 'word_of_mouth',
      date: '2024-01-20',
      rating: 5,
      service_type: 'Traditional wear',
      location: 'Ikoyi, Lagos'
    },
    {
      source: 'off_platform',
      text: 'Very patient with measurements and explains everything. Made beautiful school uniforms for my twins.',
      author: 'Mrs. Adebayo',
      platform: 'whatsapp',
      date: '2024-03-05',
      rating: 4,
      service_type: 'School uniforms',
      location: 'Gbagada, Lagos'
    }
  ],

  // Carpentry testimonials
  carpentry: [
    {
      source: 'off_platform',
      text: 'Brother built my kitchen cabinets and they are solid! 6 months later still looking brand new. Fair price too.',
      author: 'David O.',
      platform: 'whatsapp',
      date: '2024-02-14',
      rating: 5,
      service_type: 'Kitchen cabinets',
      location: 'Lekki, Lagos'
    },
    {
      source: 'off_platform',
      text: 'Made beautiful wardrobes for our new house. Clean work, no rough edges. He even cleaned up after himself.',
      author: 'Grace N.',
      platform: 'instagram',
      date: '2024-03-22',
      rating: 5,
      service_type: 'Wardrobes',
      location: 'Ajah, Lagos'
    },
    {
      source: 'off_platform',
      text: 'Fixed my dining table that was wobbling. Strong and steady now. Very reasonable pricing.',
      author: 'Ahmed L.',
      platform: 'text_message',
      date: '2024-04-18',
      rating: 4,
      service_type: 'Furniture repair',
      location: 'Maryland, Lagos'
    },
    {
      source: 'off_platform',
      text: 'Custom bookshelf fits perfectly in my study. Quality wood and excellent finishing. Recommended!',
      author: 'Dr. Okafor',
      platform: 'whatsapp',
      date: '2024-01-30',
      rating: 5,
      service_type: 'Custom furniture',
      location: 'Yaba, Lagos'
    },
    {
      source: 'off_platform',
      text: 'Built shoe racks for my shop. Very strong and well designed. My customers love the new look.',
      author: 'Alhaji Musa',
      platform: 'word_of_mouth',
      date: '2024-03-08',
      rating: 4,
      service_type: 'Commercial furniture',
      location: 'Alaba Market, Lagos'
    }
  ],

  // Welding testimonials
  welding: [
    {
      source: 'off_platform',
      text: 'Welded my gate perfectly! Very strong joints and painted it nicely. Gate has been working smoothly for months.',
      author: 'Jennifer U.',
      platform: 'whatsapp',
      date: '2024-02-20',
      rating: 5,
      service_type: 'Gate installation',
      location: 'Magodo, Lagos'
    },
    {
      source: 'off_platform',
      text: 'Fixed my car exhaust pipe properly. No more noise and it passed inspection. Quick and affordable service.',
      author: 'Tunde B.',
      platform: 'instagram',
      date: '2024-04-05',
      rating: 4,
      service_type: 'Automotive welding',
      location: 'Ikotun, Lagos'
    },
    {
      source: 'off_platform',
      text: 'Made security bars for my windows. Clean welding work and painted to match my house color.',
      author: 'Mrs. Okoro',
      platform: 'whatsapp',
      date: '2024-03-12',
      rating: 5,
      service_type: 'Security bars',
      location: 'Festac, Lagos'
    },
    {
      source: 'off_platform',
      text: 'Repaired my generator stand that broke. Reinforced it well, very strong now. Fair pricing.',
      author: 'Segun A.',
      platform: 'text_message',
      date: '2024-04-20',
      rating: 4,
      service_type: 'Equipment repair',
      location: 'Mushin, Lagos'
    },
    {
      source: 'off_platform',
      text: 'Built custom metal shelving for my warehouse. Strong and well designed. Finished on schedule.',
      author: 'Chief Akpan',
      platform: 'word_of_mouth',
      date: '2024-01-25',
      rating: 5,
      service_type: 'Industrial welding',
      location: 'Apapa, Lagos'
    }
  ],

  // Plumbing testimonials
  plumbing: [
    {
      source: 'off_platform',
      text: 'Fixed my toilet leak quickly and properly. No mess, clean work. Haven\'t had any issues since then.',
      author: 'Blessing C.',
      platform: 'whatsapp',
      date: '2024-04-12',
      rating: 5,
      service_type: 'Toilet repair',
      location: 'Ojota, Lagos'
    },
    {
      source: 'off_platform',
      text: 'Installed new pipes in my kitchen. Professional job, explained everything he did. Water pressure is much better now.',
      author: 'Michael E.',
      platform: 'instagram',
      date: '2024-03-18',
      rating: 5,
      service_type: 'Pipe installation',
      location: 'Ketu, Lagos'
    },
    {
      source: 'off_platform',
      text: 'Unblocked my drainage system fast. Brought proper equipment and cleaned up after. Very reliable.',
      author: 'Aisha M.',
      platform: 'whatsapp',
      date: '2024-04-25',
      rating: 4,
      service_type: 'Drainage cleaning',
      location: 'Ikorodu, Lagos'
    },
    {
      source: 'off_platform',
      text: 'Fixed my water heater that stopped working. Found the problem quickly and replaced parts. Hot water again!',
      author: 'Mr. Thompson',
      platform: 'text_message',
      date: '2024-02-08',
      rating: 5,
      service_type: 'Water heater repair',
      location: 'Victoria Island, Lagos'
    },
    {
      source: 'off_platform',
      text: 'Connected my new washing machine properly. No leaks and water pressure is perfect. Clean professional work.',
      author: 'Ngozi O.',
      platform: 'whatsapp',
      date: '2024-03-30',
      rating: 4,
      service_type: 'Appliance installation',
      location: 'Surulere, Lagos'
    }
  ]
}

// Helper function to get random testimonials for a category
export function getRandomTestimonials(category: string, count: number = 3): OffPlatformTestimonial[] {
  const categoryTestimonials = seedTestimonials[category] || []
  const shuffled = [...categoryTestimonials].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, Math.min(count, shuffled.length))
}

// Helper function to format testimonial for display
export function formatTestimonialForDisplay(testimonial: OffPlatformTestimonial): string {
  const platform = testimonial.platform.replace('_', ' ')
  const platformEmoji = {
    whatsapp: '💬',
    instagram: '📷', 
    facebook: '👍',
    text_message: '📱',
    word_of_mouth: '👥'
  }[testimonial.platform] || '💬'
  
  return `${platformEmoji} "${testimonial.text}" - ${testimonial.author} (via ${platform})`
}

// Sample merchant profiles with realistic Nigerian names and locations
export const sampleMerchantProfiles = [
  // Tailors
  {
    name: 'Joy Adebayo',
    category: 'tailoring',
    description: 'Expert seamstress specializing in wedding gowns, corporate wear, and traditional Nigerian attire. 15+ years experience.',
    city: 'Lagos',
    state: 'Lagos',
    testimonial_count: 3
  },
  {
    name: 'Patience Okoro', 
    category: 'tailoring',
    description: 'Professional tailor for men and women. Quick turnaround, perfect fitting, affordable prices.',
    city: 'Lagos',
    state: 'Lagos', 
    testimonial_count: 2
  },
  
  // Carpenters
  {
    name: 'Samuel Okafor',
    category: 'carpentry', 
    description: 'Skilled carpenter and furniture maker. Custom kitchen cabinets, wardrobes, and furniture repair.',
    city: 'Lagos',
    state: 'Lagos',
    testimonial_count: 3
  },
  {
    name: 'Ibrahim Garba',
    category: 'carpentry',
    description: 'Quality furniture construction and repair services. Fair prices, reliable service.',
    city: 'Lagos', 
    state: 'Lagos',
    testimonial_count: 2
  },
  
  // Welders
  {
    name: 'Chinedu Eze',
    category: 'welding',
    description: 'Professional welder for gates, security bars, automotive repairs, and industrial projects.',
    city: 'Lagos',
    state: 'Lagos', 
    testimonial_count: 3
  },
  {
    name: 'Yakubu Hassan',
    category: 'welding',
    description: 'Experienced welder specializing in home security installations and metal fabrication.',
    city: 'Lagos',
    state: 'Lagos',
    testimonial_count: 2  
  },
  
  // Plumbers
  {
    name: 'Emmanuel Udom',
    category: 'plumbing',
    description: 'Licensed plumber for all residential and commercial plumbing needs. Fast response, quality work.',
    city: 'Lagos', 
    state: 'Lagos',
    testimonial_count: 3
  },
  {
    name: 'Abdullahi Musa',
    category: 'plumbing',
    description: 'Reliable plumber with 10+ years experience. Pipe installation, repair, drainage solutions.',
    city: 'Lagos',
    state: 'Lagos',
    testimonial_count: 2
  }
]