# Supported V4 board interactions

Part of library #51 and app epic Nightlogue-LLC/gothic-cozy-puzzles#44.
Built on library main `0592925a3dd1307bc9e6b7c95aa3fa2c22f46ae2`.
This slice prepares app phase #48. It does not integrate the application.

## Package contract

```ts
import {
  createCluedBoard,
  createBoardInteractions,
  updateCluedBoard,
  type BoardStrokeAdapter,
} from '@nightlogue-llc/ui-components/projects/grim-glimmer';
import '@nightlogue-llc/ui-components/projects/grim-glimmer.css';

const board = createCluedBoard({
  presentation: 'editorial',
  size,
  mode: 'interactive',
  label: 'Trees & Tents',
  cells,
  rowClues,
  columnClues,
});
container.append(board);
const stroke: BoardStrokeAdapter = {
  begin: (index) => app.beginStroke(index),
  visit: (index) => app.visitStroke(index),
  commit: () => app.commitStroke(),
  cancel: () => app.cancelStroke(),
};
const input = createBoardInteractions({
  board,
  size,
  stroke,
  zoom: size === 15,
  onActivate: (index) => app.activateCell(index),
});
input.mount();
// Render each app preview/commit/rollback in place. Keep the cell nodes.
updateCluedBoard(board, { cells: app.cells, rowFeedback, columnFeedback });
// Before a tool change, undo, restart, puzzle replacement or route transition:
input.cancel();
// Pause input under an overlay; this rolls back an unfinished stroke.
input.setEnabled(false);
input.setEnabled(true);
// Terminal disposal restores wrappers, transforms and original tab indices.
input.destroy();
```

The example's `app` is an application adapter, not a library export or default.
Consume the merged commit containing this file through the app's dependency workflow;
no production imports from `stories/` are needed.

| Library owns                                                                     | Application owns                                                               |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Pointer capture, interpolation and cancellation routing                          | Paint/erase intent, axis lock, protected states and visited-cell deduplication |
| Explicit begin/visit/commit/cancel calls                                         | Preview, rollback, validation, persistence and bounded undo history            |
| Native keyboard/assistive activation callback and roving focus                   | Tentative → confirmed → cleared tap semantics                                  |
| Opt-in view state, 1–1.8 scale clamp, bounded translation and pinned clue tracks | Which sizes permit zoom, accessible zoom controls and labels                   |
| Lifecycle listeners, resize reset and cleanup                                    | Selection haptic session, preference, tools, completion and navigation         |

No state array, history, timer, haptic adapter, Capacitor import or puzzle rule is in
this API. The existing story-local model keeps its fixture behavior. It now delegates
all DOM input/view work to the supported adapter. The story-only Zoom in/Reset buttons
are not injected into a production board.

## Gesture and activation details

- One pointer calls `begin(index)` on an enabled cell, repeated `visit(index)` samples
  during movement and `commit()` on release. Duplicate visits are intentional: the app
  decides which cells may change and deduplicates mutation/haptics per stroke.
- Screen-space segments, including coalesced events, are sampled at most one-third of
  the displayed cell width. Points beyond the clipped viewport cannot map into a cell.
  Internal grid gaps use coordinate fallback. Mouse secondary buttons are ignored.
- A second pointer calls `cancel()` before view movement. Painting cannot resume until
  every pointer lifts. A third pointer suspends zoom; returning to two reanchors it.
  Multi-touch cancels painting on every size; zoom is explicit and off by default.
- Grid/dividers share one transformed content layer. Column clues follow only x/scaleX;
  row clues follow only y/scaleY. Counter-scaling keeps clue glyphs undistorted. Existing
  accessible clue descriptions and caller updates remain intact.
- Keyboard arrows/Home/End move a single tab stop and pan the focused cell into view.
  Native detail-zero clicks call `onActivate`; omitting it calls one begin/commit pair.
  Pointer compatibility clicks are suppressed. Fixed cells remain focusable for reading
  but do not activate. The adapter owns capture-phase cell activation during mounting;
  an existing `createBoard` activation callback cannot run a second time.
- `setView({scale,x,y})` clamps finite values and cancels pending paint. `getView()`
  returns a copy. `resetView()` returns to fit and cancels pending paint. Disabled zoom
  remains at fit for all methods. View changes have no decorative animation, so there
  is no reduced-motion alternative to a transition.

## Lifecycle

Create once per interactive editorial clued board. Duplicate bindings, mismatched
sizes and missing interactive/editorial markup throw before wrapping the board.
Append the board, then call `mount()`. It is idempotent. `unmount()` cancels and removes
listeners/observers, resets to fit, and permits explicit remount. An observed removal
unmounts automatically; a disconnected or hidden board cannot commit stale events.
Call `unmount()` synchronously from route teardown when available.

Pointer cancellation, unexpected lost capture, blur, document hiding, disabling input,
container/window resize, unmount and destroy cancel pending work. A successful release
closes the transaction before capture release, preventing a second cancellation.
The app must render rollback in `stroke.cancel` and persist only from `stroke.commit`.
`destroy()` is terminal and idempotent; it unwraps the original grid and clue tracks,
restores transforms/tab indices and releases the duplicate-binding guard. Later API
calls do not reattach input. Default boards and legacy APIs remain opt-in consumers.

## Verification and remaining acceptance

Direct supported-API tests cover external state ownership, interpolation/coalesced
paths, clipping, keyboard/disabled activation, compatibility clicks, all cancellation
paths, removal/remount, two/three-finger handoff, zoom opt-in, pinned transforms,
container resize and terminal cleanup. Existing 22 fixture-model/DOM tests remain.
The package smoke consumer compiles the exported API/types and checks bundled CSS.

Browser pixel alignment, trusted pointer capture, physical haptics and Android edge
Back arbitration still require browser/device acceptance. The prior prototype's
393×852 and 360×780 fit measurements are unchanged layout budgets, not fresh captures.
No new screenshot or physical gesture result is claimed by unit tests or static builds.

Local validation: `npm run check` passes with 600 tests, lint, formatting, types,
library build, package checks and the 355-entry Storybook build. The separate V4
fixture suite passes 64 tests. The full check used an external temporary Node preload
returning an empty network-interface list to bypass the sandbox enumeration restriction;
it is not part of this patch. Chromium was attempted and failed at
`process_singleton_posix.cc:297` with `socket() failed: Operation not permitted (1)`.

Library #51 stays open: completion, settings composition, approved tentative-tent
glyph presentation and flagged Daily/monthly presentation remain. App adoption and
history policy belong to later app PRs; no save key, ID or format changes here.
