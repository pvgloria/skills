---
name: debug
description: Chase a bug to its root cause and fix it for good — reproduce it with a failing test, reason from the evidence to the real cause, fix at the root, and leave a regression guard behind. Use when diagnosing a bug, a crash, a failing test, or unexpected behaviour ("why is this happening", "fix this bug", "debug this", "está a rebentar").
---

# Debug

A bug is a gap between what the code does and what you believe it does. Close it by
evidence, not by guessing. The bar: the root cause is fixed and a regression test proves it
won't come back.

A note on tone: everything here is a **principle, not a rigid rule**. When a principle seems
wrong for the case in front of you, say so and propose the refined version.

## Phase 1 — Reproduce

Pin the bug with a failing test that captures it as observed — it's your strongest evidence,
and it becomes the regression guard. Chase a reliable repro hard: narrow the inputs until it
fails on demand. When you can't make it fail on demand despite genuine effort, don't stall —
reason from the evidence you have (logs, traces, crash reports), and treat the fix as
provisional until something reproduces it.

## Phase 2 — Find the root cause

Reason from the evidence, step by step. Keep asking *why* until the cause explains **every**
observation — not just the loudest symptom. A fix that doesn't trace to a named cause is a
guess. Isolate by narrowing scope — bisect, remove variables — not by adding speculative
changes.

## Phase 3 — Fix at the root

Change the cause, not the symptom. The failing test goes green and stays as a regression
guard. Run the whole suite — a fix that breaks behaviour elsewhere isn't done. Account for
the edge cases the bug exposed; if it was a performance bug, the `compose-*` / `kotlin-*`
skills own those rules.

Done = root cause fixed, regression test green, nothing else broken.

## What this skill is not

Not refactoring — that preserves behaviour; debugging changes it to remove a defect (the
test-first discipline looks similar, the intent is opposite). Not a code-rules reference —
the `compose-*` / `kotlin-*` skills own that.
