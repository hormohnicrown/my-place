# Technical Requirements Document (TRD)
## My Place

**Status:** Draft v1 — for build kickoff
**Companion doc:** PRD.md (product scope), Workflow.md (build sequence)
**Last updated:** 2026-08-10

---

## 1. Architecture Overview

Standard two-sided marketplace web app:

- **Frontend:** Responsive web app (mobile-first, since many users will access via phone browsers).
- **Backend:** REST (or GraphQL) API server + relational database.
- **Third-party integrations:** ID verification API, maps/geolocation API, image/file storage, notifications (SMS/email/WhatsApp).
- **Hosting:** Cloud provider with a free/low tier suitable for MVP (e.g., Vercel/Netlify for frontend, Render/Railway/Supabase for backend+DB — final choice left to build agent based on team familiarity).

```
[Client Browser] <-> [Web Frontend] <-> [API Backend] <-> [Database]
                                              |
                                              +--> [ID Verification API]
                                              +--> [Maps/Geo API]
                                              +--> [File/Image Storage]
                                              +--> [SMS/Notification service]
```

## 2. Core Data Models

### User (base)
- id, name, phone, email, password_hash, role (client | merchant), created_at
- verification_status (unverified | pending | id_verified)
- id_document_ref (pointer to stored verification result, not raw ID image long-term)
- address, city, geo_coordinates

### MerchantProfile
- user_id (FK)
- category (enum: beauty, cleaning — extensible for phase 2 verticals)
- description, price_range_min, price_range_max
- service_area_radius_km
- rating_avg, rating_count
- imported_testimonials[] (each flagged `source: off_platform`)
- status (active | inactive | under_review)

### Listing
- merchant_id (FK)
- title, description, category, price
- active (bool)

### Booking
- id, client_id (FK), merchant_id (FK), listing_id (FK)
- status (requested | accepted | declined | checked_in | completed | cancelled)
- requested_at, accepted_at, checkin_time, checkin_geo, checkout_time, checkout_geo
- price_agreed, commission_amount, commission_rate_applied
- payment_status (v1: manual/off-platform, tracked for record only)

### Rating
- booking_id (FK)
- rater_id, rated_id (either direction: client→merchant or merchant→client)
- score (1–5), comment, created_at

### VerificationRecord
- user_id (FK)
- provider (e.g., Smile Identity / Youverify / VerifyMe — see Section 4)
- result (pass | fail | pending)
- checked_at

## 3. Key Functional Requirements by Feature

### 3.1 Authentication & Onboarding
- Standard email/phone + password auth (or OTP-based phone auth — common in Nigerian market, recommend OTP for lower friction).
- Role selection at signup (client / merchant).
- Profile incomplete → restricted access until ID verification passes.

### 3.2 ID Verification (hard gate)
- Integrate a 3rd-party identity verification API (candidates: Smile Identity, Youverify, VerifyMe Nigeria — build agent to confirm current pricing/API availability, as this is post-cutoff/market-dependent).
- Flow: user uploads government ID + live selfie → API returns match result → status updates to `id_verified` or `failed` (with retry option).
- No full platform access (listing creation, booking) until `id_verified`.

### 3.3 Search & Discovery
- Filter by: category, price range, distance (geo radius from client's location), rating, verification badge.
- Sort by: relevance, price (asc/desc), rating, distance.
- Pagination for listing results.

### 3.4 Booking Lifecycle
- State machine: `requested → accepted/declined → checked_in → completed/cancelled`.
- Check-in/check-out captures device GPS + timestamp, stored against the booking record (immutable once written — audit trail).
- On `completed`, trigger rating prompts to both parties and commission calculation.

### 3.5 Ratings (two-way)
- Both client and merchant can rate/review after a booking reaches `completed`.
- Ratings feed into merchant's `rating_avg` (aggregate, recalculated on new rating).
- Client-side ratings are internal (used for merchant discretion/future risk flags) — not necessarily public-facing in v1.

### 3.6 Commission & Settlement
- v1: payments happen off-platform at point of service (cash/transfer) — platform is not a payment processor yet.
- App still records `price_agreed` and calculates `commission_amount` owed by merchant, for manual or semi-automated reconciliation (e.g., merchant pays commission via a linked payment flow monthly, or per-booking manual settlement — build agent to propose simplest v1 approach given no payments API yet).
- **Note:** if a payments API is integrated later (Paystack/Flutterwave are common regional choices), commission can be auto-deducted at transaction time.

### 3.7 Reviews Import (off-platform testimonials)
- Merchant can add external testimonial text/screenshot at profile setup.
- Must render with a distinct visual treatment/label ("Shared by merchant — not verified on this platform") — this is a product trust requirement, not optional styling.

## 4. Non-Functional Requirements

- **Security:** ID documents and personal data must be encrypted at rest; access to raw ID images restricted/short-retention where regulation allows (research Nigerria's NDPR — Nigeria Data Protection Regulation — compliance requirements before storing ID data).
- **Performance:** Search/filter results should return in <2s for MVP scale (hundreds to low thousands of listings).
- **Availability:** Standard uptime expectations for MVP — no strict SLA required at this stage.
- **Data privacy:** Client and merchant addresses should not be fully exposed to the other party until a booking is accepted (show approximate area/distance pre-booking, full address only post-acceptance).
- **Accessibility/simplicity:** Per the original problem statement — UI must remain simple enough for low digital-literacy merchants (minimal steps, clear language, large tap targets, works on low-end Android browsers).

## 5. Third-Party Dependencies (to confirm at build time)

| Need | Candidate options | Notes |
|---|---|---|
| ID Verification | Smile Identity, Youverify, VerifyMe Nigeria | Confirm current API availability/pricing — verify live, don't assume from training data |
| Maps/Geo | Google Maps Platform, Mapbox | For distance filtering and check-in/out geo capture |
| SMS/OTP | Termii, Africa's Talking | Common in Nigerian market for phone-based OTP |
| File storage | AWS S3, Cloudinary, or provider-native storage | For ID images (short retention) and profile photos |
| Payments (phase 2) | Paystack, Flutterwave | Not required for v1 |

## 6. Explicitly Deferred to Phase 2
- In-app payments/escrow
- Full background checks / reference verification
- Tiered trust badges beyond binary ID-verified
- Additional verticals (repairs, tutoring, etc.)
- Native mobile app
