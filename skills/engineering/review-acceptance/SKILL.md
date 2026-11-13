---
name: review-acceptance
description: "How to review a pull request against the step it was opened for: map every acceptance criterion to the code and test that satisfy it, flag criteria that are not met and changes outside the step's scope, and grade each finding blocker, should-fix or nit. Loaded by the reviewer-acceptance agent, which the coo orchestrator launches on every step's PR. Do NOT use when a person asks for a code review, a PR review or feedback on a diff; that is code-review."
---

# Review: acceptance

Judge the PR against its step and nothing else. It passes when every acceptance criterion is
met, the step goal is delivered, and the diff holds nothing the step did not ask for. Whether the
code that meets a criterion is well designed, robust or fast is for the other review skills.

The step goal and acceptance criteria come from the launch message. Believe the diff over the PR
description: a claim in the description counts only when the diff or a CI check shows it.

## 1. List the checks

Write down each acceptance criterion as given, numbered. Split a criterion with several clauses
into one check per clause: "`agents/x.md` exists with `name`, `description` and `skills`" is four
checks, and the PR must pass all four.

Add the step goal as one more check. Every listed piece can exist and still not deliver it: a
screen nobody can navigate to, a handler that is never registered, a feature behind a flag that
stays off.

If the message also lists what is out of scope, keep that list for step 4.

## 2. Map each check to its evidence

For each check, find two things:

- **Code**: the lines in the diff that make the check true. When the diff alone does not show
  that the new code is reached (wired, registered, exported, called), read the surrounding file
  at the PR head.
- **Test**: when the check describes behaviour and the project has tests for that kind of code,
  the test that would fail if the behaviour broke. A test that runs the code without asserting
  the outcome the criterion names does not count.

Some checks have no code half or no test half: a document, a config entry, an index row, a
result the step asks to report in the PR description. Their evidence is that file or that text.
When a check depends on tests or a build passing, read the PR's CI checks; do not run them.

The map is working notes. Only the gaps in it become findings.

## 3. Grade what is not met

| Situation | Severity |
|-----------|----------|
| Nothing in the diff makes the check true | `blocker` |
| A criterion is partly met: some of its clauses pass, others do not | `blocker` |
| Every listed piece is present, but the goal is not reachable | `blocker` |
| A behaviour check is met in code, but no test asserts it, in a project that tests such code | `should-fix` |
| The criterion reads two ways that deliver different things, and the PR took the narrower one | `should-fix` |
| A test asserts the criterion, but its name does not say which behaviour it covers | `nit` |

When a criterion reads two ways and the PR's reading is one a careful reader would take, the
criterion is met. When the two readings deliver different things, quote the criterion and both
readings in the finding.

## 4. Grade what is outside the scope

Every changed file and hunk must trace back to the goal or a criterion. A change a criterion
needs is in scope even when the criterion does not name it: a refactor that makes room for the
feature, a fixture for its test, an index entry the project's rules require for a new file.

| Situation | Severity |
|-----------|----------|
| Work the brief marks out of scope or leaves to a later step | `blocker` |
| A behaviour change no criterion asks for | `blocker` |
| An unrelated change with no behaviour impact: a drive-by refactor, rename, reformat or dependency bump | `should-fix` |
| A file committed by accident: build output, local config, editor or OS files | `should-fix` |
| A small fix on a line the step changes anyway, such as a typo | `nit` |

## 5. Write the findings

Each finding quotes the criterion it is about, or names the change that is out of scope, and
says what is missing or extra. Point the location at the code that falls short. For a criterion
with nothing in the diff, point at the file where the work belongs; for a file that should exist
and does not, use its expected path with line 1.

From step to finding:

- Criterion "the export button is disabled while an export runs". The diff sets
  `enabled = !isExporting`; the tests only check that an export starts.
  → `[should-fix] app/src/main/java/export/ExportScreen.kt:88 - "disabled while an export runs" has no test asserting the button is disabled`
- Criterion "`README.md` lists the new skill, linked to its `SKILL.md`". `README.md` is not in
  the diff.
  → `[blocker] README.md:80 - "README lists the new skill" not met: the engineering table has no row for it`
- The step adds a repository; the diff also renames fields in an unrelated ViewModel.
  → `[should-fix] app/src/main/java/user/UserViewModel.kt:12 - renaming the uiState fields is outside the step, which covers the repository only`

## What this skill does not cover

| Concern | Review skill |
|---------|--------------|
| Layer boundaries, dependency direction, where logic and state live | `review-architecture` |
| Empty, null, boundary and error inputs, cancellation, concurrency, and the tests for them | `review-edge-cases` |
| The reviewed project's own conventions | `review-project-practices` |
| Auth, secrets, input validation, network, sensitive data, permissions | `review-security` |
| Hot paths, queries, large collections, rendering, startup | `review-performance` |
| Schema and persisted-format changes, upgrade path, rollback | `review-data-migrations` |

A test for the behaviour a criterion names is yours; tests for the edge cases around it belong to
`review-edge-cases`. A criterion can also name a neighbour's concern, such as "tokens are never
logged": checking that the criterion is met is yours, and reviewing the wider concern stays with
the neighbour.

## Mistakes to avoid

| Mistake | Cause | Fix |
|---------|-------|-----|
| Approving a PR whose goal is not reachable | Every criterion has matching code, so the review stops there | Check the goal as its own check: follow the new code to where it is wired |
| Counting a test that only executes the code | The test calls the right function | Find the assertion on the outcome the criterion names |
| Flagging a supporting change as out of scope | No criterion names it | Ask whether a criterion needs it; if one does, it is in scope |
| Commenting on design, naming or style | The code is in front of you | Leave it to the skill that owns that concern |
| Accepting what the PR description claims | The description reads like a summary of the diff | Find each claim in the diff or a CI check |
