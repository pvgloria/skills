# Frontmatter reference

## Required

```yaml
---
name: skill-name-in-kebab-case
description: What it does and when to use it. Include specific trigger phrases.
---
```

- `name` — kebab-case, no spaces or capitals, no `claude`/`anthropic` prefix, equals the folder name.
- `description` — WHAT + WHEN + key capabilities. Under 1024 characters. No angle brackets.

## Optional

```yaml
license: MIT                                # for open-source skills
allowed-tools: "Bash(python:*) WebFetch"    # restricts tool access
compatibility: "Requires network access"    # 1-500 chars; environment requirements
metadata:                                   # any custom key-value pairs
  author: Pedro
  version: 1.0.0
  category: productivity
  tags: [authoring, meta]
```

## Allowed
- Any standard YAML types (strings, numbers, booleans, lists, objects)
- Custom metadata fields
- Descriptions up to 1024 characters

## Forbidden
- Angle brackets (`<` `>`)
- `claude` or `anthropic` in the name — reserved
