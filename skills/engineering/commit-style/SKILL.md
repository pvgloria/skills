---
name: commit-style
description: The git commit message convention — what the title says, when bullets are warranted, language, and prefix rules. Use when writing or suggesting a commit message ("commit this", "write the commit message", "vamos commitar"). Does not cover whether to run the commit — that stays a standing rule.
---

# Commit style

The convention for a commit message. Running the commit is never yours to do on your own —
suggest the message; Pedro runs it.

- **Title states what the change does** — imperative, ~50-72 chars: "Merge MR CI jobs into a
  single verify job". Never "Update X" / "Fix stuff" — every commit updates something.
- **Why goes after the what**, when it isn't obvious: a trailing clause on the title
  ("…so past occurrences keep their status") or the bullets. If the rationale matters to
  whoever reads the *code* later, it belongs in a code comment or doc, not the commit.
- One-thing change = title only. Multi-part change = title + a few one-line bullets. No prose
  bodies.
- In English, regardless of chat language.
- No Conventional Commits prefixes (`feat:`, `ci:`) unless the project already uses them.

Projects may override these details in their own `CLAUDE.md` (e.g. title only, never bullets).
