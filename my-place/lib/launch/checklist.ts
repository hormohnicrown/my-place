// Launch readiness checklist system
// Verifies platform is production-ready before going live

export type CheckStatus = 'pass' | 'fail' | 'warning' | 'pending'
export type CheckCategory = 'security' | 'infrastructure' | 'content' | 'legal' | 'operations' | 'monitoring'

export interface LaunchCheck {
  id: string
  category: CheckCategory
  title: string
  description: string
  status: CheckStatus
  required: boolean // Must pass for production launch
  autoCheck?: boolean // Can be verified automatically
  verificationSteps?: string[]
  lastChecked?: Date
  details?: string
}

export interface LaunchChecklistSection {
  category: CheckCategory
  title: string
  description: string
  checks: LaunchCheck[]
}

// Comprehensive launch readiness checklist
export const launchChecklist: LaunchChecklistSection[] = [
  {
    category: 'security',
    title: 'Security & Authentication',
    description: 'Critical security measures and authentication systems',
    checks: [
      {
        id: 'rls-policies',
        category: 'security',
        title: 'Row-Level Security (RLS) Policies Active',
        description: 'All database tables have RLS policies enabled and tested',
        status: 'pending',
        required: true,
        autoCheck: true,
        verificationSteps: [
          'Check all tables have RLS enabled in Supabase dashboard',
          'Verify users can only access their own data',
          'Test merchant can only edit their own listings',
          'Confirm clients cannot access other clients\' bookings'
        ]
      },
      {
        id: 'auth-flow',
        category: 'security',
        title: 'Phone OTP Authentication Working',
        description: 'SMS OTP delivery functioning correctly with Twilio/provider',
        status: 'pending',
        required: true,
        autoCheck: false,
        verificationSteps: [
          'Test OTP sending to Nigerian phone numbers (+234)',
          'Verify OTP codes arrive within 30 seconds',
          'Test OTP verification and session creation',
          'Confirm failed OTP attempts are rate-limited'
        ]
      },
      {
        id: 'id-verification',
        category: 'security',
        title: 'ID Verification System Operational',
        description: 'Smile Identity integration working for merchant verification',
        status: 'pending',
        required: true,
        autoCheck: false,
        verificationSteps: [
          'Test Smile Identity API connection',
          'Verify Nigerian ID verification flow (NIN, Voter\'s Card, Driver\'s License)',
          'Confirm verification results stored correctly',
          'Test admin override capability for edge cases'
        ]
      },
      {
        id: 'api-keys',
        category: 'security',
        title: 'Production API Keys Secured',
        description: 'All API keys are production-ready and properly secured',
        status: 'pending',
        required: true,
        autoCheck: false,
        verificationSteps: [
          'Replace all test API keys with production keys',
          'Store API keys in environment variables only',
          'Remove any hardcoded secrets from codebase',
          'Verify .env files are in .gitignore'
        ]
      },
      {
        id: 'https-enforced',
        category: 'security',
        title: 'HTTPS Enforced Everywhere',
        description: 'All connections use HTTPS, no mixed content',
        status: 'pending',
        required: true,
        autoCheck: true,
        verificationSteps: [
          'Verify domain has valid SSL certificate',
          'Check all API calls use HTTPS',
          'Confirm no mixed content warnings',
          'Test redirect from HTTP to HTTPS'
        ]
      }
    ]
  },
  {
    category: 'infrastructure',
    title: 'Infrastructure & Performance',
    description: 'Server capacity, database, and performance optimization',
    checks: [
      {
        id: 'database-indexes',
        category: 'infrastructure',
        title: 'Database Indexes Optimized',
        description: 'Critical queries have proper indexes for performance',
        status: 'pending',
        required: true,
        autoCheck: true,
        verificationSteps: [
          'Add index on users.auth_user_id (foreign key lookup)',
          'Add index on bookings.merchant_id and bookings.client_id',
          'Add spatial index on geo_coordinates for proximity search',
          'Add index on listings.category for category filtering'
        ]
      },
      {
        id: 'cdn-setup',
        category: 'infrastructure',
        title: 'CDN for Static Assets',
        description: 'Images and static files served via CDN',
        status: 'pending',
        required: false,
        autoCheck: false,
        verificationSteps: [
          'Configure Vercel CDN for Next.js static files',
          'Set up Supabase Storage for user uploads',
          'Configure proper cache headers',
          'Test asset loading speed from Nigeria'
        ]
      },
      {
        id: 'error-monitoring',
        category: 'infrastructure',
        title: 'Error Monitoring Setup',
        description: 'Sentry or similar tool configured for error tracking',
        status: 'pending',
        required: true,
        autoCheck: false,
        verificationSteps: [
          'Install and configure Sentry (or alternative)',
          'Test error reporting with sample error',
          'Set up alert notifications for critical errors',
          'Configure error grouping and filtering'
        ]
      },
      {
        id: 'backup-strategy',
        category: 'infrastructure',
        title: 'Database Backup Strategy',
        description: 'Automated backups configured and tested',
        status: 'pending',
        required: true,
        autoCheck: false,
        verificationSteps: [
          'Enable Supabase automated daily backups',
          'Test backup restoration process',
          'Document backup retention policy',
          'Set up backup failure alerts'
        ]
      }
    ]
  },
  {
    category: 'content',
    title: 'Content & User Experience',
    description: 'Initial content, UX polish, and marketplace readiness',
    checks: [
      {
        id: 'seed-merchants',
        category: 'content',
        title: 'Seed Merchants Deployed',
        description: 'Initial merchants with testimonials for marketplace credibility',
        status: 'pending',
        required: true,
        autoCheck: true,
        verificationSteps: [
          'Deploy 8 seed merchants via admin panel',
          'Verify testimonials display correctly',
          'Check merchant profiles are complete',
          'Confirm listings are active and searchable'
        ]
      },
      {
        id: 'help-content',
        category: 'content',
        title: 'Help & Support Content Complete',
        description: 'FAQs, how-to guides, and support contact info',
        status: 'pending',
        required: true,
        autoCheck: false,
        verificationSteps: [
          'Complete FAQ section with common questions',
          'Write merchant onboarding guide',
          'Create client booking walkthrough',
          'Set up support phone number and email'
        ]
      },
      {
        id: 'accessibility-audit',
        category: 'content',
        title: 'Accessibility Audit Passed',
        description: 'Platform is usable for users with low digital literacy',
        status: 'pending',
        required: true,
        autoCheck: true,
        verificationSteps: [
          'Run accessibility audit tool',
          'Test with screen reader',
          'Verify keyboard navigation works',
          'Confirm Grade 8 reading level throughout'
        ]
      },
      {
        id: 'mobile-responsive',
        category: 'content',
        title: 'Mobile Responsiveness Verified',
        description: 'All pages work well on mobile devices',
        status: 'pending',
        required: true,
        autoCheck: false,
        verificationSteps: [
          'Test on iOS Safari and Android Chrome',
          'Verify touch targets are 44px minimum',
          'Check forms work on mobile keyboards',
          'Confirm no horizontal scrolling'
        ]
      }
    ]
  },
  {
    category: 'legal',
    title: 'Legal & Compliance',
    description: 'Terms of service, privacy policy, and legal compliance',
    checks: [
      {
        id: 'terms-of-service',
        category: 'legal',
        title: 'Terms of Service Published',
        description: 'Complete ToS covering platform rules and liabilities',
        status: 'pending',
        required: true,
        autoCheck: false,
        verificationSteps: [
          'Draft Terms of Service with legal counsel',
          'Include escrow payment terms',
          'Define merchant and client responsibilities',
          'Add dispute resolution process',
          'Publish at /legal/terms'
        ]
      },
      {
        id: 'privacy-policy',
        category: 'legal',
        title: 'Privacy Policy Published',
        description: 'NDPR-compliant privacy policy for Nigerian users',
        status: 'pending',
        required: true,
        autoCheck: false,
        verificationSteps: [
          'Draft privacy policy covering NDPR requirements',
          'Explain data collection and usage',
          'Document user rights (access, deletion, etc.)',
          'Include contact for privacy concerns',
          'Publish at /legal/privacy'
        ]
      },
      {
        id: 'cookie-consent',
        category: 'legal',
        title: 'Cookie Consent Banner',
        description: 'Cookie notice and consent mechanism implemented',
        status: 'pending',
        required: false,
        autoCheck: false,
        verificationSteps: [
          'Implement cookie consent banner',
          'Allow users to opt-in/opt-out',
          'Document cookies used and their purpose',
          'Store consent preferences'
        ]
      }
    ]
  },
  {
    category: 'operations',
    title: 'Operations & Support',
    description: 'Customer support and operational procedures',
    checks: [
      {
        id: 'support-channels',
        category: 'operations',
        title: 'Support Channels Active',
        description: 'Phone, email, and WhatsApp support ready',
        status: 'pending',
        required: true,
        autoCheck: false,
        verificationSteps: [
          'Set up dedicated support phone number',
          'Create support email (support@myplace.ng)',
          'Configure WhatsApp Business account',
          'Train support staff on common issues'
        ]
      },
      {
        id: 'payment-setup',
        category: 'operations',
        title: 'Payment Gateway Configured',
        description: 'Paystack integration tested for NGN payments',
        status: 'pending',
        required: true,
        autoCheck: false,
        verificationSteps: [
          'Complete Paystack business verification',
          'Switch to production API keys',
          'Test card payments end-to-end',
          'Verify webhook delivery for payment events',
          'Test escrow hold and release flow'
        ]
      },
      {
        id: 'admin-trained',
        category: 'operations',
        title: 'Admin Team Trained',
        description: 'Admin staff trained on platform management',
        status: 'pending',
        required: true,
        autoCheck: false,
        verificationSteps: [
          'Train on verification approval process',
          'Practice dispute resolution procedures',
          'Review flagged booking handling',
          'Test emergency response procedures'
        ]
      },
      {
        id: 'incident-response',
        category: 'operations',
        title: 'Incident Response Plan',
        description: 'Documented procedures for handling platform incidents',
        status: 'pending',
        required: true,
        autoCheck: false,
        verificationSteps: [
          'Document escalation procedures',
          'Create contact list for emergencies',
          'Define incident severity levels',
          'Plan for service disruptions'
        ]
      }
    ]
  },
  {
    category: 'monitoring',
    title: 'Monitoring & Analytics',
    description: 'Platform health monitoring and usage analytics',
    checks: [
      {
        id: 'uptime-monitoring',
        category: 'monitoring',
        title: 'Uptime Monitoring Active',
        description: 'External service monitoring platform availability',
        status: 'pending',
        required: true,
        autoCheck: false,
        verificationSteps: [
          'Set up UptimeRobot or similar service',
          'Monitor main page and API endpoints',
          'Configure alerts for downtime',
          'Set up status page for users'
        ]
      },
      {
        id: 'analytics-setup',
        category: 'monitoring',
        title: 'Analytics Tracking Implemented',
        description: 'User behavior and conversion tracking configured',
        status: 'pending',
        required: false,
        autoCheck: false,
        verificationSteps: [
          'Install Google Analytics or Plausible',
          'Track key user actions (signup, booking)',
          'Set up conversion funnels',
          'Configure event tracking'
        ]
      },
      {
        id: 'performance-monitoring',
        category: 'monitoring',
        title: 'Performance Monitoring Setup',
        description: 'Page load times and Core Web Vitals tracked',
        status: 'pending',
        required: false,
        autoCheck: true,
        verificationSteps: [
          'Enable Vercel Analytics',
          'Monitor Core Web Vitals',
          'Track API response times',
          'Set performance budgets'
        ]
      }
    ]
  }
]

