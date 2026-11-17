# Nightlogue UI Components — agent instructions

This repository contains framework-independent TypeScript/CSS shared UI,
tokens, themes, and Storybook examples. Consumers include Grim & Glimmer.
The library is not the game application.

## Implementation contract

- Fetch the current assigned Linear issue and confirm the owning repository,
  acceptance criteria, and blocking relationships before editing.
- For UI-Components lifecycle sync, use `agent/uicomp-<number>-<short-slug>` for UICOMP work. Never push to `main`. Other branches require an explicit owner-reviewed handoff.
- Do not change GitHub protection, credentials, billing, or release settings.
- Preserve exported component APIs, CSS token contracts, consumer import paths,
  and accessibility semantics unless an owner-approved issue changes them.
- Update component-specific tests and Storybook only when the issue asks for
  those changes. Do not broaden a focused task into an unrelated redesign.
- Run `npm run check`, or record the exact incomplete checks and their reasons.
- Each implementation branch must add or update `.agent/pr-description.json`
  with the canonical issue URL, problem, solution, actually-run tests,
  risks, and reviewer guidance. The format is documented in the protected
  `Nightlogue-LLC/nightlogue-agent-relay` repository under
  `docs/agent-pr-description-contract.md`.
- The trusted bot automatically opens a draft PR after successful branch CI.
  Do not create, approve, or merge the PR from the implementation session.

## Code Review Rules

### Consumer compatibility

Check exported component types, `create*` and `update*` contracts, and
built package paths for accidental breaking changes. Changes to shared UI
must not silently break a consuming game or require a new dependency.

### Attribute state and accessibility

For DOM component updates, verify added optional properties handle both
initial rendering and updates, including removal of stale attributes.
Preserve accessible names, semantic elements, and keyboard behavior.
For Badge, keep the label as the meaningful content and tone as visual
emphasis. An optional DOM `id` must remain optional and not change tone
or label behavior.

### Theme and import boundaries

Shared components must use theme contract tokens, not embed a project-specific
palette. Project compositions may consume shared components, but shared
components must not import from project-specific folders. Check that
CSS remains scoped when themes coexist.

### Review evidence

Compare the claimed changes and tests in the PR description against the actual
diff, CI, and issue acceptance criteria. A generic or missing description is
a review hold, not an approval. Report substantive correctness, security,
accessibility, or compatibility defects with locations and consequences;
leave formatting and mechanical checks to CI.

Independent Codex review does not replace owner approval and merge.

## Nightlogue engineering agent workflow

> This section governs **repository development by coding agents**. It does not describe AI features shipped inside the product. Repository-specific security rules below take precedence. Canonical operations handbook: _Nightlogue Agent Pipeline — Onboarding & Operations Guide_, maintained in Nightlogue Engineering / Operations; the approved Drive URL remains to be added after publication. The original rollout plan is preserved at https://linear.app/nightlogue-llc/document/original-implementation-plan-nightlogue-agent-pipeline-nov-12-2026-2b04447954d2.

### Authorization and scope

- Use the current assigned Linear issue as the source of work scope. Re-fetch its team, repository, status, acceptance criteria, owner approval, blockers and constraints before making changes. Missing or inconsistent information is a stop condition, not permission to infer.
- Only a **new, owner-applied** `agent-ok` label addition may authorize an automatic initial dispatch in a repo explicitly enabled by the relay. An existing label, unrelated update or programmatic label action is not fresh owner authorization.
- Do not treat this repository as enabled merely from this file, an installed GitHub App, passing CI or a Linear label. Confirm the repo's allowlist, Conductor PR flow, Codex gate and Linear lifecycle integration have been reviewed and tested.
- Never create scope-expanding tickets or change approval labels on the owner's behalf. Record follow-up recommendations for the owner. Respect unresolved dependencies and explicit `needs-owner` / `**REVIEW HOLD:**` states.

### Branches, PR authorship and owner merge

