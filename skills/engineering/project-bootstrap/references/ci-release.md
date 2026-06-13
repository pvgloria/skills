# CI & release

A coverage map, not a script. Provider-agnostic on purpose: every concept here has an
equivalent in any CI host — translate to whatever the project uses. Settle the topics
organically; record a labelled interview task for any left open.

## Defaults — state them, don't ask

- **CI runs only where it earns its cost**: merge requests and release branches. A plain push
  to the main branch builds nothing.
- **The main branch is protected** — everything lands via reviewed MR/PR, including
  CI-generated changes (version bumps arrive as an MR a human merges, never a direct push).
- **Job scripts read as code**: short named functions, definitions tucked away like private
  helpers, the job body a list of calls. One collapsible log group per step — on failure, the
  open group is the failed step. Comments follow the global policy: contracts and traps only.

## Topics to cover

Each with the recommendation and the reasoning to give when the user has no opinion:

- **Where do jobs run?** — Price the expected monthly pipeline volume against the host's free
  tier (runs per week × minutes per run × the host's per-OS multiplier); the conclusion is
  provider-dependent, not a constant. When it doesn't fit — or pipelines are slow — a
  self-hosted runner on the dev machine makes the cost zero and is usually faster. If
  self-hosting: started manually, never at login (the user controls when their machine works
  for CI; pipelines waiting while it's off is acceptable solo), and keep the other option as a
  one-toggle documented fallback. Revisit when there's a team or pipelines must run unattended.
- **How many jobs?** — One verification job (lint + unit tests + build in a single tool
  invocation), not a job per step: each extra job re-pays image pull, cache restore and
  toolchain startup, and compilation overlap is wasted. Step-level failure visibility comes
  from log groups, not job splits. (Merging Sona's three MR jobs into one cut ~35% off every
  pipeline.)
- **Build cache** — the goal: a new branch never starts cold, because the cold first build is
  the most expensive build there is. The mechanism is provider-dependent — check the cache's
  scoping and mutability before designing: where caches are mutable and globally scoped, one
  fixed key shared by every branch does it; where caches are immutable and branch-scoped (so
  only the default branch is visible to all), seed the cache from the default branch — a
  documented exception to "pushes to main build nothing". Eviction may be automatic or a
  documented manual clear.
- **Review-cycle cost** — intermediate review-fix pushes skip CI; only the final push runs the
  pipeline, and merging still requires it green. The skip mechanism varies (a push option, a
  commit-message marker, draft-PR semantics) — surface the cost of whichever the host offers
  (e.g. markers pollute commit history) and let the user pick.
- **How is a release triggered?** — An explicit, named, typed trigger — never "set variable X
  to 1" magic. The form depends on the host: a dedicated manually-dispatched workflow is its
  own button and needs only the bump-size choice; a shared "run pipeline" form additionally
  needs a boolean "release" toggle to separate release runs from normal ones. Either way the
  field descriptions teach by example and stay version-relative so they never go stale
  ("Releasing 0.2.0? minor → 0.3.0 (new features), patch → 0.2.1 (bugfixes only), major →
  1.0.0 (milestone)").
- **Release branches** — the button cuts `release/X.Y.Z` off main and opens the MR that bumps
  main to the next version. Every automated step is idempotent: re-pressing the button or
  re-running a failed job must never double-bump or corrupt state. Trap: verify the host runs
  CI on bot-created MRs with the token the pipeline uses — on some hosts the default CI token
  deliberately doesn't trigger workflows, leaving the bump MR unmergeable against a required
  check; a dedicated bot token fixes it.
- **Who allocates version numbers?** — Humans and the version-bump tasks; CI only
  *pre-allocates*. Each release build ships exactly the version the branch carries, then bumps
  to reserve the next number. Consequences worth spelling out: the cut ships main's allocation
  untouched; a cherry-pick rebuild finds a fresh never-uploaded number waiting; rebuilding with
  no new commit is just "re-run the pipeline". (Lesson: bump-*before*-build burns a number per
  release and needs fragile first-build detection; bump-after needs none.) The pre-allocation
  commit pushed back to the release branch must carry the host's skip-CI marker, or it
  re-triggers the very build that produced it — an infinite loop.
- **Build numbering** — restarts at 1 on every version bump: the numbering budget becomes
  per-version and "0.3.0 (2)" reads as "second build of 0.3.0". A forever-incrementing global
  counter buys nothing — the moment a release branch forks, both sides increment independently
  anyway. The reset is only safe because the store-facing build identifier is *derived* and
  positional (e.g. `major×10M + minor×100k + patch×1k + build`): stores require it strictly
  increasing across all uploads forever, and the formula keeps it monotonic across versions
  while the human-facing build number resets.
- **Tags** — `vX.Y.Z`, created after store acceptance, one per shipped version, and they must
  point at the commit the shipped artifact was built from. Trap: with post-build
  pre-allocation the branch tip is one commit *ahead* of what shipped — the tag task must
  compensate, not the human's memory. A fix to an already-shipped version is a new `X.Y.Z+1`
  release, not a rebuild.
- **Release notes** — derived from the changelog (it is already the curated list of
  user-visible change), condensed and translated at release-prep time, committed per-locale and
  reviewed like code. CI packages them next to the artifact, ready to paste, and enforces the
  store's character limit (Play: 500/locale) so the failure is instant, not at upload. Pick the
  file layout the store's publishing tool consumes, so future upload automation is drop-in.
  The editorial step (condense, translate, decide what testers care about) stays human+agent —
  don't put an unreviewed LLM call inside the pipeline.
- **Store upload** — manual at first (download artifact, paste notes); automate only when
  releases are frequent enough to bore. The pieces above are arranged so automation slots in
  without redesign.

## Portability rules

- **The CI config file is provider-specific and disposable; the shell logic is the asset.**
  Keep the logic in named functions (or `scripts/*.sh`) so migrating provider means moving
  bash, not redesigning a release flow.
- **A self-hosted shell runner uses the machine's toolchain, not the job's declared container
  image.** Pin the toolchain env (JAVA_HOME, SDK paths, PATH) explicitly in the runner config —
  service shells don't inherit the user's dotfiles. Keep the container image declarations
  anyway: they document the hosted fallback.
- **Audit copied snippets for GNU vs BSD differences** when the runner is macOS (e.g. `base64`
  reads stdin only). Anything that worked on hosted Linux runners is suspect.

## Output

`bootstrap/ci.md`: the decisions taken, in this order of usefulness — what runs when, who
allocates versions, the release runbook (button → branch → artifact → notes → tag), and the
runner's operational notes (how to start/stop/check it, the env it needs). The document must
be self-sufficient: a later agent builds the CI from it alone.
