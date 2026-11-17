# Shared assistance presentation (Nudge, Explain, Reveal)

Library issue #67 / Linear UICOMP-5, part of gothic-cozy-puzzles#68. Builds on the merged app
assistance contract (gothic-cozy-puzzles#69, `docs/assistance-contract.md`). App adoption for
Trees & Tents follows in gothic-cozy-puzzles#74 after review, merge and dependency adoption.

Previews: **Projects / Grim & Glimmer / Feature Expansion / Assistance**. Stories import only the
public `projects/grim-glimmer` barrel plus labelled fixtures; the V4 baseline is unchanged.

## Exports

From `@nightlogue-llc/ui-components/projects/grim-glimmer` (styles ship in the existing project CSS
entry, no new import path):

- `createAssistancePanel(options)` → `{ element, update(state) }`
- `showAssistanceCue({ cell, description?, reducedMotion?, animations? })` → `{ element, dispose() }`
- `createAssistanceAnnouncer()` → `{ element, announce(text), clear() }`
- `ASSISTANCE_DEFAULT_DESCRIPTIONS` and the types `AssistanceTier`, `AssistanceTierAvailability`,
  `ExplainGuidance`, `RevealAllowance`, `RevealPresentation`, `AssistancePanelState`,
  `AssistancePanelOptions`, `AssistancePanel`, `AssistanceCueOptions`, `AssistanceCue`,
  `AssistanceAnnouncer`.

## One entry point, no duplicated Hint controls

`createGameControlRow` is unchanged: it keeps the single approved Hint button and its
`hint: 'available' | 'idle' | 'disabled'` state. The app's `onHint` opens the existing editorial
bottom sheet (`createBottomSheet({ presentation: 'editorial', title: 'Hints' })`) holding the panel
with `showTitle: false`. Nudge, Explain and Reveal appear only inside that panel. A 360px row with
seven icon controls was rejected as too crowded and as a second set of hint controls.

## Ownership

The app owns solving, targets, reasoning, allowance accounting, entitlement, history, Undo and
board changes. The panel renders the state it is given and reports requests through `onNudge`,
`onExplain`, `onReveal` and `onGuidanceDone`. It never applies a move, decrements a count, stores
anything or shows a purchase offer, price or product. All text is set with `textContent`.

## Tiers

| Tier    | Cost text (not color)                                       | Request behavior                                                     |
| ------- | ----------------------------------------------------------- | -------------------------------------------------------------------- |
| Nudge   | "Free"                                                      | App closes the sheet and calls `showAssistanceCue`. No confirmation. |
| Explain | "Free"                                                      | App supplies `guidance`; nothing on the board changes.               |
| Reveal  | Real count, e.g. "2 of 3 free Reveals left for this puzzle" | App drives pending → success/failure with committed counts.          |

Free tiers take `{ status: 'ready' | 'loading' | 'unavailable', message? }`. Use the app's real
reason (mapped from `UnavailableReason`), e.g. "No logical step from these marks." Defaults are
"Preparing…" and "Not available right now". `busy: true` disables every tier while the app prepares
a request. `descriptions` overrides per-game wording ("Places one correct tent for you.").

### Reveal states

`RevealPresentation` maps the app ledger and request lifecycle:

- `ready` / `pending` / `success` / `failure` carry `allowance`:
  `{ kind: 'free', remaining, total }` or `{ kind: 'entitlement', remaining? }`.
- `success` and `failure` carry the app's plain-text result, announced through the panel's
  `role="status"` line. A failure keeps the unchanged count and allows a fresh request.
- `exhausted` (`freeTotal`) means the free uses for this puzzle are spent and no paid entitlement
  is active. Default copy: "More Reveals need Reveal access, which is not available yet. Nudge and
  Explain stay free." No purchase button exists; paid activation is gated by app #72.
- `loading` / `unavailable` block Reveal with their reason.

Dishonest states throw `RangeError`: `ready` with zero remaining (use `exhausted`), remaining above
total, negative or fractional counts, or a zero total.

Mapping from the app contract: an `applied` outcome with `accounting: 'pending'` is still a
success for the player. Show `success` with the app's message (for example, that the Reveal is
still being recorded) and the count the ledger reports. Never decrement locally. An
`accounting-anomaly` is not a success.

## Explain

Supplying `guidance: { title, text, lesson? }` swaps the tier list for the guidance region and
moves focus to its heading. `lesson` is only passed when a real Logic Library destination exists;
without it no link renders. **Done** calls `onGuidanceDone`; when the app clears `guidance`, focus
returns to the Explain button. If Explain is disabled at that moment, focus goes to another enabled tier, or to the panel section itself (`tabindex=-1`). Updates while guidance stays open do not move focus.

## Nudge cue

`showAssistanceCue` places the approved V4 hint-circle (`.gg-v4-hint`, 1px accent ring, inset 15%)
in the cell. It uses the shared `createGameplayMotion` hint pulse (1600ms scale/opacity loop), so
the motion is identical to HintRing. No glyph, mark or placement animation is added, and the cell's
classes and state are untouched. Reduced motion, `animations: false` or a hidden document keep a
static ring at the approved preview's 0.75 opacity. The cell needs an `.nl-grim-glimmer-v4`
ancestor.

Nonvisual equivalent: the cell gains an `aria-describedby` "Nudge target" (configurable). This
survives `updateBoard`, which rewrites `aria-label`. Existing describedby ids are preserved and
restored on `dispose()`. Mount one `createAssistanceAnnouncer()` element near the board and
announce the app's `AssistanceContent.announcement` (e.g. "Look at row 4, column 2."). Repeated
messages are re-announced. Per the contract, focus stays on the originating control; the dialog
returns focus to the Hint button when the sheet closes.

Clued-board feedback updates (`updateCluedBoard`) leave the cue in place; only `dispose()` removes it. The app decides when the cue ends (next move, next request, navigation) and calls `dispose()`.

## Accessibility summary

- Native buttons with visible names Nudge / Explain / Reveal. Description, cost and reason are
  linked through `aria-describedby`. Only visible text is referenced.
- Disabled tiers use native `disabled` with the reason shown as text. Pending sets `aria-busy`.
- Free vs counted is text plus a stronger divider above Reveal, never color alone. Failure status
  gets a "!" prefix.
- One polite `role="status"` line in the panel for Reveal results; the announcer covers the cue.

## Review evidence and open items

- Component tests: `tests/assistance-panel.test.ts`, covering every tier state, callbacks, honest-state
  validation, focus handoff, plain-text rendering, cue semantics, motion and reduced motion,
  announcer and the single Hint entry point.
- Storybook play tests: Nudge (no confirmation, no mark), Explain focus and lesson link, Reveal
  lifecycle and failure, exhausted with no purchase text.
- Light/dark and 360/390px captures: `docs/assistance-evidence/`.
- **Physical Android cue visibility: pending.** The approved ring is unchanged. Whether it is
  "subtle but clearly visible" must be measured on a physical Android device during app #74
  integration. If it is too faint, propose a reviewed option (such as a 1.5px stroke) rather than
  changing the approved motion here.
- Reveal target conflicts with player marks, Undo/refund and the ledger remain app decisions
  (epic decision 3, app #71/#74).
