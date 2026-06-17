---
name: ui-components
description: Build UI reuse-first — discover what the design system already has, reuse or compose it, and author new only when nothing fits (conforming to existing patterns and tokens). Use when building a screen or UI component, or adding visual elements ("build this screen", "add a component", "vamos fazer este ecrã"). Kills the failure mode of reaching for raw framework primitives when the design system already has the piece.
---

# Building UI (reuse first)

Bar: production-grade and consistent with what's already there. The failure mode this skill
kills: building UI from raw primitives when the design system already has the piece — or one
a step away.

A note on tone: everything here is a **principle, not a rigid rule**. When a principle seems
wrong for the case in front of you, say so and propose the refined version.

## Phase 1 — Discover before you build

Never author blind. Inventory what exists first:

- the **design-system module/package** — search it for the component and its neighbours
- **sibling screens** solving a similar problem — reuse their composition, not just their look
- the **theme/tokens** — colour, spacing, type come from there, never hardcoded

If you can't locate the design system, ask where it lives — don't default to raw primitives.

## Phase 2 — Reuse, compose, then author (in that order)

- **Reuse** an existing component as-is when it fits.
- **Compose / extend** when it almost fits — wrap it, add a slot, pass a modifier — before
  writing anything new. (`compose-slot-api-pattern` owns slot design.)
- **Author new** only when nothing fits. It's itself reusable and built from the design
  system, not primitives — match the existing naming, slot shape, and token usage so the
  next person finds and trusts it.

## Phase 3 — Cover the states

A production component handles loading, empty, and error — not just the happy path — plus
accessibility and responsive sizing. Previews are mandatory and cover those variants
(`compose-ui-testing-patterns` owns previews; `compose-focus-navigation` owns focus/a11y).

Done = reuses what it should, conforms to the system, every state covered and previewed.

## What this skill is not

Not a slot-API or testing reference — `compose-slot-api-pattern` and
`compose-ui-testing-patterns` own those. Not a design-judgment coach — `design-coaching` owns
shape and misuse.
