---
name: design-coaching
description: 'Coach your own design judgment on Android/Kotlin/Compose code — evaluate the shape you are building by reasoning from design principles in tension, not by matching a catalog of bad forms. Use when weighing a design fork — inheritance vs composition, what to expose at a boundary, a value class vs a raw primitive, a data class vs a sealed hierarchy for state, where to validate input — when you ask "is this the right shape" or "where could this be misused", or for a design pass before committing. Inward, for your own growth; to write review comments on a teammate''s PR, use the code-review skill instead.'
---

# Design Coaching

Evaluate what you build by its **shape** — reasoning from established design principles held in
tension, not from a catalog of bad forms. The goal is misuse-resistance — a less-experienced
teammate can't easily break what you ship — but it's reached by judgment, never by pattern-matching.
The whole skill rests on one thesis:

> **Make interfaces easy to use correctly and hard to use incorrectly.** — Scott Meyers

Everything below is that thesis, applied through a handful of real, studied principles.

## Read the shape, don't pattern-match it

There are two ways to look at a piece of code, and only one is this skill:

- **Classify** — "does this match a known bad form? a base class? an `open` class? two `Long`
  params?" — then emit a verdict. This is what a linter does. It produces confident answers by
  *counting*, and it is wrong exactly when the form is fine and when the form is absent but the
  problem is present.
- **Evaluate** — "what does *this* shape impose on callers, what does it invite a junior to do, what
  does the wrong version cost the system, and is it the right shape *here*?" This reasons from
  principle, not from a catalogue of symptoms.

The trap this skill was built to escape: a `BaseViewModel` with two members reads as "fine, only two
helpers" to a classifier. The right question was never the count — it was structural: *does this earn
inheritance? does it impose its whole surface on every subclass? is it one concept or a drawer?* A
classifier that counts members will wave through the junk drawer on day one and only notice on day
fifty. **Evaluate the shape, not the symptom count.**

## Judgment lives in the tension between two true mantras

A single mantra, taken alone, becomes a slogan you can over-apply — "composition over inheritance",
shouted at every base class, is how you end up with delegation boilerplate nobody wanted. Every real
design mantra has a **true counter-mantra**: information hiding vs YAGNI, parse-don't-validate vs
Postel's Law, DRY vs duplication-is-cheaper. The skill is not the mantra. **The skill is the question
that arbitrates the tension for the case in front of you.**

So every catalog entry below ends in a **question**, not a verdict. If you strip everything else away
— the provenance, the examples — keep the questions. They are the payload.

