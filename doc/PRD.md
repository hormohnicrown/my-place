# Product Requirements Document (PRD)
## My Place

**Status:** v2, reconciled with the delivered demo build
**Owner:** My Place team
**Last updated:** 2026-08-10

> **Decisions locked in the delivered build** (these were open assumptions at kickoff):
> - **Launch geography:** Nationwide (Nigeria) from day one, no single-city restriction. Matching works by distance within any city.
> - **Commission rate:** 7% per completed booking, the midpoint of a 6 to 8% range. Configurable per booking.
> - **Launch verticals:** Tailoring, carpentry, welding, plumbing (skilled artisan trades).
>
> **Still open:**
> - **First community partnership target(s):** Not yet named. Needs real associations or WhatsApp groups identified, likely one per starting city or region rather than one nationally.
>
> **Demo build note:** The submitted build uses email and password sign-in and has ID verification disabled so accounts work immediately. ID verification remains a product requirement (Section 5.3); see the README for the demo build state.

---

## 1. Problem Statement

Skilled artisans (tailors, carpenters, welders, plumbers, and similar trades) in local communities struggle to gain visibility beyond their existing personal networks. When a client relocates or wants a new provider, there is no trusted way to discover and vet a stranger's skill, safety, and reliability. The result is either lost business for the artisan or an unsafe and uninformed hiring decision for the client.

**Core example:** A person moves to a new neighborhood and needs a tailor to alter clothing or a plumber to fix a leak. They can't use the tradesperson they trusted before (too far) and don't trust an unknown local one (no visibility into skill or safety).

## 2. Goals

- Give skilled local professionals ("merchants") online visibility and a route to new clients beyond word-of-mouth.
- Give clients a way to discover, compare, and book local services with a verifiable trust signal (ID-checked, rated, with an audit trail).
- Build a sustainable two-sided marketplace with commission-based revenue.

### Non-Goals (v1)
- Full background or criminal checks (cost-prohibitive at launch; revisit after traction).
- Guaranteed liquidity (enough merchants and clients) in every city or neighborhood at once. Coverage will naturally be denser where community partnerships and merchant recruitment happen first, even though the platform itself is nationwide from day one.
- In-app payments/escrow (can be phase 2; v1 may allow off-platform payment collection at the point of service).
- Native mobile apps (web-first, mobile-responsive).

## 3. Target Users

| Persona | Description |
|---|---|
| **Client** | Anyone seeking a local artisan service, anywhere in the country. Messaging leads with "new to the neighborhood"; matching happens locally within each user's own city or area. |
| **Merchant** | Skilled local artisan (tailor, carpenter, welder, plumber) seeking new clients and income stability. |

## 4. Scope: Launch Verticals

1. Tailoring
2. Carpentry
3. Welding
4. Plumbing

*(Additional trades and services added in a later phase once the trust and booking flow are proven.)*

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
- **ID verification** (government ID + selfie match) required before any merchant or client profile is fully active. Hard gate in the production design. *(The demo build disables this gate so accounts are usable immediately; see the README.)*
- **Two-way ratings**: clients rate merchants, merchants rate clients, after each completed booking.
- **GPS check-in/check-out**: merchant (or client) marks "service started" and "service ended" with a timestamp and location, creating an audit trail for every booking.
- Verification status is visibly displayed on every profile ("ID Verified" badge).

### 5.4 Screening Gate
- Before full platform access, both clients and merchants pass:
  - ID verification (production design; disabled in the demo build).
  - Basic profile completeness check (merchant: category, price, service area; client: name, phone, address).
- No manual reference or background checks in v1 (flagged as a known limitation, see Risks).

### 5.5 Monetization
- **Commission**: 7% deducted from each completed, on-platform booking (midpoint of a 6 to 8% range; configurable per booking).
- No listing fees or subscriptions in v1, which keeps the barrier to entry low for merchant supply.

## 6. User Flows (high-level; see Workflow.md for detail)

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
| Cold start, where no merchants means no clients and vice versa | Go-to-market plan (see Workflow.md) leans on review-seeding and direct community recruitment for the first 15 to 20 merchants. |
| Imported off-platform reviews could be seen as misleading | Must be visually and textually distinguished from on-platform verified reviews at all times. |
| Commission model may deter low-income merchants pre-revenue | Monitor early merchant drop-off; consider a lead-fee hybrid if commission proves a barrier. |

## 9. Out of Scope for This Document
Technical architecture, data models, and API design → see **TRD.md**.
Step-by-step build/launch sequencing → see **Workflow.md**.
