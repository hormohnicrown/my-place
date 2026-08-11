# My Place

A two-sided marketplace connecting Nigerian artisans (tailoring, carpentry, welding, plumbing) with local clients. Clients search for verified tradespeople by category and distance, view profiles and service listings, and send booking requests with full address privacy protection. Artisans manage profiles, publish listings, accept/decline bookings, perform GPS check-ins, and manage service fees.

🔗 **Live Demo**: [https://my-place-steel.vercel.app](https://my-place-steel.vercel.app)  
📦 **GitHub Repository**: [https://github.com/hormohnicrown/my-place](https://github.com/hormohnicrown/my-place)

---

## Key Features

- **Address Privacy Protection (TRD §4)**: Client street addresses are hidden during discovery and revealed to artisans only after booking acceptance.
- **Location-Based Artisan Search**: Uses Supabase PostGIS spatial queries (`calculate_distance_coords`) to calculate distance in kilometers.
- **Simplified Demo Auth**: Email/password authentication with auto-assigned `id_verified` status so users bypass third-party ID verification while respecting Row-Level Security (RLS).
- **GPS Service Check-in System**: Artisans record location check-ins and check-outs for active service bookings.
- **Two-Way Mutual Rating System**: Clients and artisans rate each other after service completion.
- **Off-Platform Testimonial Import**: Artisans display verified external testimonials (WhatsApp/Instagram) with visual badges.

---

## Build Status

- **Type Safety**: 100% clean. `npx tsc --noEmit` passes with **0 errors**.
- **Production Build**: Verified. `npm run build` succeeds cleanly.
- **Backend**: Supabase (PostgreSQL + PostGIS, Auth, Storage, Row Level Security).
- **Database Migrations**: Tested and verified in a single transaction via `ALL_MIGRATIONS.sql`.

---

## Tech Stack

- **Framework**: Next.js 15 (App Router) & React 19
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS 3 with shadcn/ui (Radix UI primitives)
- **Database & Auth**: Supabase (PostgreSQL, PostGIS, Auth, Storage, RLS)
- **Location**: Web Geolocation API & PostGIS Distance RPCs

---

## Prerequisites

- Node.js 18+
- A Supabase Project ([supabase.com](https://supabase.com))
- Vercel Account for deployment ([vercel.com](https://vercel.com))

---

## Setup & Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   Fill in the required variables:
   | Variable | Description | Where to Find |
   |---|---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL | Supabase Dashboard → Project Settings → API |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon Key | Supabase Dashboard → Project Settings → API |
   | `NEXT_PUBLIC_APP_URL` | Application Base URL | `http://localhost:3000` (Local) or Vercel URL (Prod) |

3. **Set up Database & Extensions** (See [Database Setup](#database-setup) below).

4. **Start the development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

---

## Database Setup

### Step 1: Enable Extensions & Auth Settings in Supabase
1. **Enable PostGIS**: Go to **Database** → **Extensions**, search for `postgis`, and toggle it **ON**.
2. **Disable Email Confirmation** (for instant demo signup): Go to **Authentication** → **Providers** → **Email**, disable **Confirm email**, and click **Save**.
3. **Storage Bucket**: Go to **Storage** → **Create Bucket**, name it `profile-photos`, and set it to **Public**.

### Step 2: Run Migrations

#### Option A: Single-File Transaction (Recommended)
1. Open [`ALL_MIGRATIONS.sql`](ALL_MIGRATIONS.sql) from the project root.
2. In Supabase Dashboard, go to **SQL Editor** → **New Query**.
3. Paste the contents of `ALL_MIGRATIONS.sql` and click **Run**.

#### Option B: Individual Migration Files
Alternatively, execute each file in `supabase/migrations/` in numerical order (`0001` through `0009`) in the SQL Editor.

---

## Vercel Deployment

1. **Import Repository**: Connect `hormohnicrown/my-place` on Vercel.
2. **Root Directory**: Set to `.` (blank / repo root). *Do NOT pre-fill `my-place/` as the repo root has been flattened.*
3. **Environment Variables**: Add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `NEXT_PUBLIC_APP_URL`.
4. **Deploy**: Trigger deployment.

---

## Project Structure

```
├── app/
│   ├── (admin)/        Admin platform management, disputes, and seed tools
│   ├── (auth)/         Email/password authentication and profile onboarding
│   ├── (client)/       Artisan discovery, service search, and client bookings
│   ├── (merchant)/     Artisan profile, listings, bookings, and GPS tracking
│   ├── accessibility/  Accessibility compliance statement
│   ├── layout.tsx      Root layout with navigation shell
│   └── page.tsx        Public landing page
├── components/         Shared UI, shadcn components, and feature widgets
├── lib/
│   ├── admin/          Admin statistics and dispute handlers
│   ├── auth/           Supabase auth & profile actions
│   ├── client/         Artisan search & client booking RPCs
│   ├── gps/            GPS check-in/check-out tracking
│   ├── launch/         Launch-readiness checklist audit
│   ├── merchant/       Artisan profile & listing server actions
│   ├── ratings/        Two-way rating system
│   └── security/       RLS security audit and policy validators
├── supabase/
│   └── migrations/     Granular SQL migrations (0001-0009)
├── ALL_MIGRATIONS.sql  Single-file single-transaction SQL bundle
├── doc/                PRD, TRD, and Workflow documentation
└── public/             Static assets
```

---

## Available Scripts

- `npm run dev` - Starts Next.js development server
- `npm run build` - Builds production bundle
- `npm run start` - Runs production server
- `npm run lint` - Runs ESLint code checks
- `npm run typecheck` - Validates TypeScript types (`tsc --noEmit`)
- `npm run db:types` - Generates Supabase TypeScript definitions

---

## Documentation

- [Product Requirements Document (PRD)](doc/PRD.md)
- [Technical Requirements Document (TRD)](doc/TRD.md)
- [Workflow & Build Log](doc/Workflow.md)

---

## License

Private / Demo Project. All rights reserved.
