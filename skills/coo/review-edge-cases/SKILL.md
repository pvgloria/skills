---
name: review-edge-cases
description: "How to review the edge cases of a pull request: check how the code the diff changes handles empty, null, boundary and large inputs, failures, cancellation and concurrent use, check whether the tests for those cases assert the behaviour, and grade each finding blocker, should-fix or nit. Use when checking whether a PR's changes cover their edge cases and do not break on them. Do NOT use when a person asks for a code review or for feedback on a diff."
---

# Review: edge cases

Check the code the diff adds or changes, and existing code it now passes new inputs into, for:
inputs, failures, cancellation, concurrency, and the tests for those cases.

A case is a finding only when you can name **the input or event that triggers it** and **what
goes wrong**: a crash, hang, wrong result, stuck or inconsistent state, lost or duplicated data,
a leak, or a failure that reads as success. Follow each value back to its source: a case the
types or the callers rule out is not a finding. Non-nullable types rule out null, except for
values from the network, disk, database, platform APIs, Java interop or casts.

Before you start, find how the project reports failures (a `Result` type, error state,
exceptions caught at a boundary) and how its tests are set up (fakes, test dispatcher, virtual
clock).

Out of this review: hostile input (security), how long large inputs take (performance), data
in an older stored format (migrations), and which error mechanism the project should use.

## Inputs

- **Empty:** empty collection or string, zero, a `Flow` that never emits, no body, no rows.
  Watch `first()`, `[0]`, `max()`, `reduce`, `single()`, division by a count, and screens with
  no "loaded, nothing to show" state.
- **Null or missing:** absent field or key, failed lookup, unset optional. Watch `!!`, `!`,
  `.get()`, and defaults that hide an absence the caller needed to know about.
- **Boundaries:** zero, one, last index, first and last page, negatives, type min/max. Watch
  `until` vs `..`, `<` vs `<=`, 32-bit overflow on millis, cents or bytes, time zones and DST,
  month ends, emoji length, locale-dependent parsing.
- **Unknown values:** a new enum value or status code. A `when`/`switch` `else` that treats it
  as a known value and changes the result is a finding.
- **Large:** thousands of items, long strings, deep structures, large files. Watch loading it
  all into memory, deep recursion, and hard limits: Android's ~1 MB Binder limit on `Intent`,
  `Bundle` and saved state, SQLite's bound-variable limit in `IN (...)`, request size limits,
  API page size caps.

## Failures

For each operation that can fail (I/O, network, parsing, database write, platform call):

- The caller gets an error it can act on, through the project's mechanism. Not a crash, and not
  an empty result that reads as "no data".
- No catch is wider than needed: a catch-all that drops the error, or traps programming errors,
  hides bugs.
- State stays consistent: multi-step writes complete or roll back, flags like `isLoading` are
  reset on failure, resources close on every path (`use`, `finally`, `defer`).
- Retries are bounded and only wrap operations safe to repeat.
- One failed item in a batch does not silently drop the others.

## Cancellation

For each piece of async work the diff starts or changes:

- **The signal propagates.** `catch (e: Exception)`, `catch (e: Throwable)` and `runCatching`
  around a suspend call also catch `CancellationException`: rethrow it. Same trap elsewhere: a
  JS `AbortError` treated as a failure, Java `InterruptedException` without restoring the flag,
  a Go loop that never reads `ctx.Done()`.
- **The work stops.** Long loops check `ensureActive()`/`yield()` or the stack's equivalent.
- **Cleanup runs.** Release in `finally`; suspending cleanup needs
  `withContext(NonCancellable)`; callback-based flows unregister in `awaitClose`.
- **State stays consistent** if cancelled between two writes.
- **An older request cannot overwrite a newer one.** Look for `collectLatest`, `flatMapLatest`,
  `switchMap`, an `AbortController` or a request id.
- **Waits are bounded.** `withTimeout` throws a `CancellationException` that silently ends the
  coroutine; `withTimeoutOrNull` or catching it turns it into a handled failure.

## Concurrency

When the code can run more than once at a time, or shares state with code that can:

- **Shared mutable state** needs a lock, `Mutex`, atomic or single-thread confinement.
  Check-then-act and `_state.value = _state.value.copy(...)` (instead of `_state.update { }`)
  lose updates.
- **Repeated triggers:** double tap, overlapping retry, lifecycle event firing again. Look for a
  guard: disabled while running, single-flight, idempotency key.
- **Ordering:** results assumed to arrive in request order; events emitted before anyone
  collects (`SharedFlow` with `replay = 0`); one-off events held in a `StateFlow`.
- **Thread confinement:** UI state written off the main thread; non-thread-safe objects shared
  (database handle, date formatter, plain hash map).
- **Deadlocks:** locks taken in opposite orders; a blocking wait (`runBlocking`, `.get()`,
  `.join()`) on the thread the awaited work needs.

## Tests

For each case the code handles, when a test makes sense, the test must drive the case (empty
input, fake error, cancelled job, concurrent calls) and assert the outcome. A test that only runs
the code, only asserts nothing was thrown, or only verifies a mock was called does not count.
Async tests must control time (test dispatcher, virtual time, fake clock), not real `sleep` or
`delay`. One test per distinct behaviour is enough.

## Severity

Grade a case by what happens in use, whether or not a test exists; a missing test is a separate
finding.

| Situation | Severity |
|-----------|----------|
| A reachable input or event crashes, hangs or deadlocks | `blocker` |
| Stored or sent data is lost, corrupted or duplicated (half-done write, lost update, double submit) | `blocker` |
| Cancellation swallowed, so cancelled work keeps running or writing | `blocker` |
| Shared mutable state accessed concurrently with no synchronization | `blocker` |
| Wrong result or recoverable stuck state (empty shown as loading, page off-by-one, stale response wins, flag never reset) | `should-fix` |
| A failure dropped with no result, error or log | `should-fix` |
| A cancellation reported as a failure (logged, shown or retried) | `should-fix` |
| A resource or registration not released on an error or cancellation path | `should-fix` |
| A case no current caller reaches but the public signature allows | `nit` |
| A handled case with no test that drives it and asserts the outcome | `nit` |
| A test that passes or fails by timing | `nit` |

## Findings

Name the case concretely and what goes wrong, at the line that breaks or where handling is
missing:

- `[blocker] app/src/main/java/orders/OrderSummary.kt:27 - maxBy throws NoSuchElementException for a new account, whose order list is empty`
- `[blocker] app/src/main/java/sync/SyncPoller.kt:33 - the catch also traps CancellationException, so the loop never exits when the scope is cancelled`
- `[should-fix] app/src/main/java/search/SearchViewModel.kt:52 - a slow response for an older query can arrive last and replace the newer results`
