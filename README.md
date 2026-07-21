# skills

My personal Claude Code skills, installed with the [skills.sh](https://skills.sh) CLI.

## Install

Skills are grouped into buckets, and a bucket is the unit you install — point the CLI at
one and you get its skills and nothing else:

```bash
npx -y skills add https://github.com/pvgloria/skills/tree/main/skills/engineering -g
npx -y skills add https://github.com/pvgloria/skills/tree/main/skills/productivity -g
npx -y skills add https://github.com/pvgloria/skills/tree/main/skills/misc -g
```

Drop the `/tree/main/skills/<bucket>` suffix to take everything at once:

```bash
npx -y skills add pvgloria/skills -g
```

`-g` installs at user level, into `~/.agents/skills/` with a symlink from each agent's own
directory (`~/.claude/skills/` for Claude Code). Without `-g` the skills land in the current
project instead. The CLI asks which agents to target; `--agent claude-code` answers that up
front, and `-y` skips the remaining prompts.

Individual skills work too, if a whole bucket is more than you want:

```bash
npx -y skills add pvgloria/skills -g -s debug -s refactor
```

`personal/` is installable the same way, but it's tied to my own setup and isn't listed below:

```bash
npx -y skills add https://github.com/pvgloria/skills/tree/main/skills/personal -g
```

## Update

One command refreshes everything the CLI installed — these skills and the third-party ones
alike:

```bash
npx skills update -g
npx skills list       # what's installed, and where it came from
```

The record of what you have lives in `~/.agents/.skill-lock.json`, written by the CLI.

## Skills

### Engineering — daily code work

| Skill | What it does |
| --- | --- |
| [`architecture`](skills/engineering/architecture/SKILL.md) | The layered-architecture defaults — dependency direction, where logic/state live, how repositories and use cases are shaped. |
| [`code-review`](skills/engineering/code-review/SKILL.md) | Write thoughtful, leadership-grade reviews for Android PRs. |
| [`commit-style`](skills/engineering/commit-style/SKILL.md) | The git commit message convention — title, when bullets, language, prefix rules. |
| [`data-layer`](skills/engineering/data-layer/SKILL.md) | Android data-layer defaults — serialization, mapper testing, and the network boundary (DTOs at the edge, distrust the wire). |
| [`debug`](skills/engineering/debug/SKILL.md) | Chase a bug to its root cause — reproduce with a failing test, fix at the root, leave a regression guard. |
| [`design-coaching`](skills/engineering/design-coaching/SKILL.md) | Coach your design judgment — shape Android/Kotlin code so a less-experienced teammate can't easily misuse it. |
| [`documentation-writing`](skills/engineering/documentation-writing/SKILL.md) | Keep documentation information-only — cut justifications, virtue claims, and paraphrases, then write what's left for a human. |
| [`feature-planning`](skills/engineering/feature-planning/SKILL.md) | Plan a project or feature before any code — roadmap, grill, a saved plan. |
| [`implement`](skills/engineering/implement/SKILL.md) | Drive an agreed task to a production-grade bar — block by block, auto-review, stop to validate, never auto-commit. |
| [`performance`](skills/engineering/performance/SKILL.md) | Optimize speed/memory the disciplined way — measure first, fix the proven bottleneck, verify the win against a baseline. |
| [`project-bootstrap`](skills/engineering/project-bootstrap/SKILL.md) | Stand up a brand-new project through an interview, one decision at a time. |
| [`refactor`](skills/engineering/refactor/SKILL.md) | Inherit unfamiliar code and change it safely — map it first, characterize with tests, refactor in behaviour-preserving steps. |
| [`ui-components`](skills/engineering/ui-components/SKILL.md) | Build UI reuse-first — discover the design system, reuse or compose it, author new only when nothing fits. |

### Productivity — daily non-code workflow tools

| Skill | What it does |
| --- | --- |
| [`release-notes`](skills/productivity/release-notes/SKILL.md) | Turn a changelog into Play / App Store release notes. |

### Misc — kept around but rarely used

| Skill | What it does |
| --- | --- |
| [`consolidate-memory`](skills/misc/consolidate-memory/SKILL.md) | Tidy up Claude's memory files — merge duplicates, prune stale facts. |
| [`mentorship`](skills/misc/mentorship/SKILL.md) | People-management and leadership coaching for an engineer growing into a lead role. |

## External skills (not mine)

Skills I use but don't author, installed straight from their own repos:

```bash
# Compose + Kotlin — the whole repo
npx -y skills add chrisbanes/skills -g -s '*'

npx -y skills add mattpocock/skills -g \
  -s grilling -s grill-me -s grill-with-docs -s handoff -s domain-modeling
```

After that they update along with everything else through `npx skills update -g`.

## Adding or changing a skill

Skills live at `skills/<bucket>/<skill>/SKILL.md`. See [CLAUDE.md](CLAUDE.md) for the full
convention — which buckets are promoted, and the rule that every promoted skill is referenced
here. Push to `main`, then `npx skills update -g` to pull the change onto a machine.
