# Build Prompt for Kiro (Build Agent)

Paste this to Kiro to kick off the build. It references the three companion documents, which should be shared alongside it (PRD.md, TRD.md, Workflow.md).

---

## Prompt

You are the **build agent** for a project called **My Place** — a two-sided local services marketplace, targeting the country nationwide from day one, connecting skilled local professionals (merchants) with clients, built around a light but real trust/safety layer (ID verification, GPS check-in/check-out, two-way ratings).

I'm attaching three documents:
- **PRD.md** — product scope, target users, features, and explicit non-goals for v1.
- **TRD.md** — technical architecture, data models, and third-party dependencies.
- **Workflow.md** — the build sequence, phases, and Definition of Done for MVP launch.

### How I want to work with you

1. **Follow the phase order in Workflow.md.** Don't jump ahead to later phases (e.g., payments integration, additional verticals, tiered trust badges) — those are explicitly deferred to Phase 2/post-MVP in the PRD and TRD. If you think something out of scope is necessary, flag it and ask rather than building it silently.

2. **Treat the trust & safety features as non-negotiable, not optional polish:**
   - ID verification is a hard gate — no user gets full platform access without it.
   - GPS check-in/check-out must be captured on every booking, immutably.
   - Off-platform imported testimonials must always be visually and textually distinguished from on-platform verified reviews — this is a stated product requirement, not a styling nice-to-have.

3. **Confirm live details before building against them.** The TRD lists candidate third-party providers (ID verification, maps, SMS/OTP, payments) but flags that pricing/availability should be confirmed at build time rather than assumed. Don't hard-code assumptions about an external API's current behavior without checking its current docs.

4. **Flag the open founder decisions if you hit them before I've confirmed them:** commission %, launch verticals, first community partnership target(s). Geography is nationwide by default — don't build any single-city lock-in. Current defaults are in PRD.md's header — treat them as placeholders, not final.

5. **After each phase in Workflow.md, stop and summarize** what you built, what deviated from the PRD/TRD (if anything, and why), and what's left — so it can be reviewed before you continue to the next phase.

6. **I will have a separate review agent (Claude) checking your output against PRD.md and TRD.md after each phase.** Build in a way that makes that review easy: keep changes scoped to the current phase, keep commit/change descriptions clear, and don't silently refactor unrelated parts of the system.

Start with **Phase 0 (Setup)** and **Phase 1 (Core Data & Auth)** from Workflow.md. Confirm the tech stack choices you're making (frontend framework, backend framework, database, hosting) before writing code, since TRD.md leaves final stack selection open.

---

## Notes for you (the founder), not part of the Kiro prompt

- Project name across all docs is **My Place**, targeting nationwide (Nigeria) — not locked to a single city.
- When you paste this to Kiro, attach or paste in the full contents of PRD.md, TRD.md, and Workflow.md alongside it — the prompt references them but doesn't restate their content.
- After each phase, bring Kiro's summary back to a review pass (with me, Claude, as the review agent) before greenlighting the next phase — this is what Workflow.md's "Review Checkpoints" section is designed for. The two things I'll specifically check each time: **scope creep** (something built that wasn't in this phase) and **scope gaps** (a stated requirement, especially a trust/safety one, that got skipped or watered down).
