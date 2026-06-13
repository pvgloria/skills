# skills

My personal Claude Code skills, plus a tiny CLI to install and update them.

## Quickstart

```bash
npx pvgloria/skills install   # install or update the skills in ~/.claude/skills
```

`install` is also update — run it again any time and it copies the latest skills
into place. It installs **everything I use**: my own skills (below) plus the
third-party ones listed in [`external-skills.json`](external-skills.json), pulled
from their original repos via the [skills.sh](https://skills.sh) CLI.

## Skills

Skills live in bucket folders under `skills/` — see [CLAUDE.md](CLAUDE.md) for the
convention. The buckets below are the promoted ones; `personal/` is intentionally not listed here.

### Engineering — daily code work

| Skill | What it does |
| --- | --- |
| [`code-review`](skills/engineering/code-review/SKILL.md) | Write thoughtful, leadership-grade reviews for Android PRs. |
| [`design-coaching`](skills/engineering/design-coaching/SKILL.md) | Coach your design judgment — shape Android/Kotlin code so a less-experienced teammate can't easily misuse it. |
| [`project-planning`](skills/engineering/project-planning/SKILL.md) | Plan a project or feature before any code — roadmap, grill, a saved plan. |
| [`project-bootstrap`](skills/engineering/project-bootstrap/SKILL.md) | Stand up a brand-new project through an interview, one decision at a time. |

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

Skills I use but don't author live in [`external-skills.json`](external-skills.json),
keyed by their source repo. `install` runs `npx skills add` for each, so they're
fetched from the original repo and updated with `npx skills update`.

| Repo | Skills |
| --- | --- |
| [`chrisbanes/skills`](https://github.com/chrisbanes/skills) | all (Compose + Kotlin) |
| [`mattpocock/skills`](https://github.com/mattpocock/skills) | `grill-me`, `grill-with-docs`, `handoff` |

## Adding or changing a skill

Skills are organized into buckets under `skills/<bucket>/<skill>/`. See [CLAUDE.md](CLAUDE.md)
for the full convention — which buckets are promoted, and the rule that every promoted skill is
referenced here **and** in [`.claude-plugin/plugin.json`](.claude-plugin/plugin.json). After
editing, push to `main`, then run `npx pvgloria/skills install` again.
