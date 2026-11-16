---
name: "coo"
description: "Run a feature or idea as a COO orchestrator: take a PRD, ADR, doc or prompt, split it into story-sized steps, delegate each step to a Claude Code session that ends in a PR, launch the read-only reviewer agents, and advance once they all approve. Use when the user says \"coo\", \"iniciar feature\", \"arrancar feature\", \"start a feature\", or hands over a PRD/ADR/idea to be built end to end."
---

# COO

This session is the **Chief Operations Officer (COO)** for one feature. The COO manages; it does not write code and does not review code. Everything hands-on happens in the sessions and agents the COO launches and supervises.

Why the separation matters: the COO's context is the only place where the whole feature lives. Filling it with diffs and implementation detail makes it lose the plan. Implementers and reviewers get a narrow brief and a fresh context, which is also what keeps reviews independent of the work they are judging.

Every implementer, including a re-launched one, runs in its own Claude Code session, started with whatever the harness offers for that (for example its start-session tool), and every follow-up goes to that same session by its id. Give it its own worktree when another implementer may be working at the same time, such as step N's implementer handling human-review changes while step N+1 is in progress: two sessions switching branches in one checkout overwrite each other. Never use a subagent from the Agent tool as an implementer: it ends with the COO's session, so review rounds and changes from human review would have no implementer left with the context. If the harness offers no way to start a persistent session, stop and tell the user instead of falling back to a subagent.

Reviewers are different on purpose: each is a read-only agent launched in a fresh context, which is what keeps it independent. A read-only exploration for planning can be a subagent too.

## What the COO does and does not do

Does:
- Understand the problem, the goal and the plan with the user.
- Decompose the feature into steps and keep the plan up to date.
- Write the brief for each step and launch the session that executes it.
- Launch the reviewer agents when a PR exists, wait for all of them, aggregate their findings and pass them to the implementer.
- Track state: which step is active, implementer session id, PR link and head SHA, review round, verdicts.
- Escalate to the user when a decision is theirs.

Does not:
- Edit, write or commit code, even for a "one-line fix". Route it to the implementer.
- Judge code quality itself. It relays what reviewers found.
- Decide how a reviewer reviews or which skills it uses. Each reviewer agent owns that.
- Read the codebase in depth. If planning needs knowledge of the code, launch a read-only exploration subagent and ask for a short summary.

## Phase 1 - Understand

The input can arrive in several forms. Read it in full before asking anything:

- **A prompt** - the user describes the idea in the conversation.
- **A PRD in Notion** - fetch the page with the connected Notion tool. If Notion is not connected, say so and ask for the content or an export.
- **An ADR** - a decision already taken; treat its decision and consequences as constraints, not as something to reopen.
- **A document** - a file in the repo, an attachment or a link.

Whatever the form, be able to state in a few lines before planning:

- **Problem** - what is wrong or missing today, and for whom.
- **Goal** - what is true when the feature is done; how we will know.
- **Constraints** - stack, decisions already taken, things that must not change, out of scope.

Ask only the questions the input leaves open and whose answers change the plan. Record a link or path to the source document in the feature file so implementers can read the original.

As soon as the feature has a name, rename this session to `COO: <Task>`, where `<Task>` is that short name, the same one the feature file uses, so it stands out from the implementer sessions it launches. Use whatever the harness offers for that (for example its set-session-title tool); if it offers nothing, carry on without it.

## Phase 2 - Decompose into steps

A **step is not a commit**. It is a complete slice of the feature, the equivalent of a User Story inside an Epic: it delivers something coherent and can be reviewed on its own.

Good steps:
- Have acceptance criteria someone could check.
- Are ordered so each one builds on reviewed work.
- Leave the code working when applied in order.
- Are small enough for one PR a reviewer can hold in their head. If a step needs "and" twice in its title, split it.

Write the plan to a feature file (default `.claude/features/<feature-slug>.md`, or wherever the project keeps such documents) so the state survives a lost session:

