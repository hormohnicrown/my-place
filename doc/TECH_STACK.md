# Tech Stack Decision Document
## My Place Marketplace - MVP Build

**Date:** 2026-08-10  
**Status:** Confirmed before Phase 0 scaffolding  
**References:** TRD.md (architecture requirements), PRD.md (product scope)

---

## Stack Summary

| Layer | Technology | Rationale |
|---|---|---|
| **Frontend Framework** | Next.js 14+ (App Router) | React-based, SSR/SSG for SEO, mobile-first responsive, Vercel free-tier deployment |
| **UI Library** | Tailwind CSS + shadcn/ui | Fast styling, accessible components, works well on low-end Android browsers |
| **Backend** | Next.js API Routes (Server Actions where appropriate) | Unified stack, no separate backend service needed for MVP, reduces deployment complexity |
| **Database** | PostgreSQL via Supabase | Relational DB matches TRD data models, free tier includes 500MB storage, built-in auth utilities |
| **Auth Provider** | Supabase Auth | OTP-based phone auth (recommended in TRD for Nigerian market), email fallback, built-in session management |
| **ID Verification** | **Smile Identity** | Active in Nigeria, clear developer docs, server-side SDKs (Node.js), async webhook model, supports government ID + selfie + liveness |
| **Maps/Geo** | Google Maps Platform | Distance filtering, geocoding, GPS check-in/out capture. Free tier: $200/month credit |
| **SMS/OTP** | Termii | Nigerian market standard, active API, OTP delivery. Fallback: Africa's Talking |
| **File Storage** | Supabase Storage | Profile photos + ID documents (short retention per NDPR). Cloudinary as fallback if needed |
| **Email** | Resend (or Supabase Auth emails) | Transactional emails (verification, booking notifications). Resend has 3k/month free tier |
| **Payments (Phase 2)** | Paystack or Flutterwave | Deferred to Phase 2 - not building in v1 |
| **Hosting** | Vercel (frontend/API) + Supabase (DB/storage) | Both free-tier friendly, automatic HTTPS, good DX |

---

## Key Architectural Decisions

### 1. Nationwide from Day One (No City Lock-In)
Per PRD updates, geography is **nationwide Nigeria**. This means:
- `users.city` is a free-text field (or enum of major cities), not hardcoded to one city
- `users.geo_coordinates` (lat/lng) stored for every user
- Search/filter by distance uses geo radius calculations, not city-based filtering
- Data model supports multiple cities without migration

### 2. OTP Phone Auth (Primary)
Nigerian market has lower friction with phone OTP than email passwords. Implementation:
- Supabase Auth with phone provider
- SMS delivery via Termii
- Email auth available as fallback for users without reliable SMS access
- Phone number becomes the primary unique identifier

### 3. ID Verification: Smile Identity
**Chosen over Youverify** because:
- More comprehensive developer documentation (as of research 2026-08-10)
- Clear async webhook model documented
- Server-side SDK available for Node.js
- False rejection rate claimed at 1-1.5% (from their site)
- Supports: Biometric KYC (ID + selfie + liveness), Document Verification, Enhanced KYC

**Integration approach:**
- Use **Biometric KYC** product: ID authority lookup + face match against registered photo
- Async flow: Submit verification → receive `job_id` → webhook delivers result to our callback URL
- Store `verification_status` enum: `unverified | pending | id_verified | failed`
- Retry allowed on `failed` status (user can re-submit)

### 4. Commission Rate: 6-8% (Placeholder)
Current working assumption per founder instruction. Lower than initial 12% to fit artisan profit margins. Not hardcoded - stored in `bookings.commission_rate_applied` so it can vary per booking if needed later.

### 5. Launch Verticals (Confirmed)
- Tailoring
- Carpentry  
- Welding
- Plumbing

Stored as enum in `merchant_profiles.category` and `listings.category`. Extensible in Phase 2.

