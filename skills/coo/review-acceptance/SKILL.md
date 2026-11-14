---
name: review-acceptance
description: "How to review a pull request against the step it was opened for: map every acceptance criterion to the code and test that satisfy it, check that the step goal is delivered, flag criteria that are not met and changes outside the step's scope, and grade each finding blocker, should-fix or nit. Use when checking whether a PR does what its step asked, all of it and nothing more. Do NOT use when a person asks for a code review or for feedback on a diff."
---

# Review: acceptance

This review answers three questions about the PR, and only these:

1. Is every acceptance criterion met?
2. Is the step goal delivered?
3. Is everything in the diff something the step asked for?

The step goal and acceptance criteria come with the review request. Believe the diff over the PR
description: a claim in the description counts only when the diff shows it.

## 1. List the checks

Write down each acceptance criterion as given, numbered. Split a criterion with several clauses
into one check per clause: "the settings screen has a dark-mode toggle, a font-size slider and a
reset button" is three checks, and the PR must pass all three.

Add the step goal as one more check. Every listed piece can exist and still not deliver it: a
screen nobody can navigate to, a handler that is never registered, a feature behind a flag that
stays off.

If the request also lists what is out of scope, keep that list for step 4.

## 2. Map each check to its evidence

For each check, find two things:

- **Code**: the lines in the diff that make the check true. When the diff alone does not show
  that the new code is reached (wired, registered, exported, called), read the surrounding file
  at the PR head.
- **Test**: when the check describes behaviour, first judge whether a test makes sense for it;
  a one-line change may not need one. When it does, find the test that would fail if the
  behaviour broke. A test that runs the code without asserting the outcome the criterion names
  does not count.

The map is working notes. Only the gaps in it become findings.

## 3. Grade what is not met

| Situation | Severity |
|-----------|----------|
| Nothing in the diff makes the check true | `blocker` |
| A criterion is partly met: some of its clauses pass, others do not | `blocker` |
| Every listed piece is present, but the goal is not reachable | `blocker` |
| A behaviour check is met in code, a test makes sense for it, and none asserts it | `nit` |

## 4. Grade what is outside the scope

Every changed file and hunk must trace back to the goal or a criterion. A change a criterion
needs is in scope even when the criterion does not name it: a refactor that makes room for the
feature, a fixture for its test, an index entry the project's rules require for a new file.

| Situation | Severity |
|-----------|----------|
| Work the request marks out of scope or leaves to a later step | `blocker` |
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

- Criterion "`README.md` lists the new skill, linked to its `SKILL.md`". `README.md` is not in
  the diff.
  → `[blocker] README.md:80 - "README lists the new skill" not met: the engineering table has no row for it`
- Criterion "the export button is disabled while an export runs". The diff sets
  `enabled = !isExporting`; the tests only check that an export starts.
  → `[nit] app/src/main/java/export/ExportScreen.kt:88 - "disabled while an export runs" has no test asserting the button is disabled`
- The step adds a repository; the diff also renames fields in an unrelated ViewModel.
  → `[should-fix] app/src/main/java/user/UserViewModel.kt:12 - renaming the uiState fields is outside the step, which covers the repository only`
