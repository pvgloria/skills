---
name: project-bootstrap
description: Interview the user, one decision at a time, to define the foundation of a brand-new project. Use when the user wants to bootstrap or define a new project, or mentions starting a new project in any language (e.g. "I'm starting a new project", "vou começar um projeto novo"). Not for adding features or making changes to existing projects.
---

# Project Bootstrap

Define a new project's foundation through a guided interview: one decision at a time, each with a
recommended "good enough to start" baseline. This skill decides and records — it never writes
application code, modules, design tokens, or configuration.

## Start

- Run the interview in the language the user is already speaking. Never ask which language to
  use. All generated files are written in English.
- Ground the basics before anything else: what the project is, target platform(s), and core
  stack. Ask — never assume silently.
- The bootstrap defines a brand-new project. Ignore any other project's context present in the
  session (its `CLAUDE.md`, conventions, stack) — it is noise here.
- Propose a default order through the decision areas (most structural first), but offer to start
  wherever the user prefers.

## The interview

Work through one decision at a time. For each decision:

1. **Recommend a baseline.** Propose the "good enough to start" set, explaining each item: what
   it represents and where it is used.
2. **Offer real alternatives.** Only when meaningful trade-offs exist — no filler options.
3. **Fork on readiness.** Ask whether the user already has this defined or needs to think. If
   they need to think, record it as a labelled interview task (e.g. "Interview the user to
   define the main brand colours") and move on.
4. **Infer obvious companions.** When a choice pulls in a standard partner, propose the
   companion as part of the decision rather than asking about it from scratch.
5. **Resolve dependencies.** If a decision depends on one not yet made, surface and settle that
   one first.
6. **Defend defaults once, then record the user's call.** A rejected recommendation gets its
   reasoning restated one time; if the user still disagrees and the cost lands on them, their
   choice wins — recorded with the trade-off noted, not silently.

## Output

- **Record each decision in its area's container**: `bootstrap/<area>.md` (e.g.
  `bootstrap/colors.md`, `bootstrap/typography.md`). Group related decisions in one file when
  they are settled together.
- Always generate a `CLAUDE.md`, following the practices in `references/claude-md.md`.
- Concrete values (a colour, a size, a name) live in the bootstrap records. `CLAUDE.md` and any
  other living doc hold roles and rules only, pointing to code for facts the code owns — never
  copying them.
- Add supporting docs when the content warrants it — the output's form beyond `CLAUDE.md` is
  open.
- Decisions left open remain in the output as labelled interview tasks, in one canonical
  format: an **Open decisions** section closing the area's bootstrap record, one line per task
  ("Interview the user to define X"). `CLAUDE.md` mentions an open decision only when it blocks
  work (e.g. an undecided persistence layer).

## Areas

Three areas, most structural first by default, but the user chooses where to start. Each
reference is a coverage map, not a script: within an area, follow the conversation's order,
not the file's — the skill's job is ensuring every topic ends settled or recorded as an open
interview task.

1. **Architecture & code layout** — modules, state management, DI, persistence, error handling.
2. **Design system** — tokens: colours and typography.
3. **CI & release** — where jobs run, pipeline cost, release flow, version allocation, store
   release notes. Provider-agnostic principles with the trade-offs to walk the user through.

Read the area's reference before interviewing on it.

| Area | Reference |
|------|-----------|
| Architecture & code layout | `references/architecture.md` |
| Design system | `references/design-system.md` |
| CI & release | `references/ci-release.md` |
