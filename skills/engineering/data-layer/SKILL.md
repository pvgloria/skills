---
name: data-layer
description: Android data-layer defaults — JSON serialization, mapper testing, and the network boundary (DTOs at the edge, distrust the wire, errors as domain results). Use when writing or reviewing data-layer code — @Serializable response types, Retrofit/network calls, DTO-to-domain mappers, parsing API responses ("the data layer", "the network call", "parse this response", "DTOs").
---

# Data layer

Defaults for the layer that talks to the network and storage.

A note on tone: everything here is a **principle, not a rigid rule**. When a principle seems
wrong for the case in front of you, say so and propose the refined version.

## Serialization

- **`@SerialName` on every field** of every `@Serializable` response class — including fields
  where the Kotlin name matches the JSON key exactly (e.g. `@SerialName("id") val id`). Without
  it, R8/ProGuard obfuscates property names and breaks JSON parsing silently at runtime.
- **No tests for pure mappers.** Field-assignment mappers, null propagation, and simple
  converters have no logic to verify — the compiler and type system already do it. Only test
  data-layer code when there is a real decision, branch, formula, or algorithm that could be
  wrong.

## The network boundary

The network is a boundary you don't control. Distrust the wire, and let nothing
transport-shaped past this layer.

- **DTOs stay at the edge.** `@Serializable` wire types live here and never leak into domain
  or UI — map them to domain models at the boundary, and let upper layers depend on domain
  types only.
- **Distrust the wire.** The API can return `null` where it promised a value, unknown enum
  cases, or missing fields regardless of the contract. Parse defensively and resolve into a
  valid domain model or a failure; handle unknown enum values with an explicit fallback case,
  never a crash.
- **Map errors to domain results.** No HTTP code, Retrofit exception, or `IOException` escapes
  this layer — translate transport and protocol failures into a domain result the rest of the
  app branches on, so upper layers never see transport details. (How the result is *exposed*
  as Flow/StateFlow — `kotlin-flow-state-event-modeling` owns.)
