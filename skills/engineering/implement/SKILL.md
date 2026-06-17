---
name: implement
description: Drive an agreed task to a production-grade bar — block by block, auto-review each step, stop for Pedro's validation before every commit. Use when executing a saved plan from project-planning, or when handed a spec to build directly ("implement this", "build this", "vamos implementar"). The execution counterpart to project-planning; it owns the stop-and-validate / no-auto-commit rules.
---

# Implement

This skill is the **execution engine**. You give it an agreed task and it drives that task
to a real bar — not until it compiles, but until the architecture *and* the result are
production-grade. It does not plan; it builds what was already decided.

A note on tone: everything here is a **principle, not a rigid rule**. When a principle seems
wrong for the case in front of you, say so and propose the refined version — don't apply it
mechanically.

## What you start from

One of two entry points, both fine:

- **A saved plan** from [`project-planning`](../project-planning/SKILL.md) — the commit
  sequence is your block list, and the grill decisions are the bar you validate against.
- **A task handed directly** — a spec Pedro gives you here. If it's substantial and the
  architecture isn't yet pinned down, say so and suggest grilling first rather than building
  on a guess.

## The driving loop

`goal = {the agreed spec}`. Keep going until the architecture **and** the result meet the
bar — not just until it runs. A thing that compiles is not a thing that's done.

Work in **small blocks** — one commit-sized bucket at a time (the commit rules in CLAUDE.md
already define the size: one logical change). Don't batch unrelated changes into one block.

After each block:

- **Auto-review the change** against the architecture defaults before showing it. Placement
  matters, not just green tests — a passing test confirms behaviour, not that the logic lives
  in the right layer. The `compose-*` and `kotlin-*` skills are the authority on the actual
  code; reach for them here.
- **Stop for Pedro's validation.** His eyes close the loop, not the test suite.
- **Never commit on your own initiative.** Suggest the message; he runs the commit.

## Progress tracking

Don't invent a separate progress file. When executing a saved plan, **that plan file is the
tracker** — mark blocks done as you go. For a direct task short enough to validate
step-by-step, the conversation itself is the record; nothing to persist.

## Finish

One dedicated review pass over the whole thing — not block-by-block this time, but the
change as a whole: seams between blocks, anything that drifted, dead scaffolding. Then
`done` means every dimension meets the bar and a real user can walk in and use it.

## What this skill is not

It is not planning — if the approach isn't agreed yet, that's `project-planning` /
`grill-me` / `grill-with-docs`, not this. It is not a code-rules reference — the `compose-*`
and `kotlin-*` skills own those and are the authority when you write and validate the code.
