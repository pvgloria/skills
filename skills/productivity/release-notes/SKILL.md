---
name: release-notes
description: >
  Use when writing or updating app store release notes (Google Play, App Store) from a
  project's changelog. Trigger when asked to generate, write, or refresh release notes before
  a release. Project-agnostic — discovers paths, locales, length limit, and voice per repo.
---

# Release Notes

Write the "What's new" text users see in the store. The audience is **non-technical** — people
deciding whether the update helps them, not developers. This is a craft task with editorial
judgment, never a copy of the changelog.

## Discover the project first

Inspect the repo — don't assume:

- **Source (what changed):** the changelog, usually `CHANGELOG.md` at root. Read the section for the version being released. Skip any internal / non-user section. No changelog → ask.
- **Target (where notes live, which locales):** by store convention —
  - Google Play (Gradle Play Publisher): `**/src/main/play/release-notes/<locale>/default.txt`
  - App Store (fastlane): `fastlane/metadata/<locale>/release_notes.txt`
  - Glob for it; the existing locale subfolders are the set to write. Other layout → ask.
- **Length limit:** Google Play = 500 chars per locale; App Store = 4000. Count conservatively — the trailing newline counts, and CI may hard-fail on overflow. Stay safely under.
- **Voice:** read the existing notes and their git history. Match the project's register, opening/closing lines, and bullet style — the repo teaches you its own voice. First release, no priors → warm plain-language default, confirm with the user.
- **Version being released:** from the version source (`version.properties`, `package.json`, a tag) or the top changelog section. Ambiguous → ask.

## Principles

- **Edit, don't transcribe.** The changelog is for whoever reads the *code*; the note is for the user. Strip implementation detail and jargon, keep the benefit. Cut a clause that's engineer-reassurance, not user value.
- **One benefit per bullet** — concrete, something a user notices. No version numbers, build numbers, or internal feature names.
- **Quote in-app labels exactly.** A note naming a button or action must use the string the user actually sees, in each locale.
- **Accumulate by feel, with a reason.** A note needn't map 1:1 to one version. When a release is thin, fold in recent improvements so it's worth reading. Test: *does this give the user a satisfying picture of what's improved lately?* As substantial items arrive and the limit bites, older ones drop off — no fixed window.
- **No ordinals in the opening.** "Second release", "Third update" doesn't scale (what at 100?). Open with a warm, evergreen line; vary it each release.

**Edit, don't transcribe — example:**

> Changelog: *Notifications now have a "Snooze 15 min" action; the reminder fires again 15 minutes later and survives a reboot.*
>
> Note: *Reminders now have a "Snooze 15 min" action*
>
> The "fires again / survives a reboot" tail is how it works, not what the user gains — cut it.

## Process

1. Discover source, target, limit, voice, version.
2. Decide what to tell the user; fold in recent items if the release is thin.
3. Draft the primary locale, then localize the rest — real localization, not literal.
4. Verify each locale is safely under its limit.
5. Show every locale to the user for review. Don't commit — the user owns the editorial call.
