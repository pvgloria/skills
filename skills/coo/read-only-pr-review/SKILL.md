---
name: read-only-pr-review
description: "How to review a pull request without changing anything and report the result: read the PR's description, changed files and diff with gh, the GitHub MCP tools or git; read files as they are on the PR head; on a re-review, check your previous findings and review only what changed since the commit you last reviewed; leave the repository and GitHub untouched; reply with a verdict and graded findings in a fixed format, or with a single Cannot review line. Use when reviewing a pull request as a read-only reviewer that must return a verdict. Do NOT use when a person asks for review comments to post on a PR or to discuss with them."
---

# Read-only PR review

You review a pull request and report what you find. You change nothing: not the repository, not
the PR, nothing on GitHub. Your verdict and findings go only in your reply.

## Input

The review request has three lines:

```markdown
PR: <link>
Step goal and acceptance criteria: <what the change is meant to do>
Review round: <n>
```

When you have reviewed this PR before, it has two more:

```markdown
Previously reviewed commit: <SHA>
Your previous findings:
- [blocker | should-fix] <file>:<line> - <problem>
```

`Your previous findings` can be `none`, when your last review approved the PR.

The step goal and acceptance criteria tell you what the PR is meant to do. Without the two extra
lines this is a **first review**: review the whole PR. With them it is a **follow-up review**:
check your previous findings and review what changed since that commit, as described under
Follow-up review.

## Get the PR

Get the PR's description, changed files and diff with the first of these that works:

1. `gh`: `gh pr view <link> --json title,body,baseRefName,headRefOid,files` and
   `gh pr diff <link>`.
2. The GitHub MCP tools: `pull_request_read` with the methods `get`, `get_files` and
   `get_diff`, taking the owner, repository and number from the link.
3. `git diff` against the base branch:
   `git ls-remote origin refs/pull/<number>/head refs/pull/<number>/merge` prints the PR's head
   commit, `<head>`, and its merge commit, `<merge>`. Run `git fetch origin <head> <merge>`, then
   `git diff <merge>^1 <merge>`. GitHub's merge commit has the base branch as its first parent.
   GitHub does not keep it while the PR has merge conflicts.

If none of the three gives you the diff, send the `Cannot review:` reply described under Reply.

`<head>` is the PR's head commit: `headRefOid` from `gh pr view`, `head.sha` from
`pull_request_read` `get`, or the commit `git ls-remote origin refs/pull/<number>/head` prints.
Name commits by their hash in every git command. Never use `FETCH_HEAD`: other processes may
fetch in the same clone while you work, and each `git fetch` there rewrites it.

The local working tree may be on a different branch from the PR. To read a whole file as it is
on the PR head, run `git show <head>:<path>` after `git fetch origin <head>`, or use the GitHub
MCP tool `get_file_contents` with the ref `refs/pull/<number>/head`. Read it from disk only when
`git rev-parse HEAD` is `<head>`.

## Follow-up review

A follow-up review answers two questions: were your previous findings fixed, and do the changes
since the commit you last reviewed break anything in your area. The rest of the PR was already
reviewed.

1. **Get the delta.** `<prev>` is the previously reviewed commit. Run
   `git fetch origin <prev> <head>`, then `git merge-base --is-ancestor <prev> <head>`. When it
   succeeds, the delta is `git diff <prev> <head>`; when git cannot fetch the commits,
   `gh api repos/<owner>/<repo>/compare/<prev>...<head>` gives the same delta when its `status`
   is `ahead`. When `<prev>` is not an ancestor of `<head>`, because the branch was rebased or
   force-pushed, or neither way reaches `<prev>`, there is no reliable delta: review the whole
   PR as in a first review, and still apply steps 2 and 3 and the follow-up verdict rule.
2. **Check each previous finding** at the PR head. It is `resolved` when the problem is gone,
   whether through the fix it suggested or another; `not resolved` otherwise.
3. **Review the delta** in your area. Wherever your area's instructions say "the diff", read the
   delta. Read the rest of the PR and the codebase only as far as the delta needs: a changed
   signature leads to its callers, a moved check to the code it used to guard.
4. **Leave reviewed code alone.** For code the delta neither changes nor affects, report a new
   problem only when it is a `blocker`. Leave out should-fix and nit findings about it. Without a
   reliable delta, this step does not apply.

## Stay read-only

- Do not create, edit or delete files in the repository, with any tool. Through the shell, that
  means no redirection or `tee` into a file, and no `sed -i`, `mv`, `cp` or `rm`.
- Do not change the local git state: no `checkout`, `switch`, `reset`, `stash`, `commit`,
  `merge`, `rebase` or `apply`. `git fetch` is allowed.
- Do not push, and do not write to GitHub: no comment, review, approval, request for changes,
  label, edit, merge or close on the PR.
- Do not run a formatter, linter, static analysis tool, build, test suite or install.

## Reply

Reply with this and nothing else, choosing one verdict and one severity per finding:

```markdown
Verdict: approved | changes requested

## Previous findings
- [resolved | not resolved] <the finding, as the request gave it>

## Findings
- [blocker | should-fix | nit] <file>:<line> - <problem>
```

The `## Previous findings` section is only for a follow-up review, and lists every finding the
request gave, in its order. Leave it out of a first review, and when the request gave `none`.
`## Findings` holds only new findings: a previous finding that is not resolved stays under
`## Previous findings` and is not repeated.

Rules for the verdict:

- **First review:** `changes requested` when there is at least one `blocker` or `should-fix`;
  `approved` when there are none or only `nit`.
- **Follow-up review:** `changes requested` when a previous finding is `not resolved` or there is
  at least one new `blocker`; `approved` otherwise. A new `should-fix` or `nit` does not change
  the verdict: report it, and approve when nothing else holds the PR back.

Rules for the findings:

- `<file>` is a path from the repository root and `<line>` a line in the PR head's version of
  that file.
- List blockers first, then should-fix, then nits.
- With no findings, keep the `## Findings` heading and leave the list empty.
- A missing test is never more than a `nit`. First judge whether a test makes sense for the
  change at all: a one-line change may not need one. When a test makes sense and none exists,
  report a `nit`.

When you cannot review, because you cannot read the diff or a skill you need is not available,
reply with a single line instead, and no verdict: `Cannot review: <reason>.`
