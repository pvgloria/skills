---
name: refactor
description: Inherit unfamiliar code and change it safely — map the architecture and data flow first, characterize behaviour with tests, then refactor in behaviour-preserving steps. Use when refactoring or restructuring existing code, especially a codebase you don't yet understand ("clean this up", "refactor this module", "vamos refatorar").
---

# Refactor

You've inherited code you didn't write and need to change it. The senior move is restraint:
**understand before you touch, and preserve behaviour while you do.** This skill owns those
two disciplines; everything else it routes to the skills that already own it.

A note on tone: everything here is a **principle, not a rigid rule**. When a principle seems
wrong for the case in front of you, say so and propose the refined version.

## Phase 1 — Understand first

Don't refactor what you can't explain. Before any change, map the ground:

- **Architecture through the layers** — where does each piece sit? UI → presentation →
  domain → data (the [`architecture`](../architecture/SKILL.md) skill holds the target shape).
  Name the modules and how they depend on each other.
- **Data flow** — trace a representative path end to end: holder → use case → repository →
  source, and back. The direction of dependencies tells you what's load-bearing.

The bar for "understood" is simple: you can explain, out loud, how a change in one place
ripples through the rest. If you can't, you're not ready to refactor — keep reading the code.

## Phase 2 — Find the real problems

Run the [`design-coaching`](../design-coaching/SKILL.md) lens over what you mapped — it owns
the judgment on shape, duplication-of-knowledge, layering violations, and misuse surface.
Don't re-derive problem categories here; that skill is the authority. The only thing this
phase adds is **scope**: you're auditing a whole module or repo, not one abstraction, so
rank what you find by blast radius — the layering violation that ripples beats the local
ugliness that doesn't.

## Phase 3 — Refactor safely

The discipline that separates a refactor from a rewrite-that-breaks-things:

- **Characterize before you change.** If the behaviour you're about to move isn't pinned by
  a test, write one that captures it *as it is* — including the warts. That test is your
  proof you preserved behaviour, not improved it by accident.
- **Sequence by blast radius.** Tackle the ranked problems in order — the high-ripple
  structural fixes first, the local cleanups last. A safer base makes the later steps
  cheaper.
- **Behaviour-preserving steps.** Each step changes structure, not behaviour, and the
  characterization tests stay green throughout. Mixing a behaviour change into a refactor
  step is how regressions hide — split them into separate steps. Stop and validate after
  each before starting the next.

Done means the behaviour is unchanged and the structure is measurably simpler — never when
something *new* works.

## What this skill is not

It is not a design-rules reference — `design-coaching` and the `compose-*` / `kotlin-*`
skills own the judgment on shape and the code rules. This skill owns one thing: the order of
operations for changing code you inherited — understand it, pin its behaviour, then improve
its structure without changing what it does.
