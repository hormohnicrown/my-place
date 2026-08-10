# Product Requirements Document (PRD)
## My Place

**Status:** Draft v1 — for build kickoff
**Owner:** [Your name]
**Last updated:** 2026-08-10

> ⚠️ **Assumptions flagged for founder review** (swap these before/while building):
> - **Launch geography:** Nationwide (Nigeria) from day one — no single-city restriction. Product/matching logic must work by neighborhood/locality within any city, not just one metro area.
> - **Commission rate:** 12% per completed booking (default within 10–20% industry range)
> - **Launch verticals:** Beauty/hairdressing + Home cleaning (highest demand, easiest to verify, matches original problem story)
> - **First community partnership target(s):** Not yet named — needs real associations/WhatsApp groups identified, likely one per starting city/region rather than one nationally

---

## 1. Problem Statement

Skilled professionals (hairdressers, cleaners, tutors, repair technicians, etc.) in local communities struggle to gain visibility beyond their existing personal networks. When a client relocates or wants a new provider, there is no trusted way to discover and vet a stranger's skill, safety, and reliability — leading to either lost business for professionals or unsafe/uninformed hiring decisions for clients.

**Core example:** A person moves to a new neighborhood and needs a home hairdressing service. She can't use her old hairdresser (too far) and doesn't trust an unknown local one (no visibility into skill or safety).

## 2. Goals

- Give skilled local professionals ("merchants") online visibility and a route to new clients beyond word-of-mouth.
- Give clients a way to discover, compare, and book local services with a verifiable trust signal (ID-checked, rated, with an audit trail).
- Build a sustainable two-sided marketplace with commission-based revenue.

### Non-Goals (v1)
- Full background/criminal checks (cost-prohibitive at launch — revisit post-traction).
- Guaranteed liquidity (enough merchants/clients) in every city/neighborhood simultaneously — coverage will naturally be denser where community partnerships and merchant recruitment happen first, even though the platform itself is nationwide from day one.
- In-app payments/escrow (can be phase 2; v1 may allow off-platform payment collection at the point of service).
- Native mobile apps (web-first, mobile-responsive).

## 3. Target Users

| Persona | Description |
|---|---|
| **Client** | Anyone seeking a local service, anywhere in the country — messaging leads with "new to the neighborhood," matching happens locally within each user's own city/area. |
| **Merchant** | Skilled local professional (beautician, cleaner, tutor, repair technician) seeking new clients and income stability. |

## 4. Scope — Launch Verticals

1. Beauty & hairdressing (home service)
2. Home cleaning

*(Repairs, tutoring, and others added in Phase 2 once trust + booking flow are proven.)*

## 5. Core Features (v1)

### 5.1 Merchant Profiles
- Service listing(s): category, description, price range, location/service radius.
- Verification badge (see Trust & Safety below).
- Ratings and reviews (on-platform, post-completion).
- Optional: imported testimonials from WhatsApp/Instagram, **clearly labeled "off-platform reputation"** and visually distinct from on-platform verified reviews.

### 5.2 Client Discovery & Booking
- Search/browse by category.
- Filter by price, location/distance, rating, verification status.
- View merchant profile, reviews, and availability.
- Request/book a service (booking request → merchant accept/decline).

### 5.3 Trust & Safety (minimum viable, non-negotiable)
- **ID verification** (government ID + selfie match) required before any merchant or client profile is fully active. Hard gate — no exceptions in v1.
- **Two-way ratings**: clients rate merchants, merchants rate clients, after each completed booking.
- **GPS check-in/check-out**: merchant (or client) marks "service started" / "service ended" with a timestamp + location, creating an audit trail for every booking.
- Verification status is visibly displayed on every profile ("ID Verified" badge).

### 5.4 Screening Gate
- Before full platform access, both clients and merchants pass:
  - ID verification (automated via 3rd-party API — see TRD).
  - Basic profile completeness check (merchant: category, price, service area; client: name, phone, address).
- No manual reference/background checks in v1 (flagged as a known limitation — see Risks).

### 5.5 Monetization
- **Commission**: 12% deducted from each completed, on-platform booking (default — confirm final rate).
- No listing fees or subscriptions in v1 — keeps the barrier to entry low for merchant supply.

## 6. User Flows (high-level — see Workflow.md for detail)

1. **Merchant onboarding** → sign up → ID verify → create listing → go live (badge shown).
2. **Client onboarding** → sign up → ID verify → browse/search → book.
3. **Booking lifecycle** → request → accept/decline → check-in → service → check-out → mutual rating → commission settled.

## 7. Success Metrics (first 90 days post-launch)

- Number of ID-verified merchants live on platform.
- Number of completed bookings.
- % of bookings with both check-in and check-out logged (trust mechanism adoption).
- Average two-way rating score.
- Repeat booking rate (client returns to book again).

## 8. Risks & Open Questions

| Risk | Mitigation / Note |
|---|---|
| Light-touch verification (ID only, no background check) may not fully deliver on the "safety" promise | Messaging must be precise: "ID-verified," not "background-checked." Revisit deeper verification once revenue supports the cost. |
| Cold start — no merchants means no clients, and vice versa | Go-to-market plan (see Workflow.md) leans on review-seeding + direct community recruitment for first ~15–20 merchants. |
| Imported off-platform reviews could be seen as misleading | Must be visually and textually distinguished from on-platform verified reviews at all times. |
| Commission model may deter low-income merchants pre-revenue | Monitor early merchant drop-off; consider a lead-fee hybrid if commission proves a barrier. |

## 9. Out of Scope for This Document
Technical architecture, data models, and API design → see **TRD.md**.
Step-by-step build/launch sequencing → see **Workflow.md**.