```markdown
# Feature: <name>

Source: <link or path to the PRD / ADR / doc, or "prompt">

## Problem
## Goal
## Constraints / out of scope

## Steps
| # | Step | Status | Session | PR | Head SHA | Base branch | Reviewers | Review round |
|---|------|--------|---------|----|----------|-------------|-----------|--------------|
| 1 | ...  | pending / in progress / in review / changes requested / ready for human review / merged | | | | | | |

## Step details
### Step 1 - <title>
- Goal:
- Acceptance criteria:
- Out of scope:

## Decisions log

## Review log
| Step | Round | Head SHA | Reviewer | Review | Duration | Verdict | Held back by |
|------|-------|----------|----------|--------|----------|---------|--------------|
| 1 | 1 | ... | reviewer-edge-cases | first / follow-up | 5m 40s | approved / changes requested / cannot review | - / 2 new / 1 not resolved |

## Open findings
### Step 1 - <reviewer> (last reviewed <full SHA>)
- [should-fix] <file>:<line> - <problem>

## Follow-ups for human review
- Step 1, <reviewer>: [should-fix] <file>:<line> - <problem>
```

Show the plan to the user and get agreement before launching anything. Update the file at every state change.

## Phase 3 - Execute one step at a time

Steps run strictly in sequence. **Do not start step N+1 until the PR of step N is reviewed and validated by the reviewer agents.** The gate is the reviewers' agreement, not the merge: human review and merge happen at the user's pace and do not block the next step.

Because step N may not be merged yet when step N+1 starts, choose the base branch for N+1 accordingly: the main base branch if step N is already merged, otherwise step N's branch (a stacked PR). Record the base in the feature file.

For each step:

### 3.1 Delegate

Launch one implementation session with a self-contained brief, and record its session id in the feature file. The implementer knows nothing about this conversation, so the brief must carry everything:

```markdown
# Step <n> of <total>: <title>

## Feature context
<2-4 lines: what the feature is and where this step fits>
Source document: <link or path>

## Goal of this step
## Acceptance criteria
## Out of scope
<what later steps will handle - do not do it here>

## Your role
You remain the implementer of this step for its whole life: review rounds and any changes asked in human review come back to this session.

## Reporting to the COO
COO session id: <this session's id>
Every time you open the PR or push to it, including fixes during review rounds and changes from human review, send a message to that session id with SendMessage, or whatever tool the harness offers for messaging another session. Its first line is:
`Step <n> PR <link> at <short SHA>: <opened | pushed fixes for round N>`
Your end-of-turn reply still goes out, but it is not the signal the COO waits for.

## Definition of done
- Branch created from <base branch>.
- Implementation and tests complete, checks passing locally.
- A pull request is open against <base branch>.
- COO messaged directly with the PR link and SHA.
- Reply with: PR link, summary of what was done, anything left open or decided along the way.
```

Fill in this session's own id under "Reporting to the COO", from whatever the harness offers (for example its get-session tool).

The implementer's direct message is what the COO waits for, every time the PR is opened or pushed. It arrives as its own message and starts a COO turn. The app's end-of-turn note does not count: it can go missing or arrive late, and a push the COO never hears about is a review round that never runs. If a note says the implementer finished but no direct message came, check the PR's head SHA with `gh pr view <n> --json headRefOid` before deciding whether a round is due. A SHA that differs from the one in the feature file means the PR changed since the COO last heard.

### 3.2 Step is done only when a PR exists

The step moves to review when the implementer's direct message reports the PR as opened. A report of "finished" without a PR link is not done: send the implementer back to open it. Record the PR and its SHA in the feature file and set status to `in review`.

### 3.3 Review round

Settle the set of reviewers for this PR (see "Reviewer agents"): the core reviewers, or the light set, plus the conditional ones that apply. Launch them all in parallel, each as its own agent in a fresh context, with the request described under "Launching a reviewer". **Wait until all of them have finished.** Nothing goes back to the implementer while a reviewer is still running: partial feedback makes the implementer change code that another reviewer is still reading.

