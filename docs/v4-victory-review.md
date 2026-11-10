# V4 Phase 5 — victory review

Issue #38; epic #33. Audited merged main `47442e17ec76675a5548a44b05e18cac497b0251`.
This is a Storybook proposal. No src/, existing component API/defaults, dependency,
production tokens, V3 screen, app, puzzle rules, native plugin, metrics collection or
save-progress changes. Phase 6 and app adoption are not started.

## Audit and reuse

| Source                                                   | Reuse / consumer impact                                                                                                           |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `src/projects/grim-glimmer/success-sheet.ts`             | Actual completion factory and message picker; labels map New Game to Next Puzzle. No API or implementation changes.               |
| `src/components/bottom-sheet/`, `src/components/dialog/` | Existing native modal semantics, focus return, Escape/backdrop dismissal, entry/exit and slots. No parallel modal implementation. |
| `src/core/motion.ts`                                     | Existing 280ms restrained sheet entrance/exit; no Framer/spring dependency.                                                       |
| `stories/projects/grim-glimmer-v4/board.*`               | Approved frameless board, proportional clues, satisfied strike and glyphs. Read-only solved presentation.                         |
| Shared Button and canonical theme roles                  | Existing primary/secondary actions and optional quiet Medium callback. No approximate replacement palette.                        |

All new composition, sequence ownership and CSS live in `victory.ts` / `victory.css`
under the V4 stories folder. The generic shared sheet remains the production source
of truth. No approved PNG/SVG is edited or regenerated.

## Sheet and message contract

- Compact 260px minimum sheet (safe-area/long copy can increase actual height), radius
  28px top corners, warm elevation and theme-aware inset highlight. Native backdrop
  uses warm rgb(26 10 16 / .38), with no board/backdrop blur.
- Centered Cormorant “Puzzle Complete”, small-star hairline rule, one mocked stats row
  and italic balanced message. The inherited large star and grabber are removed.
- Keep the functional close X. No fake drag handle or drag-to-dismiss promise; no
  extra View Board/Close action duplicating the X.
- Exactly two primary actions by default: Return Home secondary and Next Puzzle
  accent primary. Optional Try Medium is a quiet callback-only action on this Easy
  fixture. Navigation is mocked in Actions; no generation or route change.
- Fixed message, message callback and configurable bank use the existing shared picker.
  A bank picker persists per preview, resolves once for each created sheet, and avoids
  consecutive repeats. Replay before sheet creation does not consume a message.
- TIME 02:14, HINTS 0, MISTAKES 1 are explicitly mock props. Stats Hidden demonstrates
  the optional display flag; this does not decide production stat visibility, hint
  entitlements/pricing, mistake tracking or player-data policy.

The board is illustrative, not a generated/validated puzzle. It uses readonly shared
cells throughout and exposes the persistent Solved chip before the celebration. Closing
the sheet retains that solved board and chip. This prototype does not introduce actual
win-condition detection, input locking in the app, completion writes or saves.

## Timeline and resolved source conflicts

| Time from Replay | Action                                                                                                |
| ---------------- | ----------------------------------------------------------------------------------------------------- |
| 0ms              | Solved chip/status, read-only board; one preference-gated mocked success callback                     |
| 0–600ms          | Thin accent hairlines at 50% opacity connect stars in row order; each star has one glow-overlay pulse |
| 700ms            | Open shared sheet; its standard 280ms entrance starts                                                 |
| 980ms            | Sheet entrance budget complete; first stat reveal starts                                              |
| 1040ms           | Second stat starts                                                                                    |
| 1100ms           | Third stat starts                                                                                     |
| 1280ms           | Last 180ms stat reveal completes                                                                      |

The source 900ms stat proposal would overlap the approved sheet entrance. This version
starts at 980ms so content is visible, using the same 60ms stagger. Stats stay hidden
until their own reveal starts; no visible-then-hidden flash. OS/explicit reduced motion
skips the celebration and delays, opens immediately, and shows static content.

Line drawing uses fixed-width positioned hairlines with rotate + scaleX, not animated
stroke-dashoffset. Glow is a static radial overlay whose opacity/scale pulses; no filter,
shadow, gradient, color, path or border animation. The source spring reference is
resolved by reusing the established shared slide-up motion. Existing Phase 4 preferred
screen/dissolve timings are unchanged.

Nominal zero-safe-area layout budget (calculated, not measured): composition width
377px / 344px at 393×852 / 360×780. The well caps width by height minus 410px; its
board remains approximately 377px / 344px square. With a header budget up to 96px,
16px top inset and 24px well gap, board bottom is at most 513px / 480px. A 260px sheet
starts at 592px / 520px, leaving the board visible. Fonts, large text, long messages,
optional Medium and safe areas require actual browser/device acceptance.

## Dismissal, replay and lifecycle

The native/fallback sheet API supplies initial Next Puzzle focus, close X, Escape,
backdrop and return focus without scrolling. Native dialog focus containment is reused;
the unchanged non-native library fallback does not add a new focus trap here.

Storybook Simulate Back cancels a pending opening or dispatches the open dialog cancel contract. The preview deliberately
does not push browser-history entries, so it cannot corrupt Storybook navigation.
App integration must retain the existing Back bridge or openDialog history:true contract;
physical Capacitor Back behavior is not claimed by a synthetic Storybook action.

Generation tokens prevent a replaced/removed sequence from opening a stale sheet or
emitting stale Home/Next/Medium actions. Pending timers/animations clear on replay,
dismissal intent, backgrounding and teardown. Background interruption retains Solved
and stops the pending sequence; replay remains available. Changing reduced motion
mid-sequence settles the pending sheet immediately. Visual effects never emit extra
feedback; only Replay start calls the injected success mock when enabled.

Two-theme comparison stories use the same sheet panel as inert inline specimens,
labelled static. They do not open two competing top-layer modal dialogs. Actual
Sheet/Sequence previews use the shared native dialog and real action/dismissal handlers.

## Stories

`Projects / Grim & Glimmer / V4 / Victory`:

- Sheet: Playground, Message Bank, Stats Hidden, Try Medium, Long Message, Reduced
  Motion, Light Dark Comparison and Dismissal Demo.
- SolvedBoard: Board 6×6, Board 15×15 and Light Dark Comparison.
- Sequence: Sequence 6×6, Sequence 15×15, Reduced Motion, Haptics Off and Light Dark
  Final State. Theme toolbar and 393×852 / 360×780 viewport presets remain available.

## Validation and pending acceptance

Focused tests cover composition/actions, safe dynamic copy, bank behavior, stats flags,
700ms opening, 980ms reveal and 60ms stagger, transform/opacity-only frames, replay,
X/Escape/backdrop/cancel dismissal, focus return, persistent Solved, optional Medium,
reduced-motion changes, haptics gate, background/teardown and stale navigation guards.
Run full lint, formatting, TypeScript, tests, library/package checks and Storybook build.
Static builds do not execute browser play functions; recorded animations are not pixel QA.

- [ ] Comparable light/dark screenshots of sheet, solved board and sequence at both
      mobile widths, including long copy, hidden stats and safe-area/large-text cases.
- [ ] Physical Android: timing perception, sheet height/remaining board visibility,
      no app jump/scrollbar, close/Back and focus, background/replay and reduced motion.
- [ ] Measure actual animation performance; no 60fps or frame-drop claim from tests.

Local Chromium capture remains unavailable after the prior socket permission failure;
no new screenshots or physical-device metrics are claimed. Stop for owner visual review;
do not merge automatically or adopt in the app. Phase 6 is outside this change.
