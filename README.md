# skills

My personal Claude Code skills, installed with Vercel's [`skills`](https://github.com/vercel-labs/skills) CLI.

The skills are grouped into **buckets**, the folders under [`skills/`](skills/). A bucket is
what you install: point the CLI at one and you get its skills and nothing else.

| Bucket | Contents |
|--------|----------|
| `engineering` | Daily code work — [Engineering skills](#engineering-skills) |
| `productivity` | Daily non-code workflow tools — [Productivity skills](#productivity-skills) |
| `misc` | Kept around but rarely used — [Misc skills](#misc-skills) |
| `coo` | The `coo` orchestrator and its agents — [COO](#coo) |
| `personal` | Tied to my own setup — indexed in [`skills/personal/README.md`](skills/personal/README.md) |

## Install

You need [Node.js](https://nodejs.org) and git. The commands are the same in the Terminal and in
PowerShell.

For every project on your computer (run it anywhere):

```bash
npx -y skills add https://github.com/pvgloria/skills/tree/main/skills/engineering -g -s '*' --agent claude-code
```

For one project only, run it from the project's root folder without `-g`. Replace `engineering`
with any bucket from the table. For `coo`, use [Install the COO](#install-the-coo) instead.

To update, run `npx skills update -g`, or `npx skills update -p` from a project's root folder.

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

[`coo`](skills/coo/coo/SKILL.md) turns a Claude Code session into the orchestrator of one
feature. It plans and decides; subagents search, build and check:

1. **Plan**: agrees a goal, a "done when" check and what to ask you first, then splits the
   feature into a few PR-sized tasks.
2. **Build**: one builder per task, one at a time, each on its own branch, ending in a PR.
3. **Check**: one round per PR. The verifier and reviewers answer PASS or FAIL; failures go back
   to the builder once.
4. **Advance**: the PR is ready for your review, with a list of what to validate, and the next
   task starts, stacked if needed.

Run the COO session on `fable` (`/model`); each agent sets its own model.

### Install the COO

The COO is the `coo` skills plus the agents in [`skills/coo/agents/`](skills/coo/agents/). The
`skills` CLI installs the skills; the agents you copy from a clone of this repo.

Install it in one of two places:

- **In a project**: needed for Claude Code on the web. Run the commands from the project's root
  folder, then commit `.claude/` and `skills-lock.json`.
- **Globally**: every project on this computer, but not cloud sessions. Run them from anywhere.

#### macOS / Linux (Terminal)

Once per computer:

```bash
git clone --depth 1 https://github.com/pvgloria/skills ~/.cache/pvgloria-skills
```

In a project:

```bash
npx -y skills add https://github.com/pvgloria/skills/tree/main/skills/coo -s '*' --agent claude-code
```

```bash
mkdir -p .claude/agents && cp ~/.cache/pvgloria-skills/skills/coo/agents/*.md .claude/agents/
```

Globally:

```bash
npx -y skills add https://github.com/pvgloria/skills/tree/main/skills/coo -g -s '*' --agent claude-code
```

```bash
mkdir -p ~/.claude/agents && cp ~/.cache/pvgloria-skills/skills/coo/agents/*.md ~/.claude/agents/
```

To update, pull the clone, run `npx skills update -p` (project) or `npx skills update -g`
(global), and run the copy command again:

```bash
git -C ~/.cache/pvgloria-skills pull
```

#### Windows (PowerShell)

Once per computer:

```powershell
git clone --depth 1 https://github.com/pvgloria/skills "$HOME\.cache\pvgloria-skills"
```

In a project:

```powershell
npx -y skills add https://github.com/pvgloria/skills/tree/main/skills/coo -s '*' --agent claude-code
```

```powershell
New-Item -ItemType Directory -Force .claude\agents | Out-Null; Copy-Item "$HOME\.cache\pvgloria-skills\skills\coo\agents\*.md" .claude\agents\
```

Globally:

```powershell
npx -y skills add https://github.com/pvgloria/skills/tree/main/skills/coo -g -s '*' --agent claude-code
```

```powershell
New-Item -ItemType Directory -Force "$HOME\.claude\agents" | Out-Null; Copy-Item "$HOME\.cache\pvgloria-skills\skills\coo\agents\*.md" "$HOME\.claude\agents\"
```

To update, pull the clone, run `npx skills update -p` (project) or `npx skills update -g`
(global), and run the copy command again:

```powershell
git -C "$HOME\.cache\pvgloria-skills" pull
```

Copying never deletes: when an agent is removed from this repo, delete its file by hand.

### Agents

The scout, the verifier and the reviewers change nothing in the repository; the verifier only runs
tests. The verifier and the reviewers all reply the same way: PASS or FAIL, what fails, and notes
for human review. A reviewer preloads only its own `review-<area>` skill.

| Agent | Runs on | Job | Model / effort | Skills |
|-------|---------|-----|----------------|--------|
| [`scout`](skills/coo/agents/scout.md) | Any search or file reading | Finds the relevant files and lines; returns paths and short excerpts. | haiku / low | — |
| [`builder`](skills/coo/agents/builder.md) | One task at a time | Builds one task on its own branch, runs its tests and opens its PR. | opus / medium | — |
| [`verifier`](skills/coo/agents/verifier.md) | Every PR | Every acceptance criterion met, nothing outside the scope, the tests and the "done when" check pass. | sonnet / medium | — |
| [`reviewer-edge-cases`](skills/coo/agents/reviewer-edge-cases.md) | Every PR with code | Edge cases: covered and not breaking. | sonnet / high | `review-edge-cases` |
| [`reviewer-security`](skills/coo/agents/reviewer-security.md) | When touched | Security: auth, secrets, untrusted input, network and TLS, sensitive data at rest, permissions. | sonnet / high | `review-security` |
| [`reviewer-performance`](skills/coo/agents/reviewer-performance.md) | When touched | Performance: hot paths, queries, large collections, rendering, startup. | sonnet / high | `review-performance` |

### COO skills

| Skill | Description |
|-------|-------------|
| [`coo`](skills/coo/coo/SKILL.md) | Run a feature as a COO orchestrator — a few PR-sized tasks, a builder per task, one round of checks each. |
| [`review-edge-cases`](skills/coo/review-edge-cases/SKILL.md) | Review a PR's edge cases — empty, null, boundary and large inputs, failures, cancellation, concurrency, and whether their tests assert the behaviour. |
| [`review-performance`](skills/coo/review-performance/SKILL.md) | Review a PR's performance — work on hot paths, query count and shape, large collections, rendering and startup, and a measurement where a speed or memory claim needs one. |
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