### 6. Data Privacy & NDPR Compliance
Nigeria Data Protection Regulation (NDPR) considerations:
- ID document images: short retention (delete after verification completes or 30 days max)
- User addresses: only exposed after booking acceptance (approximate area/distance shown pre-booking)
- Biometric data: stored by Smile Identity (verify they're NDPR-compliant in sandbox setup)
- User data export: build admin endpoint for GDPR-style data export (Phase 2)

---

## API Rate Limits & Free Tiers (as of 2026-08-10)

| Service | Free Tier / Pricing Notes |
|---|---|
| Supabase | 500MB DB, 1GB storage, 2GB bandwidth/month - sufficient for MVP, then $25/month Pro |
| Vercel | 100GB bandwidth, unlimited deployments - sufficient for MVP |
| Google Maps | $200/month credit (~28k map loads or 40k geocodes) - monitor usage |
| Termii | Pay-as-you-go SMS (₦2-4/SMS typical) - estimate 500 OTPs for launch = ₦1,000-2,000 |
| Smile Identity | Pricing not public - **must confirm in sandbox setup** (typically per-verification pricing) |
| Resend | 3,000 emails/month free, then $20/month - sufficient for MVP |

**Action before Phase 1:** Set up Smile Identity sandbox account and confirm test/production pricing before integrating.

---

## Folder Structure (Next.js 14 App Router)

```
my-place/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth routes (signup, login, verify)
│   ├── (client)/                 # Client-side routes (search, bookings)
│   ├── (merchant)/               # Merchant-side routes (profile, listings)
│   ├── api/                      # API routes (webhooks, server actions)
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Landing page
├── components/                   # Reusable UI components
│   ├── ui/                       # shadcn/ui components
│   └── ...
├── lib/                          # Utility functions
│   ├── supabase/                 # Supabase client + types
│   ├── smile-id/                 # Smile ID integration
│   ├── maps/                     # Google Maps utilities
│   └── ...
├── supabase/
│   ├── migrations/               # DB migrations (SQL)
│   └── seed.sql                  # Seed data for dev
├── public/                       # Static assets
├── .env.local                    # Environment variables (gitignored)
├── .env.example                  # Template for env vars
└── package.json
```

---

## Environment Variables (to be set up in Phase 0)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=       # Server-side only

# Smile Identity
SMILE_ID_PARTNER_ID=
SMILE_ID_API_KEY=
SMILE_ID_SANDBOX=true             # Toggle for sandbox/production
SMILE_ID_CALLBACK_URL=            # Webhook URL for verification results

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=

# Termii
TERMII_API_KEY=
TERMII_SENDER_ID=                 # Registered sender ID for SMS

# Resend (optional Phase 1, can defer)
RESEND_API_KEY=

# App Config
NEXT_PUBLIC_APP_URL=http://localhost:3000
COMMISSION_RATE_DEFAULT=0.07      # 7% midpoint of 6-8% range
```

---

## Non-Negotiable Requirements Checkpoint

Per agent-prompt.md, these are **hard requirements, not optional polish**:

1. ✅ **ID verification is a hard gate** — no listing creation or booking until `verification_status = 'id_verified'`
2. ✅ **GPS check-in/check-out** — captured immutably on every booking (`bookings.checkin_geo`, `bookings.checkout_geo`)
3. ✅ **Off-platform testimonials distinction** — `merchant_profiles.imported_testimonials[]` each has `source: 'off_platform'`, UI must render with distinct visual label
4. ✅ **Two-way ratings** — both client and merchant rate after `status = 'completed'`
5. ✅ **Nationwide geo support** — no single-city hardcoding, city + coordinates stored

---

## Next Steps (Phase 0 Execution)

1. Initialize Next.js project with TypeScript + Tailwind
2. Set up Supabase project (new org or existing?)
3. Create database schema migrations (all TRD models)
4. Set up `.env.example` with all placeholders above
5. Set up Smile Identity sandbox account (confirm pricing, get test credentials)
6. Install dependencies: `supabase-js`, `@googlemaps/js-api-loader`, etc.

---

## Open Decisions Remaining

| Decision | Status | Notes |
|---|---|---|
| Commission rate | **6-8% placeholder** | Not final per founder instruction - stored in DB as `commission_rate_applied` per booking |
| Community partnership targets | **Not named** | Needs real associations/WhatsApp groups identified (one per city/region) |

**Confirmed decisions:**
- ✅ Launch verticals: Tailoring, Carpentry, Welding, Plumbing
- ✅ Geography: Nationwide Nigeria (no city lock-in)

---

**This document will be referenced throughout Phase 0-5 to ensure no silent stack deviations occur.**
