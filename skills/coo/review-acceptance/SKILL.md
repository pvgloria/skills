---
name: review-acceptance
description: "How to review a pull request against the step it was opened for: map every acceptance criterion to the code and test that satisfy it, check that the step goal is delivered, flag criteria that are not met and changes outside the step's scope, and grade each finding blocker, should-fix or nit. Use when checking whether a PR does what its step asked, all of it and nothing more. Do NOT use when a person asks for a code review or for feedback on a diff."
---

# Review: acceptance

Answer three questions, and only these:

1. Is every acceptance criterion met?
2. Is the step goal delivered?
3. Is everything in the diff something the step asked for?

Trust the diff, not the PR description.

## Check each criterion

- Split each criterion into one check per clause ("a toggle, a slider and a reset button" is
  three checks). Add the step goal as one more check.
- For each check, find the code in the diff that makes it true. If the diff does not show that
  the code is reached (wired, registered, exported, called), read the file at the PR head.
- For behaviour, find a test that would fail if it broke, when a test makes sense at all.

| Situation | Severity |
|-----------|----------|
| Nothing in the diff makes the check true | `blocker` |
| A criterion is only partly met | `blocker` |
| Every piece is there, but the goal is not reachable (screen with no route, handler never registered, flag left off) | `blocker` |
| Behaviour met in code, a test makes sense, none asserts it | `nit` |

## Check the scope

Every changed hunk must trace back to the goal or a criterion. Changes a criterion needs are in
scope even if unnamed: a refactor that makes room, a test fixture, an index entry the project
requires.

| Situation | Severity |
|-----------|----------|
| Work marked out of scope or left to a later step | `blocker` |
| A behaviour change no criterion asks for | `blocker` |
| Unrelated change with no behaviour impact: drive-by refactor, rename, reformat, dependency bump | `should-fix` |
| File committed by accident: build output, local config, editor or OS files | `should-fix` |
| Small fix on a line the step changes anyway, such as a typo | `nit` |

## Findings

Quote the criterion, or name the out-of-scope change, and say what is missing or extra. Point at
the code that falls short; for missing work, at the file where it belongs (line 1 for a file
that should exist).

`[blocker] README.md:80 - "README lists the new skill" not met: the table has no row for it`
