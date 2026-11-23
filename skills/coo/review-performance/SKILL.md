---
name: review-performance
description: "How to review the performance of a pull request: check work on hot paths and the main thread, query count and shape, how time and memory grow with large collections, rendering and recomposition, and startup, with Android cases such as Room queries, Compose stability, lazy lists and app startup, ask for a measurement where a speed or memory claim needs one, and grade each finding fail or note. Use when checking whether a PR's changes make the code slower or heavier. Do NOT use when a person asks for a code review or for feedback on a diff, or to measure, profile or optimize code."
---

# Review: performance

Check the code the diff adds or changes, and existing code it puts on a hotter path, for: hot
paths, queries, large collections, rendering, startup, and claims that need a measurement.

A cost is a finding only when you can name **where it is paid** (the path, and how often it runs
or how large its input grows) and **what it costs** (a blocked main thread, dropped frames, extra
queries per screen or request, memory that grows with the data, a slower start). A cheaper way to
write code that runs rarely or on small, bounded input is not a finding. Android and Kotlin APIs
below are examples: check the equivalent in the PR's stack.

Before you start, for each changed piece, read its callers and note its **thread and frequency**
(main thread or event loop; once, per screen or request, per item, per frame: the last four are
hot paths), what bounds its **data size** (a fixed set, a page size, or nothing; test fixtures do
not show real sizes), and any **speed or memory claim** in the PR, its commits or the task.

Out of this review: correctness on other threads and crashes on large input (edge cases), safe
query building (security), and code that runs only in tests, debug builds or tooling.

## Hot paths

- **Nothing blocks the main thread or an event loop:** network, database, file and preference
  I/O, `runBlocking`, `Thread.sleep`, `.get()`/`.join()`, decoding large JSON or images. Look in
  lifecycle callbacks, click handlers, composable bodies and `ViewModel` code before a dispatcher
  switch. `suspend` alone does not leave the main thread: blocking work needs
  `withContext(Dispatchers.IO)` or an API that moves it, such as Room's `suspend` and `Flow`
  queries.
- **Nothing redone that could be done once:** a `Regex`, a date formatter, a JSON parser or a
  `Paint` built inside loops, `onDraw`, `onBindViewHolder`, composable bodies or request handlers.

## Queries and requests

Count how many run for one screen, request or operation, and what each reads.

- **One per item:** a query or request inside a loop over earlier results, or lazy ORM
  relations. Use a join, `IN (...)`, Room `@Relation` or a batch endpoint.
- **Reading more than used:** `SELECT *` with blobs; filtering, counting or paging in memory
  (`getAll().filter { }`, `.size` instead of `COUNT(*)`).
- **Indexes:** a new query on a growing table can use an index for its `WHERE`, `JOIN` and
  `ORDER BY` columns.
- **Writes in one transaction:** a list `@Insert` or `withTransaction { }`, not one commit per row.
- **Observed queries:** a Room `Flow` re-runs on every write to any table it reads.

## Large collections

- **Lookups in loops:** `contains`, `indexOf` or `find` on a large list inside a loop is
  quadratic; build a `Set` or `Map` once.
- **Rebuilding in loops:** `list = list + item`, `text += part`; use `buildList` or
  `StringBuilder`.
- **All in memory:** `readText()` with no size bound, `toList()` on a large `Flow`, every API page
  fetched before the first is shown. Page or stream instead.
- **Caches that only grow:** maps with no size limit; use `LruCache` or a bounded cache.

## Rendering

A frame has ~16 ms at 60 Hz, ~8 ms at 120 Hz. Check what one state change or one frame makes the
UI redo.

- **Fast-changing state read late.** Scroll, animation or drag values read in a composable body
  recompose every frame; read them in `Modifier.offset { }`, `graphicsLayer { }` or
  `drawBehind { }`, or use `derivedStateOf` for a threshold.
- **Work remembered.** Sorting, filtering or formatting in a body runs on every recomposition;
  use `remember(key) { }` or the state holder.
- **Composables can skip.** A new object built in the parent's body (`items.filter { }`,
  `listOf(...)`) recomposes the child every time; without strong skipping, so does an unstable
  parameter type. A false `@Stable`/`@Immutable` shows stale values.
- **No write after read** in the same composition: it recomposes every frame.
- **Long lists are lazy:** `LazyColumn` with a stable `key`, not `Column` + `forEach` over growing
  data. Views: `ListAdapter` with `DiffUtil`, not `notifyDataSetChanged()`.

## Startup

Everything before the first screen is usable: `ContentProvider`s (library-merged ones
included), `Application.onCreate` and its dependencies, the launch activity; on a server or CLI,
the boot path.

- **Only what the first screen needs.** Other SDKs and warm-ups start lazily or after the first
  frame.
- **No waiting on I/O:** a network call before the first frame, `runBlocking` on DataStore, a
  splash held until a request returns.
- **Release stays optimized:** no `isMinifyEnabled = false` in release, no removed baseline
  profile.

## Measurements

A claim needs a measurement when the task sets a number (startup time, frame rate, response
time, memory ceiling), when the diff adds complexity for speed or memory (a cache, memoization,
parallel work, stability annotations), or when the PR gives a speed-up as its reason. Costs that
reading settles (network on the main thread, a query per item, quadratic work) need none.

A measurement counts when it comes from the PR, covers the claimed path at realistic size,
compares with and without the change, and uses a release-like build: Macrobenchmark,
Microbenchmark, Perfetto or profiler traces, recomposition counts, `EXPLAIN QUERY PLAN`.
Reasoning, "feels faster" or a number with no baseline do not.

## Grading

Grade by what the user pays once the data reaches the size it grows to in use.

| Situation | Grade |
|-----------|-------|
| Network, database or a wait on other work on the main thread or an event loop | `fail` |
| A network round trip or a database query per item of a list a screen or request waits on | `fail` |
| Quadratic work on a growing collection on a path the user waits on | `fail` |
| A growing list rendered in full instead of lazily | `fail` |
| A composable writes state it has read, or reads fast-changing state in its body | `fail` |
| The first screen waits on a network call, or unneeded work added to startup | `fail` |
| A growing collection held whole in memory, or a cache with no size limit | `fail` |
| A new query on a growing table with no index for its filter, join or sort | `fail` |
| Writes in a loop each committing alone | `fail` |
| Unchanging work redone per frame, item or request | `fail` |
| A false stability annotation, or release loses R8 or its baseline profile | `fail` |
| Bounded file or preference I/O on the main thread | `fail` |
| A claim that needs a measurement has none that counts | `fail` |
| A speed-up given as reason, no measurement, for a change that adds no complexity | `note` |
| A cost only at sizes the data rarely reaches, with a fix that adds no complexity | `note` |

## Findings

Name the path, how often it runs or how its input grows, and the cost, at the line that adds it.
A measurement request says what to measure and in which build.

- `app/src/main/java/app/App.kt:23 - waits on a network call in Application.onCreate, so every cold start lasts as long as the request`
- `app/src/main/java/orders/data/OrderRepository.kt:41 - one itemsFor query per order, so history grows by a query per order placed; use one IN query or a @Relation`
