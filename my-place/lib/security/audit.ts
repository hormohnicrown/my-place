// Security Audit System for My Place Marketplace
// Comprehensive security checks and vulnerability assessment

export type SecurityLevel = 'critical' | 'high' | 'medium' | 'low' | 'info'
export type SecurityCategory = 'authentication' | 'authorization' | 'data_protection' | 'api_security' | 'infrastructure' | 'code_security'

export interface SecurityCheck {
  id: string
  category: SecurityCategory
  title: string
  description: string
  level: SecurityLevel
  status: 'pass' | 'fail' | 'warning' | 'not_tested'
  recommendation?: string
  implementation?: string
  cweId?: string // Common Weakness Enumeration ID
  tested?: boolean
}

export interface SecurityAuditReport {
  timestamp: Date
  overallScore: number
  critical: number
  high: number
  medium: number
  low: number
  passed: number
  failed: number
  warnings: number
  checks: SecurityCheck[]
}

// Comprehensive security checklist based on OWASP Top 10 and Nigerian context
export const securityChecks: SecurityCheck[] = [
  // ============================================================================
  // AUTHENTICATION SECURITY
  // ============================================================================
  {
    id: 'auth-001',
    category: 'authentication',
    title: 'Phone OTP Rate Limiting',
    description: 'Prevent OTP spam and abuse by limiting requests per phone number',
    level: 'critical',
    status: 'not_tested',
    recommendation: 'Implement rate limiting: max 3 OTP requests per phone per hour, max 10 per day',
    implementation: 'Add Supabase Edge Functions or middleware to track and limit OTP requests by phone number',
    cweId: 'CWE-307'
  },
  {
    id: 'auth-002',
    category: 'authentication',
    title: 'OTP Expiration',
    description: 'OTP codes must expire after short time window',
    level: 'critical',
    status: 'not_tested',
    recommendation: 'OTP codes should expire after 5 minutes maximum',
    implementation: 'Verify Supabase Auth OTP expiration is set to 300 seconds or less',
    cweId: 'CWE-613'
  },
  {
    id: 'auth-003',
    category: 'authentication',
    title: 'Session Token Security',
    description: 'Session tokens stored securely with httpOnly and secure flags',
    level: 'high',
    status: 'not_tested',
    recommendation: 'Ensure all auth cookies have httpOnly, secure, and sameSite flags',
    implementation: 'Verify Supabase client configuration uses secure cookie settings',
    cweId: 'CWE-614'
  },
  {
    id: 'auth-004',
    category: 'authentication',
    title: 'Session Timeout',
    description: 'User sessions expire after reasonable inactivity period',
    level: 'medium',
    status: 'not_tested',
    recommendation: 'Sessions should timeout after 7 days of inactivity, 30 days absolute',
    implementation: 'Configure Supabase Auth session timeout policies',
    cweId: 'CWE-613'
  },
  {
    id: 'auth-005',
    category: 'authentication',
    title: 'Failed Login Throttling',
    description: 'Prevent brute force attacks on authentication',
    level: 'high',
    status: 'not_tested',
    recommendation: 'Lock account or add delays after 5 failed attempts within 15 minutes',
    implementation: 'Implement failed attempt tracking in database with progressive delays',
    cweId: 'CWE-307'
  },

  // ============================================================================
  // AUTHORIZATION & ACCESS CONTROL
  // ============================================================================
  {
    id: 'authz-001',
    category: 'authorization',
    title: 'Row-Level Security (RLS) Enabled',
    description: 'All database tables have RLS policies active',
    level: 'critical',
    status: 'not_tested',
    recommendation: 'Enable RLS on ALL tables: users, merchant_profiles, listings, bookings, reviews, payments',
    implementation: 'Run: ALTER TABLE table_name ENABLE ROW LEVEL SECURITY; for each table',
    cweId: 'CWE-284'
  },
  {
    id: 'authz-002',
    category: 'authorization',
    title: 'User Can Only Access Own Data',
    description: 'RLS policies prevent users from accessing other users\' data',
    level: 'critical',
    status: 'not_tested',
    recommendation: 'Test: User A cannot read/write User B\'s bookings, profile, or payments',
    implementation: 'Create test users and attempt cross-user data access',
    cweId: 'CWE-639'
  },
  {
    id: 'authz-003',
    category: 'authorization',
    title: 'Merchant Can Only Edit Own Listings',
    description: 'Merchants cannot modify other merchants\' listings or profiles',
    level: 'critical',
    status: 'not_tested',
    recommendation: 'RLS policy: UPDATE/DELETE allowed only where merchant_id = auth.uid()',
    implementation: 'Test merchant A attempting to edit merchant B\'s listing',
    cweId: 'CWE-639'
  },
  {
    id: 'authz-004',
    category: 'authorization',
    title: 'Client Cannot Access Merchant-Only Features',
    description: 'Role-based access control enforced for merchant features',
    level: 'high',
    status: 'not_tested',
    recommendation: 'Verify clients cannot create listings or access merchant dashboard',
    implementation: 'Test client user attempting to access /merchant/* routes',
    cweId: 'CWE-863'
  },
  {
    id: 'authz-005',
    category: 'authorization',
    title: 'Admin Functions Protected',
    description: 'Admin-only functions require proper role verification',
    level: 'critical',
    status: 'not_tested',
    recommendation: 'All admin actions must verify user role is "admin" (not merchant/client)',
    implementation: 'Add proper admin role and verify at start of all admin server actions',
    cweId: 'CWE-284'
  },

  // ============================================================================
  // DATA PROTECTION
  // ============================================================================
  {
    id: 'data-001',
    category: 'data_protection',
    title: 'PII Data Encryption at Rest',
    description: 'Personally Identifiable Information encrypted in database',
    level: 'high',
    status: 'not_tested',
    recommendation: 'Verify Supabase encrypts data at rest (default for Supabase Pro)',
    implementation: 'Check Supabase project settings for encryption-at-rest status',
    cweId: 'CWE-311'
  },
  {
    id: 'data-002',
    category: 'data_protection',
    title: 'Payment Data Never Stored',
    description: 'No credit card numbers or sensitive payment data stored',
    level: 'critical',
    status: 'not_tested',
    recommendation: 'Use Paystack tokens only, never store raw card numbers',
    implementation: 'Verify payments table only stores transaction IDs and statuses',
    cweId: 'CWE-312'
  },
  {
    id: 'data-003',
    category: 'data_protection',
    title: 'ID Verification Images Secure',
    description: 'Government ID images stored securely with limited access',
    level: 'high',
    status: 'not_tested',
    recommendation: 'ID images in Supabase Storage with strict bucket policies, auto-delete after verification',
    implementation: 'Configure Storage bucket with authenticated-only access and lifecycle rules',
    cweId: 'CWE-311'
  },
  {
    id: 'data-004',
    category: 'data_protection',
    title: 'User Data Export Available',
    description: 'Users can export their personal data (NDPR compliance)',
    level: 'medium',
    status: 'not_tested',
    recommendation: 'Implement user data export feature for NDPR "right to data portability"',
    implementation: 'Create /api/user/export endpoint returning user\'s data as JSON',
    cweId: 'CWE-359'
  },
  {
    id: 'data-005',
    category: 'data_protection',
    title: 'User Data Deletion Available',
    description: 'Users can request account and data deletion (NDPR compliance)',
    level: 'medium',
    status: 'not_tested',
    recommendation: 'Implement account deletion with 30-day grace period',
    implementation: 'Create soft-delete mechanism with scheduled purge after 30 days',
    cweId: 'CWE-359'
  },
  {
    id: 'data-006',
    category: 'data_protection',
    title: 'Database Backups Encrypted',
    description: 'Database backups are encrypted and access-controlled',
    level: 'high',
    status: 'not_tested',
    recommendation: 'Verify Supabase automated backups are encrypted',
    implementation: 'Check Supabase backup settings and encryption status',
    cweId: 'CWE-311'
  },

  // ============================================================================
  // API SECURITY
  // ============================================================================
  {
    id: 'api-001',
    category: 'api_security',
    title: 'API Rate Limiting',
    description: 'API endpoints protected against abuse and DoS attacks',
    level: 'high',
    status: 'not_tested',
    recommendation: 'Implement rate limiting: 100 requests per minute per IP for public APIs',
    implementation: 'Add Vercel rate limiting or Supabase Edge Functions with rate limits',
    cweId: 'CWE-770'
  },
  {
    id: 'api-002',
    category: 'api_security',
    title: 'Input Validation',
    description: 'All user inputs validated and sanitized',
    level: 'critical',
    status: 'not_tested',
    recommendation: 'Validate all inputs: phone numbers, prices, names, descriptions',
    implementation: 'Use Zod schemas for validation in all server actions',
    cweId: 'CWE-20'
  },
  {
    id: 'api-003',
    category: 'api_security',
    title: 'SQL Injection Prevention',
    description: 'Parameterized queries used, no string concatenation',
    level: 'critical',
    status: 'not_tested',
    recommendation: 'Use Supabase client methods (no raw SQL strings), parameterized queries only',
    implementation: 'Code review: search for raw SQL queries and replace with Supabase methods',
    cweId: 'CWE-89'
  },
  {
    id: 'api-004',
    category: 'api_security',
    title: 'XSS Protection',
    description: 'User-generated content sanitized to prevent XSS attacks',
    level: 'high',
    status: 'not_tested',
    recommendation: 'Sanitize all user input before displaying (merchant descriptions, reviews)',
    implementation: 'React escapes by default, but verify no dangerouslySetInnerHTML usage',
    cweId: 'CWE-79'
  },
  {
    id: 'api-005',
    category: 'api_security',
    title: 'CSRF Protection',
    description: 'Cross-Site Request Forgery protections active',
    level: 'high',
    status: 'not_tested',
    recommendation: 'Next.js Server Actions have CSRF protection by default',
    implementation: 'Verify using Server Actions for all mutations (not API routes)',
    cweId: 'CWE-352'
  },
  {
    id: 'api-006',
    category: 'api_security',
    title: 'File Upload Security',
    description: 'File uploads validated for type, size, and content',
    level: 'high',
    status: 'not_tested',
    recommendation: 'Validate file types (images only), limit size to 5MB, scan for malware',
    implementation: 'Configure Supabase Storage with file type and size restrictions',
    cweId: 'CWE-434'
  },

  // ============================================================================
  // INFRASTRUCTURE SECURITY
  // ============================================================================
  {
    id: 'infra-001',
    category: 'infrastructure',
    title: 'HTTPS Enforced',
    description: 'All connections use HTTPS, HTTP redirects to HTTPS',
    level: 'critical',
    status: 'not_tested',
    recommendation: 'Vercel enforces HTTPS by default, verify no HTTP fallback',
    implementation: 'Test accessing http:// URL and verify redirect to https://',
    cweId: 'CWE-319'
  },
  {
    id: 'infra-002',
    category: 'infrastructure',
    title: 'Security Headers Configured',
    description: 'HTTP security headers protect against common attacks',
    level: 'high',
    status: 'not_tested',
    recommendation: 'Set headers: Content-Security-Policy, X-Frame-Options, X-Content-Type-Options',
    implementation: 'Add security headers in next.config.js',
    cweId: 'CWE-16'
  },
  {
    id: 'infra-003',
    category: 'infrastructure',
    title: 'Environment Variables Secured',
    description: 'No secrets in code, all sensitive config in environment variables',
    level: 'critical',
    status: 'not_tested',
    recommendation: 'Verify .env files in .gitignore, no hardcoded secrets in codebase',
    implementation: 'Search codebase for hardcoded API keys, passwords, tokens',
    cweId: 'CWE-798'
  },
  {
    id: 'infra-004',
    category: 'infrastructure',
    title: 'Dependency Vulnerabilities',
    description: 'No known vulnerabilities in npm packages',
    level: 'high',
    status: 'not_tested',
    recommendation: 'Run npm audit and fix all high/critical vulnerabilities',
    implementation: 'Execute: npm audit fix',
    cweId: 'CWE-1035'
  },
  {
    id: 'infra-005',
    category: 'infrastructure',
    title: 'Error Messages Sanitized',
    description: 'Error messages don\'t expose sensitive system information',
    level: 'medium',
    status: 'not_tested',
    recommendation: 'Production errors show generic messages, detailed logs server-side only',
    implementation: 'Review error handling code for information disclosure',
    cweId: 'CWE-209'
  },
  {
    id: 'infra-006',
    category: 'infrastructure',
    title: 'Logging Excludes Sensitive Data',
    description: 'Logs don\'t contain passwords, tokens, or PII',
    level: 'high',
    status: 'not_tested',
    recommendation: 'Review logging code, never log: passwords, OTPs, tokens, card numbers',
    implementation: 'Search codebase for console.log and verify no sensitive data logged',
    cweId: 'CWE-532'
  },

  // ============================================================================
  // CODE SECURITY (Nigerian Context)
  // ============================================================================
  {
    id: 'code-001',
    category: 'code_security',
    title: 'Phone Number Validation',
    description: 'Nigerian phone numbers validated correctly (+234 format)',
    level: 'medium',
    status: 'not_tested',
    recommendation: 'Validate format: +234[7-9][0-9]{9} for Nigerian mobile numbers',
    implementation: 'Add phone validation function using regex or libphonenumber',
    cweId: 'CWE-20'
  },
  {
    id: 'code-002',
    category: 'code_security',
    title: 'Price Manipulation Prevention',
    description: 'Booking prices cannot be manipulated client-side',
    level: 'critical',
    status: 'not_tested',
    recommendation: 'Server validates price matches listing, client cannot modify agreed_price',
    implementation: 'Server action fetches listing price from database, ignores client-provided price',
    cweId: 'CWE-602'
  },
  {
    id: 'code-003',
    category: 'code_security',
    title: 'Payment Webhook Verification',
    description: 'Paystack webhooks verified with signature',
    level: 'critical',
    status: 'not_tested',
    recommendation: 'Verify webhook signature using Paystack secret key',
    implementation: 'Implement webhook signature verification in payment webhook handler',
    cweId: 'CWE-345'
  },
  {
    id: 'code-004',
    category: 'code_security',
    title: 'Geo-Location Data Validated',
    description: 'Coordinates within Nigeria bounds, prevent location spoofing',
    level: 'low',
    status: 'not_tested',
    recommendation: 'Validate lat/lng within Nigeria bounds: lat 4-14, lng 2.5-15',
    implementation: 'Add coordinate validation before saving to database',
    cweId: 'CWE-20'
  },
  {
    id: 'code-005',
    category: 'code_security',
    title: 'ID Verification Webhook Security',
    description: 'Smile Identity webhooks authenticated properly',
    level: 'high',
    status: 'not_tested',
    recommendation: 'Verify webhook signatures and check source IP whitelist',
    implementation: 'Implement Smile Identity webhook signature verification',
    cweId: 'CWE-345'
  }
]

