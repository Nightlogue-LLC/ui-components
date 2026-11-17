# Nightlogue UI Components — agent instructions

This repository contains framework-independent TypeScript/CSS shared UI,
tokens, themes, and Storybook examples. Consumers include Grim & Glimmer.
The library is not the game application.

## Implementation contract

- Fetch the current assigned Linear issue and confirm the owning repository,
  acceptance criteria, and blocking relationships before editing.
- Work only in an `agent/` or `claude/` branch. Never push to `main`.
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

## Review-cycle budget

- The protected-main `scripts/request-codex-review.mjs` gate decides whether
  another independent Codex request is allowed. Do not bypass its decision by
  posting `@codex review` directly from an implementation session.
- The initial Codex review is round zero. Across all commits on one PR,
  allow at most five repair-review rounds total: P1 up to five, P2 up to
  three, P3 up to one. Mixed findings use the highest severity.
- Two consecutive repair revisions with unchanged, identifiable substantive
  Codex findings require an owner review hold. Unclassified findings receive
  P1-level budget treatment; review evidence must come from the Codex bot.
- If the budget is exhausted, do not push another review-triggering repair.
  The protected gate marks `**REVIEW HOLD:**` in the PR body. Ask the owner
  to decide on further implementation or follow-up issues. A new SHA never
  resets the PR counter, and no automation may merge a held PR.
- Treat a missing or unfinished prior Codex review as pending rather than
  requesting another review or asserting it passed.
