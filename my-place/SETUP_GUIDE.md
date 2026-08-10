# Setup Guide - My Place Marketplace

This guide walks through setting up the development environment from scratch.

## Prerequisites

- Node.js 18+ installed
- Git installed
- Code editor (VS Code recommended)

## Phase 0 Setup Checklist

### 1. Install Dependencies

```bash
cd my-place
npm install
```

This installs all packages defined in `package.json`:
- Next.js 15
- React 19
- Supabase client libraries
- Tailwind CSS
- TypeScript

**Expected output:** `node_modules` folder created, no errors.

---

### 2. Set Up Supabase Project

#### 2.1 Create Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Choose organization (or create one)
4. Fill in:
   - **Name**: `my-place` (or your preference)
   - **Database Password**: Save this securely
   - **Region**: Choose closest to Nigeria (e.g., Frankfurt, London)
5. Wait 2-3 minutes for project provisioning

#### 2.2 Get API Credentials

1. Go to **Settings** > **API**
2. Copy:
   - **Project URL** (`https://xxxxx.supabase.co`)
   - **anon/public key** (under "Project API keys")
   - **service_role key** (under "Project API keys" - keep this secret!)

#### 2.3 Enable PostGIS Extension

1. Go to **Database** > **Extensions**
2. Search for `postgis`
3. Click "Enable" (required for geo coordinates)

#### 2.4 Run Migrations

**Option A: Via Supabase Dashboard (Easiest for Phase 0)**

1. Go to **SQL Editor**
2. Click "New Query"
3. Copy the entire contents of `supabase/migrations/20260810000001_initial_schema.sql`
4. Paste and click "Run"
5. Verify: Go to **Table Editor** - you should see tables: users, merchant_profiles, listings, bookings, ratings, verification_records

**Option B: Via Supabase CLI (Recommended for later phases)**

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link your project
supabase link --project-ref YOUR_PROJECT_REF

# Push migrations
supabase db push
```

---

### 3. Set Up Environment Variables

```bash
# Copy the template
cp .env.example .env.local

# Edit .env.local with your actual values
```

**Required for Phase 0/1 (Minimum Viable Setup):**

```bash
# Supabase (from Step 2.2)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_PROJECT_ID=xxxxx

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Commission rate
COMMISSION_RATE_DEFAULT=0.07
```

**Can be added later (Phase 1 auth onwards):**
- Smile Identity credentials
- Google Maps API key
- Termii API key
- Resend API key

---

### 4. Generate TypeScript Types

Once migrations are run and `.env.local` is configured:

```bash
npm run db:types
```

This generates `lib/supabase/database.types.ts` with your schema types.

**Troubleshooting:**
- If command fails, ensure `SUPABASE_PROJECT_ID` is set in `.env.local`
- If types look empty, verify migrations ran successfully in Supabase dashboard

---

### 5. Start Development Server

```bash
npm run dev
```

**Expected output:**
```
▲ Next.js 15.x.x
- Local:        http://localhost:3000
- Turbopack:    enabled

✓ Compiled in Xms
```

Open [http://localhost:3000](http://localhost:3000) - you should see:

```
My Place
Connect with skilled local artisans across Nigeria
Phase 0 scaffold complete - Phase 1 auth coming next
```

---

## Third-Party Service Setup (Defer to Phase 1)

These can be set up when needed for Phase 1 implementation:

### Smile Identity (ID Verification)

1. Sign up: [usesmileid.com](https://usesmileid.com)
2. Create app, get Partner ID and API Key
3. Start with **Sandbox** environment
4. Set up webhook endpoint (use ngrok for local dev):
   ```bash
   # Install ngrok
   npm install -g ngrok
   
   # Start tunnel
   ngrok http 3000
   
   # Copy forwarding URL (e.g., https://abc123.ngrok.io)
   # Add to .env.local:
   SMILE_ID_CALLBACK_URL=https://abc123.ngrok.io/api/webhooks/smile-id
   ```

### Google Maps

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create project
3. Enable APIs:
   - Maps JavaScript API
   - Geocoding API
   - Geolocation API
4. Create API key (Credentials > Create Credentials > API Key)
5. **Important**: Restrict key by HTTP referrer (localhost:3000 for dev)

### Termii (SMS/OTP)

1. Sign up: [termii.com](https://termii.com)
2. Get API key from dashboard
3. Register sender ID (e.g., "MyPlace") - requires approval, may take 1-2 business days
4. Fund account (minimum ₦1,000 recommended for testing)

### Resend (Email - Optional)

1. Sign up: [resend.com](https://resend.com)
2. Get API key
3. Verify your domain (or use resend.dev for testing)

---

## Verify Phase 0 Complete

**Checklist:**

- [x] Dependencies installed (`node_modules` exists)
- [x] Supabase project created
- [x] PostGIS extension enabled
- [x] Database migrations run (6 tables created)
- [x] `.env.local` configured with Supabase credentials
- [x] TypeScript types generated (`lib/supabase/database.types.ts`)
- [x] Dev server runs without errors
- [x] Landing page loads at localhost:3000

**If all checked**, Phase 0 is complete. Ready for Phase 1: Core Data & Auth.

---

## Troubleshooting

### "Module not found" errors

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Supabase connection errors

- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct
- Check Supabase project is not paused (free tier pauses after 1 week inactivity)
- Ensure no trailing slashes in `NEXT_PUBLIC_SUPABASE_URL`

### PostGIS errors in migrations

- Go to Supabase Dashboard > Database > Extensions
- Search "postgis" and enable it
- Re-run migration

### TypeScript errors after type generation

- Restart your editor/TypeScript server
- Run `npm run lint` to check for issues

---

## Next Steps

Once Phase 0 is verified complete:

1. Review `TECH_STACK.md` for architecture decisions
2. Review `TRD.md` for data model understanding
3. Proceed to **Phase 1: Core Data & Auth**
   - Implement phone OTP auth
   - Build signup/login flows
   - Integrate ID verification gate
   - Add role-based routing

See `Workflow.md` for full phase breakdown.
