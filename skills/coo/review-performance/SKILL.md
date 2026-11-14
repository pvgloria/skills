---
name: review-performance
description: "How to review the performance of a pull request: check work on hot paths and the main thread, query count and shape, how time and memory grow with large collections, rendering and recomposition, and startup, with Android cases such as Room queries, Compose stability, lazy lists and app startup, ask for a measurement where a speed or memory claim needs one, and grade each finding blocker, should-fix or nit. Use when checking whether a PR's changes make the code slower or heavier. Do NOT use when a person asks for a code review or for feedback on a diff, or to measure, profile or optimize code."
---

# Review: performance

This review answers six questions about the PR, and only these:

1. Does the code the diff adds keep blocking and repeated work off its hot paths?
2. Does it run no more queries and requests than it needs, each reading only what it uses?
3. Do its time and memory grow no faster than they must with the collections it handles?
4. Does its UI redo only the work that a state change or a frame needs?
5. Does it keep work the first screen does not need off the startup path?
6. Is every speed or memory claim the PR depends on backed by a measurement?

A cost is a finding only when you can name two things: where it is paid, as a path and how often
it runs or how large its input grows, and what it costs there: a blocked main thread, dropped
frames, extra queries per screen or request, memory that grows with the data, a slower start. A
cheaper way to write code that runs rarely, or only on small and bounded input, is not a finding.

Each check applies to any stack. Where an example names an Android or Kotlin API, check the
equivalent in the stack the PR uses.

## 1. Map where the code runs

Before looking for costs, settle where each changed piece of code runs, how often, on how much
data, and what you judge it against.

- **Where and how often.** For each function, composable, query, handler or initializer the diff
  adds or changes, read its callers at the PR head. Note the thread it runs on and how often it
  runs: once at startup, per screen or request, per item, per frame. Code on the main thread or an
  event loop, and code that runs per frame, per item or per request, is a hot path.
- **How large the data grows.** For each collection, table, file or response the changed code
  handles, find what bounds it: a fixed set, a limit the code enforces such as a page size, or
  nothing, as with messages, history and anything else that grows with use. Test fixtures do not
  show real sizes.
- **Targets.** Besides the checks below, you judge against any target the project sets, such as
  a startup time in its docs or a performance check in CI.
- **Claims.** Note each claim about speed or memory, in the PR description, its commits and code
  comments, or the step goal and acceptance criteria, and each measurement the PR shows. Section 7
  checks them.

Review what the diff adds or changes, and the existing code it puts on a hotter path: a new caller
that runs an old function per item or on the main thread makes that function's cost this diff's.
A slow path the diff neither changes nor calls more often is not a finding. Files that do not run,
such as docs, have no cost to check, except build settings that change how the code is compiled.

## 2. Check work on hot paths

- **Nothing blocks the main thread or an event loop.** Look for network calls, database queries,
  file and preference I/O, `runBlocking`, `Thread.sleep`, `.get()` or `.join()` on a future, and
  decoding of large JSON or images in lifecycle callbacks, click handlers, composable bodies,
  `onBindViewHolder`, and `ViewModel` functions before they switch dispatcher. A `suspend`
  function does not leave the main thread by itself: blocking work inside it needs
  `withContext(Dispatchers.IO)`, or `Dispatchers.Default` for CPU work, or an API that moves it,
  such as Room's `suspend` and `Flow` queries. On a server, a blocking call in an async handler,
  such as `readFileSync` in Node or a JDBC call in a coroutine or reactive handler, stalls every
  request that thread serves.
- **Nothing is redone that could be done once.** In loops, `onDraw`, `onBindViewHolder`,
  composable bodies and request handlers, look for work with the same result on every call:
  compiling a `Regex`, creating a date formatter, a JSON parser (`Gson()`, `Json { }`,
  `ObjectMapper`) or a `Paint`, reading the same config value. Objects created in `onDraw` or a
  per-frame callback also trigger garbage collection during frames.

