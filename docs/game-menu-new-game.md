# Feature Expansion Game Menu

Library issue #66, revised by the owner on 2026-11-13. Application adoption follows in gothic-cozy-puzzles#38 after review, merge and dependency adoption.

The planning previews live together under **Projects / Grim & Glimmer / Feature Expansion / GameMenu**. The existing V4 stories remain the unchanged baseline; the expansion uses the exported shared components, never a copied production UI implementation.

## Required selection and separate random action

`createGameMenuContent` is exported from `@nightlogue-llc/ui-components/projects/grim-glimmer`. The existing project CSS entry includes its styles. Pass its exact `element` as `createGameMenuSheet({presentation:'popover',content,...})` content and use `createGameplayMenuHeader`'s menu trigger.

`GameMenuSelection` requires `size: 6 | 8 | 10 | 12 | 15` and `difficulty: 'easy' | 'medium' | 'hard'`. Both categories always have a selection. Native radio controls retain the selected state when activated again and support arrow keys/Space. The app supplies its committed selection; the story fixture starts at Easy 6×6. Null and partial-random filters from the earlier PR revision are superseded.

**New Game** submits the draft selection through `onStart(selection)`. **Surprise Me** is a separate Phosphor magic-wand icon button calling `onSurprise()` with no filters. Its random request must not overwrite the selected or committed preferences. The app owns random puzzle choice, eligibility, repeat avoidance, save preservation and navigation.

The button row uses 4:1 tracks (80/20 of the space after the gap), with a 48px minimum surprise track to retain a 44px target and border glow. The section is titled **Game Menu**. Surprise Me matches New Game using the same primary-button background and foreground hooks, leaving accent color for selected options. A soft neutral conic shimmer rotates through a transform-only animation around its edge; the icon itself remains still. Reduced motion, `animations: () => false`, disabled availability, and a hidden menu stop the animation. Reduced motion retains a static neutral treatment.

## Controlled lifecycle and availability

Required callbacks are `onStart`, `onSurprise`, `onHowToPlay`, `onGameSettings`, `getAvailability(selection)` and `getSurpriseAvailability()`. Optional `onSelectionChange` reports only draft edits. Neither selection nor random preview automatically persists data or replaces a board.

The returned controller provides:

- `element`: content for the existing overlay.
- `selection`: isolated draft snapshot.
- `reset(selection?)`: discard the draft; a supplied value updates the committed baseline while preserving input nodes and focus.
- `refresh()`: re-read availability and animation preference without resetting the draft.

The overlay dispatches `game-menu-open` before focus enters and `game-menu-close` on dismissal or active teardown. Content resets to the committed baseline on either event. Closing through trigger, Escape, scrim, Back, Help or Settings discards uncommitted changes. Custom hosts must call `reset()` at those boundaries themselves.

After accepting a selected New Game request, the consumer calls `content.reset(acceptedSelection)` and uses `menu.close(afterClose)` for navigation. For Surprise Me, close and request a random eligible puzzle without resetting the committed filters to the random board's metadata. A rejected request may leave the same menu open. No separate selector modal is introduced.

Selected and random availability are independent: each callback returns `{status:'ready'|'loading'|'unavailable',message?}` based on real app data. Start is blocked only for its selected pool; Surprise Me is blocked only for the random pool. Both recheck availability on activation, so stale catalog state cannot submit accidentally. Call `refresh()` after asynchronous state changes and supply a busy state while submitting. The shared UI never solves, selects, generates or persists puzzles.

The explanatory paragraph above Grid size is removed. A compact selection/status line remains below Difficulty, and loading/unavailable reasons have accessible status text. Surprise Me has an accessible name, explanatory tooltip and independent status description.

## Review and handoff

The menu keeps the approved floating overlay, Moonlit Oxblood tokens, editorial typography, Back/focus behavior, and How to Play / Game Settings actions. Global Sound/Music/Haptic preferences stay in main Settings.

Stories cover selected, loading, unavailable, mobile, tall-content and reduced-motion states. Component tests cover mandatory selections, independent random requests, lifecycle rollback and catalog availability. The app's saved-progress selection and random-selection implementation belong to #38; no app code or Android build changes in this library PR.
