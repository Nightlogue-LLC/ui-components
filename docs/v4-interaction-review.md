# V4 Phase 3 — interaction review

Issue #36; epic #33. Audited merged main `5f4b39c6fe9d15d71c478be0c449d493eea2df08`.
This is a Storybook prototype; no production game engine, save format, native behavior,
source component, dependency, token, V3 screen or app file changes.

## Reuse and additions

| Existing source                                             | Reuse                                                                                               |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `stories/projects/grim-glimmer-v4/board.ts` and `board.css` | Approved frameless surface, grid lines, glyph silhouettes, proportional clues and satisfied strikes |
| `src/projects/grim-glimmer/board.ts`                        | Accessible native cell buttons and in-place state updates; fixed-piece labels/disabled semantics    |
| `stories/projects/grim-glimmer-v4/controls.ts`              | Approved tool toggle, row Undo, Hint and Restart; no toast or Redo                                  |
| Shared Button and theme roles                               | Prototype keyboard zoom/reset actions and current Moonlit light/dark                                |

New `interaction-model.ts` owns local prototype strokes/history and pure zoom math.
New `interaction.ts` binds delegated pointer/keyboard events and axis-pinned clue
tracks. New CSS and three story sections remain under `stories/projects/grim-glimmer-v4/`.
Earlier Phase 1 and Phase 2 factories/stories retain their behavior. The integrated
Phase 3 fixture consumes their APIs; it does not replace production consumers.

## Stroke contract and cancellation

One delegated grid-viewport handler captures real pointers and resolves cells with
`document.elementFromPoint` and data-r/data-c. One-pixel internal gaps use an in-grid
coordinate fallback; outside-viewport points never map into a cell. Screen-space
segments are sampled at no more than one-third of the current displayed cell width,
including coalesced events, so endpoint jumps traverse intervening cells.

First eligible cell fixes intent for the whole stroke:

- Empty → paint only empty crossed cells with selected Star or X.
- Matching active mark → erase matching crossed marks only.
- Fixed spire, tentative star or a different glyph → cannot start that stroke.
- Fixed/different cells crossed later are skipped. A visited-cell Set prevents
  repeat mutation or haptic calls within one stroke.

Default axis lock chooses the dominant axis upon the second distinct crossed cell
(horizontal on an exact diagonal tie), then projects later points onto the first
row/column. Free Stroke disables it. This is a prototype threshold, pending playtest.

Pointerup commits one snapshot for all changed cells. Pointercancel, unexpected lost
capture, blur, document hiding, removal and resize roll back an unfinished stroke.
Completed history survives cancellation. Restart first cancels unfinished work, then
records one clear snapshot retaining spires. Repeated Restart on an empty board adds
no no-op history entry. Undo first cancels unfinished work, then restores one committed
snapshot. There is no toast, timer or Redo.

Native pointer compatibility clicks have detail >0 and never paint twice. Keyboard/
assistive activation has detail 0 and makes a one-cell transaction. Roving cell focus
supports arrows, Home/End, native Space/Enter and prevents page scrolling. In-place
updates preserve focus. A keyboard-selected cell pans into the visible zoom window.

## Two-finger view contract

15×15 starts at fit scale 1. A second pointer immediately rolls back pending paint
before entering pinch/pan. One remaining finger cannot resume painting; lift all
pointers before a new paint stroke. Smaller boards cancel multi-touch painting but
never zoom. A third pointer temporarily suspends view updates; returning to two
reanchors the pinch. There is no magnifier or one-finger pan mode.

Scale clamps to 1–1.8, with midpoint anchoring. Translation clamps independently to
[-viewport × (scale − 1), 0], so the board cannot pan past its bounds. Grid and dividers
share translate3d + scale. Column track follows x translation/scaleX only; row track
follows y translation/scaleY only. Counter-scale keeps clue numerals undistorted. Fixed
24px gutter windows clip offscreen track content. Clue reports are illustrative visual
fixture statuses, not live puzzle validation or completion.

Prototype-only Zoom in and Reset view buttons permit keyboard review. Resize resets
to fit. Gestures are direct manipulation with no easing/transition; existing controls
honor OS reduced motion and the explicit Reduced Motion story. No new decorative
animation or motion dependency is introduced.

Fit cell sizes remain **22.4667px at 393px** and **20.2667px at 360px** (zero safe-area
insets). At 1.8× displayed cells are approximately 40.44px / 36.48px; these are not
claims of 44px targets. Bounds/pinned tracks are unit/DOM tested by contract; actual
pixel alignment and two-finger behavior require browser/device acceptance.

## Haptics decision

Retain the accepted light selection tick rather than layering Impact(Light) on it.
The injected Actions adapter exposes selectionStart → selectionChanged once per changed
cell → selectionEnd, one session per stroke, including cancelled strokes. It is gated
by the preference. Tool/Undo/Restart use the same complete single-tick lifecycle.
Repeated/skipped cells and pinch emit no extra ticks. No Capacitor call or standalone
selectionChanged without its session. No solve notification is simulated: this fixture
has no puzzle solver or win detection. Success stays with the later victory phase.

## Stories and verification

`Projects / Grim & Glimmer / V4 / Interaction`:

- DragPaint: Playground (size 5/6/8/15 Controls), Free Stroke, Haptics Off, Reduced
  Motion, Light Dark Comparison and Stroke Contract Demo.
- History: Playground, Light Dark Comparison and Restart Undo.
- ZoomPan: Fit To Screen, Light Dark Comparison, Zoom Reset and Pinch Rollback And
  Clues. Always 15×15; browser play checks midpoint clue alignment after pinch.

Browser plays synthesize pointer paths; only physical trusted events exercise native
pointer capture. A static Storybook build does not run the play functions.
Focused tests cover skip/erase/protected cells, visited deduplication, history grouping,
axis lock/free strokes, restart, preference/session lifecycle, cancellation, interpolation,
clamped zoom math, two-pointer rollback, no post-pinch paint, keyboard, blur, resize and
teardown. Run the full lint/format/types/tests/library/package/Storybook checks.

- [ ] Comparable mobile screenshots and actual no-overflow/pinned-clue alignment at
      393×852 and 360×780, light/dark. Local Chromium capture remains unavailable after
      the earlier socket permission failure; no pixel screenshots or browser-play execution
      are claimed here.
- [ ] Physical Android: start drag-paint on each outermost column from both edges.
      Check accidental system Back, cancellation and no stray marks. The right edge has
      only 8px margin; the left has the extra 24px clue gutter. No gesture exclusion zones.
- [ ] Physical two-finger handoff, zoom limits, clue pinning, interruption/backgrounding
      and rapid swipe interpolation on the target WebView.
- [ ] Keyboard/assistive activation and focused cell visibility after zoom.

## Assumptions and open review decisions

- Axis lock uses the first two crossed cells with horizontal ties; keep it on by default?
- History is unbounded for this in-memory review session. Choose an explicit bounded
  depth and memory policy before production integration, not an undocumented save limit.
- Android edge gesture arbitration remains a device acceptance item, not a CSS guarantee.
- Clue text remains fit-sized during zoom and is counter-scaled; review readability
  and single-digit marker clipping before accepting this pinned-clue approach.

Stop for owner review. Phase 4, production adoption, generator integration and saved
progress changes are not started.
