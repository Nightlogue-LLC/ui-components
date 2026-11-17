# Conductor review and Linear lifecycle

Tracking: UICOMP-13.

## PR readiness

Conductor opens an owner-reviewable draft PR after passing push CI. A trusted workflow on the protected default branch receives Codex review comments and runs an hourly fallback check. Only a current, bot-authored, same-repository draft containing the approved Conductor marker can advance.

The gate requires:
- A completed Codex review summary for the PR's **exact current head SHA**
- `has_any_findings=false` and `has_unresolved_findings=false`, including security review if one ran
- A separate Codex review receipt from the verified Codex bot for that commit
- Successful **push and pull_request CI** for the exact SHA
- The same branch and SHA at the final API read

The restricted Conductor GitHub App marks the PR **Ready for review**, not approved or merged. GitHub's ready-for-review GraphQL mutation does not offer an atomic expected-SHA precondition, so branch protection and required checks remain essential. When the commit changes, the previous Codex clearance is insufficient.

The workflow uses the existing `NIGHTLOGUE_APP_ID` and `NIGHTLOGUE_APP_PRIVATE_KEY` repository secrets. It checks out the reviewed script from `main` only.

## Linear lifecycle

A separate GitHub PR-event workflow reads a canonical `UICOMP-n` link from a complete Conductor PR description, checks the bot author and matching agent branch, re-fetches the Linear issue, and verifies team/approval/status before any state change.

- Bot PR opened or marked ready: **In Review**
- Owner-merged bot PR: **Done**
- Closed without merging: **no transition**

Claude changes the issue to **In Progress** at the start of implementation.

### Owner setup for Linear write access

Create a dedicated Linear API credential with write access only where needed, and store it in `Nightlogue-LLC/ui-components` under GitHub **Settings → Secrets and variables → Actions** as `LINEAR_LIFECYCLE_API_KEY`. Do not paste the value in chat, PRs, or source files. The existing webhook's read-only key is a different credential and must remain read-only.

Until this secret exists, the workflow skips Linear updates without mutating issues. Confirm the status log after the first bot-authored PR event. No workflow can merge or approve PRs.

## Operational boundaries

- Unreviewed PR code is never executed with the Conductor App token or Linear write credential.
- GitHub workflow status and Codex review are independent; successful CI alone cannot mark the PR ready.
- The readiness workflow rechecks the commit immediately before its GraphQL mutation.
- Stale reviews, missing receipts, open findings, failing or pending CI, wrong PR authorship, and incomplete issue context are all denied.
- The original UICOMP-1 pilot was already marked ready manually. Use a new pilot to validate the automatic transition.
