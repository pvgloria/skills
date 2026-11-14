# skills

My personal Claude Code skills, installed with Vercel's [`skills`](https://github.com/vercel-labs/skills) CLI.

The skills are grouped into **buckets**, the folders under [`skills/`](skills/). A bucket is
what you install: point the CLI at one and you get its skills and nothing else.

| Bucket | Contents |
|--------|----------|
| `engineering` | Daily code work — [Engineering skills](#engineering-skills) |
| `productivity` | Daily non-code workflow tools — [Productivity skills](#productivity-skills) |
| `misc` | Kept around but rarely used — [Misc skills](#misc-skills) |
| `coo` | The `coo` orchestrator and its reviewers — [COO](#coo) |
| `personal` | Tied to my own setup — indexed in [`skills/personal/README.md`](skills/personal/README.md) |

## Install

Install a bucket for every project on this machine, without prompts:

```bash
npx -y skills add https://github.com/pvgloria/skills/tree/main/skills/engineering -g -s '*' --agent claude-code
```

Replace `engineering` with any bucket from the table above. The `coo` bucket also needs its
agents, which the CLI does not install: see [Install the COO](#install-the-coo).

- `-g` installs into each agent's own directory (`~/.claude/skills/` for Claude Code). Drop it
  to install into the current project instead.
- `-s '*'` takes the whole bucket. `-s debug -s refactor` takes only those skills.
- `--agent claude-code` installs for Claude Code only.
- Without `-y`, the CLI prompts for the scope, the agents, the skills, and symlink vs copy.
  Answering up front with these flags means copies, not symlinks.

`npx skills add pvgloria/skills -g` with no bucket path installs every bucket, `personal`
included.

Update everything the CLI installed, these skills and third-party ones alike:

```bash
npx skills update -g
```

List the installed skills:

```bash
npx skills list
```

## Engineering skills

| Skill | Description |
|-------|-------------|
| [`architecture`](skills/engineering/architecture/SKILL.md) | The layered-architecture defaults — dependency direction, where logic/state live, how repositories and use cases are shaped. |
| [`code-review`](skills/engineering/code-review/SKILL.md) | Write thoughtful, leadership-grade reviews for Android PRs. |
| [`commit-style`](skills/engineering/commit-style/SKILL.md) | The git commit message convention — title, when bullets, language, prefix rules. |
| [`data-layer`](skills/engineering/data-layer/SKILL.md) | Android data-layer defaults — serialization, mapper testing, and the network boundary. |
| [`debug`](skills/engineering/debug/SKILL.md) | Chase a bug to its root cause — reproduce with a failing test, fix at the root, leave a regression guard. |
| [`design-coaching`](skills/engineering/design-coaching/SKILL.md) | Coach your design judgment — shape Android/Kotlin code so a teammate can't easily misuse it. |
| [`documentation-writing`](skills/engineering/documentation-writing/SKILL.md) | Keep documentation information-only — cut justifications, virtue claims, and paraphrases. |
| [`feature-planning`](skills/engineering/feature-planning/SKILL.md) | Plan a project or feature before any code — roadmap, grill, a saved plan. |
| [`implement`](skills/engineering/implement/SKILL.md) | Drive an agreed task to a production-grade bar — block by block, stop to validate, never auto-commit. |
| [`performance`](skills/engineering/performance/SKILL.md) | Optimize speed/memory the disciplined way — measure first, fix the proven bottleneck, verify against a baseline. |
| [`project-bootstrap`](skills/engineering/project-bootstrap/SKILL.md) | Stand up a brand-new project through an interview, one decision at a time. |
| [`refactor`](skills/engineering/refactor/SKILL.md) | Change unfamiliar code safely — map it first, characterize with tests, refactor in behaviour-preserving steps. |
| [`ui-components`](skills/engineering/ui-components/SKILL.md) | Build UI reuse-first — discover the design system, reuse or compose it, author new only when nothing fits. |

## Productivity skills

| Skill | Description |
|-------|-------------|
| [`leadership-messages`](skills/productivity/leadership-messages/SKILL.md) | Draft team updates, recognition, and bad news as a lead — frameworks, templates, and the language to keep out. |
| [`release-notes`](skills/productivity/release-notes/SKILL.md) | Turn a changelog into Play / App Store release notes. |

## Misc skills

| Skill | Description |
|-------|-------------|
| [`consolidate-memory`](skills/misc/consolidate-memory/SKILL.md) | Tidy up Claude's memory files — merge duplicates, prune stale facts. |

## COO

[`coo`](skills/coo/coo/SKILL.md) turns a Claude Code session into the Chief Operations Officer
of one feature. It takes a PRD, ADR, document or prompt and builds it end to end without
writing or reviewing code itself:

1. **Plan** — agrees the problem, goal and constraints with you, splits the feature into
   story-sized steps, and keeps the plan and its state in a feature file.
2. **Delegate** — hands each step to its own Claude Code implementer session, which ends with
   a PR.
3. **Review** — launches the reviewer agents on the PR in parallel, waits for all of them, and
   sends their merged findings back to the same implementer, round after round.
4. **Advance** — once every reviewer approves, marks the PR ready for human review and starts
   the next step, stacked on the previous one if it isn't merged yet.

Everything it needs lives in the [`skills/coo/`](skills/coo/) bucket, which depends on no
other bucket.

### Install the COO

The COO is the `coo` bucket plus the reviewer agents in [`skills/coo/agents/`](skills/coo/agents/),
installed in the same scope. The `skills` CLI never installs or updates agents, so they are
copied from a clone of this repo:

```bash
git clone --depth 1 https://github.com/pvgloria/skills ~/.cache/pvgloria-skills
```

**Machine** — every project on this computer:

```bash
mkdir -p ~/.claude/agents && cp ~/.cache/pvgloria-skills/skills/coo/agents/*.md ~/.claude/agents/
```

```bash
npx -y skills add https://github.com/pvgloria/skills/tree/main/skills/coo -g -s '*' --agent claude-code
```

**Project** — run from the project root, then commit `.claude/agents/`, `.claude/skills/` and the
`skills-lock.json` the CLI writes. Cloud sessions (Claude Code on the web) load only these
folders from the repository, never `~/.claude/`, so this is the only install they see:

```bash
mkdir -p .claude/agents && cp ~/.cache/pvgloria-skills/skills/coo/agents/*.md .claude/agents/
```

```bash
npx -y skills add https://github.com/pvgloria/skills/tree/main/skills/coo -s '*' --agent claude-code
```

**Update** — `npx skills update` refreshes the skills. For the agents, pull the clone and copy
them again:

```bash
git -C ~/.cache/pvgloria-skills pull
```

### Reviewer agents

Each reviewer is a read-only Claude Code subagent that covers one area. The core reviewers run
on every PR; the conditional ones only when the PR touches their area. An agent's file holds
only its role, its area and the two skills it preloads: `read-only-pr-review`, shared by all,
and its own `review-<area>`.

| Agent | Runs on | Area | Skills |
|-------|---------|------|--------|
| [`reviewer-acceptance`](skills/coo/agents/reviewer-acceptance.md) | Every PR | The PR does what the step asked, all of it and nothing more. | `read-only-pr-review`, `review-acceptance` |
| [`reviewer-architecture`](skills/coo/agents/reviewer-architecture.md) | Every PR | Architecture and the good practices of the project's stack. | `read-only-pr-review`, `review-architecture` |
| [`reviewer-edge-cases`](skills/coo/agents/reviewer-edge-cases.md) | Every PR | Edge cases: covered and not breaking. | `read-only-pr-review`, `review-edge-cases` |
| [`reviewer-project-practices`](skills/coo/agents/reviewer-project-practices.md) | Every PR | Practices defined in the project. | `read-only-pr-review`, `review-project-practices` |
| [`reviewer-security`](skills/coo/agents/reviewer-security.md) | When touched | Security: auth, secrets, untrusted input, network and TLS, sensitive data at rest, permissions. | `read-only-pr-review`, `review-security` |
| [`reviewer-performance`](skills/coo/agents/reviewer-performance.md) | When touched | Performance: hot paths, queries, large collections, rendering, startup. | `read-only-pr-review`, `review-performance` |
| [`reviewer-data-migrations`](skills/coo/agents/reviewer-data-migrations.md) | When touched | Data migrations: schema and persisted-format changes, upgrade from every shipped version, compatibility in both directions, rollback. | `read-only-pr-review`, `review-data-migrations` |

### COO skills

| Skill | Description |
|-------|-------------|
| [`coo`](skills/coo/coo/SKILL.md) | Run a feature as a COO orchestrator — story-sized steps, one PR each, reviewer agents gating the next step. |
| [`read-only-pr-review`](skills/coo/read-only-pr-review/SKILL.md) | Review a PR without changing anything — get the diff, stay read-only, reply with a verdict and graded findings. Loaded by every reviewer agent. |
| [`review-acceptance`](skills/coo/review-acceptance/SKILL.md) | Review a PR against its step — every acceptance criterion met, the goal delivered, nothing outside the scope. |
| [`review-architecture`](skills/coo/review-architecture/SKILL.md) | Review a PR's architecture — layer boundaries, dependency direction, where logic and state live, justified abstractions. |
| [`review-data-migrations`](skills/coo/review-data-migrations/SKILL.md) | Review a PR's data migrations — schema and persisted-format changes, the upgrade path from every shipped version, compatibility in both directions, rollback, and migration tests. |
| [`review-edge-cases`](skills/coo/review-edge-cases/SKILL.md) | Review a PR's edge cases — empty, null, boundary and large inputs, failures, cancellation, concurrency, and whether their tests assert the behaviour. |
| [`review-performance`](skills/coo/review-performance/SKILL.md) | Review a PR's performance — work on hot paths, query count and shape, large collections, rendering and startup, and a measurement where a speed or memory claim needs one. |
| [`review-project-practices`](skills/coo/review-project-practices/SKILL.md) | Review a PR against its project's own rules — CLAUDE.md files, contributing docs and other written conventions, and the conventions of the neighbouring code. |
| [`review-security`](skills/coo/review-security/SKILL.md) | Review a PR's security — authentication and authorization on its entry points, secrets, untrusted input, network and TLS, sensitive data at rest, and permissions. |

Each `review-<area>` skill is loaded by the `reviewer-<area>` agent of the same area.

## External skills

Skills I use but don't author, installed straight from their own repos. `npx skills update -g`
refreshes them with everything else.

```bash
npx -y skills add chrisbanes/skills -g -s '*'
```

```bash
npx -y skills add mattpocock/skills -g -s grilling -s grill-me -s grill-with-docs -s handoff -s domain-modeling
```

## Adding a skill

1. Create `skills/<bucket>/<skill>/SKILL.md`. The bucket decides who can install the skill on
   its own, so pick it for who should get it.
2. Start `SKILL.md` with YAML frontmatter:
   ```
   ---
   name: skill-name
   description: What it does, and when the agent should trigger it
   ---
   ```
3. List it: promoted buckets in the tables above, `personal` in
   [`skills/personal/README.md`](skills/personal/README.md).
4. Push to `main`. `npx skills update -g` then picks it up.

[CLAUDE.md](CLAUDE.md) holds the full conventions, agents included.