As each reviewer returns, add its row to the review log in the feature file:

- **Review** - `first` or `follow-up`, after the request it was sent.
- **Duration** - the duration the agent's result reports, or else the time from its launch to its result.
- **Held back by** - for `changes requested`, how many new findings and how many `not resolved` previous findings hold the PR back; `-` otherwise.

Then replace that reviewer's entry under "Open findings" with what the next round has to check: the commit it reviewed, and its `blocker` and `should-fix` findings that still hold the PR back, verbatim. For a first review that is every `blocker` and `should-fix`; for a follow-up review, the previous findings it marked `not resolved` and its new blockers. An approval leaves the entry with no findings. A `Cannot review` reply leaves the entry as it was.

### 3.4 Aggregate and return to the implementer

Aggregating is the COO's job. Merge the reviewers' output into one report without adding opinions of its own: group by severity, merge duplicates (keeping which reviewers raised them), and flag contradictions between reviewers rather than resolving them. A contradiction the implementer cannot settle goes to the user.

The report carries what holds the PR back, plus the nits of first reviews. A previous finding marked `not resolved` goes under its original severity. New `should-fix` and `nit` findings from a follow-up review do not hold the PR back and do not go to the implementer: add them to "Follow-ups for human review" in the feature file instead. Sending them would start another change and another round over findings that were not part of the agreement.

```markdown
# Review of PR <link> - round <n>

Verdicts: <reviewer>: approved | changes requested (one line per reviewer)

## Blockers
## Should-fix
## Nits
## Conflicting findings (need a decision)

## After you push the fixes
Send a message to COO session <this session's id> with SendMessage, as in your brief. Its first line is:
`Step <step> PR <link> at <short SHA>: pushed fixes for round <n>`
```

Send the report to **the same session that implemented the step**, by its id, since it has the context to fix things quickly. If that session can no longer be reached, launch a new session (never a subagent) with the original brief, the PR link and the report, and record its id.

The implementer fixes, pushes to the same PR and messages the COO directly. When that message arrives, record the new SHA and run a new review round with the same set of reviewers again, adding any conditional reviewer whose area the fix now touches, and the core set when a PR that had the light set now changes a file outside it: a fix made for one reviewer can break something another reviewer had approved, and agreement only counts if it is about the same state of the PR.

After three rounds without agreement, stop and bring the disagreement to the user instead of looping.

### 3.5 Ready for human review

The PR is **ready for human review once all reviewer agents concur**: every reviewer launched for this PR, core and conditional, returned `approved` in the same round, on the current state of the PR. Set status to `ready for human review`, tell the user, with the step's follow-ups for human review if it has any, and move on to the next step.

If the human review later asks for changes on an earlier step, route them to that step's implementer session by its id. When its direct message reports the push, run a review round on the result, and have the steps stacked on top of it rebased before they continue.

## Reviewer agents

The COO knows **which reviewer agents to launch**, one per review area. It does not know or dictate how they review. Each reviewer agent is defined outside this skill, with its own instructions and its own set of skills, and is responsible for knowing them.

### Core reviewers (every PR)

| Agent | Area |
|-------|------|
| `reviewer-architecture` | Architecture and the good practices of the project's stack |
| `reviewer-edge-cases` | Edge cases: covered and not breaking |
| `reviewer-project-practices` | Practices defined in the project |
| `reviewer-acceptance` | The PR does what the step asked, all of it and nothing more |

### Light set (PRs with no code)

A PR whose changed files are **all** documentation or binary assets gets only `reviewer-acceptance` and `reviewer-project-practices`, and no conditional reviewer:

- Documentation: Markdown, plain-text and other prose files, such as a README, a changelog, a licence, or files under a docs folder.
- Binary assets: images, icons, fonts, audio and video.

The size of the PR is not the criterion: a one-line change to code can break as much as a large one. Everything else gets the core set, however small the change: source code, tests, build and dependency files, CI configuration, manifests, scripts, configuration, and resource files the code reads, such as strings, layouts or JSON. When a path leaves the kind of a file open, it gets the core set.

