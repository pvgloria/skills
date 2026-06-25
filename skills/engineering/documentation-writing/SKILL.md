---
name: documentation-writing
description: The discipline for writing documentation that stays information-only — every sentence carries a fact the reader needs; justifications, virtue claims, goals/benefits, and paraphrases get cut. Use whenever writing or editing anything meant to be read later — docs, READMEs, design notes, ADRs, specs, rubric/algorithm files, code comments, doc-comments, any .md. Trigger even when the doc is a side effect of another task ("document this", "add a README", "write a comment", "update the design doc", or just creating/editing a markdown file). Does NOT apply to chat replies to the user — those can carry tone and framing.
---

# Documentation writing

Documentation is read cold, later, by a *person* who needs to use the thing. Two halves to the craft,
and you need both:

1. **Cut what isn't information** (the binary test below).
2. **Write what's left for a human to read** — clear prose they follow easily, not a dense pile of
   facts. Information-only is not the same as terse or robotic.

Most failures are forgetting the second half: you cut hard, and what survives reads like notes to
yourself.

## The binary test — run it on every sentence

A sentence is one or the other:

- **A fact the reader needs to use the thing** — what it does, a contract, a unit, what an
  empty/null/zero value means, an ordering or invariant, a constraint, a real trap. → **Keep.**
- **Justification of how/why you wrote it** (names a rejected alternative, states a goal or benefit),
  **a virtue claim** about you or the method, or a **paraphrase** of what a name/label/table already
  says. → **Cut.**

If a sentence would only make sense addressed to *a reviewer of this change*, it's commentary, not
documentation — cut it. Rationale for why something *exists* belongs in the commit message or an ADR,
not woven into prose that describes what the thing does.

## The tell

At the moment of writing, a framing sentence *feels* like useful context — it connects to something
true, so it seems worth saying. That feeling is the warning, not a green light: the reasoning is
fresh in your head and wants out, and it almost never helps the reader. "This gives nice context" is
the cue to cut.

## The mirror trap

The tell catches keeping too much. Cutting too much is just as easy, and quieter: you drop a fact
because it reads as obvious. It reads that way because you just wrote it — you hold the whole thing in
your head, so everything looks like it goes without saying. The reader arrives cold and holds none of
it. The test is never "is this obvious to me?" but "does a cold reader need it to use the thing?"

## Examples

**Cut — virtue claim:**
- ✗ `We follow industry best practices and don't reinvent the wheel.`
- ✓ State what it does: `Retries use exponential backoff: 200ms base, 5 attempts max.`

**Cut — justification of a choice:**
- ✗ `Pulled into its own function so it stays unit-testable.`
- ✓ (delete) — if the choice needs a record, it goes in the commit message or an ADR.

**Cut — goal/benefit restated after the fact is already there:**
- ✗ `This way you always get fresh data.` (right after `cache_ttl = 0 disables caching`)
- ✓ (delete) — the mechanic (`cache_ttl = 0 disables caching`) is the information.

**Cut — paraphrase of the label:**
- ✗ `` `timeout` sets the timeout. `` above a field already labelled `timeout`.
- ✓ Keep only what the label can't carry: `` `timeout` — milliseconds; `0` waits forever. ``

**Keep — a fact the reader needs:**
- ✓ `All timestamps are UTC.` (a convention they must apply to read every value below.)
- ✓ `Scores are absolute 0–100, not percentiles.` (changes how the number is read.)

## Write what's left for a human

Once the noise is gone, the surviving facts still have to *read* well — this is the half that's easy
to skip. The goal is prose a colleague reads top to bottom and understands, not the shortest possible
string of true statements.

- **Plain words over jargon.** Don't lead a reader-facing doc with internal terms (`the reconciler`,
  `the broker`, `a tombstone`) where an ordinary word does the job. Introduce a term the first time
  it actually earns its place, not before.
- **Let sentences breathe.** "Returns one boolean and carries no per-dependency detail" is a spec
  sheet. "The health check tells you up or down — not which dependency failed" is the same fact,
  written for a person.
- **Keep the connective tissue.** A *because*, a *so*, a one-line example — these aren't padding;
  they're what turns a list of true statements into something readable. Cutting them is how you end
  up with the telegraphic, robotic register.

The check: read it back as the reader meeting it cold. If it sounds like notes you left yourself,
rewrite it as something you'd be glad to hand a colleague.

## Placement

A surviving fact still has a home: a contract or how-to-use goes where callers meet it (a docstring,
the top of a README); a one-line "why this exists" goes directly above the declaration.
