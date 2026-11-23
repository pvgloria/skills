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
| `coo/`          | the `coo` orchestrator, its agents and review skills |
| `productivity/` | daily non-code workflow tools        |
| `misc/`         | kept around but rarely used          |
| `personal/`     | tied to my own setup, not promoted   |

A bucket is also the unit of installation — `skills add <repo>/tree/main/skills/<bucket>`
installs that folder and nothing else. Which bucket a skill lands in therefore decides who
can pull it in isolation, not just where it's indexed.

## Visibility rules

- Every skill in `engineering/`, `coo/`, `productivity/`, or `misc/` **must** be referenced in the
  top-level `README.md`, with the skill name linked to its `SKILL.md`.
- Skills in `personal/` **must not** appear in the top-level `README.md`.

Neither rule affects what gets installed. The CLI finds skills by walking the tree, so every
skill in the repo is installable whether or not it's indexed anywhere — `personal/` included.

## Where each skill is listed

Every skill is listed **exactly once**, with its name linked to its `SKILL.md`:

- Promoted skills (`engineering/`, `coo/`, `productivity/`, `misc/`) → the top-level `README.md`.
- `personal/` skills → `skills/personal/README.md`. Since `personal/` is kept out of the top-level
  README, its own README is the only index for those skills.

There is no per-bucket README for the promoted buckets — the top-level README already indexes them,
and duplicating the one-liner in both would just drift.

## When adding, moving, or removing a skill

1. Place it at `skills/<bucket>/<skill>/SKILL.md`.
2. If it lands in `engineering/`, `coo/`, `productivity/`, or `misc/`: add it to the top-level `README.md`,
   linked. If it lands in `personal/`: keep it out of there, and add it to
   `skills/personal/README.md` instead.
3. Moving a skill across buckets means re-checking step 2 for both the old and new bucket.

## Agents

Claude Code subagent definitions live in `skills/coo/agents/`, beside the skills `coo` and the
reviewers use, one Markdown file per agent.
The repo is not a plugin, and the `skills` CLI does not install agents: they are copied into
`~/.claude/agents/` or a project's `.claude/agents/`, with the commands in `README.md`.

The team is `scout`, `builder`, `verifier` and the `reviewer-<area>` agents.

- **Naming.** An agent's `name` in the frontmatter equals its filename without `.md`; reviewer
  agents are `reviewer-<area>`. Claude Code takes an agent's identity from `name`, not from the
  filename, so keep the two equal. `coo` launches agents by these exact names.
- **Self-contained body.** An agent's body holds its whole contract, kept short: its role, where
  it reads the change, its limits, and its exact reply format. There is no shared skill.
- **Checks reply alike.** The verifier and every reviewer reply in the same format: `PASS` or
  `FAIL`, a `Fail` list and a `Notes` list, or a single `Cannot check:` line. Review skills grade
  each finding `fail` or `note`. Change the format in every check at once.
- **Review skills.** How to review one area lives in `skills/coo/review-<area>/SKILL.md`, and the
  `reviewer-<area>` agent preloads only that skill. Review skills are placed and indexed like any
  other skill of the `coo` bucket.
- **Self-contained pack.** An agent preloads only skills from the `coo` bucket. Knowledge a
  reviewer needs from another skill is written into its `review-<area>` skill.
- **Black boxes.** Agents and review skills do not mention `coo`, an orchestrator, other agents
  or other skills. The only reference allowed is an agent naming the skill it loads.
- **Tools.** Only the builder writes, and it keeps every tool. The others set `tools`: the scout
  `Read, Grep, Glob`; the verifier `Read, Grep, Glob, Bash`, to run tests, changing no files or
  git state; each reviewer `Read, Grep, Glob, Bash, Skill`, reading only.
- **No worktrees.** Agents work in the repository folder they start in; none sets `isolation`.
- **Model and effort.** Every agent sets `model` and `effort` in its frontmatter, so it never
  inherits the launching session's. The README's agents table shows both.

### Where agents are listed

Every agent is listed **exactly once**, in the agents table of the top-level `README.md`, with its
name linked to its file and the skills it preloads. Only agents that exist in `skills/coo/agents/` are
listed.

### When adding or removing an agent

1. Add or delete `skills/coo/agents/<name>.md`.
2. Add or remove its row in the agents table of `README.md`.
3. For a reviewer agent, add or remove its `review-<area>` skill and that skill's row in the
   COO skills table, following the skill steps above.
4. If `coo` launches it, check that the name in `skills/coo/coo/SKILL.md` matches the
   agent's `name` character for character.

## Commits

Claude runs commits and pushes in this repo — commit directly instead of proposing the message
and waiting, and push. Pushing directly to `main` is allowed in this repo.
