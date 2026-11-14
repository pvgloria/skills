---
name: review-edge-cases
description: "How to review the edge cases of a pull request: check how the code the diff changes handles empty, null, boundary and large inputs, failures, cancellation and concurrent use, check whether the tests for those cases assert the behaviour, and grade each finding blocker, should-fix or nit. Use when checking whether a PR's changes cover their edge cases and do not break on them. Do NOT use when a person asks for a code review or for feedback on a diff."
---

# Review: edge cases

This review answers five questions about the PR, and only these:

1. Does the code the diff adds or changes behave correctly on empty, null, boundary and large
   inputs?
2. Does a failure leave a defined result and a consistent state?
3. Does cancelled work stop, clean up and leave a consistent state?
4. Does running concurrently, or being triggered twice, lose, duplicate or corrupt nothing?
5. Do the tests for these cases assert the behaviour, rather than only run the code?

A case is a finding only when you can name two things: the input or event that triggers it, and
what goes wrong when it arrives. What goes wrong is a crash, a hang, a wrong result, a stuck or
inconsistent state, lost or duplicated data, a leak, or a failure that reads as success. "What if
the list is empty?" with no consequence is not a finding. Neither is a case the code cannot
reach: follow each value back to its source before reporting it.

## 1. Set the baseline

Before walking the cases, settle what each changed unit promises and how the project handles
failures and tests.

- **The units.** List each function, handler, component, query, mapper or script the diff adds
  or changes behaviour in. When the diff holds no executable code, apply the checks to any
  procedure it defines, such as a CI job or written step-by-step instructions: what happens when
  an input is missing or empty, and when a step fails. Prose that defines no procedure has no
  edge cases.
- **The contract of each unit.** From its signature, its doc-comment, the step goal and
  acceptance criteria, and its callers at the PR head, work out which inputs it can receive and
  what it should return or do for each. The type system rules some cases out: a non-nullable
  Kotlin or Swift parameter cannot be null. A value from the network, the disk, a database, a
  platform API, Java interop or a cast can be null or malformed whatever its declared type.
- **The project's error mechanism.** Find how the project reports failures: a `Result` or sealed
  error type, a safe-call wrapper, exceptions caught at a boundary, an error state in the UI. A
  failure is handled when it reaches that mechanism. Which mechanism the project should use is
  not part of this review.
- **The project's tests.** Find where tests for each kind of changed code live and what they
  use: the framework, fakes, a test dispatcher or a virtual clock.

Review what the diff adds or changes, and the existing code it passes new inputs into: a new
caller that hands an empty list to an old function that fails on one is this diff's case. A
broken case in code the diff does not touch or call is not a finding.

## 2. Check inputs: empty, null, boundary, large

For each input to a changed unit (parameters, data read from the network, disk or a database,
user input, configuration, platform callbacks), walk these values and follow each through the
code:

- **Empty.** An empty collection or string, a blank string, zero, a stream or `Flow` that
  completes without emitting, a response with no body, a query with no rows. Look for calls that
  fail on empty (`first()`, `[0]`, `max()`, `reduce`, `single()`), a division by a count, and a
  screen that has no state for "loaded, nothing to show" and stays on its spinner.
- **Null and missing.** An absent field or map key, a lookup that finds nothing, an optional
  that was never set, a null from a platform or interop call. Look for force-unwraps (`!!`, `!`,
  `.get()` on an empty optional) and for defaults that hide an absence the caller needed to know
  about. Where data comes from the network or from storage, walk each null and missing field
  through the mapping into the project's own types.
- **Boundaries.** Zero, one, the last index, the first and last page, negative values where only
  positive ones were assumed, and the minimum and maximum of the type. Off-by-one errors hide in
  ranges (`until` against `..`, `<` against `<=`) and in pagination. Sums of milliseconds, cents
  or byte counts can overflow a 32-bit integer. Dates break at time zones, daylight-saving
  changes, month ends, leap days and the epoch. Strings break on emoji and combining characters,
  where the length in code units is not the number of characters, and on locale-dependent
  formatting and parsing, such as a decimal comma.
- **Unknown values.** An enum value or response type the server adds later, an unexpected status
  code. Check what the mapping does with it: crash, drop the whole response, or fall back. A
  `when` or `switch` whose `else` branch quietly treats an unknown value as a known one is a
  finding when that changes the result.
- **Large.** Inputs far larger than the test data: thousands of items, a long string, a deep
  structure, a large file. Check whether the code breaks: running out of memory by loading
  everything at once, overflowing the stack through recursion, or exceeding a size limit. Known
  limits include the roughly 1 MB Binder transaction limit on Android, which data passed in an
  `Intent`, a `Bundle` or saved instance state must fit under; the SQLite limit on bound
  variables in an `IN (...)` list; a request body limit; and a page size the API caps. How long a
  large input takes, or how much memory it uses when it works, is not part of this check.

