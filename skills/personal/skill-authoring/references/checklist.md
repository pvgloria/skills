# Skill checklist

Run through this when creating or revising a skill.

## Before writing
- [ ] 2-3 concrete use cases named, each with a trigger and the steps it unblocks
- [ ] Confirmed the workflow repeats — not a one-off prompt
- [ ] Bucket chosen (`engineering` / `productivity` / `misc` / `personal`)

## Frontmatter
- [ ] `---` delimiters present, valid YAML
- [ ] `name`: kebab-case, no spaces or capitals, no `claude`/`anthropic`, matches folder
- [ ] `description`: states WHAT and WHEN, includes real trigger phrases
- [ ] `description` under 1024 characters
- [ ] No angle brackets (`<` `>`) anywhere in frontmatter

## Body
- [ ] Critical instruction is first, not buried
- [ ] Instructions are imperative and specific, not abstract
- [ ] Examples cover the common cases (input → action → result)
- [ ] Failure modes listed: error, cause, fix
- [ ] Body under ~5,000 words; detail pushed to `references/`
- [ ] No `README.md` inside the skill folder

## Triggering
- [ ] "Should trigger" list passes (obvious request + paraphrases)
- [ ] "Should not trigger" list passes (adjacent topics stay out)
- [ ] Negative triggers added where it overlaps a neighbouring skill

## Registration
- [ ] Listed exactly once in the correct index
- [ ] `engineering`/`productivity`/`misc` → top-level `README.md` **and** `plugin.json`
- [ ] `personal` → `skills/personal/README.md` only, absent from both top-level README and `plugin.json`
