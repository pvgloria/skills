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

## Agents

Claude Code subagent definitions live in `agents/` at the repo root, one Markdown file per agent.
The repo is not a plugin, and the `skills` CLI does not install agents: they are copied into
`~/.claude/agents/` or a project's `.claude/agents/`, with the commands in `README.md`.

- **Naming.** Reviewer agents are `agents/reviewer-<area>.md`, with `name: reviewer-<area>` in
  the frontmatter. Claude Code takes an agent's identity from `name`, not from the filename, so
  keep the two equal. `coo` launches reviewers by these exact names.
- **Agent body.** A reviewer agent's body holds only its role, its area, and the skills it
  loads with what each one is for. Nothing else goes in the agent file.
- **`skills` list.** `read-only-pr-review` first, then the agent's own `review-<area>` skill,
  then any existing skill it reuses for its area.
- **Shared skill.** `skills/engineering/read-only-pr-review/SKILL.md` holds what every reviewer
  shares: the review request, how to get the PR and read files at its head, the read-only limits,
  and the reply format with the verdict rules. Change it there; never copy it into an agent.
- **Review skills.** How to review one area lives in `skills/engineering/review-<area>/SKILL.md`.
  Both kinds of skill are placed and indexed like any other engineering skill.
- **Black boxes.** Reviewer agents and review skills, the shared one included, do not mention
  `coo`, an orchestrator, other agents or other skills. The only reference allowed is an agent
  naming the skills it loads.
- **Read-only.** Every reviewer agent sets `disallowedTools: Edit, Write, NotebookEdit, Agent`
  and keeps Bash and the GitHub tools, which it needs to read the PR.

### Where agents are listed

Every agent is listed **exactly once**, in the agents table of the top-level `README.md`, with its
name linked to its file and the skills it preloads. Only agents that exist in `agents/` are
listed.

### When adding or removing an agent

1. Add or delete `agents/<name>.md`.
2. Add or remove its row in the agents table of `README.md`.
3. For a reviewer agent, add or remove its `review-<area>` skill and that skill's row in the
   engineering table, following the skill steps above.
4. If `coo` launches it, check that the name in `skills/engineering/coo/SKILL.md` matches the
   agent's `name` character for character.

## Commits

Claude runs commits and pushes in this repo — commit directly instead of proposing the message
and waiting, and push. Pushing directly to `main` is allowed in this repo.
