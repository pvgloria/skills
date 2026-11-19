---
name: review-performance
description: "How to review the performance of a pull request: check work on hot paths and the main thread, query count and shape, how time and memory grow with large collections, rendering and recomposition, and startup, with Android cases such as Room queries, Compose stability, lazy lists and app startup, ask for a measurement where a speed or memory claim needs one, and grade each finding blocker, should-fix or nit. Use when checking whether a PR's changes make the code slower or heavier. Do NOT use when a person asks for a code review or for feedback on a diff, or to measure, profile or optimize code."
---

# Review: performance

Check the code the diff adds or changes, and existing code it puts on a hotter path, for: hot
paths, queries, large collections, rendering, startup, and claims that need a measurement.

A cost is a finding only when you can name **where it is paid** (the path, and how often it runs
or how large its input grows) and **what it costs** (a blocked main thread, dropped frames, extra
queries per screen or request, memory that grows with the data, a slower start). A cheaper way to
write code that runs rarely or on small, bounded input is not a finding. Android and Kotlin APIs
below are examples: check the equivalent in the PR's stack.

Before you start, for each changed piece, read its callers at the PR head and note:

- **Thread and frequency:** main thread or event loop; once, per screen or request, per item, per
  frame. Main-thread, per-frame, per-item and per-request code is a hot path.
- **Data size:** what bounds each collection, table, file or response: a fixed set, a page size,
  or nothing (messages, history). Test fixtures do not show real sizes.
- **Targets and claims:** any target the project sets, and each speed or memory claim in the PR,
  its commits, comments or criteria.

Out of this review: correctness on other threads (edge cases), crashes on large input (edge
cases), safe query building (security), schema upgrades (migrations), library setup order, and
which layer owns UI state. Code that runs only in tests, debug builds or tooling is not a finding.

## Hot paths

- **Nothing blocks the main thread or an event loop:** network, database, file and preference
  I/O, `runBlocking`, `Thread.sleep`, `.get()`/`.join()` on a future, decoding large JSON or
  images. Look in lifecycle callbacks, click handlers, composable bodies, `onBindViewHolder`, and
  `ViewModel` code before a dispatcher switch. `suspend` alone does not leave the main thread:
  blocking work needs `withContext(Dispatchers.IO)` (or `Default` for CPU), or an API that moves
  it, such as Room's `suspend` and `Flow` queries. On a server: `readFileSync` in Node, JDBC in a
  coroutine or reactive handler.
- **Nothing redone that could be done once:** compiling a `Regex`, building a date formatter, a
  JSON parser (`Gson()`, `Json { }`, `ObjectMapper`) or a `Paint`, rereading config, inside
  loops, `onDraw`, `onBindViewHolder`, composable bodies or request handlers.

## Queries and requests

Count how many run for one screen, request or operation, and what each reads.

- **One per item:** a query or request inside a loop over earlier results; lazy ORM relations
  (JPA `FetchType.LAZY`, Django without `select_related`). Use a join, `IN (...)`, Room
  `@Relation` or a batch endpoint. A network round trip costs far more than a local SQLite query.
- **Reading more than used:** `SELECT *` with blobs or long text; filtering, counting or paging
  in memory (`getAll().filter { }`, `.size` instead of `COUNT(*)`, `take` instead of `LIMIT`).
- **Indexes:** for a new or changed query on a growing table, `WHERE`, `JOIN` and `ORDER BY`
  columns can use an index (`@Index`, schema files). `LIKE '%term'` and `lower(name) = ?` cannot.
- **Writes in one transaction:** SQLite commits each statement alone; use a list `@Insert` or
  `withTransaction { }`.
- **Observed queries:** a Room `Flow` re-runs when any table it reads changes, so joins over
  tables the screen does not need re-run on every write to them.

## Large collections

- **Lookups in loops:** `contains`, `indexOf`, `find` on a list inside a loop over another large
  list is quadratic; build a `Set` or `Map` once (`toSet()`, `associateBy`).
- **Rebuilding in loops:** `list = list + item`, `text += part`; use `buildList` or
  `StringBuilder`.
- **All in memory:** `readText()` with no size bound, `toList()` on a large `Flow`, fetching every
  API page before showing the first. Page (Paging 3, keyset) or stream (`useLines`, streaming
  parser).
- **Caches that only grow:** maps with no size limit; use `LruCache` or a bounded cache.

## Rendering

A frame has ~16 ms at 60 Hz, ~8 ms at 120 Hz. Check what one state change or one frame makes the
UI redo.

Compose:

- **Read fast-changing state late.** Scroll offset, animation or drag values read in a body
  recompose every frame; read them in `Modifier.offset { }`, `graphicsLayer { }`,
  `drawBehind { }`. For a threshold, use `derivedStateOf`.
