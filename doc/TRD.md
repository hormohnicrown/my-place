# Technical Requirements Document (TRD)
## My Place

**Status:** v2, reconciled with the delivered demo build
**Companion doc:** PRD.md (product scope), Workflow.md (build sequence)
**Last updated:** 2026-08-10

---

## 1. Architecture Overview

The delivered build is a single Next.js application, not a separate frontend and API server. The kickoff draft left the stack open; this section records what was built.

- **Frontend and backend:** Next.js 15 (App Router) with React 19. Server-side data access runs through Next.js Server Actions, so there is no standalone REST or GraphQL API server. Route groups separate the client, merchant, and admin areas.
- **Database and platform:** Supabase provides PostgreSQL, authentication, row level security, file storage, and PostGIS for distance queries. The browser Geolocation API supplies client and merchant coordinates.
- **Session handling:** Cookie-based Supabase sessions via `@supabase/ssr`, enforced in middleware.
- **Hosting:** Vercel for the Next.js app, Supabase for the managed database. Both have free tiers suitable for a demo.

```
[Client Browser]
      |
      v
[Next.js App]  --- Server Actions --->  [Supabase]
   route groups                          Postgres + RLS
   (client / merchant / admin)           Auth (email + password)
      |                                   Storage
      +-- Browser Geolocation API         PostGIS distance queries
```

The kickoff draft also listed ID verification, maps, and SMS providers. None of those are wired into the delivered build; see Section 5.

## 2. Core Data Models

These reflect the delivered Supabase schema (`supabase/migrations/`). Category values are `tailoring`, `carpentry`, `welding`, `plumbing`.

### User (base)
- id, name, phone, email, role (client | merchant), created_at
- verification_status (unverified | pending | id_verified | failed)
- id_document_ref (pointer to stored verification result, not the raw ID image long-term)
- address, city, state, geo_coordinates (PostGIS point for distance queries)
- Note: passwords are handled by Supabase Auth, not stored in this table.

### MerchantProfile
- user_id (FK)
- category (enum: tailoring | carpentry | welding | plumbing)
- description, price_range_min, price_range_max
- service_area_radius_km
- rating_avg, rating_count
- imported_testimonials[] (each flagged `source: off_platform`)
- status (active | inactive | under_review)

### Listing
- merchant_id (FK)
- title, description, category, price
- active (bool)

### BookingRequest
The live booking flow uses `booking_requests` (an initial `bookings` table also exists in the first migration; the request-based model is what the app reads and writes).
- id, client_user_id (FK), merchant_user_id (FK), merchant_profile_id (FK), listing_id (FK, nullable)
- service_details, preferred_date, preferred_time_start, preferred_time_end, special_requirements
- client_address (full address revealed to the merchant only after acceptance)
- status (pending | accepted | declined | checked_in | completed | cancelled)
- service_started_at, service_completed_at
- price_agreed, commission_rate_applied (default 0.07), commission_amount (generated column)
- payment_status (pending | paid | disputed), payment_notes
- A `booking_requests_audit` table records status changes.

### GpsCheckin
- id, booking_request_id (FK), user_id (FK), user_role
- checkin_type (start | end), checkin_timestamp
- gps_latitude, gps_longitude, gps_accuracy, captured_address, address_matches_expected
- device_info, ip_address (captured for the audit trail; write-once)

### Rating
- booking_id / booking_request_id (FK)
- rater_id, rated_id (either direction: client to merchant or merchant to client)
- score (1 to 5), comment, created_at

### Notification
- id, user_id (FK), type, title, message
- booking_request_id (FK, nullable), rating_id (FK, nullable)
- read_at, sent_at, delivery_status, send_email, send_sms, send_push

### VerificationRecord
- user_id (FK)
- provider (intended: Smile Identity, Youverify, or VerifyMe; not wired in the demo build, see Section 4)
- result (pass | fail | pending)
- checked_at

## 3. Key Functional Requirements by Feature

### 3.1 Authentication & Onboarding
- Email and password auth via Supabase Auth. (The kickoff draft considered phone OTP; the delivered build uses email and password.)
- Role selection at signup (client or merchant).
- After signup the user completes onboarding; a signed-in user without a profile is routed to onboarding by the middleware.
- In the production design, incomplete or unverified accounts have restricted access until ID verification passes. The demo build disables that gate.