Most entries have a defensible *default lean* (a side that's safer absent a reason). A few (#4) have
no fixed side at all — the question hands you the axis and you decide. Either way you hand over
*reasoning*, never a reflex.

### How each entry is built

1. **Mantra + provenance** — whose idea, so you can go read the source, not the slogan.
2. **De-slogan** — what it actually claims, stripped of the bumper-sticker.
3. **The misuse it prevents** — concrete, with real cost.
4. **Canonical example** — from the literature/CS, timeless.
5. **Android/Kotlin example** — idiomatic, *generic to the platform* (never code from a specific repo
   — repo examples rot and couple the skill to a codebase that moves).
6. **Where it's fine** — the anti-dogma clause, so the mantra never becomes a reflex.
7. **The tension + the question** — the counter-mantra, and what you ask to decide *here*.

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

## Coaching ethos

- **Validate before deferring.** Be an honest second opinion. Say whether a shape is right, a
  defensible call, or a trap waiting to be sprung — never defer by default.
- **Name the principle.** Explain *why* a shape invites misuse, not just *what* to change. You should
  leave seeing the pattern, not just this instance.
- **Calibrate the weight.** Real trap / shape smell / nitpick don't deserve the same energy. If you
  can't name a *realistic* misuse with *real* cost, it's not a finding — say so.
- **Don't pad.** No findings is a valid outcome. Don't manufacture a taxonomy to look thorough.

Not for: routine feature code, private single-use helpers, or anywhere there's no realistic, costly
misuse — those stay silent. When the goal is to write review comments on a *teammate's* PR, use the
`code-review` skill; this skill's coaching is for your own code and designs.

## The catalog — mantras, in tension

### 1. Favor composition over inheritance — *GoF, "Design Patterns" (1994); Liskov Substitution (Liskov, 1987)*

**De-slogan:** inheritance binds the child to the parent's *entire* surface and forbids removing
anything; reach for it only when the child genuinely **is-a** parent and can stand in for it
everywhere (Liskov). When you only want *one behaviour* the parent happens to have, wrap or delegate.

**Misuse it prevents:** a junior extends a base to get one helper and silently inherits a growing bag
of unrelated surface; or an override that can't honour the parent's contract breaks every caller that
trusted the supertype.

**Canonical:** `java.util.Stack extends Vector`. A stack is not a vector, yet it inherits
`add(index, e)` and `get(i)` — callers can reach under the LIFO discipline and the type can't stop
them. Inheritance leaked the wrong surface.

**Android/Kotlin:**

```kotlin
// Lean against — inheritance to share one behaviour; every subclass inherits the whole growing surface
abstract class BaseViewModel : ViewModel() {
    protected fun launch(block: suspend CoroutineScope.() -> Unit): Job { /* ... */ }
}
class HomeViewModel : BaseViewModel() { /* also gets whatever later lands in the base */ }

// Lean toward — composition: the one behaviour, no inherited surface
fun ViewModel.launchSafely(block: suspend CoroutineScope.() -> Unit): Job { /* ... */ }
// or inject a small collaborator the VM holds, not extends
```

**Where it's fine:** a genuine is-a with shared *state* where the subtype honours the full contract —
a sealed hierarchy, a real specialization. Inheritance isn't the smell; inheritance-as-utility-bag is.

**The tension — *don't paper over with delegation boilerplate*:** composition can mean hand-forwarding
many methods. **Ask: is every member of the parent valid and meaningful on the child, and is this
genuinely is-a — or do I just want one behaviour the parent happens to expose?** If the latter,
compose. (See also #9 — even as composition, is it *one* concept?)

### 2. Information hiding — *Parnas, "On the Criteria To Be Used in Decomposing Systems into Modules" (1972)*

**De-slogan:** a module hides the decisions that will change and exposes only those that won't; the
"secret" is what you can change without breaking callers. It is not "make fields private" — it's
*which design decisions leak across the boundary*.

**Misuse it prevents:** exposing a mutable handle lets any caller reach past your invariants — a
`MutableStateFlow` they can overwrite, a `MutableList` they can `.add()` into — and a junior will,
and review won't catch it.

**Canonical:** Parnas's KWIC index — the "circular shift" module hides whether shifts are *stored* or
*computed on demand*. Callers can't depend on the representation, so it can change freely.

**Android/Kotlin:**

```kotlin
// Lean against — the mutable secret is exposed
val state: MutableStateFlow<HomeUiState> = MutableStateFlow(HomeUiState())   // any caller: state.value = …

// Lean toward — expose the read view, hide the mutable
private val _state = MutableStateFlow(HomeUiState())
val state: StateFlow<HomeUiState> = _state.asStateFlow()
```

**Where it's fine:** private/internal plumbing inside the module — hiding bites only at what you
*expose*. The read-only form costs nothing, so default to it at boundaries.

**The tension — *YAGNI; don't over-encapsulate*:** wrapping everything in getters/setters is
ceremony. **Ask: does the caller need to *change* this, or only *read* it? Hide exactly the decisions
that will change.**

### 3. Connascence — *Page-Jones (1992); popularized by Jim Weirich*

**De-slogan:** two pieces of code are connascent if changing one forces changing the other. The worst
kinds are connascence of *position* and *meaning* across distance. The move is to convert connascence
of position → connascence of name, or eliminate it with the type system.

**Misuse it prevents:** adjacent same-typed parameters transposed at the call site — compiles, fails
at runtime, invisible in review because both sides are the same type.

**Canonical:** `setColor(255, 0, 0)` — positional args of identical type; you must *know* the order.
Named args, or a `Color` value, removes the hidden coupling.

**Android/Kotlin:**

```kotlin
// Lean against — swap the two and it still compiles
fun assign(userId: Long, roleId: Long)

// Lean toward — the compiler rejects the transposition
@JvmInline value class UserId(val value: Long)
@JvmInline value class RoleId(val value: Long)
fun assign(userId: UserId, roleId: RoleId)
```

**Where it's fine:** a single id of that type in the signature, or types already distinct; one or two
params where order is self-evident. The smell is *two or more* swappable same-typed params, especially
ids.

**The tension — *primitive-wrapping everything is noise*:** a value class per `Int` taxes every call.
**Ask: would transposing two arguments compile and fail only at runtime? If yes, encode the
distinction in the type.**

### 4. Make illegal states unrepresentable — *Minsky / the ML & Haskell tradition* — a judgment fork

**This one has no fixed safe side.** The misuse is reaching for a blanket rule ("always a data class
with flags" / "always sealed") instead of reading the state space.

**De-slogan:** shape the type so contradictory combinations *cannot be constructed* — the compiler,
not a runtime guard, rules out the impossible. But only the states that are *genuinely* illegal.

**Reason on one question: do the conditions *combine*, or are they *mutually exclusive*?**

- **Orthogonal axes that combine → fields in a data class.** Real screens hold simultaneous
  conditions: data *and* `isRefreshing`; content + `loadingMore` + a page error; a transient error
  snackbar while the list stays visible. A data class models axes that cross.
- **Mutually-exclusive alternatives with disjoint data → sealed.** A one-shot
  `Loading | Success(data) | Failure(error)` where you genuinely can't have data while loading; a
  wizard step; a true one-of-N mode. A data class here is a pile of nullables that *are* exclusive.

**Canonical:** a connection as `Connected(socket) | Disconnected` — not `isConnected: Boolean` plus a
nullable `socket` that can disagree with it.

**Android/Kotlin — often hybrid:** a data class for the orthogonal axes, a nested sealed for the part
that is exclusive.

```kotlin
data class HomeUiState(
    val query: String,          // orthogonal, always present
    val content: ContentState,  // the genuinely-exclusive part
)
sealed interface ContentState {
    data object Loading : ContentState
    data object Empty : ContentState
    data class Items(val items: List<Item>) : ContentState
    data class Error(val message: String) : ContentState
}
```

**How each side fails when mismatched (this is the misuse):** sealed forced onto combining axes →
the next dev bolts `isRefreshing` inside `Content(data, isRefreshing)`, back to flags with ceremony;
a flag-bag data class on an exclusive space → the next dev constructs `Processing + Failed` together
and renders something incoherent.

**The tension — *over-precise types ossify and model accidental impossibilities*:** **Ask: do these
conditions combine, or exclude each other? Combining → fields; exclusive → sealed; both → hybrid.**

### 5. Parse, don't validate — *Alexis King (2019)*

**De-slogan:** push the check to the boundary and return a *new type that carries the proof*, so
downstream code can't be reached without it — instead of re-checking a permissive type at every
layer. Validation discards information; parsing preserves it in the type.

**Misuse it prevents:** passing `String` everywhere and re-running `isNotEmpty()` / re-validating an
email at each layer; one path forgets, and an invalid value surfaces deep in the system where it's
expensive to trace.

**Canonical:** `parseNonEmpty : [a] -> Maybe (NonEmpty a)` returns a `NonEmpty` that *proves*
non-emptiness, versus `validateNonEmpty : [a] -> ()` that throws and hands the same unrefined list
back — every later caller must trust a check it can't see.

**Android/Kotlin:**

```kotlin
// Lean against — String flows through; every layer must remember to re-validate
fun sendInvite(email: String) { require(email.matches(EMAIL_REGEX)); /* ... */ }

// Lean toward — parse once at the boundary; the type is the proof
@JvmInline value class Email private constructor(val value: String) {
    companion object {
        fun of(raw: String): Result<Email> =
            if (raw.matches(EMAIL_REGEX)) Result.success(Email(raw)) else Result.failure(...)
    }
}
fun sendInvite(email: Email) { /* provably valid, no re-check */ }
```

**Where it's fine:** truly internal data already known valid; throwaway scripts. The bite is at
*trust boundaries* — user input, network, IPC.

**The tension — *Postel's Law: be liberal in what you accept*** (and note: Postel's has been widely
*contested* — leniency breeds ambiguity and security holes; the HTTP/HTML tolerance mess is the
cautionary tale). **Ask: at this boundary, do I want the type to carry the proof of validity, or to
stay liberal? Past a trust boundary, parse.**

### 6. Depend on abstractions, not concretions — *Dependency Inversion Principle, Robert C. Martin*

**De-slogan:** high-level policy must not import low-level detail; both depend on an interface *owned
by the policy side*. It's about the *direction* of the source dependency — not "put an interface on
everything".

**Misuse it prevents:** a global `object` with an `init(impl)` and nullable backing — callers can use
it before init, can't fake it in tests, and the dependency points the wrong way (policy → detail).

**Canonical:** Martin's `Copy` routine depending on `Reader`/`Writer` interfaces rather than concrete
`KeyboardReader`/`PrinterWriter` — a new device needs zero change to `Copy`.

**Android/Kotlin:**

```kotlin
// Lean against — policy reaches for the concrete detail; unfakeable, can call before ready
object CrashReporter { fun init(c: FirebaseCrashlytics); fun record(t: Throwable) }

// Lean toward — policy owns the contract; the detail is injected
interface CrashReporter { fun record(t: Throwable) }
class HomeViewModel(private val crashReporter: CrashReporter) : ViewModel()
```

**Where it's fine:** stable leaf concretions you'll never swap or test-double (the std lib, a
`String`); an interface with exactly one impl that will *never* have another is just indirection.

**The tension — *YAGNI; speculative generality is its own cost*:** an interface per class is noise.
**Ask: will this dependency be swapped, faked in a test, or does policy genuinely own the contract? If
none, depend on the concrete.**

### 7. Duplication is cheaper than the wrong abstraction — *Sandi Metz (2016)*

**De-slogan:** a premature abstraction that's only *almost* right accretes parameters and conditionals
to cover each caller's differences until it's harder to follow than the duplication it replaced.
Prefer to inline back and wait for the real shape. DRY is about *knowledge*, not lines that resemble
each other.

**Misuse it prevents:** fusing two composables that merely *look* similar into one with `isEditable`
+ nullable lambdas; every new caller bolts on a flag, and the function becomes a maze paying for each
other's special cases.

**Canonical:** Metz's narrative of the shared method that grows `if type == A … else if B …` as new
callers arrive — each caller drags the others' branches through its own path.

**Android/Kotlin:**

```kotlin
// Lean against — one function fused across two intents
@Composable fun Field(value: String, isEditable: Boolean, onChange: ((String) -> Unit)? = null, onSubmit: (() -> Unit)? = null)

// Lean toward — two small composables; no flag, no nullable plumbing
@Composable fun ReadOnlyField(value: String)
@Composable fun EditableField(value: String, onChange: (String) -> Unit, onSubmit: () -> Unit)
```

**Where it's fine:** genuinely shared *knowledge* — a business rule, a formula, a domain constant —
has exactly one home; never duplicate that, even once. The license to duplicate is for *incidental*
similarity only.

**The tension — *DRY itself*:** **Ask: do these two sites change for the same reason (shared knowledge
→ unify) or do they merely look alike today (incidental → leave them duplicated)?**

### 8. Command-Query Separation — *Bertrand Meyer (Eiffel)*

**De-slogan:** a method either *does* something (command — effect, returns nothing) or *answers*
something (query — returns a value, no observable effect), never both. Then reading is always safe and
free of surprise.

**Misuse it prevents:** a getter or composable that mutates as a side effect of being read — the next
dev reads it twice "to be safe" and fires the effect twice, or deletes a "redundant" read and breaks
behaviour.

**Canonical:** `stack.top` (query — peeks) vs `stack.pop` (command — mutates and returns). A single
`pop()` that both returns and mutates conflates the two and surprises the reader.

**Android/Kotlin:**

```kotlin
// Lean against — reading triggers work
val isReady: Boolean get() { startLoadingIfNeeded(); return loaded }   // a "read" with an effect
@Composable fun Banner() { analytics.log("seen"); /* effect on compose */ Text(...) }

// Lean toward — the effect is explicit, the read is pure
@Composable fun Banner() { LaunchedEffect(Unit) { analytics.log("seen") }; Text(...) }
```

**Where it's fine:** well-known idioms read as a unit — `iterator.next()`, `queue.poll()`,
`StateFlow.getAndUpdate`. The conflation there is conventional and expected. The bite is a
*surprising* effect on something named or shaped like a read.

**The tension — *atomic read-and-act is sometimes the safe primitive*** (compare-and-set): **Ask: does
the name/shape promise a pure read? If a reader would be surprised by the effect, split it.**

### 9. One reason to change — *Single Responsibility (Martin); "the bigger the interface, the weaker the abstraction" (Rob Pike)*

**De-slogan:** a module should have one reason to change; a fat interface forces clients to depend on
methods they don't use. The junk drawer (`Utils`, `BaseViewModel`, `Helpers`) is the anti-pattern — it
has as many reasons to change as it has members, and everything ends up depending on everything.

**Misuse it prevents:** the shared bag everyone adds "just one more" thing to — until a change to date
formatting recompiles every screen, and nothing can be reasoned about in isolation.

**Canonical:** `java.util.Properties extends Hashtable` — a config store that's also a general map, two
responsibilities welded together (and it lets you `put` non-`String` values, an illegal state).
Pike's counter-aesthetic: `io.Reader` is *one* method.

**Android/Kotlin:**

```kotlin
// Lean against — a drawer with N reasons to change, every helper a different concern
object Utils {
    fun titleCase(s: String): String
    fun formatDate(d: LocalDate): String
    fun isValidEmail(s: String): Boolean
    // …and twenty more — each a separate reason to recompile every caller
}
// (the same drawer reached through inheritance is #1's BaseViewModel — there the cost is the surface; here it's the reasons to change)

// Lean toward — focused, purpose-named units, composed where needed
class DateFormatter { fun format(d: LocalDate): String }   // date concern
class EmailValidator { fun validate(s: String): Boolean }  // validation concern
```

**Where it's fine:** a cohesive type with several methods that genuinely change together for *one*
reason is not a junk drawer. The test is never the count of members — it's the count of *reasons to
change*.

**The tension — *don't over-fragment into nano-classes*:** a one-method class for everything is its
own cognitive tax. **Ask: do these members change for the same reason and serve one concept? If they
have independent reasons to change, split.**

## The mantra inventory — raw material, with provenance

The nine above are worked examples, not the whole field. When a new fork recurs, reach into this
inventory before inventing one — and go read the source, not the slogan.

- **Tier A (rigorous / academic):** Information hiding (Parnas) · Connascence (Page-Jones) · Design by
  Contract & Command-Query Separation (Meyer) · Make illegal states unrepresentable (Minsky / ML) ·
  Parse, don't validate (Alexis King).
- **Tier B (canonical folk):** *Easy to use correctly, hard to use incorrectly* (Scott Meyers — **the
  thesis of this skill**) · Composition over inheritance (GoF) · Dependency Inversion (Martin) ·
  "Bigger the interface, weaker the abstraction" (Pike) · Duplication is cheaper than the wrong
  abstraction (Metz) · Tell, don't ask · Principle of Least Astonishment.
- **A useful warning — Postel's Law** ("be liberal in what you accept"): a once-revered mantra now
  widely *contested* (it breeds ambiguity and security holes). Keep it on the shelf as the reminder
  to **venerate no mantra** — each is a tool in tension with another, never a commandment.

## The Guardrail callout

When the lens *drives* a decision, surface it as one short line so the fork becomes visible:

> **Guardrail: `<X>` over `<Y>` — prevents `<the concrete misuse>`.**

- The `prevents <misuse>` clause must name a *concrete* misuse, not a vague benefit ("cleaner"). If
  you can't write it, drop the line.
- Include the decision to *decline* a guardrail — the "why not" teaches the bar as much as the "why"
  (e.g. *kept the helper inline — single private site, the wrapper would name the invariant without
  enforcing it*).
- For a judgment fork (#4), the callout names the *axis*, not a winner: *modelled as combining axes
  (data class) over sealed — the refresh state is simultaneous, not exclusive.*
- Scope: emit only when the lens changed the choice **and** a reasonable dev might have gone the other
  way. Obvious / compiler-forced / unrelated choices stay silent.

## Output

Structure the findings so the principle sticks, not just the fix:

- **Summary** (1–2 sentences) — what the code does, in terms of shape and boundaries. If the model is
  wrong, the code is probably unclear.
- **Findings** — by concern, leading with the specific code. For each: the misuse it invites, the
  safer shape, the *mantra* underneath, and the *question* you'd ask to arbitrate it. Note the impact
  (real trap / shape smell / nitpick).
- **What's done well** — only non-obvious things a less-experienced dev would get wrong. Not a praise
  sandwich.

## Design coaching

After the findings, add a **"Design coaching"** section — your eyes only, never part of the code or
commit. Keep it to 3–5 bullets, specific to this work, about *how you reached for the shape*, not the
shape itself.

- **The fork you didn't see** — which tension did you walk past, and what's the question you'd ask
  yourself by default next time?
- **Reflex shapes** — did you reach for inheritance, an exposed mutable, or a blanket state rule out
  of habit? Patterns in your own instinct are the highest-value thing to surface.
- **Slogan check** — did you (or would you) apply a mantra as a reflex where its counter-mantra
  actually wins? Over-applying *one* side of a tension is the core failure mode.
- **Calibration** — did you weight a nitpick like a trap, or wave past a real one? Severity judgment
  is the skill.

## Growing this skill

The catalog is empirical and seed-sized, not exhaustive — resist inflating it (that manufactures
noise, and over-applying a mantra is the very failure this skill warns against). The unit of growth is
a **mantra in tension**, not a symptom to match. When a *new* fork genuinely recurs in real review,
prefer pulling from the inventory above; add a full entry only in the same seven-part shape, and only
if it carries a real counter-mantra and a question a less-experienced dev gets wrong. An entry doesn't
need a fixed safe side (#4 has none) — it needs a real tension to arbitrate.

## Defer to the author

Findings are for discussion, not verdicts. Some have documented rationale — check PLAN.md, AI.md,
ADRs. Present the finding, the principle, and the question; the author decides what to act on.
