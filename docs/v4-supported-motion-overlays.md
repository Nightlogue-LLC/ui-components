# V4 shared motion and overlays — second slice of #51

Based on merged library main `22cb38d031b598d5e8ad40dc23b23b1378c5d67c` (PR #52). This slice promotes accepted gameplay motion, editorial sheet gestures, popover presentation and the labelled switch. Storybook fixtures consume the supported implementations. No app route, puzzle state, save, statistics, preference storage or dependency changes are included. Issue #51 remains open for the remaining library families.

## Supported imports

```ts
import { createSwitch, updateSwitch } from '@nightlogue-llc/ui-components/components/switch';
import {
  createBottomSheet,
  destroyBottomSheet,
} from '@nightlogue-llc/ui-components/components/bottom-sheet';
import {
  openDialog,
  closeDialog,
  destroyDialog,
} from '@nightlogue-llc/ui-components/components/dialog';
import { animatePopover, POPOVER_MOTION } from '@nightlogue-llc/ui-components/core';
import {
  createGameplayMotion,
  GAMEPLAY_MOTION,
  dissolveTiming,
  createGameMenuSheet,
} from '@nightlogue-llc/ui-components/projects/grim-glimmer';
```

Load existing `styles.css`, the selected theme CSS, and `projects/grim-glimmer.css`. Shared switch styles are included by styles.css; an explicit `components/switch.css` entry works through the existing package export pattern. Project CSS includes motion effects and the opt-in editorial sheet/popover skin. No source import or production asset refers to stories.

## Switch

`createSwitch({label, checked, disabled?, reducedMotion?, onChange?})` creates a labelled native checkbox with switch semantics. It preserves the reviewed 56px row, 56×44px input target, 44×26px track and 160ms thumb movement. Theme roles supply colors. Native label activation, Space, checked/disabled semantics and visible keyboard focus remain intact.

`updateSwitch(root,{label,checked,disabled?,reducedMotion?})` applies external preference state without replacing the input or emitting onChange. Labels must contain text and are never interpreted as markup. No automatic preference persistence, haptic intensity or audio behavior is included; the app owns those decisions.

## Editorial bottom sheet

`createBottomSheet({...dialogOptions, presentation:'editorial'})` opts into the accepted handle-only gesture. Existing unflagged consumers keep their current sheet gesture/appearance. The editorial skin is part of Grim & Glimmer's project CSS; the underlying modal, body/actions slots, focus restoration and history bridge remain the existing shared Dialog.

On mobile, a downward drag dismisses beyond 120 CSSpx, or at least 24 CSSpx with average downward velocity greater than 500 CSSpx/s. Upward movement has 0.1 elasticity; insufficient movement rebounds over 180ms with shared easing. Cancel, capture loss, close, blur, resize, visibility loss and disposal clear unfinished drag state. Gesture listeners on window/document/media exist only during active drag/rebound. Content scrolling never participates; desktop and non-dismissible/disabled-swipe cases cannot start this gesture.

Actual sheet entrance and exit still use shared 280ms responsive motion. The mobile layout retains a fixed bottom sheet with safe-area actions and independently scrolling tall body; desktop stays a centered dialog. No blur or additional sheet implementation is introduced. Tutorial stays a centered dialog; game menu opts into popover instead of being converted to a sheet.

`closeDialog` is the normal user/app close path and emits its outcome after exit/history settlement. `destroyBottomSheet` and `destroyDialog` are **terminal teardown**: they cancel pending work, release listeners/history/focus, suppress future close outcomes and remove the element. A destroyed dialog cannot be reopened. Use normal close for an overlay you intend to reuse; use destroy on screen unmount. Do not route from a teardown callback.

## Menu popover

`createGameMenuSheet({...existingOptions, presentation:'popover'})` reuses the existing persistent dots/X holder, focus loop, inert board/control handling, Escape and optional same-URL history entry. Its default remains the existing sheet. Popover entry/exit is 160ms, scale .92↔1 plus opacity, through shared `animatePopover`; OS reduced motion or the app animation getter bypasses movement. Popovers do not use content-swipe dismissal.

`menu.close(action)` waits for both exit and consumption of its owned history entry. Reopening invalidates queued navigation and previous animation completions. Removing the trigger/menu or calling destroy cancels queued actions, motion, history waiters and document listeners and restores the prior inert state. The app remains responsible for actual destinations, New Game confirmation and real preferences. Fixtures use history:false and local sample callbacks; production callers can retain existing history behavior.

## Gameplay motion

`createGameplayMotion({animations?, reducedMotion?, hint?, playbackRate?})` exports the reviewed effects without puzzle behavior. Call `mount()` for preference/visibility observation, then `dispose()` on unmount. Disposal is terminal and future calls start no work. The optional playback rate is a positive review aid, default 1; production uses the accepted normal speed.

| Method                               | Ownership                                                                                                                                                                           |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `changes(grid,before,after)`         | Observe already-committed presentation changes. Transient overlays cannot intercept input or receive focus. A new change cancels older effects on that cell.                        |
| `screen(node)`                       | 560ms screen push; no routing or history mutation.                                                                                                                                  |
| `dissolve(grid,size,onVisualFinish)` | Whole-cell center-out opacity fade: 480ms duration, distance×48ms stagger, 720ms delay cap, 1200ms overall ceiling. Superseding, backgrounding or disposal cancels stale callbacks. |
| `setAnimations(enabled)`             | Update the app preference live. Disabling settles an active visual dissolve once and removes transient effects.                                                                     |
| `cancel()`                           | Cancel current finite jobs without committing a route, reset or game result.                                                                                                        |

Mark/ring/X/erase/hint budgets remain 200/280/120/100/1600ms. No pixel dissolve returns. OS reduced motion, missing Web Animations, background state and explicit app preference are honored. Visibility restoration restarts only the purposeful hint pulse, not a completed celebration or old transition. Effects emit no haptics.

`onVisualFinish` is a visual handoff, never the owner of a save, reset, puzzle selection, completion credit or statistics write. The app commits authoritative state through its existing session adapter and can render it immediately when motion is skipped or interrupted. The victory sequence and once-only completion adapter remain the later completion slice.

## Validation and review

Direct API tests cover switch state/focus/disabled behavior, terminal teardown during exit, handle interruption, content/desktop isolation, history plus animation ordering, stale-route suppression on reopen/removal, accepted timing, preference settlement and post-disposal calls. Existing gesture-threshold, focus, shared motion, V3/default API and V4 story tests remain active. Packed-package checks cover new JS/types/CSS entry points under NodeNext/Bundler and both-theme/neutral consumers.

Browser capture was attempted again; Chromium aborts at `process_singleton_posix.cc:297` with `socket() failed: Operation not permitted (1)`. Static Storybook uses the existing external build-only network-interface preload for this executor; the preload is not committed. No browser play, physical Android, safe-area, no-scrollbar or frame-drop result is claimed from unit tests.

Review current Motion and overlay stories in both themes: mark/X/erase, dissolve/screen push, menu toggle and fast reopen, tall difficulty content, handle cancel/dismiss, switch focus, reduced motion and teardown. App adoption later pins the reviewed merge commit and lockfile. Dedicated supplied-glyph approval, tutorial composition, completion, deck/Home and Daily/monthly production adapters remain separate work.
