# Repository conventions

This repo holds personal Claude Code skills plus a small CLI to install them. Skills are
organized into **bucket folders** under `skills/`, and each skill is a folder with a `SKILL.md`:

```
skills/<bucket>/<skill>/SKILL.md
```

## Buckets

| Bucket          | Meaning                              |
| --------------- | ------------------------------------ |
| `engineering/`  | daily code work                      |
| `productivity/` | daily non-code workflow tools        |
| `misc/`         | kept around but rarely used          |
| `personal/`     | tied to my own setup, not promoted   |

## Visibility rules

- Every skill in `engineering/`, `productivity/`, or `misc/` **must** have **both**:
  - a reference in the top-level `README.md`, with the skill name linked to its `SKILL.md`, and
  - an entry in `.claude-plugin/plugin.json` (the `skills` array — one path per skill).
- Skills in `personal/` **must not** appear in either the top-level `README.md` or `plugin.json`.

## Where each skill is listed

Every skill is listed **exactly once**, with its name linked to its `SKILL.md`:

- Promoted skills (`engineering/`, `productivity/`, `misc/`) → the top-level `README.md`.
- `personal/` skills → `skills/personal/README.md`. Since `personal/` is kept out of the top-level
  README, its own README is the only index for those skills.

There is no per-bucket README for the promoted buckets — the top-level README already indexes them,
and duplicating the one-liner in both would just drift.

## When adding, moving, or removing a skill

1. Place it at `skills/<bucket>/<skill>/SKILL.md`.
2. If it lands in `engineering/`, `productivity/`, or `misc/`: add it to the top-level `README.md`
   (linked) **and** to `plugin.json`. If it lands in `personal/`: keep it out of both, and add it
   to `skills/personal/README.md` instead.
3. Moving a skill across buckets means re-checking step 2 for both the old and new bucket.
