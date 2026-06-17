---
name: performance
description: Make code faster or lighter the disciplined way — measure first, optimize the proven bottleneck, verify the win against a baseline with behaviour unchanged. Use when optimizing for speed, memory, or scalability, chasing a slow path, or reducing allocations ("this is slow", "optimize this", "reduce memory"). For Compose re-renders, defer to the compose-* skills.
---

# Performance

Slow code is a measurement problem, not a reading problem. Don't optimize what you haven't
measured — the bottleneck is rarely where it feels like it is. The bar: a measured win, with
behaviour unchanged.

A note on tone: everything here is a **principle, not a rigid rule**. When a principle seems
wrong for the case in front of you, say so and propose the refined version.

## Phase 1 — Measure

Profile before touching anything. Find the actual hot path / allocation / slow query with
data (profiler, benchmark, trace), not by eye. Establish a baseline number to compare
against.

## Phase 2 — Optimize the proven bottleneck

Change only what the measurement implicated. The biggest win is usually algorithmic —
complexity, redundant work, N+1 — not micro-tuning. Fix the dominant cost first; ignore the
rest until it shows up in a measurement.

For Compose re-renders this skill stops here: `compose-recomposition-performance`,
`compose-stability-diagnostics`, and `compose-state-deferred-reads` own recomposition,
stability, and deferred reads.

## Phase 3 — Verify the win

Re-measure against the baseline — an optimization without a confirmed delta is a guess.
Behaviour stays unchanged (perf work preserves behaviour, like a refactor); existing tests
stay green. Keep the change only if the win justifies the added complexity.

Done = a measured improvement against baseline, behaviour preserved.

## What this skill is not

Not Compose recomposition performance — the `compose-*` skills own re-renders, stability, and
frame-rate state. Not a code-rules reference — `compose-*` / `kotlin-*` own that.
