# CLAUDE.md practices

Every bootstrap session generates a `CLAUDE.md`. These practices define what a good one looks
like — apply them when writing it, and record them so future sessions keep the file healthy.

- **Short and imperative.** Factual instruction lines, no narrative paragraphs. Every line must
  earn its place: omit anything the agent already does well by default.
- **Index + always-relevant rules.** `CLAUDE.md` opens with a table mapping each area to its
  reference doc ("read before working in that area"), and its body keeps only rules that apply
  to most sessions. Altitude test for every line: would a session working on a random part of
  the codebase need this? If it is area-specific, it belongs in the area's reference. Every
  reference doc must be in the table — an unindexed doc does not exist for the agent.
- **Rule above, rationale below.** An always-relevant rule may appear as a one-liner in
  `CLAUDE.md` while its explanation lives only in the reference doc. Never explain in both
  places — duplicated explanations drift apart.
- **Document roles and rules, not values.** A fact the code owns (a colour value, an exact list,
  a signature) is pointed to, never copied. Docs hold what code cannot answer: what each thing
  represents, where it is used, which rules govern it. This includes structure: state the
  boundary ("core never imports features"), never the current inventory (the list of modules,
  screens, files) — inventories change and the line goes stale.
- **Anti-patterns travel with their replacement.** When a convention exists because something
  went wrong once, record it as "use X, never Y". The "never Y" is what prevents regressions.
- **Examples only where ambiguity is likely.** A short snippet when the convention is easy to
  get wrong (commit format, a naming pattern); no decorative examples.
- **Commands are copy-paste ready.** One block of executable commands, a one-line comment each.
- **Named pointers only.** Every pointer names a concrete file. "Consult the relevant docs" is
  not actionable.
- **Start single-file — bootstrap records excepted.** The `bootstrap/<area>.md` records exist
  from day one and are indexed in the table like any reference doc. Beyond those, a new project
  begins with `CLAUDE.md` alone; split a section into a reference doc when it outgrows a
  screenful.

## Non-interviewed defaults

Include these sections in every generated `CLAUDE.md` without interviewing — they are stable
preferences, not project decisions. Mention them once at the end of the interview; adjust only
if the user objects.

- **Commits** — concise messages in English. A one-thing change is a single-line title; a
  multi-change commit is a title plus a few one-line factual bullets. No prose bodies.
- **Tests** — names are plain-English sentences in domain language; test doubles written
  inline, no mocking framework; nested grouping instead of comment separators.
