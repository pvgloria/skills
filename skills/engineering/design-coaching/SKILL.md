---
name: design-coaching
description: Coach your design judgment on Android/Kotlin/Compose code — surface where a less-experienced teammate could predictably misuse what you're shaping, name the principle, and hand you the fork to catch yourself next time. Use when shaping or reviewing the design of your own code (a base class accumulating helpers, exposed mutable state, swappable primitive params, half-valid objects, data class vs sealed for screen state), when you ask "where could this be misused / is this the right shape", or for a design pass before committing. Inward — your own growth. For writing review comments on a teammate's PR, use the code-review skill (it draws on this lens).
---

# Design Coaching

Coach your design judgment: shape Android/Kotlin code so a less-experienced teammate can't easily
misuse it — and learn to see the fork yourself next time.

## Coaching ethos

- **Validate before deferring.** Be an honest second opinion. Say whether a shape is right, a
  defensible call, or a trap waiting to be sprung — never defer by default.
- **Name the principle.** Explain *why* a shape invites misuse, not just *what* to change. You should
  leave seeing the pattern, not just this instance.
- **Calibrate the weight.** Real trap / shape smell / nitpick don't deserve the same energy. If you
  can't name a *realistic* misuse with *real* cost, it's not a finding — say so.
- **Don't pad.** No findings is a valid outcome. Don't manufacture a taxonomy to look thorough.

## The core move

It's easy to stop at "is it correct?". The design-judgment move is to go one level deeper: **is this
the right *shape*, where does a less-experienced teammate predictably misuse it, and what does the
wrong shape cost the system?**

- A `BaseViewModel` that works — but what stops it becoming a junk drawer the team grows unreviewed?
- State that's exposed and works — but can a caller `.value =` straight into it and bypass the logic?
- `fun link(aId: Long, bId: Long)` — but what stops the call site swapping the two and still compiling?

Two kinds of fork live here:

- **Directional guardrails** — one shape is safer regardless of context. A `BaseViewModel` is not
  wrong, but it *invites* juniors to make it a junk drawer; an extension that does one thing has
  almost no surface to abuse. Here there's a defensible "X over Y, except where it's fine".
- **Judgment forks** — no fixed safe side; the right choice depends on the problem. Your job is to
  hand over the *axis to reason on*, not a default (see *data class vs sealed*).

Every catalog entry carries a **where it's fine** clause. That clause is what stops the lens from
becoming a mantra — the failure mode is flagging every base class and every `open`.

Not for: routine feature code, private single-use helpers, or anywhere there's no realistic, costly
misuse — those stay silent. When the goal is to write review comments on a *teammate's* PR, use the
`code-review` skill; this skill's coaching is for your own code and designs.

## Drive the lens

When this runs as a review of your own work, lead — don't wait to be asked.

- Read the whole thing as a system, not file-by-file. Shape issues live in the connections — a base
  class the team extends, a boundary that leaks a mutable type, a state shape the next dev fills in.
- Bring the questions you didn't think to ask. Hunt cross-cutting issues proactively, even in code
  that looks clean. You can't flag what you don't see — that's the value here.
- Check for documented rationale before flagging (PLAN.md, AI.md, ADRs, inline comments). A
  principled choice with a recorded reason is not a finding — ask before flagging when it could be
  intentional.
- When something non-obvious is shaped *right*, say so. Knowing *why* a safe shape is safe is half
  the lens.

## The catalog — forks to hunt for

### 1. Base class that invites a junk drawer

**Smell:** a base class (`BaseViewModel`, `BaseRepository`) accumulates "shared" helpers; the easy
move for a junior is to add *just one more* to the base, and every subclass inherits the growing
surface.

**Extension/composition over inheritance** when the shared thing is a *behavior*, not a true is-a
relationship:

```kotlin
// Y — inheritance: open-ended surface, grows unreviewed
abstract class BaseViewModel : ViewModel() {
    protected fun launch(onError: ((UiError) -> Unit)? = null, block: suspend CoroutineScope.() -> Unit): Job { ... }
    // ...next dev adds logEvent(), then formatDate(), then...
}

// X — extension: one thing, almost no surface to abuse
internal fun ViewModel.launch(
    onError: ((UiError) -> Unit)? = null,
    block: suspend CoroutineScope.() -> Unit,
): Job { ... }
```

**Prevents:** the base becoming a god-object; unrelated concerns leaking into every subclass.

**Where it's fine:** inheritance with genuine shared *state* and a real is-a relationship. The smell
is inheritance used as a shared-utility bag.

### 2. Handing out mutable state at a boundary

**Smell:** a public/exposed property is a `MutableStateFlow` or `MutableList`. Any caller can
`.value =` or `.add()` straight into your internal state, bypassing your logic — and a junior will,
and you won't catch it in review.

**Read-only type at the boundary**, mutable kept private:

```kotlin
// Y
val state: MutableStateFlow<HomeUiState> = MutableStateFlow(...)   // callers can overwrite it

// X
private val _state = MutableStateFlow(HomeUiState())
val state: StateFlow<HomeUiState> = _state.asStateFlow()
```

**Prevents:** external mutation of internal state, silently, from anywhere.

**Where it's fine:** private/internal plumbing inside a module — the rule bites only at what you
*expose*. The safe form costs nothing, which is why it's worth doing by default at boundaries.

### 3. Primitives you can swap at the call site

