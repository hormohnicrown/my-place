# Security Documentation - My Place Marketplace

## Overview
Comprehensive security implementation for the My Place marketplace platform, designed for the Nigerian market with specific attention to local threat models and compliance requirements (NDPR).

## Table of Contents
1. [Security Architecture](#security-architecture)
2. [Authentication & Authorization](#authentication--authorization)
3. [Data Protection](#data-protection)
4. [API Security](#api-security)
5. [Infrastructure Security](#infrastructure-security)
6. [Code Security](#code-security)
7. [Compliance (NDPR)](#compliance-ndpr)
8. [Incident Response](#incident-response)
9. [Security Audit System](#security-audit-system)

## Security Architecture

### Defense in Depth
Multi-layered security approach:
- **Layer 1**: Network (HTTPS, security headers)
- **Layer 2**: Authentication (Phone OTP, session management)
- **Layer 3**: Authorization (RLS, role-based access)
- **Layer 4**: Application (input validation, CSRF protection)
- **Layer 5**: Data (encryption at rest and in transit)

### Zero Trust Model
- No implicit trust based on network location
- Every request authenticated and authorized
- Principle of least privilege throughout

## Authentication & Authorization

### Phone OTP Authentication

**Implementation**:
- Primary authentication method using Nigerian phone numbers (+234)
- SMS OTP delivery via Twilio/Supabase Auth
- OTP validity: 5 minutes
- Rate limiting: 3 attempts per hour per phone number

**Security Controls**:
```typescript
// Rate limiting configuration
const OTP_LIMITS = {
  maxAttemptsPerHour: 3,
  maxAttemptsPerDay: 10,
  otpExpiryMinutes: 5,
  lockoutDurationMinutes: 60
}
```

**Threats Mitigated**:
- CWE-307: Brute force attacks
- CWE-613: Insufficient session expiration

### Session Management

**Configuration**:
- Session timeout: 7 days inactive, 30 days absolute
- Secure cookies: httpOnly, secure, sameSite=strict
- Automatic session refresh on activity
- Session invalidation on logout

**Storage**:
- Server-side session storage in Supabase Auth
- Client-side: httpOnly cookies only (no localStorage)

### Row-Level Security (RLS)

**Critical Implementation**:
All database tables have RLS enabled with policies:

```sql
-- Example: Users can only access their own data
CREATE POLICY "Users can view own data"
  ON users FOR SELECT
  USING (auth.uid() = auth_user_id);

-- Merchants can only edit own listings
CREATE POLICY "Merchants can update own listings"
  ON listings FOR UPDATE
  USING (merchant_id IN (
    SELECT id FROM users WHERE auth_user_id = auth.uid()
  ));

-- Clients can only see own bookings
CREATE POLICY "Clients can view own bookings"
  ON bookings FOR SELECT
  USING (
    client_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
    OR merchant_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
  );
```

**Verification**:
- Automated RLS tests in `/lib/security/actions.ts`
- Manual testing: user A cannot access user B's data
- Regular audits via security dashboard

### Role-Based Access Control (RBAC)

**Roles**:
- **Client**: Book services, leave reviews
- **Merchant**: Create listings, manage bookings
- **Admin**: Platform management, verification approval

**Enforcement**:
```typescript
// Server-side role check (required for all admin actions)
async function requireAdmin() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') {
    throw new Error('Admin access required')
  }
  return user
}
```

## Data Protection

### Encryption

**At Rest**:
- Database: AES-256 encryption (Supabase default)
- File storage: Encrypted buckets for ID verification images
- Backups: Encrypted with separate keys

**In Transit**:
- TLS 1.3 enforced for all connections
- HTTPS-only (HSTS enabled)
- No mixed content allowed

### Personally Identifiable Information (PII)

**Sensitive Data Handling**:
| Data Type | Storage | Encryption | Retention |
|-----------|---------|------------|-----------|
| Phone numbers | Database | At rest | Indefinite |
| Email addresses | Database | At rest | Indefinite |
| ID verification images | Supabase Storage | At rest | 90 days post-verification |
| Addresses | Database | At rest | Indefinite |
| Payment data | Never stored | N/A | Never |

**Payment Data**:
- **NEVER stored**: Credit card numbers, CVV, PINs
- Only store: Paystack transaction IDs, status, amounts
- PCI DSS compliance through Paystack (Level 1 certified)

### ID Verification Security

**Smile Identity Integration**:
- Government ID images transmitted over HTTPS
- Stored in access-controlled Supabase bucket
- Auto-deletion 90 days after verification
- Admin-only access to verification images
- Webhook signature verification required

**Access Control**:
```typescript
// Storage bucket policy
{
  "authenticated-read": true,
  "roles": {
    "admin": ["read", "delete"],
    "user": ["upload"] // Own ID only
  }
}
```

### Data Retention & Deletion

**NDPR Compliance**:
- Users can export their data (JSON format)
- Users can request account deletion
- 30-day grace period before permanent deletion
- Soft delete with scheduled purge

**Implementation**:
- Data export: `/api/user/export`
- Account deletion: `/settings/delete-account`
- Automated purge: Daily cron job

## API Security

### Input Validation

**Validation Library**: Zod schemas for all inputs

```typescript
// Example validation schema
const BookingSchema = z.object({
  listingId: z.string().uuid(),
  requestedDate: z.string().datetime(),
  message: z.string().max(500),
  priceAgreed: z.number().positive().max(10000000) // 10M Naira max
})
```

**Validation Points**:
- All user inputs sanitized
- Phone number format validation
- Price range validation
- Geographic coordinates bounds checking

### SQL Injection Prevention

**Approach**: Parameterized queries only

```typescript
// ✅ SAFE: Using Supabase client methods
const { data } = await supabase
  .from('bookings')
  .select('*')
  .eq('client_id', userId) // Parameterized

// ❌ NEVER: Raw SQL with string concatenation
const query = `SELECT * FROM bookings WHERE client_id = '${userId}'` // UNSAFE!
```

**Enforcement**:
- Code reviews check for raw SQL
- Supabase client methods required
- ESLint rules prevent unsafe patterns

### XSS Protection

**React Default Security**:
- Automatic HTML escaping
- No `dangerouslySetInnerHTML` usage
- Content Security Policy headers

**CSP Configuration**:
```javascript
// next.config.js
headers: [
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
  }
]
```

### CSRF Protection

**Next.js Server Actions**:
- Built-in CSRF tokens
- Origin checking
- SameSite cookies

**Additional Measures**:
- All mutations via Server Actions (not API routes)
- Double-submit cookie pattern for API routes

### Rate Limiting

**Limits**:
| Endpoint | Limit | Window |
|----------|-------|--------|
| OTP requests | 3 | 1 hour |
| Login attempts | 5 | 15 minutes |
| API calls (authenticated) | 1000 | 1 hour |
| API calls (public) | 100 | 1 minute |

**Implementation**:
- Vercel Edge Config for rate limiting
- IP-based and user-based tracking
- Progressive delays (increasing lockout times)

### File Upload Security

**Validation**:
- File type whitelist: images only (jpg, png, webp)
- Maximum file size: 5MB
- MIME type verification
- Image content validation (not just extension)

**Storage**:
```typescript
// Supabase Storage configuration
{
  "maxSizeBytes": 5242880, // 5MB
  "allowedMimeTypes": ["image/jpeg", "image/png", "image/webp"],
  "avoidDuplicates": true
}
```

## Infrastructure Security

### HTTPS Enforcement

**Configuration**:
- Vercel enforces HTTPS by default
- HTTP requests redirect to HTTPS
- HSTS header enabled (max-age=31536000)

**Verification**:
```bash
# Test HTTP -> HTTPS redirect
curl -I http://myplace.ng
# Should return 301/308 redirect to https://
```

### Security Headers

**Configured Headers**:
```javascript
// next.config.js
headers: [
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'geolocation=(self), microphone=(), camera=()'
  }
]
```

### Environment Variables

**Management**:
- All secrets in environment variables (never in code)
- `.env` files in `.gitignore`
- Vercel environment variables encrypted
- Different keys for staging/production

**Required Variables**:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx (public, safe)
SUPABASE_SERVICE_ROLE_KEY=eyJxxx (server-side only!)
PAYSTACK_SECRET_KEY=sk_xxx (never exposed to client)
SMILE_IDENTITY_API_KEY=xxx (server-side only)
```

### Dependency Management

**Process**:
1. Weekly `npm audit` runs
2. Automated dependency updates (Dependabot)
3. Security patch priority (< 24 hours for critical)
4. Lock files committed (package-lock.json)

**Commands**:
```bash
# Check for vulnerabilities
npm audit

# Fix automatically fixable issues
npm audit fix

# Force fix (may break things)
npm audit fix --force
```

### Logging & Monitoring

**What We Log**:
- Authentication attempts (success/failure)
- Authorization failures
- Payment transactions
- Admin actions
- API errors

**What We DON'T Log**:
- Passwords or OTP codes
- Payment card numbers
- Full ID verification images
- Session tokens
- API keys

**Implementation**:
```typescript
// Sanitized logging
logger.info('User authenticated', {
  userId: user.id,
  // ❌ DO NOT LOG: otp, password, token
})
```

## Code Security (Nigerian Context)

### Phone Number Validation

**Format**: Nigerian mobile numbers
```typescript
const NIGERIAN_PHONE_REGEX = /^\+234[7-9][0-9]{9}$/

function validateNigerianPhone(phone: string): boolean {
  return NIGERIAN_PHONE_REGEX.test(phone)
}
```

### Price Manipulation Prevention

**Server-Side Validation**:
```typescript
// Client sends listing ID, server fetches price
async function createBooking(listingId: string) {
  // ✅ Fetch price from database (trusted source)
  const { data: listing } = await supabase
    .from('listings')
    .select('price')
    .eq('id', listingId)
    .single()
  
  // Use database price, ignore any client-provided price
  const booking = {
    listing_id: listingId,
    price_agreed: listing.price // ✅ From database
  }
  
  // ❌ NEVER: const priceAgreed = request.body.price
}
```

### Payment Webhook Verification

**Paystack Webhook Security**:
```typescript
import crypto from 'crypto'

function verifyPaystackWebhook(payload: string, signature: string): boolean {
  const hash = crypto
    .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY!)
    .update(payload)
    .digest('hex')
  
  return hash === signature
}
```

### Geographic Bounds Validation

**Nigeria Coordinates**:
```typescript
const NIGERIA_BOUNDS = {
  minLat: 4.0,
  maxLat: 14.0,
  minLng: 2.5,
  maxLng: 15.0
}

function validateNigerianCoordinates(lat: number, lng: number): boolean {
  return lat >= NIGERIA_BOUNDS.minLat &&
         lat <= NIGERIA_BOUNDS.maxLat &&
         lng >= NIGERIA_BOUNDS.minLng &&
         lng <= NIGERIA_BOUNDS.maxLng
}
```

## Compliance (NDPR)

### Nigeria Data Protection Regulation (NDPR)

**Requirements Met**:
1. ✅ Lawful basis for processing (consent)
2. ✅ Privacy policy published
3. ✅ Data subject rights (access, deletion)
4. ✅ Data breach notification plan
5. ✅ Data security measures
6. ✅ Data retention policy

### User Rights Implementation

**Right to Access**:
- Users can export all their data
- JSON format with all PII
- Endpoint: `GET /api/user/export`

**Right to Erasure**:
- Users can request account deletion
- 30-day grace period
- Permanent deletion after grace period
- Endpoint: `POST /api/user/delete`

**Right to Portability**:
- Data export in machine-readable format (JSON)
- Includes: profile, bookings, reviews, messages

### Consent Management

**Consent Collected For**:
- Account creation and service usage
- Marketing communications (opt-in)
- Location data for proximity search
- ID verification for merchant accounts

**Implementation**:
- Explicit consent checkboxes
- Clear, plain language explanations
- Audit trail of consent decisions
- Easy withdraw mechanisms

## Incident Response

### Security Incident Classification

**Severity Levels**:
| Level | Definition | Response Time | Example |
|-------|------------|---------------|---------|
| Critical | Data breach, system compromise | < 1 hour | Database exposed |
| High | Vulnerability exploitation | < 4 hours | Payment fraud |
| Medium | Security weakness discovered | < 24 hours | XSS vulnerability |
| Low | Minor security issue | < 1 week | Outdated dependency |

### Incident Response Plan

**Step 1: Detection** (0-15 minutes)
- Monitor error rates via Sentry
- Check uptime monitoring alerts
- Review security logs
- User reports via support

**Step 2: Assessment** (15-30 minutes)
- Determine severity level
- Identify affected systems
- Estimate user impact
- Document initial findings

**Step 3: Containment** (30 minutes - 2 hours)
- Isolate affected systems
- Revoke compromised credentials
- Block malicious IPs
- Disable vulnerable features

**Step 4: Eradication** (2-24 hours)
- Patch vulnerabilities
- Remove malware/backdoors
- Update security rules
- Deploy fixes

**Step 5: Recovery** (24-48 hours)
- Restore from backups if needed
- Re-enable services gradually
- Monitor for recurring issues
- Verify fix effectiveness

**Step 6: Post-Incident** (48 hours - 1 week)
- Document incident details
- Conduct root cause analysis
- Update security measures
- Notify affected users (NDPR compliance)
- Report to NITDA if required

### Contact Information

**Security Team**:
- Email: security@myplace.ng
- Phone: +234-XXX-XXX-XXXX
- PagerDuty: On-call rotation

**External Contacts**:
- NITDA (NDPR regulator): www.nitda.gov.ng
- Nigeria Police Cybercrime Unit
- Legal counsel

## Security Audit System

### Automated Audits

**Frequency**: Weekly automated runs

**Checks Performed**:
- RLS policy verification
- Environment variable presence
- HTTPS enforcement
- Payment data storage (none)
- Dependency vulnerabilities

**Access**: Admin dashboard at `/admin/security`

### Manual Audits

**Quarterly Reviews**:
- Penetration testing
- Code security review
- Access control audit
- Incident response drill

**Annual Comprehensive Audit**:
- Third-party security assessment
- NDPR compliance review
- Infrastructure security review
- Business continuity testing

### Security Metrics

**Tracked Metrics**:
- Failed authentication attempts
- RLS policy violations
- API rate limit hits
- Security patch deployment time
- Mean time to detect (MTTD)
- Mean time to respond (MTTR)

**Dashboard**: Real-time metrics at `/admin/security`

## Security Contact

**Responsible Disclosure**:
If you discover a security vulnerability, please email security@myplace.ng with:
- Description of the vulnerability
- Steps to reproduce
- Potential impact assessment
- Your contact information (optional)

**Bug Bounty**: Under consideration for future implementation

## References

- [OWASP Top 10](https://owasp.org/Top10/)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [NDPR Guidelines](https://nitda.gov.ng/ndpr/)
- [Supabase Security](https://supabase.com/docs/guides/security)
- [Next.js Security](https://nextjs.org/docs/security)
- [Vercel Security](https://vercel.com/security)

## Revision History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-08-10 | Initial security documentation | My Place Team |