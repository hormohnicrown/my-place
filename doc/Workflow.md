# Workflow & Build Sequence
## My Place

**Status:** Draft v1
**Companion docs:** PRD.md (what/why), TRD.md (how — technical)
**Last updated:** 2026-08-10

---

## 1. Build Phases

### Phase 0 — Setup
- Confirm the open assumptions (commission %, verticals, first community partnership target(s)) — see PRD.md header. Geography is nationwide by default; no single-city restriction.
- Set up repo, hosting, base frontend/backend scaffold per TRD.md architecture.
- Set up ID verification API sandbox/test account.

### Phase 1 — Core Data & Auth
- User model + auth (client/merchant roles).
- Onboarding flow: signup → profile completion → ID verification gate.
- Verification status must block full access until `id_verified`.

### Phase 2 — Merchant Side
- Merchant profile creation (category, price, service area, description).
- Listing creation/edit.
- Off-platform testimonial import (with required visual distinction label).

### Phase 3 — Client Side
- Search/browse UI with filters (category, price, distance, rating, verified badge).
- Merchant profile view (client-facing).
- Booking request flow.

### Phase 4 — Booking Lifecycle & Trust Mechanism
- Booking state machine (requested → accepted/declined → checked-in → completed/cancelled).
- GPS check-in/check-out capture.
- Two-way rating flow post-completion.
- Commission calculation + record (manual/semi-automated settlement for v1).

### Phase 5 — Polish & Launch Readiness
- Accessibility/simplicity pass (low digital-literacy usability check — plain language, minimal steps).
- Basic admin view (to manually monitor verification failures, disputes, flagged bookings).
- Seed data: import initial testimonials for first recruited merchants (Phase 6 below happens in parallel).

### Phase 6 — Go-to-Market (runs alongside Phase 2–5, not after)
- Identify and reach out to first community partnership target (association/WhatsApp group) — recruit first 15–20 merchants.
- Collect off-platform testimonials from recruited merchants for review-seeding.
- Prepare launch messaging anchored on the "new to the neighborhood" story from the PRD problem statement.

## 2. Suggested Sprint Breakdown (if working in short cycles)

| Sprint | Focus |
|---|---|
| 1 | Setup + Auth + ID verification integration |
| 2 | Merchant profile + listing creation |
| 3 | Client search/discovery + booking request |
| 4 | Booking lifecycle (check-in/out) + ratings |
| 5 | Commission logic + admin view + polish |
| 6 | Merchant recruitment, review-seeding, launch |

*(Sprint length is up to the build agent/team — this is a dependency-ordered sequence, not a fixed calendar.)*

## 3. Definition of Done for MVP Launch

- [ ] A client and a merchant can each sign up and pass ID verification.
- [ ] A merchant can create a live listing under one of the two launch verticals.
- [ ] A client can search, filter, and view a merchant profile with verification badge and rating.
- [ ] A client can request a booking; merchant can accept/decline.
- [ ] Both parties can check in/out of an accepted booking with GPS+timestamp logged.
- [ ] Both parties can rate each other post-completion.
- [ ] Commission is calculated and recorded per completed booking.
- [ ] At least 15–20 real merchants are onboarded and verified before public launch.
- [ ] Off-platform testimonials (if any) are visually distinguished from on-platform reviews.

## 4. Review Checkpoints (for the Review Agent — see agent-prompt.md)

Recommend a review pass at the end of each phase above, checking against PRD.md (does the feature match scope/intent) and TRD.md (does the implementation match the architecture/data model). Flag any scope creep (e.g., accidental payments integration, background checks) or scope gaps (e.g., missing the off-platform-review labeling requirement) explicitly — these are the two failure modes most likely to slip through.
