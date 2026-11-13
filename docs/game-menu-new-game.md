# New Game inside the editorial Game Menu

Issue: https://github.com/Nightlogue-LLC/ui-components/issues/66. App integration follows in gothic-cozy-puzzles#38 after review, merge and dependency adoption.

`createGameMenuContent` is exported from `@nightlogue-llc/ui-components/projects/grim-glimmer`. Load the existing project CSS entry; it includes the new content styles. It composes inside `createGameMenuSheet({ presentation: 'popover', ... })` and uses `createGameplayMenuHeader`'s trigger. No new dialog, bottom sheet, runtime dependency or global setting is introduced.

## Selection and ownership

`GameMenuSelection` has `size: 6 | 8 | 10 | 12 | 15 | null` and `difficulty: 'easy' | 'medium' | 'hard' | null`. Null independently means random. Both start unselected when the consumer supplies nulls; activating a selected toggle clears it. Native buttons with `aria-pressed` allow deselection, unlike a native radio group.

Pass the last committed `selection`, a required `getAvailability(selection)` callback, and real `onStart`, `onHowToPlay`, `onGameSettings` callbacks. Optional `onSelectionChange` reports a draft only. No selection event persists anything or replaces a board.

The returned controller exposes:

- `element`: pass this exact element as the overlay's `content` so lifecycle events reach it.
- `selection`: an isolated snapshot of the current draft.
- `reset(selection?)`: discard the draft; supplying a value also updates the committed baseline. This is the controlled external-selection update API and preserves existing button/focus nodes.
- `refresh()`: reevaluate availability after an asynchronous catalog/loading change without resetting the draft or replacing controls.

`createGameMenuSheet` dispatches `game-menu-open` before focus enters the content and `game-menu-close` on dismissal and open-menu teardown. Content resets to its committed baseline on either event. Toggle, Escape, scrim, Back, Help and Settings all discard uncommitted changes. When composing in another host, call `reset()` explicitly on the same lifecycle boundaries.

Only **Start New Game** invokes `onStart` with the submitted selection. Availability is rechecked immediately before invoking it. The component does not close, navigate, persist or assume the request succeeded. After the app accepts a request, call `content.reset(acceptedSelection)` and close the menu using `menu.close(afterClose)` for navigation. Keep validation/failure inside the same flow; do not introduce another selector modal or Surprise Me action.

## Catalog availability

The app owns eligible catalog combinations, preference persistence, unplayed/repeat policy, saved unfinished boards and real navigation. The library never selects or generates a puzzle. `getAvailability` receives a snapshot of the draft and returns:

- `{ status: 'ready', message? }`: Start is available.
- `{ status: 'loading', message? }`: Start is disabled and busy; choices remain usable.
- `{ status: 'unavailable', message? }`: Start is disabled with an honest explanation. The app may supply a reason specific to its actual catalog.

Default loading/unavailable text is provided when no message is supplied. Call `refresh()` after asynchronous data changes. An exhausted selection never silently changes filters. The app must independently validate requests and supply busy/availability state during asynchronous submission.

## Remaining menu actions and design boundary

How to Play and Game Settings follow the New Game section. Game Settings is for supported puzzle-specific behavior. Sound effects, Music and Haptic feedback are absent from this gameplay menu and remain the responsibility of the app's global Settings destination. The Storybook Game Settings callback is explicitly a fixture, not a fake working settings implementation.

Moonlit Oxblood tokens, Cormorant Infant heading role, Inter functional text, the existing floating overlay, focus trap, Back handling and motion remain in use. The old Difficulty story URL now demonstrates this in-menu flow; its separate selector sheet has been removed. Global Settings, tutorial lessons and unrelated sheets retain their behavior.

## Review and validation

GameMenu stories cover random/selected states, loading, unavailable catalog, tall content, 360/390 widths, reduced motion and light/dark comparison. Regression tests cover independent deselection, explicit Start, committed reset, dismissal paths, real navigation callbacks, stale availability, focus, teardown and packed consumer typing. Android physical-device review and application integration are separate handoff checks; Storybook does not establish either.