Whether code is safe or correct on another thread is not part of this check. What it costs on the
thread it runs on is.

## 3. Check query count and shape

For each database query and network request the changed code issues, count how many run for one
screen, request or operation, and check what each one reads.

- **One query per item.** A query or request inside a loop or `map` over the results of an earlier
  one: a DAO call per order to load its items, a request per id, an ORM relation loaded lazily per
  row (JPA `FetchType.LAZY`, Django without `select_related`). A join, an `IN (...)` query, a Room
  `@Relation` or a batch endpoint does the same work in one round trip. A round trip to another
  host costs far more than a query to a local SQLite database, and section 8 grades them apart.
- **Reading more than is used.** `SELECT *` where the code uses a few columns, above all when the
  others hold blobs or long text. Rows loaded, then filtered, counted or paged in memory:
  `getAll().filter { }`, `.size` instead of `COUNT(*)`, `take` instead of `LIMIT`.
- **An index for each filter and sort.** For a query the diff adds or changes on a table that
  grows with use, find the indexes at the PR head (Room `@Index`, schema files, ORM declarations)
  and check that its `WHERE`, `JOIN` and `ORDER BY` columns can use one. A leading wildcard
  (`LIKE '%term'`) or a function on the column (`lower(name) = ?`) keeps a query off the index.
- **Writes in one transaction.** SQLite commits each statement on its own unless it runs inside a
  transaction, so writes in a loop pay one commit each. A list `@Insert` or `withTransaction { }`
  writes them together.
- **Observed queries read only what the screen shows.** A Room `Flow` query runs again whenever
  any table it reads changes, so a join over tables the screen does not need re-runs on every
  write to them.

Whether a query is built safely from its input, and how stored data is upgraded between schema
versions, are not part of this check. How many queries run, and how much each one reads, is.

## 4. Check large collections

For each collection, file or stream that grows with use, check how the time and memory the code
takes grow with its size:

- **Lookups inside loops.** `contains`, `indexOf` or `find` on a list inside a loop over another
  large list is quadratic. A `Set` or `Map` built once (`toSet()`, `associateBy`) makes it linear.
- **Rebuilding in a loop.** `list = list + item` or `text += part` in a loop copies everything
  built so far on each pass; `buildList` or a `StringBuilder` does not.
- **Everything in memory at once.** A whole table, file or response read into memory where the
  code could page or stream it: `readText()` on a file with no size bound, `toList()` on a large
  `Flow`, every page of an API fetched before the first is shown. Paging (Paging 3, keyset
  pagination) and streaming (`useLines`, a streaming parser) keep memory flat.
- **Caches that only grow.** A map used as a cache with no size limit keeps every entry for the
  life of the process. `LruCache`, or any cache with a maximum size, bounds it.

Whether a large input crashes the code or breaks a hard size limit is not part of this check. How
the time and memory the code takes grow with the input, when it works, is.

## 5. Check rendering

At 60 Hz a frame has about 16 ms for all the work the UI thread does in it; at 120 Hz, about 8 ms.
For each piece of UI the diff adds or changes, check what one state change, or one frame of
scrolling or animation, makes it redo.

In Jetpack Compose:

- **Fast-changing state is read late.** A scroll offset, animation value or drag position read in
  a composable body recomposes that scope on every frame. Read in a lambda in the layout or draw
  phase (`Modifier.offset { }`, `graphicsLayer { }`, `drawBehind { }`), it skips composition.
  When the UI depends only on a threshold, such as whether the list is scrolled at all,
  `derivedStateOf` recomposes only when it is crossed.
- **Work in a composable body is remembered.** Sorting, filtering or formatting data in a
  composable body runs on every recomposition; `remember(key) { }` or the state holder runs it
  once per change.
