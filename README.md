# skills

My personal Claude Code skills, installed with Vercel's [`skills`](https://github.com/vercel-labs/skills) CLI.

## Install

A bucket is the unit you install — point the CLI at one and you get its skills and nothing else.

**Engineering** — daily code work:

```bash
npx -y skills add https://github.com/pvgloria/skills/tree/main/skills/engineering -g
```

**COO** — the `coo` orchestrator, its reviewer skills and agents. It needs more than this
bucket; see [Install the COO pack](#install-the-coo-pack) for the full commands.

```bash
npx -y skills add https://github.com/pvgloria/skills/tree/main/skills/coo -g
```

**Productivity** — daily non-code workflow tools:

```bash
npx -y skills add https://github.com/pvgloria/skills/tree/main/skills/productivity -g
```

**Misc** — kept around but rarely used:

```bash
npx -y skills add https://github.com/pvgloria/skills/tree/main/skills/misc -g
```

**Personal** — tied to my own setup, not listed below:

```bash
npx -y skills add https://github.com/pvgloria/skills/tree/main/skills/personal -g
```

> **Note:** plain `npx skills add pvgloria/skills -g` installs all five buckets. Use a bucket
> URL to take only what you need, or `-s debug -s refactor` to pick individual skills.

`-g` installs for every project, into each agent's own directory (`~/.claude/skills/` for
Claude Code). Drop it to install into the current project instead.

Run it without `-y` and the CLI prompts for the scope, the agents to install to, which skills
to take, and symlink vs copy. To answer all of that up front and take the whole bucket:

```bash
npx -y skills add https://github.com/pvgloria/skills/tree/main/skills/engineering -g -s '*' --agent claude-code
```

`-s '*'` is what makes it the whole bucket rather than a picker. Answering the method prompt
this way means copies, not symlinks.

### Update skills

```bash
npx skills update -g
```

One command refreshes everything the CLI installed — these skills and third-party ones alike.

### List installed skills

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

## COO pack

[`coo`](skills/coo/coo/SKILL.md) runs a feature as story-sized steps, one PR each, and launches
reviewer agents by name on each step's PR. The skills, the agents and the review skills they
preload live together in the [`skills/coo/`](skills/coo/) bucket.

### COO skills

| Skill | Description |
|-------|-------------|
| [`coo`](skills/coo/coo/SKILL.md) | Run a feature as a COO orchestrator — story-sized steps, one PR each, reviewer agents gating the next step. |
| [`read-only-pr-review`](skills/coo/read-only-pr-review/SKILL.md) | Review a PR without changing anything — get the diff, stay read-only, reply with a verdict and graded findings. Loaded by every reviewer agent. |
| [`review-acceptance`](skills/coo/review-acceptance/SKILL.md) | Review a PR against its step — every acceptance criterion met, the goal delivered, nothing outside the scope. Loaded by the `reviewer-acceptance` agent. |
| [`review-architecture`](skills/coo/review-architecture/SKILL.md) | Review a PR's architecture — layer boundaries, dependency direction, where logic and state live, justified abstractions. Loaded by the `reviewer-architecture` agent. |
| [`review-data-migrations`](skills/coo/review-data-migrations/SKILL.md) | Review a PR's data migrations — schema and persisted-format changes, the upgrade path from every shipped version, compatibility in both directions, rollback, and migration tests. Loaded by the `reviewer-data-migrations` agent. |
| [`review-edge-cases`](skills/coo/review-edge-cases/SKILL.md) | Review a PR's edge cases — empty, null, boundary and large inputs, failures, cancellation, concurrency, and whether their tests assert the behaviour. Loaded by the `reviewer-edge-cases` agent. |
| [`review-performance`](skills/coo/review-performance/SKILL.md) | Review a PR's performance — work on hot paths, query count and shape, large collections, rendering and startup, and a measurement where a speed or memory claim needs one. Loaded by the `reviewer-performance` agent. |
| [`review-project-practices`](skills/coo/review-project-practices/SKILL.md) | Review a PR against its project's own rules — CLAUDE.md files, contributing docs and other written conventions, and the conventions of the neighbouring code. Loaded by the `reviewer-project-practices` agent. |
| [`review-security`](skills/coo/review-security/SKILL.md) | Review a PR's security — authentication and authorization on its entry points, secrets, untrusted input, network and TLS, sensitive data at rest, and permissions. Loaded by the `reviewer-security` agent. |

### Agents

Claude Code subagent definitions live in [`skills/coo/agents/`](skills/coo/agents/), one file per
agent. A reviewer agent's file holds only its role, its area and the skills it preloads:
`read-only-pr-review`, shared by every reviewer, for getting the PR, staying read-only and the
format of the verdict and findings; then its own `review-<area>` skill for how to review its
area; then any existing skill it reuses for that area. See [CLAUDE.md](CLAUDE.md) for the
convention.