### 3.2 ID Verification (hard gate in production design)
- Intended integration: a third-party identity verification API (candidates: Smile Identity, Youverify, VerifyMe Nigeria; confirm current pricing and API availability at build time).
- Intended flow: user uploads a government ID and a live selfie, the API returns a match result, and status updates to `id_verified` or `failed` with a retry option.
- In the production design, no full platform access (listing creation, booking) until `id_verified`.
- **Demo build:** verification is disabled. New accounts are set to `id_verified` on signup so the flows are usable without a verification provider. The `verification_records` table and status field remain in place for when the provider is wired in.

### 3.3 Search & Discovery
- Filter by category, price range, distance (geo radius from the client's location), rating, and verification badge.
- Sort by relevance, price (ascending or descending), rating, and distance.
- Distance ordering uses PostGIS against the merchant and client coordinates.
- Pagination for listing results.

### 3.4 Booking Lifecycle
- State machine: `pending -> accepted/declined -> checked_in -> completed/cancelled`.
- Check-in and check-out capture device GPS and a timestamp, stored against the booking in `gps_checkins` (write-once, an audit trail).
- On `completed`, the app prompts both parties to rate and calculates the commission.

### 3.5 Ratings (two-way)
- Both client and merchant can rate and review after a booking reaches `completed`.
- Ratings feed the merchant's `rating_avg` (aggregate, recalculated on each new rating).
- Client-side ratings are internal (used for merchant discretion and future risk flags), not necessarily public-facing in v1.

### 3.6 Commission & Settlement
- v1: payments happen off-platform at the point of service (cash or transfer). The platform is not a payment processor yet.
- The app records `price_agreed` and calculates `commission_amount` as a generated column (`price_agreed * commission_rate_applied`). The default rate is 7% (`0.0700`) and can vary per booking.
- **Note:** if a payments API is integrated later (Paystack and Flutterwave are common regional choices), commission can be auto-deducted at transaction time.

### 3.7 Reviews Import (off-platform testimonials)
- A merchant can add external testimonial text or a screenshot at profile setup.
- These must render with a distinct visual treatment and label ("Shared by merchant, not verified on this platform"). This is a product trust requirement, not optional styling.

## 4. Non-Functional Requirements

- **Security:** ID documents and personal data must be encrypted at rest, with access to raw ID images restricted and short-retention where regulation allows. Review Nigeria's NDPR (Nigeria Data Protection Regulation) requirements before storing ID data. Supabase row level security policies gate table access per role (see the `rls_policies` migration).
- **Performance:** Search and filter results should return in under 2 seconds at MVP scale (hundreds to low thousands of listings).
- **Availability:** Standard uptime expectations for an MVP. No strict SLA at this stage.
- **Data privacy:** A client's full address is not exposed to the merchant until the booking is accepted. Pre-acceptance the merchant sees only the city and approximate distance; the full address is revealed after acceptance. This is enforced in the booking flow and the search results.
- **Accessibility and simplicity:** The UI must stay simple enough for low digital-literacy users: minimal steps, clear language, large tap targets, and support for low-end Android browsers. The app includes a skip-to-content link and a text-size toggle.

## 5. Third-Party Dependencies

### Delivered build
| Need | Provider | Notes |
|---|---|---|
| Database, auth, storage | Supabase | PostgreSQL, email/password auth, row level security, file storage, PostGIS |
| Geolocation | Browser Geolocation API | Captures client and merchant coordinates; no paid maps provider |
| Hosting | Vercel (app), Supabase (database) | Free tiers suitable for a demo |

### Planned for production (not wired in the demo build)
| Need | Candidate options | Notes |
|---|---|---|
| ID Verification | Smile Identity, Youverify, VerifyMe Nigeria | Confirm current API availability and pricing; verify live rather than assuming |
| Maps and geocoding | Google Maps Platform, Mapbox | If richer maps or address geocoding is needed beyond raw coordinates |
| SMS and notifications | Termii, Africa's Talking | For phone OTP or SMS booking alerts; the `notifications` table already models email/SMS/push flags |
| Payments (later phase) | Paystack, Flutterwave | Not required for v1 |

## 6. Explicitly Deferred to a Later Phase
- In-app payments and escrow
- Full background checks and reference verification
- Tiered trust badges beyond binary ID-verified
- Additional trades and verticals
- Native mobile app
- Live ID verification provider integration (the demo build ships with the gate disabled)
