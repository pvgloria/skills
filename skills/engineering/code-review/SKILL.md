---
name: code-review
description: "Help write thoughtful, leadership-grade code reviews for Android PRs. Trigger when you ask to review code, a diff, or a PR — including casual requests like 'take a look at this'. Also trigger when you share a GitHub PR URL to work through received review comments together."
---

# Code Review Skill

Help write high-quality code reviews that balance technical rigor with team leadership. The output is review comments you can paste into a PR.

## Two jobs

- **Reviewing code** — you paste code, optionally with your own draft comment. Produce review comments. Covered below.
- **Working through received comments** — you share a GitHub PR URL to go through feedback you received, as a coaching session. → read `pr-feedback.md` and follow it.

## Coaching ethos (applies to both jobs)

- **Validate before deferring.** Be an honest second opinion. Say whether an instinct — yours or a reviewer's — is right, partially right, or too pedantic. Never defer by default.
- **Name the principle.** Explain *why*, not just *what*. You should leave understanding the pattern, not just the fix.
- **Calibrate the weight.** Blocker, nitpick, good-to-know, or personal style — they don't deserve the same energy. Mark skippable things `[nitpick]`.
- **Don't pad.** If there's nothing worth saying, say so. "Skip this one" is valid advice.

## Reviewing code

You paste raw code blocks, sometimes with context (PR title, intent) or your own draft comment. Work with whatever's there. Ask only if missing context would materially change the review (e.g. you can't tell if a function is new or modified) — otherwise review what's in front of you.

**If you include a draft comment**, react to it first:

- Validate the observation — right? say so and refine. Wrong? explain why.
- Sharpen the phrasing — rewrite it clear, self-contained, actionable. Show the version.
- If you're uncertain ("I can't put my finger on it"), help name what you're sensing.
- If the code is too complex to verify by reading (math, geometry, algorithms), don't pretend to. Check whether it's tested — missing coverage on non-trivial logic is an honest comment.

### 1. Understand the change first

Build a mental model of the diff. State it in 1–2 sentences at the top. If your summary is wrong, the diff is probably unclear to reviewers too.

### 2. Analyze across these dimensions

Comment only when there's something worth saying — not every dimension applies.

**Architecture & design**

- Respects layer boundaries (domain → data → presentation)?
- Responsibilities in the right place? (business logic in use cases, not repositories)
- New abstractions justified, or over-engineering? Missing abstractions that would clarify?

**Correctness & bugs**

- Race conditions, null safety gaps, missing error handling
- Concurrency: coroutine scope leaks, missing cancellation, wrong dispatcher
- Edge cases the author likely didn't consider
- Realm pitfalls: iterator mutation during deletion, thread confinement, missing transactions

**Kotlin & Android idioms**

- Idiomatic Kotlin: `if` over `takeIf { !it }`, sealed types over boolean flags, `when` exhaustiveness
- Compose: side effects in `LaunchedEffect`, no analytics in composable body, `trackOnce` for view events
- Coroutines: structured concurrency, appropriate scope, `resultOf` for error swallowing
- Naming: intent-based (`applyStats` not `parseStats`), Kotlin style (`userRound()` not `getUserRound()`)

**Readability & maintainability**

- Would a teammate understand this in 6 months?
- Names clear and intention-revealing?
- Unnecessary complexity that could be simplified?
- Duplicated logic worth extracting — if the abstraction is justified

### 3. Write the comments

Each comment:

- **Located** — reference the file/section or quote the code
- **Self-contained** — understandable without follow-up questions
- **Actionable** — say what to change; include a code suggestion when it makes the fix unambiguous

### 4. Write the summary

- **Overall assessment** — approve, request changes, or approve with comments. Be direct.
- **Key concerns** — if requesting changes, the 1–3 things that must change before merge
- **Direction** — optional note if the change is part of a larger effort heading somewhere concerning

## Review coaching

After the review, add a **"Review coaching"** section — your eyes only, never pasted into the PR. Keep it to 3–5 bullets, specific to this review.

- **Tone** — any comment harsher than intended? Too soft for the severity? (a data-loss bug isn't a question.) Is the review balanced, or a wall of criticism?
- **Ask vs. tell** — questions for design decisions you might lack context on ("what was the reasoning behind X?"); statements for objective issues ("this crashes on null"). Flag when you hedge on a certainty or assert a preference.
- **Strategic scope** — is this comment about the PR, or a broader pattern (tech debt, architecture drift)? Systemic issues belong outside the PR, not overloading the review.
- **When to approve** — not every imperfection blocks a merge. "Would I mass-revert this?" is the blocker test.

## What NOT to do

- Don't rewrite the code for the author — suggest the fix, they implement it.
- Don't review code outside the diff (unless it introduces an obvious inconsistency with an adjacent pattern).
- Don't comment on what a linter should catch.
- Don't generate praise to soften criticism — the response-style skill rejects praise sandwiches.
- Don't add motivational closings or sign-offs.
