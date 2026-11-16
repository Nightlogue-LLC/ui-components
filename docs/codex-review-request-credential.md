# Codex reviewer request credential

Nightlogue Conductor uses its GitHub App installation to open bot-authored
pull requests. The Codex reviewer did not respond to an App-authored
`@codex review` comment on temporary PR #78, including after it was marked
ready for review. The owner's GitHub account successfully triggered Codex
reviews on PR #76 and PR #77.

The trusted `open-agent-pr-after-ci.yml` workflow now separates the PR
creator's GitHub App credentials from the Code Review request credential.

## Owner setup (not performed by this PR)

1. In GitHub, create a **fine-grained personal access token** under the
   `shavonne-senpai` account.
2. Select resource owner `Nightlogue-LLC` and **only**
   `Nightlogue-LLC/ui-components` as the repository. Your GitHub organization
   may need to approve a fine-grained token before use.
3. Grant the minimal repository permissions:
   - **Issues:** Read and write (to post `@codex review` as a PR issue comment)
   - **Pull requests:** Read (to verify the exact tested PR/head)
   - **Metadata:** Read (automatic)
4. Set an expiration appropriate for your maintenance schedule.
5. In the repository's GitHub Actions secrets, add
   `CODEX_REVIEW_REQUEST_TOKEN` with the token value. Never place this
   credential in issues, PR comments, source files, CI logs, or chat.

No token is currently provided by this PR. When absent, the review request
step exits cleanly with `skipped_requester_not_configured` and **does not**
claim a Codex review was requested.

The script verifies that the token's authenticated GitHub user is
`shavonne-senpai` before searching or commenting. A wrong principal is a
safe skip. The PR must be bot-authored, open, belong to the same repo,
have complete issue-specific description, and match the exact CI-verified
commit, including a fresh check immediately before commenting.

One review request per SHA is deduplicated against the owner's previous
request comments. Codex's actual review receipt must be verified in GitHub;
a successful GitHub comment is **not** itself a completed review.

**Owner still decides when to merge. No workflow merges PRs or resolves
review comments without checking the addressed findings.**