- **Composables can skip.** How Compose compares arguments depends on the compiler: check the
  Kotlin version, the Compose compiler options and any stability configuration file. With strong
  skipping, the default from Kotlin 2.0.20, an unstable argument is compared by instance, so a new
  object built in the parent's body on each recomposition (`items.filter { }`, `listOf(...)`)
  recomposes the child every time. Without strong skipping, a parameter of an unstable type, such
  as a class with a `var` or a `List`, stops the composable from skipping at all. A `@Stable` or
  `@Immutable` annotation on a type whose data changes without Compose being notified lets Compose
  skip a composable whose data did change, so the UI shows stale values.
- **No write after a read.** A composable that writes a state after reading it in the same
  composition recomposes again, and writes again, on every frame.
- **Long lists are lazy.** A list that grows with use, built with `Column` and `forEach`, composes
  and measures every item, on screen or not; `LazyColumn` composes the visible ones. In a lazy
  list, `items` with no `key` ties item state to position, so inserting, removing or moving an
  item recomposes every item after it, and their remembered state stays with the position instead
  of the item. A stable id as `key` avoids both.

In Android Views, the same checks find `notifyDataSetChanged()` where `ListAdapter` with
`DiffUtil` updates only what changed, and nested `LinearLayout` weights, which measure their
children twice per level. In web UIs, they find a new object or function passed on each render to
a memoized child, and a long list rendered without virtualization.

Which layer owns a piece of UI state is not part of this check. How much work each change to it,
and each frame, costs is.

## 6. Check startup

The startup path is everything that runs before the first screen is usable. On Android, that is
every `ContentProvider`, including App Startup initializers and those libraries merge into the
manifest, then `Application.onCreate` with the dependencies created for it, then the launch
activity up to the content the user waits for. On a server or a CLI, it is the boot path up to the
first request served or command run.

For each piece of work the diff adds to that path or moves onto it, check:

- **The first screen needs it.** An SDK, a cache warm-up or a dependency the first screen does not
  use can start lazily (`by lazy`, an injected `Lazy<T>`, an App Startup initializer run on
  demand) or after the first frame.
- **It does not wait on I/O.** The first read of a large `SharedPreferences` file waits for the
  whole file. `runBlocking { dataStore.data.first() }` blocks the main thread on disk. A network
  call before the first frame, or a splash screen held with `setKeepOnScreenCondition` until a
  request returns, makes every cold start as slow as the network.
- **The release build stays optimized.** Turning off R8 in the release build
  (`isMinifyEnabled = false`), or removing a baseline profile or `androidx.profileinstaller`,
  slows startup and the first run of every code path.

Whether a library is set up correctly, and in the order its dependencies need, is not part of
this check. What its setup costs on the startup path is.

## 7. Ask for a measurement where a claim needs one

Reading the code shows what work runs and how it grows; it does not show how long that work takes
on a device or a server. A claim needs a measurement when:

- the step goal or an acceptance criterion sets a number: a startup time, a frame rate, a response
  time, a memory ceiling;
- the diff adds complexity or risk for speed or memory: a cache and its invalidation, memoization,
  parallel work, a hand-written data structure, precomputed data, stability annotations;
- the PR gives a gain ("faster", "fixes jank") as a reason for the change;
- the diff adds work of unknown size to a per-frame, main-thread or startup path, and whether it
  fits the budget depends on data or devices the code does not show.

A cost that reading settles needs no measurement: a network call on the main thread, a query per
item, quadratic work over a collection that grows with use. Report it as it is.

The measurement comes from the PR: numbers in its description, a linked report or trace, or the
output of a benchmark it adds. It counts when it:

- measures the path the claim is about, with data of the size the claim is about;
- shows the code with and without the change, under the same conditions;
- comes from a build configured like the one that ships. An Android debug build is debuggable
  and not minified, and runs much slower than a release build, Compose code most of all.

A Macrobenchmark result, a Microbenchmark or JMH result, a Perfetto or profiler trace,
recomposition counts from the Layout Inspector, Compose compiler reports for a stability claim and
`EXPLAIN QUERY PLAN` output for an index can all count. Reasoning, "feels faster", a single run,
and a number with nothing to compare it to do not.