// Calculate security score
export function calculateSecurityScore(checks: SecurityCheck[]): {
  score: number
  critical: number
  high: number
  medium: number
  low: number
  passed: number
  failed: number
  warnings: number
  notTested: number
} {
  let passed = 0
  let failed = 0
  let warnings = 0
  let notTested = 0
  let critical = 0
  let high = 0
  let medium = 0
  let low = 0

  checks.forEach(check => {
    // Count by level
    switch (check.level) {
      case 'critical': critical++; break
      case 'high': high++; break
      case 'medium': medium++; break
      case 'low': low++; break
    }

    // Count by status
    switch (check.status) {
      case 'pass': passed++; break
      case 'fail': failed++; break
      case 'warning': warnings++; break
      case 'not_tested': notTested++; break
    }
  })

  // Calculate score (0-100)
  // Critical failures are heavily weighted
  const totalChecks = checks.length
  const criticalWeight = 3
  const highWeight = 2
  const mediumWeight = 1

  const criticalFailed = checks.filter(c => c.level === 'critical' && c.status === 'fail').length
  const highFailed = checks.filter(c => c.level === 'high' && c.status === 'fail').length
  const mediumFailed = checks.filter(c => c.level === 'medium' && c.status === 'fail').length

  const totalWeight = checks.reduce((sum, check) => {
    if (check.level === 'critical') return sum + criticalWeight
    if (check.level === 'high') return sum + highWeight
    if (check.level === 'medium') return sum + mediumWeight
    return sum + 1
  }, 0)

  const failedWeight = 
    (criticalFailed * criticalWeight) + 
    (highFailed * highWeight) + 
    (mediumFailed * mediumWeight)

  const score = Math.max(0, Math.round(((totalWeight - failedWeight) / totalWeight) * 100))

  return {
    score,
    critical,
    high,
    medium,
    low,
    passed,
    failed,
    warnings,
    notTested
  }
}

