# skills

My personal Claude Code skills, installed with Vercel's [`skills`](https://github.com/vercel-labs/skills) CLI.

## Install

A bucket is the unit you install — point the CLI at one and you get its skills and nothing else.

**Engineering** — daily code work:

```bash
npx -y skills add https://github.com/pvgloria/skills/tree/main/skills/engineering -g
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

> **Note:** plain `npx skills add pvgloria/skills -g` installs all four buckets. Use a bucket
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
| [`release-notes`](skills/productivity/release-notes/SKILL.md) | Turn a changelog into Play / App Store release notes. |

## Misc skills

| Skill | Description |
|-------|-------------|
| [`consolidate-memory`](skills/misc/consolidate-memory/SKILL.md) | Tidy up Claude's memory files — merge duplicates, prune stale facts. |
| [`mentorship`](skills/misc/mentorship/SKILL.md) | People-management and leadership coaching for an engineer growing into a lead role. |

## External skills (not mine)

Skills I use but don't author, installed straight from their own repos:

```bash
npx -y skills add chrisbanes/skills -g -s '*'
npx -y skills add mattpocock/skills -g -s grilling -s grill-me -s grill-with-docs -s handoff -s domain-modeling
```

`npx skills update -g` refreshes these along with everything else.

## Adding a new skill

1. Create a folder under the right bucket: `skills/engineering/`, `skills/productivity/`,
   `skills/misc/`, or `skills/personal/`. The bucket decides who can install the skill on
   its own, so pick it for who should get it.
2. Add a `SKILL.md` with YAML frontmatter:
   ```
   ---
   name: skill-name
   description: What it does, and when the agent should trigger it
   ---
   (skill content here)
   ```
3. List it — promoted buckets in the table above, `personal/` in
   [`skills/personal/README.md`](skills/personal/README.md). See [CLAUDE.md](CLAUDE.md) for
   the full convention.
4. Push to `main`. Anyone can then run `npx skills update -g` to get it.
