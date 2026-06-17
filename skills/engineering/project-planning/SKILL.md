---
name: project-planning
description: The process for planning a new project or feature before writing code — roadmap, grill, a saved plan that conforms to architecture defaults, then block-by-block execution. Use when planning a project or feature, structuring work before coding, or mentions "let's plan this", "plan this feature", "how should we structure this".
---

# Project Planning

This skill captures *how Pedro plans*, so that planning produces structure that is already
right — instead of producing something that his review then has to correct. The whole point
is to think with the target architecture in mind from the start — the [`architecture`](../architecture/SKILL.md)
skill holds those defaults.

A note on tone before anything else: everything here is a **principle, not a rigid rule**.
Rigid never/always rules misfire on exactly the edge cases that planning exists to catch.
When a principle below seems wrong for the case in front of you, say so and propose the
refined version — don't apply it mechanically, and don't soften it into mush either. Use
judgment.

## Two scopes, different depth

The same process serves a whole project and a single feature — the difference is depth and
whether the roadmap phase applies.

- **Whole project** → start at the Roadmap phase, then loop through the per-feature phases
  one feature at a time.
- **Single feature** → skip the Roadmap; start at Entry.

## Phase −1 — Roadmap (whole project only)

A big project has many must-have features. Grilling all of them up front is insane — by the
time you build the third, the first plan is stale. So the roadmap is deliberately thin: it
sequences the work and decides *what to grill and when*, nothing more.

- List the must-have features and **sequence** them — what depends on what, what comes first.
- Do one thin **foundation pass**: modules, stack, navigation skeleton. No feature detail.
  Just enough structure that the first feature has somewhere to land.
- Define the **grill order** and keep a queue of "next to grill".
- Grill each feature only **when its turn comes** — not up front.

The roadmap is a living document; expect to reorder as you learn.

## Phase 0 — Entry (per feature)

- Identify the scope: a genuinely new feature, or a change to something that exists?
- Choose the grilling mode:
  - **`grill-me`** — greenfield, or no documented domain to lean on.
  - **`grill-with-docs`** — there's a documented domain (CONTEXT.md, ADRs) worth validating
    the plan against, so terminology and prior decisions stay coherent.

## Phase 1 — Grill to shared understanding

Run the chosen grilling skill. The essence: **one question at a time**, descend the decision
tree, and resolve dependencies between decisions before moving on. Don't batch questions —
each answer often changes what the next question should even be.

## Phase 2 — Produce the plan

Each block in the commit sequence is written with this structure — a one-liner is not a
block:

- **Scope** — the files/modules it touches and what changes in each.
- **Tests** — what gets tested. Test real logic, not pass-throughs.
- **Commit** — the proposed commit message.

**Save the plan as a file in the repo.** It has two parts, and both matter:

1. **The grill decisions, as bullet points** — the *what we agreed*: architecture, models,
   approaches, and the *why* behind them, taken as far as pseudo-code of one possible shape
   (the domain model, the interfaces between layers). It sketches a solution, not a frozen
   contract — the internals emerge while building. This is what survives across sessions;
   without it the plan is a to-do list with no reasoning.
2. **The commit sequence** — the *how we'll build it*, derived from those decisions.

## Phase 3 — Execution

Hand the saved plan to [`implement`](../implement/SKILL.md). It owns execution: block by
block, auto-review each step, stop for Pedro's validation, and never commit on its own
initiative. The grill decisions in the plan are the bar it validates against.

## What this skill is not

This is the planning *process*, up to a saved plan — execution lives in `implement`. It also
does not re-teach Compose, Flow, or Kotlin rules — the `compose-*` and `kotlin-*` skills own
those and are the authority. Reach for them during Phase 2 to shape the plan correctly, not
instead of this skill.