These are inputs that are unexpected but not hostile: empty, null, out of range, too large, or
malformed by a bug. Input crafted to attack the code, such as injection, path traversal or a size
chosen to exhaust memory, is not part of this check. When one missing check fails both ways,
report what breaks for ordinary input. Data written in an older format by an earlier version of
the app, and how it is upgraded, is not part of this check either; a value that is empty or
missing in the current format is.

## 3. Check error paths

For each operation in the changed code that can fail (I/O, network, parsing, a database write, a
platform call, a call that throws or returns an error), check that:

- **The failure reaches a defined result.** The caller gets an error it can act on, through the
  project's mechanism: an error state, a typed error, a retry. Not a crash, and not an empty
  result that reads as "no data".
- **No catch is wider than it needs to be.** A catch-all that drops the error with no result, no
  rethrow and no log hides failures. A catch that also traps programming errors turns a bug into
  a normal-looking state.
- **State stays consistent.** A multi-step write either completes or rolls back; a flag set
  before the call (`isLoading`, `isSaving`) is reset on failure too; a resource opened is closed
  on every path (`use`, `try`-with-resources, `defer`, `finally`).
- **Retries are bounded** and wrap only operations that are safe to repeat.
- **Batches fail predictably.** When one item of a batch fails, the others are not silently
  dropped, or the contract says what happens to them.

## 4. Check cancellation

Async work gets cancelled: its scope ends when a screen closes or a request is aborted, a timeout
fires, or a newer request replaces it. For each piece of async work the diff starts or changes:

- **Cancellation propagates.** A catch-all around an async call must not swallow the
  cancellation signal. In Kotlin coroutines, `catch (e: Exception)`, `catch (e: Throwable)` and
  `runCatching` around a suspend call also catch `CancellationException`: rethrow it, or use a
  wrapper that does. Other stacks have the same trap: an `AbortError` caught as an ordinary
  failure in JavaScript, an `InterruptedException` caught in Java without restoring the
  interrupt flag, a Go loop that never reads `ctx.Done()`.
- **Cancelled work stops.** A loop or long computation checks for cancellation (`ensureActive()`
  or `yield()` in coroutines, a cancellation token or `ctx.Err()` elsewhere), or it keeps running
  and writing after its owner is gone.
- **Cleanup runs on cancellation.** Resources and in-progress flags are released in `finally`.
  In coroutines, cleanup that suspends must run in `withContext(NonCancellable)`, or it is
  cancelled too. A callback or listener wrapped as a suspend function or `Flow` is unregistered
  on cancellation (`awaitClose`, `invokeOnCancellation`).
- **Cancellation midway leaves a consistent state.** Work cancelled between two writes leaves
  either both or neither. Closing the screen during a save does not stop the save halfway.
- **A superseded request cannot overwrite a newer one.** When each new query, refresh or input
  launches its own request, an older response can arrive last and replace the newer result. Look
  for the previous request being cancelled or its result ignored: `collectLatest`,
  `flatMapLatest`, `switchMap`, an `AbortController`, a request id.
- **Waits are bounded and timeouts handled.** A network call or wait with no timeout can hang.
  In coroutines, `withTimeout` throws `TimeoutCancellationException`, a `CancellationException`:
  when nothing catches it, the coroutine ends as if cancelled, with no crash and no error state.
  `withTimeoutOrNull`, or catching it where the timeout is handled, makes it a failure the code
  can act on.

Which component owns a piece of work, and whether that owner lives as long as the work must, is
not part of this check. What happens to the work when it is cancelled is.

## 5. Check concurrency

When the changed code can run more than once at the same time, or shares state with code that
can, check:

- **Shared mutable state.** A field, cache or collection that several threads or coroutines read
  and write needs a lock, a `Mutex`, an atomic or confinement to one thread or dispatcher.
  Check-then-act (`if (cache[key] == null) cache[key] = load()`) and read-modify-write
  (`_state.value = _state.value.copy(...)` instead of `_state.update { }`) lose updates even
  when each step looks safe.
- **Repeated triggers.** A double tap, a retry that overlaps the first attempt, a lifecycle event
  or subscription that fires again: the second run duplicates the work, such as a second order,
  or interleaves with the first. Look for a guard: the action disabled while it runs, a
  single-flight or dedupe, an idempotency key.
- **Ordering.** Code that assumes async results arrive in the order they were requested. Events
  emitted before anyone collects them: a hot stream without replay, such as a `SharedFlow` with
  `replay = 0`, drops them. One-off events held as state: a `StateFlow` replays the last one to a
  new collector and drops a value equal to the current one.