**Smell:** a signature with adjacent params of the same primitive type — the call site can pass them
in the wrong order and it still compiles.

**A value class per concept:**

```kotlin
// Y — swap the two and it compiles, fails at runtime
fun link(reminderId: Long, seriesId: Long)

// X — swapping is a compile error
@JvmInline value class ReminderId(val value: Long)
@JvmInline value class SeriesId(val value: Long)
fun link(reminderId: ReminderId, seriesId: SeriesId)
```

**Prevents:** silently transposed arguments — a bug the compiler can't see when both are `Long`.

**Where it's fine:** a single id of that type in the signature, or types already distinct. The smell
is *two or more* swappable same-typed params, especially ids.

### 4. Screen state: data class vs sealed — a judgment fork

This one has **no fixed safe side** — the misuse is reaching for a blanket rule ("always a data
class with flags" / "always sealed") instead of reading the state space.

**Reason on one question: do the conditions *combine*, or are they *mutually exclusive*?**

- **Orthogonal axes that combine → fields in a data class.** Real screens hold simultaneous
  conditions:
  - Pull-to-refresh: `data` *and* `isRefreshing` at once.
  - Pagination: `content` + `loadingMore` + maybe a page error.
  - Transient error over existing content: an error snackbar while the list stays visible.

  These are independent axes (`hasData`, `isLoading`, `hasError`, `query`) that cross. A data class
  models axes that combine; a sealed type models *one* dimension of alternatives.

- **Mutually-exclusive alternatives with disjoint fields → sealed.** A one-shot result
  (`Loading | Success(data) | Failure(error)`, where you genuinely can't have data while loading), a
  wizard step, a screen that is truly one-of-N modes with disjoint data. Here a data class would be
  a pile of nullables that *are* exclusive, and "make illegal states unrepresentable" finally bites.

**How each side fails when mismatched** (this is the misuse):

- Sealed forced onto combining axes → the next dev bolts `isRefreshing` *inside*
  `Content(data, isRefreshing)` — back to flags, with more ceremony; or shows `Loading` and blanks
  the list on refresh.
- Data class on a genuinely-exclusive space → the next dev constructs contradictory state
  (`Processing` + `Failed` together) and renders something incoherent.

**Often the answer is hybrid** — data class for the orthogonal axes, a nested sealed for the part
that *is* exclusive:

```kotlin
data class HomeUiState(
    val query: String,            // orthogonal, always present
    val content: ContentState,    // the genuinely-exclusive part
)
sealed interface ContentState {
    data object Loading : ContentState
    data object Empty : ContentState
    data class Items(val items: List<X>) : ContentState
    data class Error(val message: String) : ContentState
}
```

**There is no default — the structure of the state space decides.**

## The Guardrail callout

When the lens *drives* a decision, surface it as one short line so the fork becomes visible:

> **Guardrail: `<X>` over `<Y>` — prevents `<the concrete misuse>`.**

- The `prevents <misuse>` clause must name a *concrete* misuse, not a vague benefit ("cleaner"). If
  you can't write it, drop the line.
- Include the decision to *decline* a guardrail — the "why not" teaches the bar as much as the "why"
  (e.g. *kept the try/finally inline — single private site, the wrapper would name the invariant
  without enforcing it*).
- For a judgment fork (#4), the callout names the *axis*, not a winner: *modelled as combining axes
  (data class) over sealed — the refresh state is simultaneous, not exclusive.*
- Scope: emit only when the lens changed the choice **and** a reasonable dev might have gone the
  other way. Obvious / compiler-forced / unrelated choices stay silent.

## Output

Structure the findings so the principle sticks, not just the fix:

- **Summary** (1–2 sentences) — what the code does, in terms of shape and boundaries. If the model is
  wrong, the code is probably unclear.
- **Findings** — by concern, leading with the specific code. For each: the misuse it invites, the
  safer shape, and the *principle* underneath. Note the impact (real trap / shape smell / nitpick).
- **What's done well** — only non-obvious things a less-experienced dev would get wrong. Not a praise
  sandwich.

## Design coaching

After the findings, add a **"Design coaching"** section — your eyes only, never part of the code or
commit. Keep it to 3–5 bullets, specific to this work, about *how you reached for the shape*, not the
shape itself.

- **The fork you didn't see** — which misuse did you walk past, and what's the tell you'd catch it by
  next time? Name the question to ask yourself by default.
- **Reflex shapes** — did you reach for inheritance, an exposed mutable, or a blanket state rule out
  of habit? Patterns in your own instinct are the highest-value thing to surface.
- **Mantra check** — did you (or would you) flag a base class / `open` / nullable where there's no
  *realistic* misuse? Over-applying the lens is its own failure mode.
- **Calibration** — did you weight a nitpick like a trap, or wave past a real one? Severity judgment
  is the skill.

## Growing this skill

This catalog is empirical, not exhaustive — resist inventing a big taxonomy up front (that
manufactures noise). When a *new* fork recurs in real review, add an entry in the same shape:
*smell → the choice → the misuse it prevents → where it's fine*. Anchor every entry to a concrete
misuse with real cost, or it dilutes the lens. An entry doesn't need a fixed safe side (#4 has none)
— but it does need a real fork a less-experienced dev gets wrong.

## Defer to the author

Findings are for discussion, not verdicts. Some have documented rationale — check PLAN.md, AI.md,
ADRs. Present the finding and the reasoning; the author decides what to act on.
