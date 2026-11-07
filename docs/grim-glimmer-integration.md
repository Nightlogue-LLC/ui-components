# Grim & Glimmer: project layer and game integration

`src/projects/grim-glimmer/` holds the Grim & Glimmer compositions, built from the shared components and the [grim-glimmer theme](grim-glimmer-theme.md). It is **presentation only**: no game engine, no board generation, no persistence, no final artwork. This page lists what the library provides, what the game app must own, and the sequencing contracts between them.

## Using it

```ts
import '@nightlogue-llc/ui-components/styles.css';
import '@nightlogue-llc/ui-components/themes/grim-glimmer.css';
import '@nightlogue-llc/ui-components/projects/grim-glimmer.css';
import { applyTheme } from '@nightlogue-llc/ui-components';
import { createPuzzleCollectionCard } from '@nightlogue-llc/ui-components/projects/grim-glimmer';

applyTheme(document.documentElement, 'grim-glimmer', 'dark'); // or 'light'
```

Allowed imports inside the library: project code may import shared `components/` and `core/`; shared code must never import `projects/`; projects never import each other (all enforced by tests). Project CSS uses only theme tokens (no literal colors) and `nl-grim-glimmer-*` classes.

## What is provided

| Export                                   | Purpose                                                                                                                                                                                                                                         |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `createBoard` / `updateBoard`            | Square board of cells in `preview` (decorative), `interactive` (buttons; given cells announced but inert) or `readonly` (images) mode. Reports activations by index; draws whatever cell states it is given: `empty / fixed / placed / marked`. |
| `createPuzzleCollectionCard`             | Full-width landscape card (136px tall by default; preview ~40% left; serif title and status on the right). `play` / `continue` are native buttons; `coming-soon` is a static, dashed, non-actionable card whose status is real text.            |
| `createPuzzleCollection`                 | One-column `<ul>` of equally sized cards.                                                                                                                                                                                                       |
| `createGameHeader`                       | Back, short title (`h1`), help. 48px targets via the icon button's size hook. Icon artwork is passed in by the app.                                                                                                                             |
| `createGameControls`                     | Compact New Game button shown below the board.                                                                                                                                                                                                  |
| `createGameScreen` / `getGameScreenSlot` | Single-column screen layout (header, difficulty, board, controls) with 24px side padding and safe-area insets. No bottom navigation anywhere.                                                                                                   |
| `createTutorialDialog`                   | Multi-step copy plus a **mock, tappable 5x5 demo** (empty → placed → marked → empty). Skip always available, Finish on the last step. Does not touch the real board.                                                                            |
| `createSuccessDialog`                    | Concise success message with a small decorative accent (no confetti). Play Again / Close.                                                                                                                                                       |
| `createDiscardConfirmDialog`             | Compulsory confirmation (not dismissible, Cancel focused first).                                                                                                                                                                                |

The dialogs return a closed, detached `<dialog>`; the app appends it inside its themed container and calls `openDialog()`. Their callbacks run **after** the dialog has closed and focus has returned to the opener. All strings (and `labels` options for button words) come from the app, for translation.

Difficulty uses the shared `SegmentedControl`, with the app's own option values. Easy / Medium / Hard are sample values in the gallery, not built into the library.

## What the game app owns (contracts)

The gallery's "G&G · Modal flow" story simulates these rules with mock state so you can see them work; it is **not** Tents & Trees and not production state management.

1. **First-visit detection.** The app persists whether the tutorial has been seen (globally or per puzzle). On the first open of a puzzle: create an **Easy** board first, render the game screen, **then** open the tutorial above it. Skip, Finish and any dismissal (Escape, X, backdrop) leave the board exactly as it was; the app decides what to record (the gallery marks it seen on any close). Help replays the tutorial without altering anything.
2. **Board generation.** The engine generates one board per puzzle at a difficulty. **New Game** generates immediately at the _current_ difficulty. A **difficulty change** generates at the _selected_ difficulty. The library never generates boards (`gallery/lib/mock-board.ts` is a mock).
3. **Save and restore.** There is one current board per puzzle. Persist it with its difficulty, given pieces, the player's progress and a solved flag. **Back retains progress.** On return, restore the board; the collection card shows **Continue** when a board exists and **Play** when none does.
4. **Completed state.** When the board becomes solved: switch it to `readonly` mode and open the success dialog **once, on the transition** (not when restoring an already-solved board). **Close** leaves the solved board visible and read-only. **Play Again** creates a fresh board at the same difficulty. Replacing a solved board (New Game) needs **no** confirmation.
5. **Difficulty and confirmation.** `SegmentedControl` is controlled: `onChange(next)` is only a request, and the control stays on the old value until you call `updateSegmentedControl`. If the board is unfinished, open the discard confirmation; **Confirm** → generate at `next`, then update the control; **Cancel** → do nothing (board and difficulty stay).
6. **What "unfinished" means.** The issue says replacing an _unfinished_ board needs confirmation. The gallery treats a board as unfinished when it is not solved **and** the player has made progress, so replacing a board that was never touched is immediate. A toggle in the story ("confirmUntouched") shows the stricter reading. Decide which the product wants.
7. **Modal sequencing.** Show one dialog at a time, never stacked. Sequence: tutorial (first visit, or Help) → play → discard confirmation (only on replacing an unfinished board) → success (on solve). Dialogs are modal, so the page behind cannot be used while one is open.
8. **Android back button (Capacitor).** The library does not listen for it. Handle it in the app: if a dismissible dialog is open, call `closeDialog`; if a non-dismissible one is open (the discard confirmation), ignore it; otherwise navigate back. _Not tested on a device._
9. **Accessibility.** Cells have positional accessible names (`Row r, column c: state`), customizable through `stateLabels` and `cellLabel`. The app should announce solve/replace events through its own live region if the dialogs alone are not enough.

## Placeholders to replace

Clearly marked as such in the gallery and code comments; none is final artwork:

- Board glyphs (circle / triangle / dot) and the preview boards in collection cards.
- The four-point star in the success dialog.
- The sample icons (chevron, help) in the gallery; real icons are supplied by the app as DOM nodes.
- All sample copy, and the "Placeholder puzzle A/B" cards.
- The display font (Georgia stack), pending sign-off.

## Previewing

`npm run dev`, then open **G&G · Overview** (home and game screens, light and dark side by side, in true phone-width stages), **G&G · Modal flow** (the working simulation) and **G&G · Foundations**. Use the Viewport menu or device emulation for 320 / 375 / 430px. "Overview" and "Modal flow" render edge to edge so a screen is as wide as the viewport, which matters for touch-target sizes.

Review screenshots (375px, mock data) are in `docs/screenshots/grim-glimmer/`; they can be deleted after review.
