# Spec: reviewer agents and review skills for `coo`

Status: delivered, in eight stacked PRs starting at
[#1](https://github.com/pvgloria/skills/pull/1). Step 8 ran the reviewers end to end.
Branch with the `coo` skill: `claude/lucid-cannon-rcedp3`.

## Changes after review

The human review of the steps changed the shape below. The sections that follow are amended to
match.

- **Shared skill.** What every reviewer shares lives once, in
  `skills/engineering/read-only-pr-review/SKILL.md`: the review request, getting the PR and
  reading files at its head, the read-only limits, and the reply format. Agents do not repeat it.
- **Black boxes.** Agents and skills do not mention `coo`, an orchestrator, other agents or other
  skills. The only reference allowed is an agent naming the skills it loads.
- **No "does not cover" sections.** A review skill states its scope as the questions it answers.
- **Missing tests.** A missing test is never more than a `nit`, and the reviewer first judges
  whether a test makes sense for the change at all.
- **No tools run.** The reviewers run no formatter, linter, static analysis tool, build, test
  suite or install.
- **Project practices from documents and code.** By the user's decision,
  `review-project-practices` checks the diff against the project's documented rules and the
  neighbouring code only.
- **`Cannot review:` reply.** A reviewer that cannot read the PR, or lacks a skill it needs,
  replies `Cannot review: <reason>.` with no verdict. `coo` never counts it as approval and tells
  the user what is missing.

## Context

This repo holds personal Claude Code skills, installed with the `skills` CLI
(`vercel-labs/skills`). Layout and indexing rules are in [`CLAUDE.md`](../../CLAUDE.md).

[`skills/engineering/coo/SKILL.md`](../../skills/engineering/coo/SKILL.md) defines a COO
orchestrator. For each step of a feature it launches an implementer sub-session that ends in a
PR, then launches reviewer agents **by name** and advances only when all of them return
`approved`. It names seven agents:

| Agent | Kind | Area |
|-------|------|------|
| `reviewer-architecture` | core | Architecture and the good practices of the project's stack |
| `reviewer-edge-cases` | core | Edge cases: covered and not breaking |
| `reviewer-project-practices` | core | Practices defined in the project |
| `reviewer-acceptance` | core | The PR does what the step asked, all of it and nothing more |
| `reviewer-security` | conditional | Auth, secrets, user input, network, storage of sensitive data, permissions |
| `reviewer-performance` | conditional | Hot paths, queries, large collections, rendering, startup |
| `reviewer-data-migrations` | conditional | Schema changes, persisted formats, backwards compatibility |

`coo` states that each reviewer is defined outside the skill, with its own instructions and its
own set of skills, and that it relies on two things from every reviewer:

- It is read-only: it never edits code, pushes, comments on the PR or approves it.
- It returns a verdict (`approved` or `changes requested`) and findings, each with a severity
  (`blocker`, `should-fix`, `nit`), a location and the problem.

The message a reviewer receives from the COO is only:

```markdown
PR: <link>
Step goal and acceptance criteria: <from the step brief>
Review round: <n>
```

## Problem

None of the seven agents exists, and neither do the skills that hold their review method. `coo`
cannot run a review round: its own rule for a missing reviewer is to stop and ask the user.

The repo also has no place or convention for agent definitions. It only knows skills.

## Goal

After this work:

- The seven agents exist in this repo as Claude Code subagent definitions, with the exact names
  above, and can be installed into a machine or a project.
- Each agent has one review skill of its own that holds the method for its area.
- `README.md` and `CLAUDE.md` describe where agents live, how they are installed and how they are
  indexed.
- A `coo` session in a project with the agents and skills installed can launch every reviewer
  and get back a verdict and findings in the format `coo` expects.

## Decisions already taken

Treat these as constraints. Do not reopen them.

1. **Agents live in `agents/` at the repo root**, one file per agent: `agents/reviewer-<area>.md`.
   The repo does not become a Claude Code plugin.
2. **One skill per reviewer**, in the `engineering` bucket:
   `skills/engineering/review-<area>/SKILL.md`, where `<area>` is `architecture`, `edge-cases`,
   `project-practices`, `acceptance`, `security`, `performance`, `data-migrations`.
3. **Split of content.** The agent file holds the role, the area and the list of skills it loads.
   The shared skill `read-only-pr-review` holds the request, getting the PR, the read-only limits
   and the reply format. The review skill holds how to review that area.
4. **Existing skills are reused, not copied:**
   - `reviewer-architecture` also loads `architecture` and `data-layer`.
   - `reviewer-performance` also loads `performance`.
   - `reviewer-project-practices` loads no fixed stack skill; its skill tells it to read the
     reviewed project's `CLAUDE.md` and documented conventions.
5. **Read-only is enforced by tool removal plus instruction, without a hook.** Each agent sets
   `disallowedTools: Edit, Write, NotebookEdit, Agent`. It keeps `Bash` and the GitHub tools,
   which it needs to read the PR. The shared skill states that it must not push, comment on the
   PR, approve it or change files through the shell.
6. **All seven agents are in scope.**

## Facts about the platform

Checked against the Claude Code docs (`code.claude.com/docs/en/sub-agents`, `plugins/*`,
`cloud-environments`) and the `vercel-labs/skills` docs on 2026-11-13.

Subagent definitions:

- Markdown with YAML frontmatter. `name` and `description` are required. Identity comes from
  `name`, not the filename. `name` cannot contain `:`.
- `skills` preloads the full content of the listed skills at startup. Without it, the subagent can
  still find and invoke installed skills through the Skill tool.
- `disallowedTools` removes tools from the inherited set. A specifier such as `Bash(git push *)`
  removes the whole Bash tool, so Bash cannot be narrowed to read-only commands in frontmatter.
- `tools` is an allowlist. Using it would also drop the MCP tools, including the GitHub ones.
- Lookup order: `.claude/agents/` in the project, then `~/.claude/agents/`, then plugin agents.
- The main session launches an agent by name through the Agent tool (`subagent_type`) and can
  continue it later with `SendMessage`.

Cloud sessions (Claude Code on the web):

- Load `.claude/agents/` and `.claude/skills/` from the cloned repo, and skills enabled on
  claude.ai.
- Do not load `~/.claude/agents/`, `~/.claude/skills/` or plugins.

The `skills` CLI:

- Installs skills only. It has no install target for agents.
- Finds skills up to three levels below `skills/`, so `skills/<bucket>/<skill>/SKILL.md` is found.

Verified in step 1: a name in the `skills` frontmatter field preloads a user-level skill
(`~/.claude/skills/`) the same way as a project skill. A name that matches no installed skill is
skipped without an error, so each agent invokes a missing skill through the Skill tool and
replies `Cannot review:` if that fails too.

## Deliverables

### 1. Seven agent definitions

`agents/reviewer-<area>.md`, each with:

- Frontmatter: `name` (exact name from the table), `description` (area and when it is launched),
  `disallowedTools`, `skills`.
- Body: a one-sentence role, `## Area` and `## Skills`, nothing else. The input, getting the diff
  (`gh`, otherwise the GitHub MCP tools, otherwise `git diff` against the base branch), the
  read-only limits and the reply format live in `read-only-pr-review`, which every agent loads
  first.

Reply format, defined once in `read-only-pr-review`:

```markdown
Verdict: approved | changes requested

## Findings
- [blocker | should-fix | nit] <file>:<line> - <problem>
```

Rules for the verdict: `changes requested` when there is at least one `blocker` or `should-fix`;
`approved` when there are none or only `nit`. An empty findings list is a valid result. A
missing test is never more than a `nit`. A reviewer that cannot review replies only
`Cannot review: <reason>.`, with no verdict.

### 2. Seven review skills

`skills/engineering/review-<area>/SKILL.md`, written to
[`skills/personal/skill-authoring/SKILL.md`](../../skills/personal/skill-authoring/SKILL.md) and
[`skills/engineering/documentation-writing/SKILL.md`](../../skills/engineering/documentation-writing/SKILL.md).
Each holds, for its area:

- The questions the review answers, and only these.
- What to look for, as concrete checks.
- How to tell a `blocker` from a `should-fix` from a `nit` in that area.

A review skill names no other skill, agent or orchestrator, and repeats nothing from
`read-only-pr-review`.

Area notes:

| Skill | Must cover |
|-------|-----------|
| `review-architecture` | Layer boundaries, dependency direction, placement of logic and state, justified abstractions. Judges against the defaults the agent also preloads (`architecture`, `data-layer`), without naming them. |
| `review-edge-cases` | Empty, null, boundary and large inputs; error and cancellation paths; concurrency; whether each case has a test and the test asserts behaviour. |
| `review-project-practices` | Discovering the reviewed project's own rules (`CLAUDE.md`, contributing docs and other written conventions, neighbouring code) and checking the diff against them. No stack rules of its own, and no tools run. |
| `review-acceptance` | Each acceptance criterion mapped to the code and test that satisfies it; criteria not met; changes outside the step's scope. |
| `review-security` | Auth and authorization, secrets in code or logs, input validation, network and TLS, storage of sensitive data, permissions. |
| `review-performance` | Work on hot paths, query count and shape, large collections, rendering, startup. Asks for a measurement where the claim needs one. Relies on the method the agent also preloads (`performance`), without naming it. |
| `review-data-migrations` | Schema and persisted-format changes, upgrade path from every shipped version, backwards compatibility, rollback, migration tests. |

The skill descriptions must not make these skills trigger for a person asking for a code review.
Add the negative trigger, without naming another skill.

### 3. Repo conventions and index

- `README.md`: seven new rows in the engineering table; a section on the agents with a table of
  the seven and the install commands for a machine (`~/.claude/agents/`) and for a project
  (`.claude/agents/`, required for cloud sessions).
- `CLAUDE.md`: the convention for `agents/` (location, naming, where agents are listed, what to
  update when one is added or removed).
- `skills/engineering/coo/SKILL.md`: names and reply contract unchanged. It gains one rule: a
  `Cannot review:` reply never counts as approval, and `coo` tells the user what is missing.

## Acceptance criteria

- `agents/` holds exactly seven files; each `name` matches the `coo` tables character for
  character.
- Every agent has `disallowedTools: Edit, Write, NotebookEdit, Agent` and a `skills` list that
  matches decisions 2 and 4.
- The reply format is defined once, in `read-only-pr-review`, and no agent repeats it.
- Seven `review-*` skills and `read-only-pr-review` exist; each passes
  [`references/checklist.md`](../../skills/personal/skill-authoring/references/checklist.md):
  folder equals `name`, description under 1024 characters, no angle brackets in frontmatter.
- Every new skill is listed exactly once, in the top-level `README.md`, linked to its `SKILL.md`.
- `README.md` documents both install paths for the agents; `CLAUDE.md` documents the `agents/`
  convention.
- With the agents copied into a project's `.claude/agents/` and the skills installed, launching
  one core and one conditional reviewer against a real PR returns a verdict and findings in the
  agreed format, and the reviewer makes no write to the repo or the PR.

## Out of scope

- A hook that filters Bash commands for the reviewers.
- Packaging the repo as a Claude Code plugin or marketplace.
- An agent or skill for the implementer sub-session.
- Stack-specific reviewers beyond the seven.
- Changes to the review method of `code-review` or `design-coaching`.

## Notes for the orchestrator

- **Bootstrap.** The reviewers this feature creates are the ones `coo` needs to review it. Until
  they exist, `coo` has no reviewer to launch and its rule is to ask the user how to proceed.
  Settle this with the user before step 1.
- **Order.** The output format and the split between agent and skill are shared by all seven
  pieces. Fix them in the first step, on one reviewer, and verify the unconfirmed `skills`
  behaviour there.
- **Language.** Skills, agents and docs are written in English.
- **Commits and pushes.** `CLAUDE.md` allows committing and pushing, including to `main`.