- **Thread confinement.** UI state written off the main thread; an object that is not
  thread-safe, such as a thread-confined database handle, a date formatter or a plain hash map,
  shared across threads.
- **Deadlocks.** Two locks taken in opposite orders in two places; a blocking wait
  (`runBlocking`, `.get()`, `.join()` on a future) on the thread or dispatcher the awaited work
  needs.

## 6. Check the tests for each case

For each case from sections 2 to 5 that the changed code handles, first judge whether a test
makes sense for it; a one-line guard may not need one. When it does, find the test at the PR
head that covers it. A test covers a case when it:

- **drives the case:** it passes the empty list, makes the fake return the error, cancels the
  job, or runs the two calls together or in the order that breaks;
- **asserts the behaviour** the contract promises for that case: the returned value, the emitted
  state, the error type, the state after cleanup, or that nothing was written. A test that only
  runs the code, asserts only that nothing was thrown, or checks that a mock was called without
  checking the outcome does not cover the case;
- **controls time and scheduling** when the case is async or concurrent: a test dispatcher,
  virtual time, a fake clock, a latch or barrier. A test that relies on real `sleep` or `delay`,
  or on how threads happen to be scheduled, passes or fails by timing and proves nothing.

Look for one test per distinct behaviour, not one per value: when empty and null take the same
branch to the same result, one test covers both.

Tests for the main behaviour the step asks for are not part of this check; tests for the edge
cases around it are. How the project names and lays out its tests is not part of this check
either.

## 7. Grade each finding

Grade a case the code does not handle by what happens when it occurs in use, whether or not a
test exists for it. A missing or weak test for a case is a finding of its own, graded separately.

| Situation | Severity |
|-----------|----------|
| A reachable input or event crashes, hangs or deadlocks the code | `blocker` |
| A case loses, corrupts or duplicates data that is stored or sent: a half-done write, a lost update, a double submit | `blocker` |
| Cancellation is swallowed or ignored, so cancelled work goes on running or writing | `blocker` |
| Shared mutable state is read and written concurrently with no synchronization | `blocker` |
| A reachable case gives a wrong result or a stuck state the user can recover from: an empty list shown as loading, an off-by-one at a page boundary, a stale response replacing a newer one, a flag never reset after a failure | `should-fix` |
| A failure is dropped with no result, error or log, so the caller cannot tell it from success or from "no data" | `should-fix` |
| A cancellation is reported as a failure: an error logged, shown or retried when the caller only went away | `should-fix` |
| A resource or registration is not released on an error or cancellation path | `should-fix` |
| A case no current caller can reach but the public signature allows, such as an input every caller already guards | `nit` |
| A case the code handles, where a test makes sense, and no test drives it and asserts the outcome | `nit` |
| A test for a case passes or fails by timing | `nit` |

A case the types or the callers rule out is not a finding at any severity.

## 8. Write the findings

Each finding names the case as concretely as you can ("an empty `orders`", "a second tap while
the first save runs", "the scope cancelled during `upload()`") and says what goes wrong. Point
the location at the line that breaks or where the handling is missing: the `first()`, the catch,
the `launch`, the unguarded write. For a test finding, point at the test, or at the line of code
whose case has no test.

From check to finding:

- `val latest = orders.maxBy { it.date }`, where `orders` comes from the API, which returns an
  empty list for a new account.
  → `[blocker] app/src/main/java/orders/OrderSummary.kt:27 - maxBy throws NoSuchElementException for a new account, whose order list is empty`
- `average = sum(durations) / len(durations)` in a daily report.
  → `[blocker] reports/summary.py:18 - divides by len(durations), which raises ZeroDivisionError for a day with no sessions`
- A `while (true)` polling loop wraps `delay(interval)` and `poll()` in
  `try { } catch (e: Exception) { log(e) }`.
  → `[blocker] app/src/main/java/sync/SyncPoller.kt:33 - the catch also traps CancellationException, so when the scope is cancelled the loop never exits and spins logging errors`
- `fun pay() = viewModelScope.launch { repository.placeOrder(cart) }`, and the button stays
  enabled while the call runs.
  → `[blocker] app/src/main/java/checkout/CheckoutViewModel.kt:64 - a second tap on Pay while placeOrder runs places the order twice`
- Each change of the query calls `launch { _results.value = repository.search(query) }`.
  → `[should-fix] app/src/main/java/search/SearchViewModel.kt:52 - a slow response for an older query can arrive after the newer one and replace its results`
- `@Test fun emptyCart() { viewModel.load(emptyList()) }`, with no assertion.
  → `[nit] app/src/test/java/cart/CartViewModelTest.kt:40 - emptyCart loads an empty list but asserts nothing about the resulting state`
