# SHAE-5: UI Components merge restrictions and PR gate verification

Linear: [SHAE-5](https://linear.app/nightlogue-llc/issue/SHAE-5) · Related: [UICOMP-12](https://linear.app/nightlogue-llc/issue/UICOMP-12), [SHAE-10](https://linear.app/nightlogue-llc/issue/SHAE-10)
Verified against `main` @ `b0efd02` · Written 2026-11-18 (UTC)
Primary record, findings and owner-run procedures: `Nightlogue-LLC/nightlogue-agent-relay` → `docs/shae-5-security-verification.md`. This file records only what is specific to this repository.

**Result: not accepted yet.** The gate scripts deny every negative case that can be tested from code, and one full bot-to-owner-merge cycle was observed live. GitHub ruleset settings could not be read from this session, so enforcement is shown by outcome, not by reading the rules. See "Still needs the owner".

## Legend

- **Live**: observed on GitHub during this session, with a link and UTC time.
- **New test**: added in this PR; each guard was mutation-checked (removing it made a named test fail).
- **Existing test**: covered earlier, passes today, not re-proven here.
- **Not run**: needs the owner, a secret or a disposable branch this session may not use.

## 1. Merge restrictions

| Check                                                   | Result                       | Evidence                                                                                                                                                                                                                                                                                                                          |
| ------------------------------------------------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `main` is protected                                     | **Live** ✅                  | `list_branches`: `main` `protected: true` @ `b0efd02`; all 15 other branches `false`.                                                                                                                                                                                                                                             |
| No direct pushes to `main`                              | **Live** ✅ (consistent)     | 47 of 50 first-parent commits are merge commits. The other three are PR-derived and all pre-date 2026-11-11: squash merges `(#44)` and `(#45)` (2026-11-10) and a single-parent commit titled `Merge pull request #18` (2026-11-08). Nothing since is a direct push.                                                              |
| Only the owner can approve or merge                     | **Live** ✅                  | Collaborators: `shavonne-senpai` (admin) only.                                                                                                                                                                                                                                                                                    |
| Owner approval precedes merge                           | **Live** ✅                  | [#93](https://github.com/Nightlogue-LLC/ui-components/pull/93): `APPROVED` on `f0708ca` 2026-11-17T23:46:53Z, merged 23:46:57Z. [#89](https://github.com/Nightlogue-LLC/ui-components/pull/89): `APPROVED` 2026-11-17T06:14:34Z, merged 06:14:39Z.                                                                                |
| Bot PR is Conductor-owned; human PR is not converted    | **Live** ✅                  | #93 author `nightlogue-conductor[bot]`. [#87](https://github.com/Nightlogue-LLC/ui-components/pull/87) (owner-authored, branch `ccr-a3b12206-rcejct`, opened 2026-11-17T05:13:39Z) was closed unmerged and replaced by bot PR [#88](https://github.com/Nightlogue-LLC/ui-components/pull/88) at 05:29:22Z, as AGENTS.md requires. |
| Required `check` runs on the PR and push                | **Live** ✅                  | #93 head `f0708ca`: push `check` run 44196362605 (23:06:31–23:08:08Z) **success**; PR `check` run 44196667077 (23:08:28–23:10:05Z) **success**. Unlike the relay, this repo does not skip PR CI on `agent/` branches, so `check` is never "skipped".                                                                              |
| Conductor App cannot merge or approve through our code  | **Not run** (code scan only) | The UI scripts contain no merge or review-submit call; the equivalent static scan lives in the relay test `SHAE-5 S1`. Whether the ruleset counts an App approval is unread (relay doc 6-B).                                                                                                                                      |
| Conductor App cannot push to `main`                     | **Not run**                  | Relay doc 6-A.                                                                                                                                                                                                                                                                                                                    |
| `require_last_push_approval`, code-owner review, bypass | **Not run**                  | Settings unreadable from this session; owner decision recorded in relay doc F-5 and 6-D.                                                                                                                                                                                                                                          |

## 2. Observed positive cycle (PR #93, UICOMP-18 smoke)

All times UTC, 2026-11-17.

| Time     | Event                                                                                                                                      |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 23:08:08 | Push CI `check` finished **success** on `f0708ca`.                                                                                         |
| 23:08:20 | Conductor opened draft PR #93.                                                                                                             |
| 23:08:23 | One `@codex review` comment appeared under the owner's login, carrying `nightlogue-codex-request:f0708ca…` and budget `round 0 / initial`. |
| 23:08:38 | Codex summary comment created; status `completed` at 23:09:41 with no findings.                                                            |
| 23:09:40 | Codex receipt issue comment, `Reviewed commit: f0708ca43a`.                                                                                |
| 23:46:53 | Owner `APPROVED`.                                                                                                                          |
| 23:46:57 | Owner merge.                                                                                                                               |

The comment shows as the owner because the owner-authorized token posts it. I cannot distinguish this from a manual comment by login alone; the budget marker and the 3-second delay after PR creation indicate the script posted it. This is the only live evidence for "requester identity matches the owner" and for a single request per SHA.

## 3. Negative paths in this repository

| Case                                                                                                                                                               | Coverage                                                                                                      |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| Missing owner token → no GitHub call, no claim of a request                                                                                                        | **Existing test** (`request-codex-review.test.mjs`)                                                           |
| Token of the App or another user → `skipped_wrong_requester`, no comment                                                                                           | **Existing test**                                                                                             |
| Identity API failure → fixed stage label, no credential in the message                                                                                             | **Existing test**                                                                                             |
| Duplicate request for one SHA; head moves, PR closes or gains a hold before the post                                                                               | **Existing test**                                                                                             |
| Review cap, P0, unchanged findings, unfinished prior review                                                                                                        | **Existing test** (`review-budget.test.mjs`, `request-codex-review.test.mjs`)                                 |
| Forged or incomplete Codex evidence cannot clear a PR: summary only, receipt only, other commit, no receipt marker, author is Conductor or the owner, corrupt JSON | **New test** `SHAE-5: forged or incomplete Codex evidence never clears a PR` (mutation-checked, 2 guards)     |
| Skipped, cancelled, neutral, failed, running or missing CI on **either** event is never green                                                                      | **New test** `SHAE-5: skipped, cancelled or missing CI…` (mutation-checked)                                   |
| Ready, owner-authored or held PR is never promoted and no mutation is sent                                                                                         | **New test** `SHAE-5: a ready PR or an owner-authored PR is never promoted`                                   |
| Stale SHA never reaches owner-ready                                                                                                                                | **Existing test** (`promote-reviewed-pr.test.mjs`, "a stale or failing review cannot transition PR to ready") |

Run: `node --test scripts/request-codex-review.test.mjs scripts/review-budget.test.mjs scripts/promote-reviewed-pr.test.mjs scripts/sync-linear-lifecycle.test.mjs scripts/review-gate-trigger.test.mjs` → 38 tests, 38 pass, 0 fail (35 before this PR). CI runs these same files explicitly, so the new tests are enforced without editing any workflow.

## 4. Findings specific to this repository

**U-1 · Low · Least privilege · The PR-creation token is wider than the job needs.**
`.github/workflows/open-agent-pr-after-ci.yml` mints one App token for both `nightlogue-agent-relay` and `ui-components` with `contents: read` and `pull-requests: write`. Permissions apply to every repository in the token, so the token can also write pull requests in the relay. The relay is only read (two script files). Suggested: mint a read-only token for the relay fetch and a separate `ui-components` token for PR creation.

**U-2 · Informational · Cross-repo trust.** The same job downloads `open-app-pr.mjs` and `pr-description.mjs` from relay `main` and rewrites one constant with `sed` before running them with App credentials. This depends on relay `main` staying protected (it is: `protected: true`, owner-only merge) and on the `grep -Fq` guards around the rewrite, which fail the job if the expected line changes. No change recommended; noted so a relay ruleset change is understood to affect this repo.

**U-3 · Informational · Lifecycle parser.** `scripts/sync-linear-lifecycle.mjs` only accepts an `## Issue` URL of the form `…/issue/UICOMP-<n>/<slug>` on a branch `agent/uicomp-<n>-…`. A SHAE-5 PR here therefore does not move any Linear issue. That is safe, and it means SHAE-5 status must be updated by hand.

**U-4 · Same as relay F-1.** `scripts/review-budget.mjs` and `scripts/promote-reviewed-pr.mjs` read the Codex receipt only from issue comments. Clean reviews post it there (#89 at 05:55:36Z, #93 at 23:09:40Z), so the ready gate works. Reviews with findings post it as a pull-request review, so after a round with findings the budget stops at `previous_review_pending`. Safe stop; the repair-review loop cannot advance automatically. Not changed.

## Still needs the owner

1. Read both repositories' rulesets and record the values and bypass actors (relay doc 6-D).
2. Confirm a Conductor App push to `main` is refused and an App approval does not unblock a PR (6-A, 6-B).
3. On a disposable `agent/shae-5-ui-smoke` branch, make `check` fail and confirm the PR is blocked from merge in the merge box, without merging.
4. Decide on `require_last_push_approval` and code-owner review (F-5), and record any owner-approved change.
5. SHAE-4 is still Todo; escalation behavior cannot be accepted until it ships.
