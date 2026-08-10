# My Place

A two-sided marketplace connecting skilled local artisans with clients across Nigeria.

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS
- **Database**: PostgreSQL via Supabase
- **Auth**: Supabase Auth (Phone OTP + Email)
- **ID Verification**: Smile Identity
- **Maps**: Google Maps Platform
- **SMS/OTP**: Termii

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase project (create at [supabase.com](https://supabase.com))
- Smile Identity account (for ID verification)
- Google Maps API key
- Termii account (for SMS)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Copy `.env.example` to `.env.local` and fill in your credentials:
```bash
cp .env.example .env.local
```

3. Run database migrations (after Supabase project is set up):
```bash
# Instructions in supabase/migrations/README.md
```

4. Generate TypeScript types from Supabase:
```bash
npm run db:types
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
my-place/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Auth routes (signup, login, verify)
│   ├── (client)/            # Client-side routes
│   ├── (merchant)/          # Merchant-side routes
│   └── api/                 # API routes & webhooks
├── components/              # Reusable UI components
│   └── ui/                  # shadcn/ui components
├── lib/                     # Utility functions & integrations
│   ├── supabase/           # Supabase client & types
│   ├── smile-id/           # Smile Identity integration
│   └── maps/               # Google Maps utilities
├── supabase/
│   └── migrations/         # Database migrations
└── public/                 # Static assets
```

## Development Phases

- [x] **Phase 0**: Setup (Current)
- [ ] **Phase 1**: Core Data & Auth
- [ ] **Phase 2**: Merchant Side
- [ ] **Phase 3**: Client Side
- [ ] **Phase 4**: Booking Lifecycle & Trust Mechanism
- [ ] **Phase 5**: Polish & Launch Readiness

See `Workflow.md` in the project root for details.

## Key Features

### Trust & Safety (Non-Negotiable)
- ID verification hard gate (no access until verified)
- GPS check-in/check-out on every booking
- Two-way ratings (client ↔ merchant)
- Off-platform testimonials clearly distinguished

### Launch Verticals
- Tailoring
- Carpentry
- Welding
- Plumbing

### Geography
- Nationwide Nigeria from day one
- No single-city lock-in
- Distance-based matching

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:types` - Generate TypeScript types from Supabase

## Documentation

- [PRD.md](../PRD.md) - Product Requirements
- [TRD.md](../TRD.md) - Technical Requirements
- [Workflow.md](../Workflow.md) - Build Sequence
- [TECH_STACK.md](../TECH_STACK.md) - Stack Decisions

## License

Private - All rights reserved
