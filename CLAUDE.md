# Repository conventions

This repo holds personal Claude Code skills, distributed with the [skills.sh](https://skills.sh)
CLI. Skills are organized into **bucket folders** under `skills/`, and each skill is a folder
with a `SKILL.md`:

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

A bucket is also the unit of installation — `skills add <repo>/tree/main/skills/<bucket>`
installs that folder and nothing else. Which bucket a skill lands in therefore decides who
can pull it in isolation, not just where it's indexed.

## Visibility rules

- Every skill in `engineering/`, `productivity/`, or `misc/` **must** be referenced in the
  top-level `README.md`, with the skill name linked to its `SKILL.md`.
- Skills in `personal/` **must not** appear in the top-level `README.md`.

Neither rule affects what gets installed. The CLI finds skills by walking the tree, so every
skill in the repo is installable whether or not it's indexed anywhere — `personal/` included.

## Where each skill is listed

Every skill is listed **exactly once**, with its name linked to its `SKILL.md`:

- Promoted skills (`engineering/`, `productivity/`, `misc/`) → the top-level `README.md`.
- `personal/` skills → `skills/personal/README.md`. Since `personal/` is kept out of the top-level
  README, its own README is the only index for those skills.

There is no per-bucket README for the promoted buckets — the top-level README already indexes them,
and duplicating the one-liner in both would just drift.

## When adding, moving, or removing a skill

1. Place it at `skills/<bucket>/<skill>/SKILL.md`.
2. If it lands in `engineering/`, `productivity/`, or `misc/`: add it to the top-level `README.md`,
   linked. If it lands in `personal/`: keep it out of there, and add it to
   `skills/personal/README.md` instead.
3. Moving a skill across buckets means re-checking step 2 for both the old and new bucket.
