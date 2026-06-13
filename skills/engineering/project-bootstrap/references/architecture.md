# Architecture & code layout

A coverage map, not a script. Settle the topics below organically as the stack conversation
unfolds — one at a time as they surface, in whatever order the conversation brings them. The
job is to make sure none is left unsettled; record a labelled interview task for any that is.

## Defaults — state them, don't ask

- **Layered separation: pure domain, data implementing domain interfaces, UI on top.** The
  domain has no platform imports — that is what keeps it testable without emulators and
  portable across platforms. The boundary that matters is UI vs non-UI: UI churns the fastest,
  so it must depend inward, never the reverse.
- **UI never imports the data layer directly.** The day a screen talks to a data source, the
  domain stops being the place where behavior is defined and bugs split across two layers.
- **Repositories: interface in the domain, implementation in the data layer.** The domain owns
  the contract; storage is a detail that can be swapped (or faked in tests) without touching
  callers.

## Topics to cover

Each with the recommendation and the reasoning to give when the user has no opinion:

- **Modules** — start with core vs app: `core:domain`, `core:data`, `core:<infra>` as needed;
  UI and features live in the app module as per-feature packages. Per-feature modules pay
  build-config and boundary ceremony *before* the codebase is big enough to collect the
  benefit — split when size or build times hurt, and at that moment adopt the rule "features
  never import each other" (lateral imports are how feature modules quietly become one big
  module again).
- **State management** — unidirectional per screen: a single observable state + user intents,
  reactive streams from the data layer up. One source of truth makes the UI a render function
  of one value — debugging is inspecting that value, not chasing five mutable fields that
  update in different orders.
- **DI** — a lightweight container; the concrete one is the stack's standard companion (infer
  it, don't interview). What matters is lifecycles fixed by kind, each for a reason:
  repositories as singletons (they hold caches and connections that must be shared), use cases
  transient (stateless, cheap, no reason to keep), one presenter/viewmodel per screen (state
  scoped to the screen's lifecycle dies with it — no leak, no stale state).
- **Persistence** — split structured data (database) from key-value preferences: they change
  at different cadences and only one of them needs migrations. If the app keeps user-generated
  data: **no destructive migration, ever** — the user's data is the one thing a reinstall
  cannot restore. Fail loud in dev, versioned schemas with reviewable diffs, and a migration
  test per schema change (the test is what turns "we think upgrades work" into a fact).
- **Navigation** — a structural choice, not a UI detail, on multiplatform: shared navigation
  state (one back stack the platforms render) vs per-platform navigators. Shared state keeps
  flows testable and defined once; per-platform feels more native but duplicates every flow.
  Settle it before the first screen exists — retrofitting the other model means touching every
  screen.
- **Error handling** — suggest (don't mandate) a single safe-call wrapper owned by the domain:
  the UI sees one typed error boundary instead of each screen inventing its own try/catch
  policy. If the user prefers the platform's native helper, that's valid — but check how it
  behaves with async cancellation first; on some platforms it swallows it, and a swallowed
  cancellation is a class of bug that only shows up as "the app sometimes ignores
  back-navigation".

## Rules emitted with the decisions

Carry each into the generated docs alongside the decision it belongs to, with its why:

- **A use case exists only when there is real logic** (validation, orchestration, non-trivial
  transformation). A pass-through call doesn't create a layer — it creates a file someone has
  to open to learn nothing.
- **The owner of heavy work owns its threading.** The presentation layer never shifts threads
  "just in case" — defensive dispatching hides the real contract of which calls are expensive.
- **Noise-filtering at the consumer is a smell** (de-duplicating a coarse stream at the call
  site): it means the data API is too coarse for that consumer — fix the API, not every caller.