- Work on a fresh `agent/<issue-id-lowercase>-<short-slug>` branch; `claude/` is permitted only where **all** repo workflows and Linear branch matching support it. Never push directly to protected `main`. Use the repository's documented exact branch convention.
- For the automated Conductor handoff, commit changes and required review metadata to the implementation branch; push it and let the trusted **successful push-CI** workflow create the **draft PR as** `nightlogue-conductor[bot]`. Do **not** create the PR using the owner's GitHub account, even from an `agent/` branch: the prefix does not change PR authorship or make self-approval possible.
- A human-authored open PR cannot be converted into a bot-authored PR by renaming its branch or title. Preserve its code/review evidence and follow the owner-approved close-and-recreate procedure rather than bypassing protections.
- Never approve or merge a PR, request a branch-protection bypass, change CODEOWNERS/workflows/secrets or weaken required checks without explicit owner authorization through the relevant high-risk review process. Owner performs the final review and merge.

### Implementation evidence and independent review

- Keep work limited to the issue. Run repository-defined lint, formatting, typecheck, unit/integration tests, security scans and build checks. Report exact commands and real results; do not claim unrun tests passed.
- Provide the per-branch Conductor PR description artifact where the repo contract requires it (current pilot: `.agent/pr-description.json`), including canonical Linear URL, problem, actual solution, tests, risks and reviewer focus. Preserve unrelated metadata during merges.
- Treat CI and independent Codex review of the **current commit SHA** as mandatory before owner handoff. If CI, review evidence or provider receipt is missing, leave the work pending; never describe it as approved.
- Do not manually spam `@codex review` or bypass the trusted request budget. Current pilot limits: initial review = round 0; critical P0 → owner escalation; P1 ≤ 5, P2 ≤ 3, P3 ≤ 1 repair-review requests; ≤ 5 globally per PR; repeated substantive findings trigger an early owner hold. These are request limits; an automatic Claude repair controller is a separately tracked capability.
- Stop on `**REVIEW HOLD:**`, exhausted budgets, changed approval, stale SHA, uncertain execution receipt or unauthorized access. Never reset a counter by creating a new commit, deleting comments or changing branch names.

### Credentials and high-risk changes

- Never expose production credentials or customer data in coding sessions, PR comments, test logs or untrusted CI. Use synthetic fixtures and scoped local/test services.
- Any authentication, tenant isolation/RLS, database migration, data deletion, storage policy, permissions, infrastructure, secret management or production-deployment change requires explicit owner review and a repo-specific validation plan. Never let an unattended automation deploy such work.
- Protected automation that uses write credentials must load trusted code from protected branches, not execute unreviewed PR code with secrets. Use least-privilege credentials.
- If the repository is not onboarded, use its existing manually approved delivery process; do not assume an `agent/` push will start Conductor.

### UI Components — verified local settings

- **Automation status:** The UI Components pilot is enabled and has produced Conductor-owned PRs. This note does not authorize a new task or broaden the relay allowlist.
- **Linear team / issue prefix:** UI-Components / `UICOMP-<number>`; the wider SHAE team manages cross-repository operations.
- **Branch / lifecycle mapping:** `agent/uicomp-<number>-<short-slug>` for UICOMP-linked implementation tickets. PR creation accepts `agent/` and `claude/` prefixes; current `scripts/sync-linear-lifecycle.mjs` recognizes only the `agent/uicomp-...` pattern. Non-UICOMP operational PRs do not automatically synchronize that team's issue lifecycle.
- **Checks:** `npm run check` (lint, formatting, types, tests, build, packaging and Storybook). Required GitHub status check: `check`.
- **PR metadata:** `.agent/pr-description.json`, as documented in `Nightlogue-LLC/nightlogue-agent-relay/docs/agent-pr-description-contract.md`.
- **Review and readiness:** `.github/workflows/open-agent-pr-after-ci.yml`, `.github/workflows/promote-reviewed-agent-pr.yml`, `.github/workflows/sync-linear-lifecycle.yml`, and `scripts/review-budget.mjs` on the protected default branch.
- **Consumer-sensitive areas:** exported component APIs and package paths, accessibility behavior, theme tokens, Storybook contracts and Grim & Glimmer consumer compatibility. Follow the existing Code Review Rules above.
- **Owner escalation:** current PR `**REVIEW HOLD:**`, the linked Linear issue, and the Automated Agent Workflow project at https://linear.app/nightlogue-llc/project/automated-agent-workflow-de564d494875.
- **Claude adapter:** no root `CLAUDE.md` is present in this repository at this stage. The external Claude routine's issue-specific prompt and this AGENTS.md are different mechanisms; do not claim the external routine reads this file until independently verified.

Do not replace this section's controls with generalized agent instructions. Validate which instruction files the actual implementation agent loads.
