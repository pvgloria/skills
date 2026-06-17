---
name: architecture
description: The layered-architecture defaults for Android/Kotlin app code — dependency direction, where logic and state live, how repositories and use cases are shaped. Use when deciding where code belongs, structuring layers, or adding a repository or use case ("where does this go", "which layer", "add a repository/use case"). The implement, refactor, and project-planning skills validate against these defaults.
---

# Architecture

The default shape for app code — and the defaults the planning and execution skills validate
against.

A note on tone: everything here is a **principle, not a rigid rule**. When a principle seems
wrong for the case in front of you, say so and propose the refined version rather than
applying it mechanically.

## Layered, one direction

UI → presentation → domain → data, dependencies pointing one way only. Lower layers never
import upper ones; the domain knows nothing about UI or framework. Composables never touch
data sources directly — always holder → use case → repository.

## Where logic and state live

- **Holders depend on abstractions**, never concrete data-layer classes.
- **Business logic lives in use cases / domain.** A pass-through with no validation,
  orchestration, or transformation does not earn a use case.
- **One repository, one domain concept** — organized by what it returns, not by where it's
  stored.

## DRY about knowledge, not lines

A business rule, formula, or domain constant has exactly one authoritative home — never
duplicate it, even once. But don't abstract code that's only *incidentally* similar: if two
blocks have no shared reason to change, coupling them is the wrong abstraction. (The full
tension — DRY vs the wrong abstraction — lives in `design-coaching`.)

## What this skill is not

Not Compose or Flow mechanics — the `compose-*` / `kotlin-*` skills own those. Not
design-shape judgment — `design-coaching` owns misuse-resistance and the abstraction forks.
Not the data-layer rules — `data-layer` owns serialization and the network boundary. This
skill is just the layering defaults: where code goes and which way dependencies point.
