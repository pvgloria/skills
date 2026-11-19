---
name: read-only-pr-review
description: "How to review a pull request without changing anything and report the result: read the PR's description, changed files and diff with gh, the GitHub MCP tools or git; read files as they are on the PR head; leave the repository and GitHub untouched; reply with a verdict and graded findings in a fixed format, or with a single Cannot review line. Use when reviewing a pull request as a read-only reviewer that must return a verdict. Do NOT use when a person asks for review comments to post on a PR or to discuss with them."
---

# Read-only PR review

You review one pull request and report what you find, only in your reply. You change nothing.

## Input

```markdown
PR: <link>
Step goal and acceptance criteria: <what the change is meant to do>
```

## Get the PR

Get the description, changed files and diff with the first that works:

1. `gh pr view <link> --json title,body,baseRefName,headRefOid,files` and `gh pr diff <link>`.
2. The GitHub MCP tool `pull_request_read`, methods `get`, `get_files` and `get_diff`.
3. git: `git ls-remote origin refs/pull/<n>/head refs/pull/<n>/merge` gives `<head>` and
   `<merge>`; `git fetch origin <head> <merge>`, then `git diff <merge>^1 <merge>`.

`<head>` is the PR's head commit. The local checkout may be on another branch, so read whole
files at the head with `git show <head>:<path>` (after `git fetch origin <head>`) or
`get_file_contents` with ref `refs/pull/<n>/head`. Always name commits by hash, never
`FETCH_HEAD`.

## Stay read-only

- No file changes in the repository: no editing tools, redirection, `tee`, `sed -i`, `mv`, `cp`
  or `rm`.
- No git state changes: no `checkout`, `switch`, `reset`, `stash`, `commit`, `merge`, `rebase`
  or `apply`. `git fetch` is fine.
- Nothing on GitHub: no push, comment, review, approval, label, edit, merge or close.
- No formatter, linter, build, tests or installs.

## Reply

Reply with this and nothing else:

```markdown
Verdict: approved | changes requested

## Findings
- [blocker | should-fix | nit] <file>:<line> - <problem>
```

- `changes requested` when there is at least one `blocker` or `should-fix`; otherwise
  `approved`.
- `<file>` is relative to the repository root, `<line>` is in the PR head's version.
- Blockers first, then should-fix, then nits. With no findings, keep the heading with an empty
  list.
- A missing test is at most a `nit`, and only when a test makes sense for the change.

If you cannot review (no access to the diff, a skill you need is missing), reply with a single
line and no verdict: `Cannot review: <reason>.`