| Agent | Area | Skills |
|-------|------|--------|
| [`reviewer-acceptance`](skills/coo/agents/reviewer-acceptance.md) | The PR does what the step asked, all of it and nothing more. | `read-only-pr-review`, `review-acceptance` |
| [`reviewer-architecture`](skills/coo/agents/reviewer-architecture.md) | Architecture and the good practices of the project's stack. | `read-only-pr-review`, `review-architecture`, `architecture`, `data-layer` |
| [`reviewer-data-migrations`](skills/coo/agents/reviewer-data-migrations.md) | Data migrations: schema and persisted-format changes, upgrade from every shipped version, compatibility in both directions, rollback. | `read-only-pr-review`, `review-data-migrations` |
| [`reviewer-edge-cases`](skills/coo/agents/reviewer-edge-cases.md) | Edge cases: covered and not breaking. | `read-only-pr-review`, `review-edge-cases` |
| [`reviewer-performance`](skills/coo/agents/reviewer-performance.md) | Performance: hot paths, queries, large collections, rendering, startup. | `read-only-pr-review`, `review-performance`, `performance` |
| [`reviewer-project-practices`](skills/coo/agents/reviewer-project-practices.md) | Practices defined in the project. | `read-only-pr-review`, `review-project-practices` |
| [`reviewer-security`](skills/coo/agents/reviewer-security.md) | Security: auth, secrets, untrusted input, network and TLS, sensitive data at rest, permissions. | `read-only-pr-review`, `review-security` |

### Install the COO pack

The pack is three pieces, installed in the same scope:

- the `coo` bucket: `coo`, `read-only-pr-review` and the `review-*` skills;
- `architecture`, `data-layer` and `performance` from the engineering bucket, which the
  architecture and performance reviewers preload. An agent preloads a skill by name, and a skill
  that isn't installed is skipped without an error;
- the agent files. The `skills` CLI installs skills only: `npx skills add` and
  `npx skills update` never touch agents, so they are copied from a clone of this repo.

Clone this repo once:

```bash
git clone --depth 1 https://github.com/pvgloria/skills ~/.cache/pvgloria-skills
```

**Machine** — every project on this computer:

```bash
mkdir -p ~/.claude/agents && cp ~/.cache/pvgloria-skills/skills/coo/agents/*.md ~/.claude/agents/
npx -y skills add https://github.com/pvgloria/skills/tree/main/skills/coo -g -s '*' --agent claude-code
npx -y skills add https://github.com/pvgloria/skills/tree/main/skills/engineering -g -s architecture -s data-layer -s performance --agent claude-code
```

**Project** — run from the project root, then commit `.claude/agents/`, `.claude/skills/` and the
`skills-lock.json` the CLI writes in the project root.
Cloud sessions (Claude Code on the web) load both folders from the repository and do not load
`~/.claude/agents/` or `~/.claude/skills/`, so this is the only install they see:

```bash
mkdir -p .claude/agents && cp ~/.cache/pvgloria-skills/skills/coo/agents/*.md .claude/agents/
npx -y skills add https://github.com/pvgloria/skills/tree/main/skills/coo -s '*' --agent claude-code
npx -y skills add https://github.com/pvgloria/skills/tree/main/skills/engineering -s architecture -s data-layer -s performance --agent claude-code
```

`npx skills update` refreshes the skills. To update the agents, run
`git -C ~/.cache/pvgloria-skills pull` and copy them again.

## External skills (not mine)

Skills I use but don't author, installed straight from their own repos:

```bash
npx -y skills add chrisbanes/skills -g -s '*'
npx -y skills add mattpocock/skills -g -s grilling -s grill-me -s grill-with-docs -s handoff -s domain-modeling
```

`npx skills update -g` refreshes these along with everything else.

## Adding a new skill

1. Create a folder under the right bucket: `skills/engineering/`, `skills/coo/`,
   `skills/productivity/`, `skills/misc/`, or `skills/personal/`. The bucket decides who can install the skill on
   its own, so pick it for who should get it.
2. Add a `SKILL.md` with YAML frontmatter:
   ```
   ---
   name: skill-name
   description: What it does, and when the agent should trigger it
   ---
   (skill content here)
   ```
3. List it — promoted buckets in the tables above, `personal/` in
   [`skills/personal/README.md`](skills/personal/README.md). See [CLAUDE.md](CLAUDE.md) for
   the full convention.
4. Push to `main`. Anyone can then run `npx skills update -g` to get it.
