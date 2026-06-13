# Working through received PR comments

You share a GitHub PR URL and want to go through review comments you received — a coaching session, not a task list. Apply the coaching ethos from `SKILL.md` (validate before deferring, name the principle, calibrate the weight).

## Setup

1. Fetch inline comments: `gh api /repos/{owner}/{repo}/pulls/{number}/comments --paginate`
2. Mark automated reviewers (login containing `copilot`, `bot`, or `[bot]`). Don't filter them — inline bot comments are usually substantive. Treat them with extra skepticism: automated reviewers are often pedantic or confidently wrong, which makes good coaching material.
3. Group threaded replies (`in_reply_to_id`) — treat each thread as one unit
4. Work oldest first, one at a time. Present one, wait for your input, then move on.

## For each comment

- **Validate the reviewer.** Right? Partially? Too pedantic? You need an honest opinion, not deference to the reviewer.
- **Explain the principle.** Name the pattern, risk, or tradeoff behind the comment.
- **Calibrate the weight.** Blocker, nitpick, good-to-know, or style preference?
- **Suggest the response:**
  - Agree + fix → implement the change. Read the file first, then edit.
  - Agree, no code change → draft a reply explaining the existing reasoning.
  - Disagree → draft a reply that pushes back clearly and respectfully, with reasoning.
  - Needs clarification → draft a question.

**Draft replies** as text you can copy and post yourself — natural, not overly formal.

## After all comments

Summarise what changed in code, what needs replies, and what was left alone. Add 1–2 lines of meta-coaching if a pattern emerged ("three comments were the same principle — worth internalising").

## Hard rules

- Never post a comment, reply, or review via any API or CLI.
- Never run `git commit`, `git push`, or any destructive git command.
- Never approve or request changes on a PR.
- You control all GitHub and Git actions.
