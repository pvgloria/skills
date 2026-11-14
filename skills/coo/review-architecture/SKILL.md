---
name: review-architecture
description: "How to review the architecture of a pull request: check layer boundaries, dependency direction, where logic and state live, and whether each new abstraction earns its place, judging against the project's and the stack's architecture defaults, and grade each finding blocker, should-fix or nit. Use when checking whether a PR's changes fit the architecture of the codebase they land in. Do NOT use when a person asks for a code review or for feedback on a diff, or to decide where new code goes while writing it."
---

# Review: architecture

This review answers five questions about the PR, and only these:

1. Does each change sit in the right layer, with nothing crossing a boundary that should stay
   closed?
2. Does every new dependency point the right way, without closing a cycle?
3. Do logic and state live where they belong, each with one home?
4. Does every new abstraction earn its place?
5. Does the code the diff touches follow the rest of the architecture defaults?

You judge against the project's architecture decisions and the defaults below. Name the default
or decision a finding relies on in a few words.

The defaults are principles, not rigid rules. A departure from one is a finding only when you can
name what it costs: a later change it makes harder, a type or rule that leaks into a layer that
should not see it, a bug it lets in. If you cannot name a cost, leave it out.

## Defaults

The defaults for layered Android and Kotlin app code:

- **Layers.** UI → presentation (state holders such as ViewModels) → domain → data, with
  dependencies pointing that way only. A lower layer never imports an upper one, and the domain
  knows nothing about the UI or the framework.
- **The path from the UI.** The UI never reaches a data source: it goes through its state holder,
  which calls a use case or a repository.
- **Holders depend on abstractions,** never on concrete data-layer classes.
- **Business logic lives in the domain:** use cases and domain models. A use case earns its place
  with validation, orchestration or transformation of its own; a pass-through does not.
- **One repository per domain concept,** organized by what it returns, not by where the data is
  stored.
- **One home per piece of knowledge.** A business rule, formula or domain constant has exactly one
  home. Code that only looks like other code, with no shared reason to change, is not a copy.
- **Wire types stay at the edge.** `@Serializable` wire types (DTOs) live in the data layer and are
  mapped to domain models there. Upper layers see domain types only.
- **Transport errors stay at the edge.** No HTTP code, Retrofit exception or `IOException` leaves
  the data layer: transport and protocol failures become a domain result the upper layers branch
  on.
- **`@SerialName` on every field** of every `@Serializable` response class, also where the Kotlin
  name matches the JSON key. Without it, R8 renames the property in release builds and parsing
  breaks at runtime.

## 1. Set the baseline

Before looking for problems, settle what you are judging against and where each changed file
sits.

- **The project's decisions.** Read the architecture the project documents: its `CLAUDE.md`,
  ADRs, an architecture doc, the module list in its build settings. A documented decision that
  departs from a stack default replaces that default for this review, so judge the diff against
  the project's decision and do not flag the departure itself.
- **The stack.** When a stack default names a library or framework the project does not use,
  skip it, and apply the principle behind it only where it holds for the project's stack. When
  the diff holds no layered code, as with docs or config, only the knowledge check in section 4
  can apply: the same rule written out in full in two files is a second copy.
- **The layer map.** Assign each changed file to a layer, and to a module where the project has
  them. Use the project's own structure (modules, packages, the files around it) and map its
  names onto the layers of the defaults by role, not by name. When the diff alone does not show
  what a file is, read the whole file.

The composition root (DI modules, the application class, the entry point that wires the layers
together) may see every layer it wires. An import there is not a boundary breach.

Review what the diff adds or changes, and the existing code it extends. A problem that sits
untouched next to the diff is not a finding.

## 2. Check layer boundaries

For each changed file, check what crosses the edge of its layer:

- **Calls and constructor parameters.** Each reaches a layer the layer order allows from here,
  through the path the defaults set. A layer that reaches past the next one, such as UI calling
  a data source with no holder or repository in between, breaks the boundary.
- **Public signatures and errors.** Every type in a public or internal signature (parameters,
  return types, exposed state), and every exception the layer lets escape, belongs to this layer
  or to one it may expose. A wire type, a transport error or a framework type in a domain
  signature leaks into every caller, even when the callers' imports look clean.

At the network and storage boundary, check which types and errors cross it. How each field is
parsed, and what happens to a null or unknown value, is not part of this check.

## 3. Check dependency direction

List the dependency edges the diff adds. They come from three places:

- imports and injected dependencies in source files;
- module dependencies in build files: `build.gradle.kts`, `settings.gradle.kts`, `package.json`,
  `go.mod` and the like;
- interfaces implemented and classes extended across layers.

For each edge, name the layer it starts in and the layer it reaches, and check it against the
layer order. Then follow each new edge's target through its own dependencies at the PR head to
see whether the edge closes a cycle between modules or packages.

