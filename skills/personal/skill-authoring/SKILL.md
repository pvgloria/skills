---
name: skill-authoring
description: "How to author a skill in this repo — when one earns its place, the folder and frontmatter anatomy, writing a description that triggers reliably, progressive disclosure, and registering it under the repo's bucket conventions. Use when creating a new skill, editing a SKILL.md, fixing a skill that over- or under-triggers, or deciding whether something should be a skill at all. Defers prose discipline to documentation-writing."
---

# Skill authoring

A skill is a folder that teaches Claude a repeatable workflow once, so it applies every time instead
of being re-explained per conversation. This skill covers authoring one **in this repo**; for the
prose itself, `documentation-writing` is the authority (a SKILL.md is a doc).

## When a skill earns its place

Before writing, name 2-3 concrete use cases, each as a trigger plus the steps it unblocks. If only
one situation would ever load it, it's a one-off prompt, not a skill. A skill is worth it when the
workflow repeats, the steps are easy to get wrong, or the domain knowledge is non-obvious.

## Anatomy

```
<skill-name>/
├── SKILL.md          # required — frontmatter + instructions
├── references/       # optional — detail loaded on demand
├── scripts/          # optional — executable code
└── assets/           # optional — templates, fixtures
```

Naming rules:
- Folder is kebab-case and equals the `name` field: `release-notes`, not `Release Notes` or `release_notes`.
- The file is exactly `SKILL.md` (case-sensitive).
- `name` cannot contain `claude` or `anthropic` (reserved).
- No `README.md` inside the skill folder. The bucket index README (`README.md`, `skills/personal/README.md`) is separate — it lists the skill, it doesn't live inside it.

## Progressive disclosure

Three levels load at increasing cost:
1. **Frontmatter** — always in the system prompt. The `description` alone decides whether the skill loads.
2. **SKILL.md body** — loaded when the skill is judged relevant. Core instructions only; keep it tight.
3. **Linked files** (`references/`, `scripts/`) — loaded when the body points to them.

Push reference material, long checklists, and edge-case detail into `references/` and link to it. A
body over ~5,000 words is a signal to move detail down a level.

## The description field — highest leverage

The `description` is the only thing the model sees when deciding to load the skill. Write it as:

> [what it does] + [when to use it / trigger phrases] + [key capabilities]

Rules: under 1024 characters, no angle brackets (`<` `>`), include phrases the user would actually
say, and name file types if relevant.

```
# Good — specific, names triggers
description: Analyzes Figma files and generates developer handoff docs. Use when the user
uploads .fig files or asks for "design specs", "component docs", or "design-to-code handoff".

# Bad — vague, no triggers
description: Helps with projects.
```

Add **negative triggers** when a skill overlaps a neighbour: `Do NOT use for simple data
exploration (use data-viz instead).`

## Writing the body

- Imperative and specific over abstract: `Run X, then verify Y` beats `validate properly`.
- Put the critical instruction first; bury nothing the reader must not miss.
- Show examples of input → action → result for the common cases.
- Include the failure modes: the error, its cause, the fix.
- For checks that must be deterministic, bundle a script rather than trusting prose.

## Triggering and testing

Write two lists and check the skill against them:
- **Should trigger** — the obvious request plus 2-3 paraphrases.
- **Should not trigger** — adjacent topics it must stay out of.

To debug triggering, ask Claude "when would you use the `<name>` skill?" — it quotes the description
back, exposing what's missing. Then iterate by symptom:

| Symptom | Fix |
| --- | --- |
| Doesn't load when it should | Add detail and real trigger phrases to the `description` |
| Loads for unrelated queries | Add negative triggers; narrow scope |
| Loads but instructions ignored | Tighten the body, front-load the critical step, add error handling |

See `references/checklist.md` for the full pre/post checklist and `references/frontmatter.md` for
every frontmatter field.

## Registering in this repo

Placement and indexing follow the project `CLAUDE.md` (the authority). In short:
- Pick the bucket: `engineering/` (code work), `productivity/` (non-code workflow), `misc/` (rarely used), `personal/` (own setup, not promoted).
- `engineering` / `productivity` / `misc` → add to the top-level `README.md` **and** `plugin.json`.
- `personal` → add to `skills/personal/README.md` only; keep it out of both the top-level README and `plugin.json`.
- Each skill is listed exactly once. Moving across buckets means re-checking both indexes.
