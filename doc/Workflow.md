# Workflow & Build Sequence
## My Place

**Status:** v2, reconciled with the delivered demo build
**Companion docs:** PRD.md (what and why), TRD.md (how, technical)
**Last updated:** 2026-08-10

---

## 1. Build Phases

Phases 1 through 5 are implemented in the delivered demo build. Phase 6 (go-to-market) is a business track and is not code.

### Phase 0: Setup
- Confirm the open assumptions. Commission (7%) and verticals (tailoring, carpentry, welding, plumbing) are now locked; the first community partnership target is still open (see PRD.md header). Geography is nationwide by default, with no single-city restriction.
- Set up the repo, hosting, and the Next.js plus Supabase scaffold per TRD.md.
- Set up an ID verification API sandbox account (deferred in the demo build).

### Phase 1: Core Data & Auth
- User model and auth (client and merchant roles) via Supabase Auth (email and password).
- Onboarding flow: signup, then profile completion, then the ID verification gate.
- Verification status blocks full access until `id_verified` in the production design. The demo build disables this gate and marks new accounts `id_verified` on signup.

### Phase 2: Merchant Side
- Merchant profile creation (category, price, service area, description).
- Listing creation and edit.
- Off-platform testimonial import (with the required visual distinction label).

### Phase 3: Client Side
- Search and browse UI with filters (category, price, distance, rating, verified badge).
- Merchant profile view (client-facing).
- Booking request flow.

### Phase 4: Booking Lifecycle & Trust Mechanism
- Booking state machine (pending, accepted or declined, checked-in, completed or cancelled).
- GPS check-in and check-out capture.
- Two-way rating flow after completion.
- Commission calculation and record (manual or semi-automated settlement for v1).

### Phase 5: Polish & Launch Readiness
- Accessibility and simplicity pass (low digital-literacy usability check: plain language, minimal steps).
- Basic admin view (to monitor verification failures, disputes, and flagged bookings). Note: the delivered admin section uses a basic role check and some placeholder figures; it is not production-hardened.
- Seed data: import initial testimonials for the first recruited merchants (Phase 6 runs in parallel).

### Phase 6: Go-to-Market (runs alongside Phases 2 to 5, not after)
- Identify and reach out to the first community partnership target (association or WhatsApp group) to recruit the first 15 to 20 merchants.
- Collect off-platform testimonials from recruited merchants for review-seeding.
- Prepare launch messaging anchored on the "new to the neighborhood" story from the PRD problem statement.

## 2. Suggested Sprint Breakdown (if working in short cycles)

| Sprint | Focus |
|---|---|
| 1 | Setup, auth, onboarding (ID verification integration deferred) |
| 2 | Merchant profile and listing creation |
| 3 | Client search and discovery, booking request |
| 4 | Booking lifecycle (check-in and out) and ratings |
| 5 | Commission logic, admin view, polish |
| 6 | Merchant recruitment, review-seeding, launch |

*(Sprint length is up to the team. This is a dependency-ordered sequence, not a fixed calendar.)*

## 3. Definition of Done for MVP Launch

Checked items are working in the delivered demo build. Unchecked items remain before a real public launch.

- [x] A client and a merchant can each sign up and reach their dashboard. *(ID verification is disabled in the demo; sign-in is email and password.)*
- [x] A merchant can create a live listing under one of the launch verticals (tailoring, carpentry, welding, plumbing).
- [x] A client can search, filter, and view a merchant profile with verification badge and rating.
- [x] A client can request a booking and the merchant can accept or decline.
- [x] Both parties can check in and out of an accepted booking with GPS and timestamp logged.
- [x] Both parties can rate each other after completion.
- [x] Commission is calculated and recorded per completed booking (7% default).
- [x] Off-platform testimonials, where present, are visually distinguished from on-platform reviews.
- [ ] Live ID verification provider wired in and the hard gate re-enabled.
- [ ] At least 15 to 20 real merchants onboarded and verified before public launch.
- [ ] Admin section given a proper role model and real data (the demo uses a basic check and some placeholders).

## 4. Review Checkpoints

Run a review pass at the end of each phase, checking against PRD.md (does the feature match scope and intent) and TRD.md (does the implementation match the architecture and data model). Flag scope creep (for example an accidental payments integration or background checks) and scope gaps (for example a missing off-platform-review label) explicitly. Those two are the failure modes most likely to slip through.