Whether the repository keeps a benchmark for the path is not part of this check: a benchmark is a
test, and a missing one is graded as a missing test. Whether the PR's claims rest on a
measurement is.

## 8. Grade each finding

Grade by what the user pays once the data reaches the size it grows to in use.

| Situation | Severity |
|-----------|----------|
| A network call, a database query or a wait on other work runs on the main thread or an event loop | `blocker` |
| A round trip to another host runs per item of a list that a screen or request waits on | `blocker` |
| Work quadratic in a collection that grows with use runs on a path the user waits on | `blocker` |
| A list that grows with use is composed or rendered in full instead of lazily | `blocker` |
| A composable writes a state it has read, so it recomposes on every frame | `blocker` |
| The first screen waits on a network call | `blocker` |
| File or preference I/O of a bounded size runs on the main thread | `should-fix` |
| A query to a local database runs per item of a list | `should-fix` |
| A collection that grows with use is held whole in memory where it could be paged or streamed, or a cache has no size limit | `should-fix` |
| A new query on a table that grows with use filters, joins or sorts on columns no index covers | `should-fix` |
| Writes in a loop each commit on their own | `should-fix` |
| Work whose result does not change is redone per frame, per item or per request | `should-fix` |
| A state change or a frame recomposes, rebinds or redraws more than what changed | `should-fix` |
| A stability annotation is false, so the UI can show stale values | `should-fix` |
| Work the first screen does not need is added to the startup path, or the release build loses R8 or its baseline profile | `should-fix` |
| The step sets a number, the diff adds complexity or risk for a gain, or it adds work of unknown size to a per-frame, main-thread or startup path, and the PR shows no measurement that counts | `should-fix` |
| The PR gives a gain as a reason, with no measurement, for a change that adds no complexity or risk | `nit` |
| A cost that shows only at sizes the data rarely reaches, with a fix that adds no complexity | `nit` |

Code that runs only in tests, debug builds or developer tooling is not a finding.

## 9. Write the findings

Each finding names the path, how often it runs or how its input grows, and what it costs there.
Point the location at the line that adds the cost: the call, the loop, the query, the state read,
the initializer. A request for a measurement says what to measure, and in which build.

From check to finding:

- `Application.onCreate` calls `runBlocking { configApi.fetch() }`.
  → `[blocker] app/src/main/java/app/App.kt:23 - waits on a network call in Application.onCreate, so every cold start lasts as long as the request, and an offline start until it times out`
- `GET /feed` calls `userClient.getProfile(post.authorId)` for each post on the page.
  → `[blocker] server/src/main/kotlin/feed/FeedRoutes.kt:57 - one call to the user service per post, so a page of 50 posts waits on 50 round trips before it responds`
- `OrderRepository.loadHistory()` runs `itemDao.itemsFor(order.id)` for every order the user has
  placed.
  → `[should-fix] app/src/main/java/orders/data/OrderRepository.kt:41 - one itemsFor query per order, so the history grows by a query for every order placed; one IN query or a @Relation loads them together`
- `ProfileScreen` reads `listState.firstVisibleItemScrollOffset` in its body to fade the header.
  → `[should-fix] feature/profile/src/main/kotlin/profile/ProfileScreen.kt:48 - reads the scroll offset in the screen's body, so the whole screen recomposes on every frame of a scroll; read it inside graphicsLayer { }`
- `LazyColumn { items(messages) { MessageRow(it) } }`, where new messages arrive at the top.
  → `[should-fix] feature/chat/src/main/kotlin/chat/ChatScreen.kt:72 - items has no key, so each new message at the top recomposes every visible row; key the items on the message id`
- The diff adds a cache with its own invalidation to `PriceRepository`; the description says it
  makes the cart faster and shows no numbers.
  → `[should-fix] app/src/main/java/cart/data/PriceRepository.kt:30 - adds a cache and its invalidation for a speed-up the PR does not measure; show the cart's load time with and without it, in a release build`
