# Database Migrations

This directory contains SQL migration files for the My Place Supabase database.

## Setup Instructions

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note your project URL and anon key
4. Add them to your `.env.local` file

### 2. Install Supabase CLI

```bash
# macOS/Linux
brew install supabase/tap/supabase

# Windows (via Scoop)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Or via npm (cross-platform)
npm install -g supabase
```

### 3. Link Your Project

```bash
# From the my-place directory
supabase link --project-ref YOUR_PROJECT_REF

# Find YOUR_PROJECT_REF in your Supabase dashboard URL:
# https://supabase.com/dashboard/project/YOUR_PROJECT_REF
```

### 4. Run Migrations

```bash
# Apply all migrations to your remote database
supabase db push

# Or apply manually via SQL Editor in Supabase dashboard:
# Copy the contents of 20260810000001_initial_schema.sql
# Paste into SQL Editor and run
```

### 5. Generate TypeScript Types

After running migrations, generate types:

```bash
npm run db:types
```

This will create/update `lib/supabase/database.types.ts` with your schema.

## Migration Files

| File | Description | Phase |
|------|-------------|-------|
| `20260810000001_initial_schema.sql` | Initial database schema: users, merchant_profiles, listings, bookings, ratings, verification_records | Phase 0 |

## Schema Overview

### Tables Created

1. **users** - Base user table (client + merchant)
   - Auth integration (Supabase Auth)
   - Verification status (hard gate)
   - Geo coordinates (nationwide support)

2. **verification_records** - ID verification audit trail
   - Smile Identity integration
   - Provider job IDs and results

3. **merchant_profiles** - Extended merchant data
   - Service category (tailoring, carpentry, welding, plumbing)
   - Price range, service area radius
   - Rating aggregates
   - Off-platform testimonials (JSONB)

4. **listings** - Service listings by merchants
   - Title, description, price
   - Active/inactive status

5. **bookings** - Booking lifecycle
   - Status state machine
   - GPS check-in/check-out (immutable audit trail)
   - Commission calculation (generated column)
   - Off-platform payment tracking

6. **ratings** - Two-way ratings
   - Client → Merchant
   - Merchant → Client
   - Auto-updates merchant rating aggregates

### Key Design Decisions

**Nationwide Support:**
- `users.city` is free-text (no enum)
- `users.geo_coordinates` uses PostGIS for distance queries
- No single-city hardcoding anywhere

**Trust & Safety (Non-Negotiable):**
- `users.verification_status` blocks access until `id_verified`
- `bookings.checkin_geo` + `checkout_geo` are immutable GPS captures
- `merchant_profiles.imported_testimonials` stores source metadata for UI distinction
- Two-way ratings enforced via unique constraint

**Commission Model:**
- `bookings.commission_rate_applied` defaults to 7% (6-8% range midpoint)
- `bookings.commission_amount` is a generated column (auto-calculated)
- Rate can vary per booking if needed later

**NDPR Compliance:**
- `users.id_document_ref` stores pointer, not raw image
- Raw ID images handled by Smile Identity with short retention

## Troubleshooting

### PostGIS Extension Error

If you get an error about PostGIS not being available:

1. Go to Supabase Dashboard > Database > Extensions
2. Enable "postgis" extension
3. Re-run the migration

### RLS Policies

Row Level Security (RLS) is enabled on all tables but uses service role access only for Phase 0. User-level policies will be added in Phase 1 after auth is implemented.

## Next Steps

After running migrations:

1. ✅ Verify tables exist in Supabase Table Editor
2. ✅ Run `npm run db:types` to generate TypeScript types
3. ✅ Proceed to Phase 1: Auth implementation