- **Remember work in bodies.** Sorting, filtering or formatting in a body runs on every
  recomposition; use `remember(key) { }` or the state holder.
- **Composables can skip.** Check the Kotlin version and Compose compiler options. With strong
  skipping (default from Kotlin 2.0.20), a new object built in the parent's body
  (`items.filter { }`, `listOf(...)`) recomposes the child every time. Without it, an unstable
  parameter type (a `var`, a `List`) prevents skipping. A false `@Stable`/`@Immutable` makes the
  UI show stale values.
- **No write after read** in the same composition: it recomposes every frame.
- **Long lists are lazy:** `Column` + `forEach` over growing data composes every item; use
  `LazyColumn`. `items` with no `key` recomposes every item after an insert and ties state to
  position; key on a stable id.

Views: `notifyDataSetChanged()` instead of `ListAdapter` with `DiffUtil`; nested `LinearLayout`
weights. Web: new objects or functions passed to memoized children on each render; long lists
without virtualization.

## Startup

Everything before the first screen is usable: on Android, every `ContentProvider` (App Startup
and library-merged ones), `Application.onCreate` and its dependencies, and the launch activity;
on a server or CLI, the boot path.

- **Only what the first screen needs.** Other SDKs, warm-ups and dependencies start lazily
  (`by lazy`, `Lazy<T>`, on-demand initializers) or after the first frame.
- **No waiting on I/O:** a large `SharedPreferences` first read,
  `runBlocking { dataStore.data.first() }`, a network call before the first frame, a splash held
  by `setKeepOnScreenCondition` until a request returns.
- **Release stays optimized:** no `isMinifyEnabled = false` in release, no removed baseline
  profile or `androidx.profileinstaller`.

## Measurements

A claim needs a measurement when the step sets a number (startup time, frame rate, response
time, memory ceiling); when the diff adds complexity for speed or memory (a cache, memoization,
parallel work, a custom data structure, stability annotations); when the PR gives a speed-up as
its reason; or when it adds work of unknown size to a per-frame, main-thread or startup path.
Costs that reading settles (network on the main thread, a query per item, quadratic work) need no
measurement.

A measurement counts when it comes from the PR, covers the claimed path at realistic size,
compares with and without the change, and uses a release-like build (Android debug builds are
much slower, Compose most of all). Macrobenchmark, Microbenchmark, JMH, Perfetto or profiler
traces, Layout Inspector recomposition counts, Compose compiler reports and `EXPLAIN QUERY PLAN`
count. Reasoning, "feels faster", a single run or a number with no baseline do not. A missing
benchmark in the repository is graded as a missing test.

## Severity

Grade by what the user pays once the data reaches the size it grows to in use.

| Situation | Severity |
|-----------|----------|
| Network, database or a wait on other work on the main thread or an event loop | `blocker` |
| A network round trip per item of a list a screen or request waits on | `blocker` |
| Quadratic work on a growing collection on a path the user waits on | `blocker` |
| A growing list composed or rendered in full instead of lazily | `blocker` |
| A composable writes state it has read, recomposing every frame | `blocker` |
| The first screen waits on a network call | `blocker` |
| Bounded file or preference I/O on the main thread | `should-fix` |
| A local database query per item | `should-fix` |
| A growing collection held whole in memory, or a cache with no size limit | `should-fix` |
| A new query on a growing table with no index for its filter, join or sort | `should-fix` |
| Writes in a loop each committing alone | `should-fix` |
| Unchanging work redone per frame, item or request | `should-fix` |
| A state change or frame redoes more than what changed | `should-fix` |
| A false stability annotation | `should-fix` |
| Unneeded work added to startup, or release loses R8 or its baseline profile | `should-fix` |
| A claim that needs a measurement (see above) has none that counts | `should-fix` |
| A speed-up given as reason, no measurement, for a change that adds no complexity | `nit` |
| A cost only at sizes the data rarely reaches, with a fix that adds no complexity | `nit` |

## Findings

Name the path, how often it runs or how its input grows, and the cost, at the line that adds it.
A measurement request says what to measure and in which build.

- `[blocker] app/src/main/java/app/App.kt:23 - waits on a network call in Application.onCreate, so every cold start lasts as long as the request`
- `[should-fix] app/src/main/java/orders/data/OrderRepository.kt:41 - one itemsFor query per order, so history grows by a query per order placed; use one IN query or a @Relation`
- `[should-fix] feature/profile/src/main/kotlin/profile/ProfileScreen.kt:48 - reads the scroll offset in the body, so the whole screen recomposes every frame of a scroll; read it inside graphicsLayer { }`