// Calculate overall readiness score
export function calculateReadinessScore(checklist: LaunchChecklistSection[]): {
  total: number
  passed: number
  failed: number
  warnings: number
  pending: number
  requiredPassed: number
  requiredTotal: number
  readyForLaunch: boolean
  completionPercentage: number
} {
  let total = 0
  let passed = 0
  let failed = 0
  let warnings = 0
  let pending = 0
  let requiredTotal = 0
  let requiredPassed = 0

  checklist.forEach(section => {
    section.checks.forEach(check => {
      total++
      if (check.required) requiredTotal++

      switch (check.status) {
        case 'pass':
          passed++
          if (check.required) requiredPassed++
          break
        case 'fail':
          failed++
          break
        case 'warning':
          warnings++
          if (check.required) requiredPassed++ // Warnings don't block launch
          break
        case 'pending':
          pending++
          break
      }
    })
  })

  const readyForLaunch = requiredPassed === requiredTotal && failed === 0
  const completionPercentage = total > 0 ? Math.round(((passed + warnings) / total) * 100) : 0

  return {
    total,
    passed,
    failed,
    warnings,
    pending,
    requiredPassed,
    requiredTotal,
    readyForLaunch,
    completionPercentage
  }
}

// Get checks by category
export function getChecksByCategory(category: CheckCategory): LaunchCheck[] {
  const section = launchChecklist.find(s => s.category === category)
  return section?.checks || []
}

// Get only required checks
export function getRequiredChecks(): LaunchCheck[] {
  return launchChecklist.flatMap(section => 
    section.checks.filter(check => check.required)
  )
}

// Get failing checks
export function getFailingChecks(): LaunchCheck[] {
  return launchChecklist.flatMap(section => 
    section.checks.filter(check => check.status === 'fail')
  )
}