// Get checks by severity
export function getCriticalFailures(checks: SecurityCheck[]): SecurityCheck[] {
  return checks.filter(c => c.level === 'critical' && c.status === 'fail')
}

export function getHighRiskIssues(checks: SecurityCheck[]): SecurityCheck[] {
  return checks.filter(c => (c.level === 'critical' || c.level === 'high') && c.status === 'fail')
}

// Security hardening recommendations
export const productionHardeningChecklist = [
  {
    category: 'Pre-Deployment',
    items: [
      'Run npm audit and fix all vulnerabilities',
      'Review all environment variables are set',
      'Verify production API keys are active',
      'Enable Supabase database connection pooling',
      'Configure Supabase Storage bucket policies',
      'Set up error monitoring (Sentry)',
      'Configure uptime monitoring',
      'Test payment webhook with production keys'
    ]
  },
  {
    category: 'Launch Day',
    items: [
      'Switch NODE_ENV to production',
      'Enable HTTPS-only mode',
      'Verify RLS on all tables',
      'Monitor error rates closely',
      'Have rollback plan ready',
      'Team on standby for issues',
      'Monitor payment processing',
      'Track authentication metrics'
    ]
  },
  {
    category: 'Post-Launch (Week 1)',
    items: [
      'Daily security log review',
      'Monitor failed authentication attempts',
      'Review suspicious booking patterns',
      'Check payment reconciliation',
      'Monitor API rate limit hits',
      'Review user-reported security issues',
      'Update security checks based on findings',
      'Schedule first security audit'
    ]
  }
]