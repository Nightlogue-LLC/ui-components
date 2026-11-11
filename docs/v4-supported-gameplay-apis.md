# V4 gameplay API promotion — first slice of #51

Based on library main `37a5e14c557f4a23b227435b509a8d2de64643f9` and the merged app audit PR #53. This slice supplies board presentation, tarot header and controlled tools. App adoption, pointer transactions, zoom, completion motion, overlays, deck/Home and flagged monthly surfaces follow in separate PRs. Issue #51 remains open.

## Package imports

```ts
import '@nightlogue-llc/ui-components/styles.css';
import '@nightlogue-llc/ui-components/themes/moonlit-oxblood.css';
import '@nightlogue-llc/ui-components/projects/grim-glimmer.css';
import {
  createTarotGameplayHeader,
  createCluedBoard,
  updateCluedBoard,
  createGameControlRow,
  updateGameControlRow,
  type BoardCellState,
  type ClueFeedback,
} from '@nightlogue-llc/ui-components/projects/grim-glimmer';
```

No production import reaches into stories. The existing project CSS entry includes `editorial.css`; no additional public subpath or package dependency is required. Packaged CSS resolves its tentative-star SVG locally. The optional V4 error roles live beside existing Moonlit error roles; no existing theme value changes. Internal `gg-v4-*` hooks remain for existing fixtures and are project-scoped through the opt-in `nl-grim-glimmer-v4` root. Experimental palette and framed comparison styles remain story-only.

## Header

`createTarotGameplayHeader` requires independent `tarotNumeral`, `archetypeTitle`, `puzzleName`, `difficulty`, `columns` and `rows`. Dimensions must be positive integers. It reuses the existing compact header and native Hint/Menu buttons. `onHint` and `onMenu` remain consumer callbacks. `hintLabel` permits the app's current honest How to Play label. `showIdentity:false` retains the existing comparison layout slot.

Identity mappings remain collection data in the story fixture and later app adapter. The generic factory has no default game, puzzle seed, route or archetype. Text is assigned as text content.

## Board

`createCluedBoard({...existingOptions, presentation:'editorial'})` opts into the accepted frame-free geometry, 24px clue tracks, filled occupied cells, outline tentative star, diagonal satisfied strikes, over-count marker and dense 15×15 dividers. The existing default stays unchanged. Every positive integer size is supported; tests cover all shipped sizes 6/8/10/12/15.

The app must supply the complete row-major `cells`, `rowClues` and `columnClues`. No fallback fixture, generated values, solver or marking cycle ships in the library. Activated cells report an index without changing a mark.

`updateCluedBoard(shell, {cells, rowFeedback?, columnFeedback?, conflicts?, hints?})` updates cell nodes in place. Optional feedback arrays contain one `{status:'default'|'satisfied'|'over', confirmed:number}` per row/column. Counts/statuses come from the app; presentation never infers satisfaction from cells. `conflicts` and `hints` are row-major indices. Supplied reports are validated before DOM mutation. Omitted feedback resets to neutral and removes stale markers, rings and spoken annotations. Custom row/column clue labels remain the base of spoken reports. Continue using `updateBoard(grid,{cells})` for existing consumers that do not use the new feedback facade.

The existing star/spire art stays available. Supplied tree/tent SVGs remain byte-identical in their current preview location. **No supplied-tent production variant is exported in this PR**: its tentative rendering still needs the audit's dedicated visual approval. The copied tentative-star mask is the existing accepted asset, not a new tentative tent. A later glyph slice must deliver a reviewed, complete state family before app #47 adopts it.

## Controls

`createGameToolToggle` / `updateGameToolToggle` supply the isolated toggle. `createGameControlRow` / `updateGameControlRow` compose it with Undo, optional Hint, and Restart. Existing `createGameControls` remains unchanged for its current consumers.

Controlled state: `{mode:'tent'|'exclude', canUndo, hint?, disabled?, reducedMotion?, haptics?}`. Clicks request changes through `onModeChange`, `onUndo`, `onHint` and `onRestart`; the app calls the updater with its next state. Updaters preserve button nodes and focus. Callbacks remain fixed for the lifetime of the control. A missing callback disables its action. No enabled control points into a mock action.

Use `showHint:false` when the header already owns the help/hint affordance. `tentLabel` and optional DOM `tentIcon` permit future reviewed app artwork without embedding collection identity. Native IconButton clones the supplied node. No visible Redo, toast, confirmation policy or history implementation is included.

`tick` is an injected feedback request, gated by the current `haptics` state. The library does not import Capacitor or choose vibration strength. The app continues its gentle selection lifecycle. OS reduced motion and explicit reducedMotion disable control transitions. Tool keyboard arrows/Home/End request selection and move native focus. Disabled controls reject pointer and keyboard requests.

## Existing stories are consumers

V4 Board stories now pass illustrative state/count reports into the shared board. Their sample marking cycle, guide preview and demo annotations remain local adapters. Header stories re-export the shared factory and retain collection copy. Control stories map sample Star/Exclude state to the supported neutral tent/exclude mode; local undoable Restart remains a labelled fixture, not a production reset decision. Earlier V4, V3 and neutral consumers retain their own defaults.

## Adoption and next gates

After merge, each app PR pins the actual reviewed library commit in package.json and package-lock.json. Do not pin a moving branch or the pre-promotion main commit. App #46 still needs the later deck/Home export family. App #47 needs this header/board slice plus the reviewed supplied-glyph family. App #48 needs the later pointer/session transaction contract and reviewed reset/drag policies.

Tests cover real supported APIs, all catalog sizes, neutral input data, in-place feedback clearing/focus, invalid reports, preserved legacy DOM, safe header text, controlled state and disabled/preference behavior. Package consumer checks import the new APIs under NodeNext/Bundler, resolve JS exports and bundle both-theme/neutral CSS plus its asset.

Browser capture was attempted in this executor; Chromium aborts at `process_singleton_posix.cc:297`, `socket() failed: Operation not permitted (1)`. Static Storybook builds use an external temporary Node preload returning an empty network-interface list to bypass the executor's `uv_interface_addresses` enumeration failure. That preload is not repository code and performs no browser/device validation. Physical safe areas, enlarged text, gesture feel and frame drops remain review evidence, not unit-test claims.
