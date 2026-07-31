---
name: commit-style
description: The git commit message convention — what the title says, when bullets are warranted, language, prefix rules, and whether running the commit is yours to do. Use when writing or suggesting a commit message ("commit this", "write the commit message", "vamos commitar").
---

# Commit style

The convention for a commit message, and for who runs the commit.

**Default: suggest the message, don't run it.** A project grants the commit in its own
`CLAUDE.md` (see [Project overrides](#project-overrides)). Silence is not a grant, and
neither is having been allowed to commit in another project. A grant covers committing only;
pushing, force-pushing and rewriting history stay off unless named separately.

- **Title states what the change does** — imperative, ~50-72 chars: "Merge MR CI jobs into a
  single verify job". Never "Update X" / "Fix stuff" — every commit updates something.
- **A commit that will be squashed is title only.** Its body dies at the merge; the title is
  all that reaches the squash message. This is the default — assume squash unless told otherwise.
- **Only the merge/squash commit may carry bullets**, since it is the one entry that survives
  and it covers the whole branch. Ceiling of four, one line each, no prose bodies. Needing a
  fifth means the branch is doing too much — say that instead of writing the bullet.
- **A bullet earns its place only when the title and the diff can't carry it**, in this
  order of priority: the why, a behaviour change the title doesn't cover, a rename or
  migration that makes the diff hard to follow.
- **A line that describes the resulting system is documentation, not a commit.** A commit
  records a transition. If the rationale matters to whoever reads the *code* later, it belongs
  in a code comment or doc.
- In English, regardless of chat language.
- No Conventional Commits prefixes (`feat:`, `ci:`) unless the project already uses them.

## Project overrides

A project's `CLAUDE.md` overrides any of the above — title only and never bullets, a
different language, a required prefix.

To grant the commit, paste this into that `CLAUDE.md`:

```markdown
## Commits

Claude runs commits in this repo — commit directly instead of proposing the message and
waiting. Pushing is not covered: never push, force-push, or rewrite history.
```

To scope the grant to non-default branches, replace the first sentence with: *Claude runs
commits in this repo, but only on a branch that isn't `main`. On `main`, propose the message
and wait.*
