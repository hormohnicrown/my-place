# My Place

A two-sided marketplace that connects local artisans with clients across Nigeria. Clients search for verified tradespeople by category and distance, view profiles and listings, and send booking requests. Artisans manage a profile, publish service listings, and accept or decline requests. The launch categories are tailoring, carpentry, welding, and plumbing.

## Build status

This is a demo build. The following is true of the code in this repository:

- Sign-in and sign-up use email and password only. ID verification is disabled so accounts are usable immediately after signup.
- The client and merchant flows work end to end against a Supabase backend: signup, onboarding, search, listings, and booking requests.
- The admin section renders but uses a basic role check and some placeholder figures. It is not part of the client or merchant path.
- Production build passes (`npm run build`). ESLint and TypeScript checks are not enforced during the build because of pre-existing issues in library and admin code. Run them manually with `npm run lint` and `npm run typecheck`.

## Tech stack

- Next.js 15 (App Router) and React 19
- TypeScript
- Tailwind CSS 3 with shadcn/ui (Radix) components
- Supabase for PostgreSQL, authentication, row level security, file storage, and PostGIS distance queries
- Browser Geolocation API for client and merchant location

## Prerequisites

- Node.js 18 or newer
- A Supabase project (create one at [supabase.com](https://supabase.com))

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env.local` from the template and fill in your Supabase values:

   ```bash
   cp .env.example .env.local
   ```

   The demo needs three variables to run:

   | Variable | Where to find it |
   |----------|------------------|
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase dashboard, Project Settings, API |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase dashboard, Project Settings, API |
   | `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` for local development |

3. Set up the database (see [Database](#database) below).

4. Start the development server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Database

The SQL migrations live in `supabase/migrations/`. Apply them to a Supabase project in one of two ways.

### Option A: Supabase CLI

```bash
npm install -g supabase
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

Find `YOUR_PROJECT_REF` in your dashboard URL: `https://supabase.com/dashboard/project/YOUR_PROJECT_REF`.

### Option B: SQL editor

Open each file in `supabase/migrations/` in numeric order and run its contents in the Supabase SQL editor.

### PostGIS

Distance search needs the PostGIS extension. In the Supabase dashboard go to Database, then Extensions, and enable `postgis` before running the migrations.

### Generated types (optional)

The app runs without generated database types. To add them later, set `SUPABASE_PROJECT_ID` in your environment and run:

```bash
npm run db:types
```

This writes `lib/supabase/database.types.ts`. Once that file exists you can wire the typed client back into `lib/supabase/server.ts` and `lib/supabase/client.ts`.

## Auth note for the demo

The app uses Supabase email and password auth. For signup to log a user in right away, turn off email confirmation in your Supabase project: Authentication, then Providers, then Email, and disable "Confirm email". With confirmation on, new users must click a link in their email before they can sign in.

## Project structure

```
├── app/
│   ├── (auth)/         Login and onboarding
│   ├── (client)/       Client search, listings, bookings
│   ├── (merchant)/     Merchant profile, listings, bookings, commission
│   ├── (admin)/        Admin dashboard and tools
│   ├── accessibility/  Accessibility statement page
│   ├── layout.tsx      Root layout, header, footer
│   └── page.tsx        Landing page
├── components/         UI and feature components
│   └── ui/             shadcn/ui primitives
├── lib/
│   ├── auth/           Sign-in, sign-up, session helpers
│   ├── client/         Merchant search and booking actions
│   ├── merchant/       Merchant profile and listing actions
│   ├── commission/     Commission calculation and formatting
│   ├── ratings/        Two-way rating actions and formatting
│   ├── gps/            Check-in and check-out actions
│   ├── accessibility/  Accessibility audit helpers
│   ├── admin/          Admin data actions
│   ├── launch/         Launch-readiness checklist actions
│   ├── security/       RLS validation and security audit helpers
│   ├── seed-data/      Testimonial seeding for demos
│   ├── supabase/       Browser and server Supabase clients
│   └── utils.ts        Shared helpers
├── supabase/
│   └── migrations/     Database schema and policies
├── doc/                PRD, TRD, and Workflow documents
└── public/             Static assets
```

## Scripts

- `npm run dev` starts the development server
- `npm run build` creates a production build
- `npm run start` serves the production build
- `npm run lint` runs ESLint
- `npm run typecheck` runs the TypeScript compiler with no output
- `npm run db:types` generates Supabase types (needs `SUPABASE_PROJECT_ID`)

## How it works

The middleware in `lib/supabase/middleware.ts` reads the Supabase session on each request. A signed-in user without a profile goes to onboarding. After onboarding, clients land on `/client` and merchants on `/merchant`. Signed-out users can reach the landing page and login.

Clients search on `/client/search`, which reads their browser location and orders results by distance using PostGIS. A client opens a merchant or listing and sends a booking request from `/client/booking/new`. Merchants see incoming requests under `/merchant/bookings` and respond there.

## Documentation

- [PRD](doc/PRD.md) product requirements
- [TRD](doc/TRD.md) technical requirements
- [Workflow](doc/Workflow.md) build sequence

## License

Private. All rights reserved.
