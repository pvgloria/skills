---
name: review-project-practices
description: "How to review a pull request against the practices of the project it lands in: find the project's own rules in its CLAUDE.md files, contributing docs and other written conventions and in its neighbouring code, check the diff against them, keep only what the PR introduces, and grade each finding blocker, should-fix or nit. Use when checking whether a PR's changes follow the rules and conventions of their project. Do NOT use when a person asks for a code review or for feedback on a diff."
---

# Review: project practices

This review answers two questions about the PR, and only these:

1. Does the diff follow the rules the project documents?
2. Does the diff follow the conventions its neighbouring code keeps?

You bring no rules of your own about any language, framework or stack. Every rule you apply comes
from the project, and every finding names where it comes from: the line of the document that
states it, or the neighbouring files that show it. A practice the project neither states nor
follows is not a finding, however common it is in the stack.

## 1. Find the project's rules

Read every source at the PR head, so that a rule the PR adds or changes counts for the rest of
the diff. The rules come from three places:

- **Instruction files.** Every `CLAUDE.md` from the repository root down to the directory of each
  changed file, `.claude/CLAUDE.md`, the files in `.claude/rules/`, and the files other coding
  tools read, such as `AGENTS.md` and `.github/copilot-instructions.md`. Follow the `@path`
  imports inside them. A `CLAUDE.md` in a directory applies to the files below it; a file in
  `.claude/rules/` with `paths` in its frontmatter applies to the files those patterns match.
- **Contributing docs and other written conventions.** `CONTRIBUTING.md`, a style guide or
  conventions page under `docs/`, the development section of the `README`, and the checklist in a
  pull request template under `.github/`.
- **The neighbouring code.** For each changed file, the files in the same directory or package,
  and the files of the same kind elsewhere in its module: the other screens, repositories,
  migrations or workers, or in a docs repo the other pages or entries.

Keep the rules that apply to what the diff touches. A rule about previews applies to a diff that
adds a composable; a rule about an index applies to a diff that adds a file the index lists. When
two sources disagree, the one closer to the changed file wins: a nested `CLAUDE.md` over the root
one, a path-scoped rule over a general one. A rule about something the project no longer has,
such as a library it dropped or a folder that is gone, is stale: skip it.

Two kinds of rule are not part of this review, even when the project writes them down:

- rules about layering: which layer a piece of code belongs in, which way dependencies between
  layers and modules point, and where logic and state live;
- rules about how the work is done rather than what the diff holds, such as commit messages,
  branch names, or the commands to run before pushing.

## 2. Keep what the PR introduces

Older code may already break a documented rule or a convention. Keep a break only when the PR
introduced it:

- **On a line the diff adds or changes**, it is the PR's. A line the diff only moves or
  re-indents, with its content unchanged, brings its old break along: section 5 grades that case
  on its own.
- **On a line the diff leaves alone**, it is the PR's only when the diff caused it, for example by
  renaming, moving or deleting what that line points to, such as the file an index entry links
  to.
- **Anything else** was there before the PR. It is not a finding at any severity, even in a file
  the diff touches.

## 3. Check the documented rules

For each rule from section 1 that applies, check every file and line the diff adds or changes.
Documented rules mostly fall into these kinds:

- **Naming:** of files, types, functions, resources, tests and keys.
- **Placement:** the folder a kind of file goes in, and the file a kind of code goes in.
- **Companion changes:** something the project asks for whenever a kind of change is made, such
  as an index or registry entry, a changelog line, a doc update, a version bump, or a string
  resource instead of literal text. Check that the diff holds it.
- **APIs and libraries to use or avoid:** "log through Timber", "no `!!`", "read the time from
  the injected clock".
- **Written style:** rules for comments and doc-comments, the order of members in a file, how
  user-facing text and error messages are worded.

Read an ambiguous rule the way the neighbouring code applies it.

## 4. Check the neighbouring code

Where no document speaks, the neighbouring code shows how the project does things. Compare each
file the diff adds or changes with its neighbours from section 1:

- the names of files, types, functions, tests and resources;
- where the file sits, and how it is laid out;
- how it is wired in: registered, exported, listed, injected;
- which of the project's own helpers, wrappers, extensions and components it uses for a job they
  already do, such as a logger, a dispatcher provider, a result type or a design-system
  component;
- how its tests are named and where they live.

A convention counts only when you can show it: name two or more neighbours that follow it, and
check that no file of the same kind does it another way. When the neighbours mix two ways, there
is no convention, and either way is fine. When the project documents a move from one way to
another, the new way is the convention, whatever most files still do.

## 5. Grade each finding

Grade by what the break costs: whether it makes something the project runs fail, and how firmly
the project states the rule.

| Situation | Severity |
|-----------|----------|
| The PR breaks a documented rule, and the break makes something the project runs fail: the build, a CI check, a release step, or a program that reads the files the rule governs, such as an installer or a migration runner | `blocker` |
| The PR breaks any other documented rule, unless the project words it as a preference | `should-fix` |
| The PR breaks a convention of the neighbouring code, and you can name a cost beyond consistency, such as skipping the logging or error mapping that the project's own helper does | `should-fix` |
| The PR breaks a documented rule that the project words as a preference: "prefer", "usually", "where possible" | `nit` |
| The PR breaks a convention of the neighbouring code, with no cost beyond consistency | `nit` |
| A line the PR only moves or re-indents carries a break that was there before | `nit` |

A documented rule that asks for a test is graded as a missing test, not by this table.

When the PR breaks a documented rule in the same way its neighbouring code already does, and
nothing the project runs fails on it, grade it `nit` and name the neighbours in the finding.

## 6. Write the findings

Each finding names the rule and its source in a few words: the document and line
(`CLAUDE.md:31`), or two neighbours that show the convention. Point the location at the line that
breaks the rule. For a missing companion change, point at the place in the file where it belongs.

From check to finding:

- `CONTRIBUTING.md:25` says migration files are named `V<number>__<description>.sql`, the only
  names Flyway runs. The PR adds `db/migrations/add_orders_index.sql`.
  → `[blocker] db/migrations/add_orders_index.sql:1 - the file name breaks the pattern CONTRIBUTING.md:25 sets, so Flyway never runs this migration`
- `CLAUDE.md:31` says "Log through Timber; never use android.util.Log", and the diff adds
  `Log.d(TAG, "sync done")`.
  → `[should-fix] app/src/main/java/sync/SyncWorker.kt:44 - logs with android.util.Log, where CLAUDE.md:31 requires Timber`
- `CONTRIBUTING.md:18` asks for a line under "Unreleased" in `CHANGELOG.md` for every user-facing
  change. The PR adds an export option and does not touch `CHANGELOG.md`.
  → `[should-fix] CHANGELOG.md:3 - no Unreleased entry for the new export option, which CONTRIBUTING.md:18 asks for`
- The other repositories in `data/` wrap each API call in the project's `safeApiCall`, which maps
  network errors to `DataError`. The new `ProfileRepository` calls the API directly.
  → `[should-fix] data/src/main/kotlin/profile/ProfileRepository.kt:31 - calls ProfileApi without the safeApiCall that OrdersRepository and CartRepository use, so a network error escapes unmapped`
- The tests next to the new one name each test as a sentence in backticks; the new test is
  `testLoad1`.
  → `[nit] feature/settings/src/test/kotlin/settings/SettingsViewModelTest.kt:22 - testLoad1 breaks the sentence-style test names that SettingsRepositoryTest and ThemeViewModelTest use`
