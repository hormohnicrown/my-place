# Production Deployment Guide - My Place Marketplace

## Overview
This guide provides step-by-step instructions for deploying the My Place marketplace to production.

**Prerequisites**: All Phases 0-5 complete and tested in development environment.

## Table of Contents
1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Database Migration Verification](#database-migration-verification)
3. [Environment Configuration](#environment-configuration)
4. [Supabase Production Setup](#supabase-production-setup)
5. [Vercel Deployment](#vercel-deployment)
6. [Third-Party Service Configuration](#third-party-service-configuration)
7. [Post-Deployment Verification](#post-deployment-verification)
8. [Monitoring & Error Tracking](#monitoring--error-tracking)
9. [Rollback Procedures](#rollback-procedures)
10. [First-Run Admin Setup](#first-run-admin-setup)

---

## Pre-Deployment Checklist

### Code & Testing
- [ ] All Phase 4 features tested (booking lifecycle, GPS, ratings, commission)
- [ ] All Phase 5 features tested (admin dashboard, accessibility, seed data)
- [ ] No console errors in browser
- [ ] `npm run build` completes without errors
- [ ] All TypeScript errors resolved
- [ ] RLS policies tested for all tables
- [ ] Security audit passed (see `/docs/SECURITY.md`)

### Documentation
- [ ] `.env.example` up to date with all required variables
- [ ] README.md deployment section complete
- [ ] Terms of Service published
- [ ] Privacy Policy published (NDPR-compliant)

### Dependencies
- [ ] `npm audit` shows no critical vulnerabilities
- [ ] All dependencies up to date
- [ ] `package-lock.json` committed

### Git Repository
- [ ] All changes committed
- [ ] Main branch is stable
- [ ] Tags created for release version (e.g., `v1.0.0`)


---

## Database Migration Verification

### Migration Files
All 9 migrations must be present and in order:

```bash
supabase/migrations/
├── 20260810000001_initial_schema.sql          # Users, profiles, listings
├── 20260810000002_rls_policies.sql            # Row-level security
├── 20260810000003_storage_setup.sql           # File storage buckets
├── 20260810000004_distance_functions.sql      # Geo proximity search
├── 20260810000005_gps_checkin_system.sql      # GPS check-in/out
├── 20260810000006_commission_tracking.sql     # Commission calculation
├── 20260810000007_ratings_fix.sql             # Two-way ratings
├── 20260810000008_booking_requests_rls.sql    # Booking state machine
└── 20260810000009_booking_workflow_notifications.sql  # Notifications
```

### Pre-Deployment Verification

**Step 1**: Verify migrations are idempotent
```sql
-- Each migration should use IF NOT EXISTS
CREATE TABLE IF NOT EXISTS users (...);
CREATE POLICY IF NOT EXISTS "Users can view own data" ...;
```

**Step 2**: Test rollback capability
- Each migration should have clear rollback instructions
- Document any data loss risks

**Step 3**: Check for production-specific issues
- [ ] No `DROP TABLE` statements (except in rollbacks)
- [ ] No hardcoded development values
- [ ] All constraints have proper error messages
- [ ] Indexes are created for performance


---

## Environment Configuration

### Production Environment Variables

Create a production `.env.production` file (DO NOT commit):

```bash
# =============================================================================
# SUPABASE (Production Project)
# =============================================================================
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROD_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_PROJECT_ID=your-prod-project-ref

# =============================================================================
# APPLICATION
# =============================================================================
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NODE_ENV=production
COMMISSION_RATE_DEFAULT=0.07
ID_DOCUMENT_RETENTION_DAYS=90

# =============================================================================
# SMILE IDENTITY (Production)
# =============================================================================
NEXT_PUBLIC_SMILE_ID_PARTNER_ID=your-prod-partner-id
SMILE_ID_API_KEY=your-prod-api-key
SMILE_ID_ENVIRONMENT=production
SMILE_ID_CALLBACK_URL=https://yourdomain.com/api/webhooks/smile-id

# =============================================================================
# GOOGLE MAPS (Production API Key with domain restrictions)
# =============================================================================
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXX

# =============================================================================
# TERMII (SMS Provider)
# =============================================================================
TERMII_API_KEY=your-prod-termii-key
TERMII_SENDER_ID=MyPlace

# =============================================================================
# RESEND (Email Provider)
# =============================================================================
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@yourdomain.com

# =============================================================================
# SECURITY
# =============================================================================
DISABLE_ID_VERIFICATION_GATE=false  # MUST be false in production
DEBUG=false
```


### Environment Variable Security Checklist

- [ ] No development keys in production
- [ ] `SUPABASE_SERVICE_ROLE_KEY` never exposed to client
- [ ] `SMILE_ID_API_KEY` server-side only
- [ ] Google Maps API key has domain restrictions
- [ ] `DISABLE_ID_VERIFICATION_GATE=false` enforced
- [ ] `NODE_ENV=production` set
- [ ] All secrets stored in Vercel environment variables (not in code)

---

## Supabase Production Setup

### Step 1: Create Production Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **"New Project"**
3. Configure:
   - **Name**: `my-place-production`
   - **Database Password**: Generate strong password (save in password manager)
   - **Region**: Choose closest to Nigeria (e.g., `eu-west-2` London)
   - **Pricing Plan**: Pro plan recommended for production ($25/month)
4. Wait 2-3 minutes for provisioning

### Step 2: Enable Required Extensions

Go to **Database** > **Extensions** and enable:
- [ ] `postgis` (required for geographic coordinates)
- [ ] `pg_stat_statements` (for query performance monitoring)
- [ ] `uuid-ossp` (for UUID generation)

### Step 3: Run Migrations

**Option A: Via Supabase CLI** (Recommended)

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login
supabase login

# Link to production project
supabase link --project-ref YOUR_PROD_PROJECT_REF

# Push all migrations
supabase db push

# Verify migrations applied
supabase db diff
```


**Option B: Via Dashboard** (Manual)

1. Go to **SQL Editor** in Supabase dashboard
2. Click **"New Query"**
3. For each migration file (in order):
   - Copy entire file content
   - Paste into SQL editor
   - Click **"Run"**
   - Verify no errors
4. Repeat for all 9 migrations

### Step 4: Verify Database Setup

Run these verification queries in SQL Editor:

```sql
-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
-- Should return: users, merchant_profiles, listings, booking_requests,
--                gps_checkins, ratings, notifications, verification_records

-- Check RLS is enabled on all tables
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
-- All should have rowsecurity = true

-- Check indexes exist
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public';

-- Check functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public';
-- Should include: record_gps_checkin, calculate_commission_for_booking, etc.
```

### Step 5: Configure Storage Buckets

1. Go to **Storage** section
2. Verify buckets created by migration:
   - `profile-photos` (public read, auth write)
   - `id-verification` (admin-only read, auth upload)
3. Set retention policies:
   - `id-verification`: 90-day auto-deletion

### Step 6: Set up Database Backups

1. Go to **Database** > **Backups**
2. Pro plan includes daily automatic backups
3. Enable Point-in-Time Recovery (PITR) for critical data protection
4. Test restore procedure in staging environment


---

## Vercel Deployment

### Step 1: Connect Repository

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your Git repository (GitHub/GitLab/Bitbucket)
3. Select `my-place` directory as root
4. Choose **Next.js** framework (auto-detected)

### Step 2: Configure Build Settings

```
Build Command: npm run build
Output Directory: .next
Install Command: npm install
Development Command: npm run dev
```

### Step 3: Set Environment Variables

In Vercel dashboard, go to **Settings** > **Environment Variables**

**Add all variables from production `.env.production`:**

| Variable | Value | Environment |
|----------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | Production |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJxxx...` | Production |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJxxx...` | Production |
| `NEXT_PUBLIC_APP_URL` | `https://yourdomain.com` | Production |
| `NODE_ENV` | `production` | Production |
| `COMMISSION_RATE_DEFAULT` | `0.07` | Production |
| ... | ... | ... |

**Important**: Add separate variables for Preview and Development environments.

### Step 4: Configure Custom Domain

1. Go to **Settings** > **Domains**
2. Add your custom domain (e.g., `myplace.ng`)
3. Configure DNS records:
   ```
   Type: A
   Name: @
   Value: 76.76.19.19 (Vercel IP)
   
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```
4. Wait for DNS propagation (5-60 minutes)
5. Vercel auto-provisions SSL certificate


### Step 5: Deploy

1. Click **"Deploy"** button
2. Wait for build to complete (3-5 minutes)
3. Vercel provides deployment URL

### Step 6: Verify Deployment

- [ ] Visit deployment URL - homepage loads
- [ ] Check browser console - no errors
- [ ] Test signup flow - OTP sent
- [ ] Test login - redirects correctly
- [ ] Check mobile responsiveness
- [ ] Verify HTTPS enforced (no HTTP access)

---

## Third-Party Service Configuration

### Smile Identity (ID Verification)

**Production Setup:**

1. Log in to [Smile Identity Portal](https://portal.usesmileid.com/)
2. Switch from Sandbox to **Production** mode
3. Create new production API keys
4. Configure webhook:
   - **URL**: `https://yourdomain.com/api/webhooks/smile-id`
   - **Events**: `job.complete`, `job.failed`
   - **Secret**: Save for webhook signature verification
5. Update Vercel environment variables with production keys
6. Test with real Nigerian ID (BVN, NIN, Driver's License)

**Webhook Verification:**
```typescript
// Ensure this code exists in app/api/webhooks/smile-id/route.ts
import crypto from 'crypto'

export async function POST(request: Request) {
  const signature = request.headers.get('x-smile-signature')
  const payload = await request.text()
  
  const expectedSignature = crypto
    .createHmac('sha256', process.env.SMILE_ID_WEBHOOK_SECRET!)
    .update(payload)
    .digest('hex')
  
  if (signature !== expectedSignature) {
    return new Response('Invalid signature', { status: 401 })
  }
  
  // Process webhook...
}
```


### Google Maps Platform

**Production Setup:**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project: `my-place-production`
3. Enable APIs:
   - Maps JavaScript API
   - Geocoding API
   - Geolocation API
4. Create API key (Credentials > Create Credentials)
5. **CRITICAL**: Restrict API key:
   - **Application restrictions**: HTTP referrers
   - **Website restrictions**: Add `yourdomain.com/*` and `*.yourdomain.com/*`
   - **API restrictions**: Restrict to enabled APIs only
6. Set up billing (required for production use)
7. Add key to Vercel environment variables

**Monitoring:**
- Enable billing alerts ($100 threshold recommended)
- Monitor quota usage in Cloud Console

### Termii (SMS/OTP)

**Production Setup:**

1. Log in to [Termii Dashboard](https://accounts.termii.com/)
2. Register sender ID: `MyPlace` (approval takes 1-2 business days)
3. Fund account (recommended: ₦10,000 initial for ~1,000 SMS)
4. Copy production API key
5. Add to Vercel environment variables
6. Test with Nigerian phone number:
   ```bash
   curl -X POST https://api.ng.termii.com/api/sms/send \
     -H "Content-Type: application/json" \
     -d '{
       "to": "+2348012345678",
       "from": "MyPlace",
       "sms": "Test message",
       "type": "plain",
       "channel": "generic",
       "api_key": "YOUR_API_KEY"
     }'
   ```

**Cost Monitoring:**
- Nigerian SMS: ₦10-15 per message
- International SMS: ₦50-100 per message
- Set up low balance alerts in Termii dashboard


### Resend (Email)

**Production Setup:**

1. Log in to [Resend](https://resend.com/)
2. Verify your domain:
   - Go to **Domains** > **Add Domain**
   - Add DNS records (SPF, DKIM, DMARC)
   - Wait for verification (5-60 minutes)
3. Create API key (production scope)
4. Add to Vercel environment variables
5. Test email sending:
   ```bash
   curl -X POST https://api.resend.com/emails \
     -H "Authorization: Bearer YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "from": "noreply@yourdomain.com",
       "to": "test@example.com",
       "subject": "Test Email",
       "html": "<p>Production email test</p>"
     }'
   ```

**Monitoring:**
- Free tier: 3,000 emails/month
- Pro tier: Starting at $20/month for 50,000 emails
- Monitor deliverability in Resend dashboard

---

## Post-Deployment Verification

### Critical User Flows (Manual Testing)

**Flow 1: Client Signup & Booking**
1. [ ] Visit homepage
2. [ ] Click "Sign Up"
3. [ ] Enter Nigerian phone number (+234)
4. [ ] Receive OTP via SMS
5. [ ] Complete profile
6. [ ] Upload ID for verification
7. [ ] Wait for verification (webhook received)
8. [ ] Search for merchants
9. [ ] View merchant profile
10. [ ] Create booking request
11. [ ] Receive booking confirmation

**Flow 2: Merchant Onboarding**
1. [ ] Sign up as merchant
2. [ ] Complete profile with category, pricing
3. [ ] Upload ID verification
4. [ ] Create first listing
5. [ ] Listing appears in search results


**Flow 3: Booking Lifecycle (Phase 4)**
1. [ ] Merchant receives booking request
2. [ ] Merchant accepts booking
3. [ ] Client address revealed to merchant
4. [ ] Merchant performs GPS check-in (service_start)
5. [ ] Booking status updates to `in_progress`
6. [ ] Merchant performs GPS check-out (service_complete)
7. [ ] Booking status updates to `completed`
8. [ ] Both parties can submit ratings
9. [ ] Commission calculated and recorded
10. [ ] Ratings aggregate to merchant profile

**Flow 4: Admin Functions**
1. [ ] Admin can log in at `/admin`
2. [ ] Dashboard shows booking stats
3. [ ] Can view verification records
4. [ ] Can monitor GPS check-ins
5. [ ] Launch readiness checklist accessible

### Automated Health Checks

Create these endpoints for monitoring:

**`/api/health` - Basic health check**
```typescript
export async function GET() {
  return Response.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  })
}
```

**`/api/health/db` - Database connectivity**
```typescript
export async function GET() {
  const supabase = createClient()
  const { error } = await supabase.from('users').select('count').single()
  
  return Response.json({
    database: error ? 'down' : 'up',
    timestamp: new Date().toISOString()
  })
}
```

**Set up uptime monitoring:**
- [UptimeRobot](https://uptimerobot.com/) (free tier available)
- Check `/api/health` every 5 minutes
- Alert via email/SMS if down


---

## Monitoring & Error Tracking

### Sentry Setup (Error Monitoring)

**Step 1: Create Sentry Project**

1. Sign up at [sentry.io](https://sentry.io/)
2. Create new project: **Next.js**
3. Copy DSN (Data Source Name)

**Step 2: Install Sentry**

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

**Step 3: Configure Sentry**

Add to `.env.production`:
```bash
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=my-place
SENTRY_AUTH_TOKEN=your-auth-token
```

**Step 4: Add to Vercel**
- Add all Sentry environment variables to Vercel
- Sentry will automatically capture errors in production

**Step 5: Test Error Tracking**
```typescript
// Trigger test error
throw new Error('Sentry production test')
```

**Alerts to Configure:**
- Critical errors (500s, database errors)
- Authentication failures spike
- Payment errors
- High error rate (>1% of requests)

### Vercel Analytics

**Enable in Vercel Dashboard:**
1. Go to project **Settings** > **Analytics**
2. Enable **Web Analytics** (tracks page views, performance)
3. Enable **Speed Insights** (Core Web Vitals monitoring)


### Supabase Monitoring

**Database Performance:**
1. Go to **Reports** > **Database**
2. Monitor:
   - Query performance (slow queries)
   - Connection pool usage
   - Disk usage
   - Index usage

**API Usage:**
1. Go to **Reports** > **API**
2. Monitor:
   - Requests per second
   - Response times
   - Error rates
   - Authentication success/failure

**Set up alerts:**
- Database CPU > 80%
- Storage > 80% capacity
- API error rate > 5%

### Custom Monitoring Dashboard

Create monitoring page at `/admin/monitoring`:

**Key Metrics to Track:**
- Active users (daily, weekly, monthly)
- Booking conversions (requests → completed)
- Average booking value
- Commission revenue
- GPS check-in completion rate
- Rating submission rate
- ID verification success rate
- API response times

---

## Rollback Procedures

### If Deployment Fails

**Step 1: Instant Rollback (Vercel)**
1. Go to Vercel dashboard > **Deployments**
2. Find last working deployment
3. Click **three dots** > **Promote to Production**
4. Takes effect immediately (~30 seconds)

**Step 2: Database Rollback (If Needed)**

If migration caused issues:
```bash
# Connect to production database
supabase db remote commit --project-ref YOUR_PROD_REF

# Rollback last migration
supabase db reset --version 20260810000008

# Or manually rollback via SQL
-- See migration file comments for rollback SQL
```


**Step 3: Clear CDN Cache**
```bash
# Vercel automatically purges cache on new deployment
# Manual purge if needed:
vercel --prod --force
```

**Step 4: Notify Users**
- Update status page (if available)
- Send notice to active users
- Provide ETA for fix

### Emergency Contacts

**Critical Issues:**
- Technical Lead: [phone/email]
- DevOps: [phone/email]
- Supabase Support: support@supabase.io
- Vercel Support: support@vercel.com

---

## First-Run Admin Setup

### Create First Admin User

**Option 1: Via Database (Recommended)**

```sql
-- Connect to production database
-- Update existing user to admin role
UPDATE users 
SET role = 'admin' 
WHERE email = 'admin@yourdomain.com';

-- Or via auth_user_id
UPDATE users 
SET role = 'admin' 
WHERE auth_user_id = 'xxx-xxx-xxx';
```

**Option 2: Via Admin Script**

Create `scripts/create-admin.ts`:
```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function createAdmin(email: string) {
  const { data, error } = await supabase
    .from('users')
    .update({ role: 'admin' })
    .eq('email', email)
    .select()
    .single()
  
  console.log('Admin created:', data)
}

createAdmin('admin@yourdomain.com')
```

Run: `npx tsx scripts/create-admin.ts`


### Deploy Seed Data

**Initial Merchants** (15-20 recommended before public launch):

1. Create seed data file:
   ```bash
   node scripts/seed-merchants.js
   ```

2. Or manually via admin dashboard:
   - Go to `/admin/seed-data`
   - Click "Deploy Seed Merchants"
   - Verify 40+ Nigerian testimonials imported

3. Verify seed merchants:
   ```sql
   SELECT COUNT(*) FROM users WHERE role = 'merchant';
   SELECT COUNT(*) FROM merchant_profiles WHERE status = 'active';
   SELECT COUNT(*) FROM listings WHERE active = true;
   ```

### Run Launch Readiness Check

1. Navigate to `/admin/launch-readiness`
2. Click **"Run Automated Checks"**
3. Verify all required checks pass:
   - [ ] RLS policies active
   - [ ] HTTPS enforced
   - [ ] Production environment
   - [ ] Seed merchants deployed
   - [ ] Database indexes created
   - [ ] ID verification working
4. Review recommendations
5. Download launch report
6. Share with stakeholders

### Configure Admin Notifications

Set up admin email alerts for:
- New merchant verification submissions
- Booking disputes
- Security incidents
- High error rates
- Daily metrics summary


---

## Post-Launch Monitoring (First 48 Hours)

### Hour 1-4: Critical Monitoring
- [ ] Check error rates every 15 minutes
- [ ] Monitor authentication success rate
- [ ] Verify OTP delivery working
- [ ] Check database connection pool
- [ ] Monitor API response times
- [ ] Test from multiple devices/locations

### Hour 4-24: Active Monitoring
- [ ] Check every 2 hours
- [ ] Monitor user signups
- [ ] Track booking requests
- [ ] Review Sentry errors
- [ ] Check support channels
- [ ] Verify GPS check-ins working

### Day 2: Stabilization
- [ ] Review 24-hour metrics
- [ ] Identify bottlenecks
- [ ] Fix critical bugs
- [ ] Optimize slow queries
- [ ] Update monitoring thresholds

### Week 1: Optimization
- [ ] Daily metrics review
- [ ] User feedback analysis
- [ ] Performance tuning
- [ ] Documentation updates
- [ ] Team retrospective

---

## Security Hardening (Production-Specific)

### SSL/TLS Configuration
- [ ] Vercel auto-provisions SSL (Let's Encrypt)
- [ ] Force HTTPS (automatic with Vercel)
- [ ] HSTS header enabled (see `next.config.ts`)
- [ ] No mixed content warnings

### API Rate Limiting

Configure in `middleware.ts`:
```typescript
// Example rate limiting config
const rateLimits = {
  '/api/auth/otp': { requests: 3, window: 3600 },  // 3 per hour
  '/api/bookings': { requests: 100, window: 3600 }, // 100 per hour
  '/api/': { requests: 1000, window: 3600 }         // Default
}
```


### NDPR Compliance Final Checks

- [ ] Privacy Policy accessible at `/privacy`
- [ ] Terms of Service accessible at `/terms`
- [ ] Cookie consent banner functional
- [ ] Data export endpoint working (`/api/user/export`)
- [ ] Account deletion working (`/settings/delete-account`)
- [ ] ID document retention (90 days) configured
- [ ] User consent tracked in database

### Penetration Testing (Optional but Recommended)

Consider hiring security firm for:
- SQL injection testing
- XSS vulnerability scanning
- Authentication bypass attempts
- Authorization testing (RLS verification)
- API endpoint fuzzing

---

## Deployment Checklist Summary

### Pre-Deployment
- [x] Code complete and tested
- [x] Database migrations verified
- [x] Environment variables documented
- [x] Security audit passed
- [x] Dependencies up to date

### Deployment
- [ ] Production Supabase project created
- [ ] Migrations applied to production database
- [ ] Environment variables set in Vercel
- [ ] Custom domain configured
- [ ] SSL certificate active
- [ ] Application deployed

### Configuration
- [ ] Smile ID production keys
- [ ] Google Maps with domain restrictions
- [ ] Termii SMS funded and configured
- [ ] Resend email domain verified

### Verification
- [ ] All critical user flows tested
- [ ] Health checks passing
- [ ] Error monitoring active
- [ ] Uptime monitoring configured
- [ ] Admin dashboard accessible

### Post-Launch
- [ ] First admin user created
- [ ] Seed merchants deployed
- [ ] Launch readiness checklist complete
- [ ] Monitoring dashboards reviewed
- [ ] Support channels active


---

## Troubleshooting Common Deployment Issues

### Build Failures

**Error: TypeScript compilation failed**
```bash
# Locally test production build
npm run build

# Check for type errors
npx tsc --noEmit

# Generate fresh database types
npm run db:types
```

**Error: Module not found**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Runtime Errors

**Error: Unable to connect to Supabase**
- Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
- Check Supabase project not paused
- Confirm anon key matches project

**Error: OTP not sending**
- Check Termii API key valid
- Verify sender ID approved
- Confirm account funded
- Check phone number format (+234...)

**Error: ID verification failing**
- Switch Smile ID to production mode
- Verify webhook URL accessible
- Check webhook signature validation
- Test with real Nigerian ID

### Performance Issues

**Slow API responses**
- Check database query performance (Supabase Reports)
- Add missing indexes
- Review N+1 query patterns
- Enable caching where appropriate

**High memory usage**
- Check for memory leaks in Server Actions
- Review image upload sizes
- Optimize large data fetches


---

## Additional Resources

### Documentation Links
- [Supabase Production Checklist](https://supabase.com/docs/guides/platform/going-into-prod)
- [Vercel Deployment Guide](https://vercel.com/docs/deployments/overview)
- [Next.js Production Checklist](https://nextjs.org/docs/deployment/production-checklist)
- [NDPR Guidelines](https://nitda.gov.ng/ndpr/)

### Support Contacts
- **Supabase Support**: https://supabase.com/support
- **Vercel Support**: support@vercel.com
- **Smile ID Support**: support@usesmileid.com
- **Termii Support**: support@termii.com

### Internal Documentation
- `/docs/SECURITY.md` - Security implementation details
- `/docs/LAUNCH_READINESS.md` - Launch readiness checklist
- `/docs/ADMIN_GUIDE.md` - Admin dashboard usage (if created)
- `SETUP_GUIDE.md` - Development environment setup

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-08-10 | Initial production deployment guide | My Place Team |

---

**Next Steps After Deployment:**
1. Monitor for first 48 hours continuously
2. Gather user feedback from early adopters
3. Iterate based on real usage patterns
4. Scale infrastructure as needed
5. Plan Phase 6 features based on traction

**Good luck with your launch! 🚀**
