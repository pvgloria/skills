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

You need [Node.js](https://nodejs.org) (for `npx`) and git.

To install a bucket globally, so every project on your computer can use it:

```bash
npx -y skills add https://github.com/pvgloria/skills/tree/main/skills/engineering -g -s '*' --agent claude-code
```

Replace `engineering` with any bucket from the table above. For the `coo` bucket, follow
[Install the COO](#install-the-coo) instead: it also needs agents that this command does not
install.

What the flags do:

- `-g` installs globally, into `~/.claude/skills/`. Leave it out to install into the current
  project only, in its `.claude/skills/`.
- `-s '*'` installs every skill in the bucket. `-s debug -s refactor` installs only those two.
- `--agent claude-code` installs for Claude Code only, not for other AI tools.
- `-y` skips the questions. Without it, the CLI asks where to install, for which tools, which
  skills, and whether to copy the files or link to them. With these flags, it copies them.

To install every bucket at once, `personal` included, leave out the bucket path:
`npx skills add pvgloria/skills -g`.

### Update

To update every skill the CLI installed, including ones from other repos, run this for global
skills:

```bash
npx skills update -g
```

And this from a project's root folder for that project's skills:

```bash
npx skills update -p
```

To see what is installed:

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

1. **Plan** — agrees the problem, goal and constraints with you, splits the feature into a
   few PR-sized steps that group related user stories, and keeps the plan and its state in a
   feature file.
2. **Delegate** — hands each step to its own Claude Code implementer session, which ends with
   a PR. Implementers run on Opus / medium, each on its own branch in the project's checkout,
   never in a git worktree.
3. **Review** — runs one review round per PR: launches the reviewer agents in parallel, waits
   silently for all of them, and sends their blockers and should-fix findings to the same
   implementer once. There is no second round.
4. **Advance** — once the round is done and the implementer has pushed its fixes, marks the PR
   ready for human review and starts the next step, stacked on the previous one if it isn't
   merged yet. For each step it lists what you have to validate: the fixes made after the
   review, which no agent checked, every finding left unfixed and every nit.

Everything it needs lives in the [`skills/coo/`](skills/coo/) bucket, which depends on no
other bucket.

### Install the COO

The COO has two parts: the skills in the `coo` bucket and the reviewer agents in
[`skills/coo/agents/`](skills/coo/agents/). Install both the same way, either in a project or
globally.

The `skills` CLI does not install or update agents, so you copy them yourself from a local copy
of this repo. Clone it once per computer:

```bash
git clone --depth 1 https://github.com/pvgloria/skills ~/.cache/pvgloria-skills
```

**In a project.** Use this if you work in Claude Code on the web: cloud sessions read skills and
agents only from the project's repository, never from `~/.claude/`. From the project's root
folder, copy the agents:

```bash
mkdir -p .claude/agents && cp ~/.cache/pvgloria-skills/skills/coo/agents/*.md .claude/agents/
```

Then install the skills:

```bash
npx -y skills add https://github.com/pvgloria/skills/tree/main/skills/coo -s '*' --agent claude-code
```

Commit `.claude/agents/`, `.claude/skills/` and `skills-lock.json`. Anyone who clones the
project then has the COO, with nothing to install.

**Globally.** Every project on your computer can use it, but cloud sessions cannot. Copy the
agents:

```bash
mkdir -p ~/.claude/agents && cp ~/.cache/pvgloria-skills/skills/coo/agents/*.md ~/.claude/agents/
```

Then install the skills:

```bash
npx -y skills add https://github.com/pvgloria/skills/tree/main/skills/coo -g -s '*' --agent claude-code
```

**To update**, run `npx skills update -p` in the project (or `-g` for a global install) for the
skills. For the agents, get the latest version of the repo:

```bash
git -C ~/.cache/pvgloria-skills pull
```

Then copy the agents again, into `.claude/agents/` in a project or `~/.claude/agents/` globally:

```bash
cp ~/.cache/pvgloria-skills/skills/coo/agents/*.md .claude/agents/
```

### Reviewer agents

Each reviewer is a Claude Code subagent that checks one area of a PR and never changes
anything. Edge cases and acceptance run on every PR with code. If a PR has only documentation or
images, only acceptance runs. Security and performance run only when the PR
clearly touches their area, and architecture only when you ask for it.

Every agent loads two skills: `read-only-pr-review`, which they all share, and its own
`review-<area>`. Each agent's file sets the model and effort it runs with.

| Agent | Runs on | Area | Model / effort | Skills |
|-------|---------|------|----------------|--------|
| [`reviewer-acceptance`](skills/coo/agents/reviewer-acceptance.md) | Every PR | The PR does what the step asked, all of it and nothing more. | sonnet / high | `read-only-pr-review`, `review-acceptance` |
| [`reviewer-architecture`](skills/coo/agents/reviewer-architecture.md) | When you ask | Architecture and the good practices of the project's stack. | sonnet / high | `read-only-pr-review`, `review-architecture` |
| [`reviewer-edge-cases`](skills/coo/agents/reviewer-edge-cases.md) | Every PR with code | Edge cases: covered and not breaking. | sonnet / high | `read-only-pr-review`, `review-edge-cases` |
| [`reviewer-security`](skills/coo/agents/reviewer-security.md) | When touched | Security: auth, secrets, untrusted input, network and TLS, sensitive data at rest, permissions. | sonnet / high | `read-only-pr-review`, `review-security` |
| [`reviewer-performance`](skills/coo/agents/reviewer-performance.md) | When touched | Performance: hot paths, queries, large collections, rendering, startup. | sonnet / high | `read-only-pr-review`, `review-performance` |

### COO skills

| Skill | Description |
|-------|-------------|
| [`coo`](skills/coo/coo/SKILL.md) | Run a feature as a COO orchestrator — a few PR-sized steps, one review round each, reviewer agents gating the next step. |
| [`read-only-pr-review`](skills/coo/read-only-pr-review/SKILL.md) | Review a PR without changing anything — get the diff, read files at the PR head, stay read-only, reply with a verdict and graded findings. Loaded by every reviewer agent. |
| [`review-acceptance`](skills/coo/review-acceptance/SKILL.md) | Review a PR against its step — every acceptance criterion met, the goal delivered, nothing outside the scope. |
| [`review-architecture`](skills/coo/review-architecture/SKILL.md) | Review a PR's architecture — layer boundaries, dependency direction, where logic and state live, justified abstractions. |
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