A module dependency in a build file weighs more than one import: it opens the same edge to every
file in the module.

## 4. Check where logic and state live

**Logic.** For each new piece of logic (a branch on domain data, a calculation, a validation, a
conversion between models), name the layer the defaults give it and compare it with where the
diff puts it. For a validation, check the layer it runs in, not whether it rejects enough.

Before accepting a new business rule, formula or domain constant, search the codebase for one
that already exists: grep for the constant's value, the formula's terms, a function with a
similar name. A second copy of the same knowledge is a finding. Code that only looks like other
code, with no shared reason to change, is not.

**State.** For each new piece of state (a field, a flow, a cache, a remembered UI value), find
its owner, the one place that writes it, and check that:

- it has exactly one owner, and every other place reads from it. A second copy that can disagree
  with the first, such as a holder keeping its own list of what a repository already exposes, is
  a finding;
- the owner lives as long as the state must. State that has to survive the screen is not owned
  by the screen's holder or UI, and a screen's state is not held in a singleton that outlives it.

For storage code, check which layer and module it lives in. The schema it defines and how stored
data moves from one version to the next are not part of this check.

## 5. Check each new abstraction

A new abstraction is an interface, an abstract or base class, a generic type, a wrapper, a use
case, a new module, or a parameter or flag added so that one piece of code serves several
callers.

For each one, count at the PR head, not only in the diff, its implementations (test doubles
included) and its callers. It earns its place when at least one of these holds:

- a default asks for an abstraction at that boundary;
- it has a second implementation or a test double today;
- it holds logic of its own; for a use case, the defaults say which logic counts;
- it is the one home of knowledge that two or more places use;
- the step goal or acceptance criteria name the later need it serves. A plan stated only in the
  PR description does not count.

When none holds, the abstraction is indirection. Its common shapes: an interface with one
implementation and no double, a use case or wrapper that passes the call through, two code paths
that only look alike merged behind flags or nullable parameters that pick the behaviour per
caller, and a base class that exists to share a helper.

Check the opposite case too: a boundary where a default asks for an abstraction and the diff
depends on a concrete class.

## 6. Check the other defaults

The defaults hold rules beyond the four checks above, such as `@SerialName` on wire types. Check the code the diff touches against each one that applies.

## 7. Grade each finding

Grade by what the problem costs once later changes build on it:

| Situation | Severity |
|-----------|----------|
| A new dependency points against the layer order, or closes a cycle between modules or packages | `blocker` |
| A layer reaches past the next one, such as UI calling a data source directly | `blocker` |
| A wire type, transport error or framework type crosses a boundary the defaults keep closed | `blocker` |
| A business rule, formula or domain constant gets a second copy | `blocker` |
| A piece of state gets a second owner that can disagree with the first | `blocker` |
| A default is broken in a way that fails at runtime | `blocker` |
| Business logic sits in a layer other than the one the defaults give it | `should-fix` |
| A holder depends on a concrete class where the defaults ask for an abstraction | `should-fix` |
| A new abstraction meets none of the conditions in section 5 | `should-fix` |
| State is owned by something that lives shorter or longer than the state must | `should-fix` |
| Any other broken default that changes behaviour or structure | `should-fix` |
| A broken default with no effect on behaviour or structure | `nit` |
| A placement the defaults allow either way, where one fits them better | `nit` |

When the diff repeats a pattern that the neighbouring code already uses the same way, grade one
level lower (a `blocker` becomes `should-fix`, a `should-fix` becomes `nit`, a `nit` is dropped)
and name the existing pattern in the finding.

## 8. Write the findings

Each finding names the change and, in a few words, the default or project decision it breaks.
Point the location at the line that introduces the problem: the import, the call, the signature,
the build-file line, the declaration of the abstraction.

From check to finding:

- A composable takes `OrdersApi` as a parameter and calls it in a `LaunchedEffect`.
  → `[blocker] app/src/main/java/orders/OrdersScreen.kt:42 - the screen calls OrdersApi directly, with no holder or repository in between`
- `OrderRepository.observeOrders()` returns `Flow<List<OrderDto>>`, and `OrdersViewModel` reads
  `dto.totalCents` from it.
  → `[blocker] app/src/main/java/orders/data/OrderRepository.kt:18 - returns the wire type OrderDto to the ViewModel instead of a domain model`
- `feature/cart/build.gradle.kts` adds `implementation(project(":feature:checkout"))`, and
  `:feature:checkout` already depends on `:feature:cart`.
  → `[blocker] feature/cart/build.gradle.kts:31 - cart now depends on checkout, which depends on cart: a module cycle`
- A new `GetUserUseCase` whose `invoke` returns `repository.getUser(id)` and does nothing else.
  → `[should-fix] app/src/main/java/user/domain/GetUserUseCase.kt:9 - a pass-through use case with no logic of its own`