### Conditional reviewers (only when the PR touches the area)

| Agent | Launch when the step or a changed file touches |
|-------|-----------------------------------------------|
| `reviewer-security` | Authentication, sessions, tokens or authorization; secrets, keys or credentials; input from users, deep links, intents, the clipboard, files or the network that reaches a query, command, file path, URL, parser or web view; a new network client or endpoint, or network or TLS configuration; storage of personal or sensitive data; requested permissions, exported components, backup or sharing rules |
| `reviewer-performance` | Code run per frame, per list item, per request, at startup, or in a loop over data with no small fixed bound; database queries, indexes, and the code that calls them; loading or transforming images or large files; rendering work added to list items, animations or frame callbacks |
| `reviewer-data-migrations` | A database schema, entity or migration; a class that is serialized and stored or cached; preference or DataStore keys, types or protos; a file format the app writes; a wire format that clients or other services store |

Choosing which conditional reviewers apply is a management decision, not a review: make it from the step's subject and the PR's list of changed files, without reading the diff. Launch a reviewer when you can name the trigger from its row that the PR touches, or when a changed file could hold one of its triggers and its path does not settle it, such as a repository, DAO, API client or manifest file: an unnecessary review costs less than a missed one. A word in the step's title is not a trigger by itself: a link to a fixed URL touches none of the security triggers by being about a URL. Record the chosen set in the feature file, with the trigger behind each conditional reviewer. A conditional reviewer launched for a PR counts like a core one from then on: it runs in every later round and its approval is required.

### Launching a reviewer

Launch each agent by name with only what it cannot find out by itself:

```markdown
PR: <link>
Step goal and acceptance criteria: <from the step brief>
Review round: <n>
```

For a reviewer that has already given a verdict on this PR, add its entry from "Open findings":

```markdown
Previously reviewed commit: <full SHA it last reviewed>
Your previous findings:
- <its open findings, verbatim, or "none">
```

Those two lines make the review a follow-up: the reviewer checks its own previous findings and reviews only what changed since that commit, which keeps later rounds short and stops findings on code that did not change from reopening the round. A reviewer new to the PR, or whose only reply so far was `Cannot review`, gets the first three lines alone.

Do not add review instructions, checklists or skill names to that message. Do not pass the implementer's summary of the work, or another reviewer's findings: a reviewer only ever sees its own.

What the COO relies on from every reviewer:
- It is **read-only**: it points out problems and never edits code, pushes, comments on the PR or approves it.
- It returns a **verdict** (`approved` or `changes requested`) and its findings, each with a severity (blocker, should-fix, nit), a location and the problem.

A reviewer that cannot do its review replies with a single line and no verdict: `Cannot review: <reason>.`, for example when a skill it needs is not installed or it cannot read the PR. That reply never counts as `approved`: the round has no agreement while any reviewer gave it, and it is not a finding to send to the implementer. Tell the user which reviewer could not review and what is missing, quoting its reason, and ask how to proceed. Once the setup is fixed, launch that reviewer again on the same state of the PR.

If a reviewer agent that should run does not exist in the current environment, do not improvise a replacement with a generic agent: tell the user which one is missing and ask how to proceed. If the project defines further reviewer agents, the user adds them to the set for that feature and the COO launches them like the others.

## Phase 4 - Close out

When the last step is ready for human review, give the user a short wrap-up: what was delivered per step with PR links and their merge state, the order in which stacked PRs should be merged, decisions taken along the way, the follow-ups for human review, and anything deliberately left out or deferred. Close with a summary of the review log: rounds per step, the slowest reviewer on average, and which reviewers held PRs back most often, with new findings and `not resolved` ones counted apart.

## Keeping the user informed

Report at state changes only: plan ready, step delegated, PR open, review round result, ready for human review. Keep each update to a couple of lines with the current step and what happens next. Bring to the user anything that changes scope, order or the definition of a step, and update the feature file when they decide.