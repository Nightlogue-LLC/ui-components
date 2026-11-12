# Supported completion presentation

This prerequisite for app issue Nightlogue-LLC/gothic-cozy-puzzles#49 promotes the accepted V4 completion sheet and visual sequence from Storybook. Based on library main `1534cb6f0b43da7cc65c026b0c4d83a7cbb7e659`. The app adoption is a separate PR after owner review and merge. Library #51 and app #49 remain open.

## Imports

```ts
import {
  createCompletionSheet,
  createCompletionSequence,
  COMPLETION_TIMING,
  type CompletionStatistic,
} from '@nightlogue-llc/ui-components/projects/grim-glimmer';
```

Load the existing shared styles, theme and `projects/grim-glimmer.css`. The project CSS now includes the accepted sheet, divider, celebration links/glow and statistic presentation. The existing `createSuccessSheet` API remains compatible. Storybook uses the supported factories; sample statistics, replay controls, fixture board and success-haptic spy remain in the stories.

## Sheet

`createCompletionSheet` extends the existing success sheet options with optional `statistics: {label, value}[]` and `extraAction: {label, onSelect}`. Dynamic messages are evaluated once per sheet and assigned as text. No statistics are generated when none are supplied. The default primary label remains **New Game** and secondary remains **Return Home**; the preview explicitly labels its action **Next Puzzle**. The optional extra action has no built-in difficulty or route. All outcomes use shared dialog exit/history/focus behavior. The accepted sheet has no grabber or large star; it retains the small editorial divider.

## Sequence

`createCompletionSequence({...sheetOptions, host, board, size, reducedMotion?, history?, present?})` takes a mounted board wrapper containing exactly size² indexed grid children. It does not validate solutions, disable board input, reset zoom, write saves, select puzzles, record statistics or emit haptics. Those remain app/session decisions.

Call `start()` once after a genuine completion has already been committed and the board rendered read-only. The controller is single-use. Repeated start calls do nothing. A solved preview can call `start({celebration:false})` to present its sheet immediately without replaying the visual celebration; it must not replay rewards, statistics or success haptics.

The default presenter appends and opens the shared dialog with `history:false`. Production may opt into `history:true`, or supply `present(dialog)` to reuse its existing modal pause/open adapter. A custom presenter owns the actual opening; the controller still owns terminal teardown. Its history consumption must use the shared dialog bridge. Same-URL modal Back is left to that bridge; hash navigation cancels the sequence.

| Presentation                     | Accepted timing                                                    |
| -------------------------------- | ------------------------------------------------------------------ |
| Link reveal                      | 200 ms, staggered across 400 ms                                    |
| Per-mark glow                    | 280 ms, staggered across 320 ms                                    |
| Celebration cleanup              | 600 ms                                                             |
| Completion sheet handoff         | 700 ms                                                             |
| Shared responsive sheet entrance | 280 ms                                                             |
| Supplied statistic entrance      | After the sheet's 280 ms entrance, 180 ms per value, 60 ms stagger |

Decorations are aria-hidden, have no pointer handlers and are removed after their finite effect. Links live outside the indexed cell grid, so keyboard/cell state adapters still see exactly size² children. Their coordinates come from the rendered grid relative to its board wrapper. No inline foreground/background colors or white transition layer are introduced.

App animation-off, OS reduced motion and missing Web Animations open the sheet immediately without celebration. `setAnimations(false)` settles pending presentation immediately and removes sequence effects. No forced timer wait occurs on those paths. OS preference changes are observed during the sequence.

`cancel()` clears timers, decorations and jobs, destroys its dialog, removes observers/listeners and suppresses all queued action callbacks. `dispose()` is terminal and safe to call repeatedly. Neither method routes or reports dismissal. Backgrounding, host/board removal and hash navigation invoke terminal cancellation. Same-URL Back before the sheet exists cancels pending presentation. A resize clears obsolete link coordinates and presents a pending sheet immediately. Returning to the foreground never replays a celebration or opens a cancelled sheet.

Normal dismissal clears pending effects, returns focus through the shared Dialog and invokes exactly one chosen outcome. It leaves the rendered solved board intact. The app must dispose the controller on screen replacement, and must keep completion credit in the authoritative session rather than a visual callback.

## App adoption

Pin the reviewed merge commit and regenerate the app lockfile. Use shared `createGameplayMotion` for committed mark feedback, the 560 ms screen push and original whole-cell dissolve (480 ms fade, up to 720 ms delay, 1200 ms ceiling). Do not restore pixel dissolve. A visual callback must never own puzzle selection or completion credit. Wire the new completion presenter through the existing modal tracking, cancel it on navigation, and source optional statistics from real attempt data only. Retain New Game/Return Home outcomes and confirmed Reset behavior.

## Validation

All 616 tests across 49 files pass, including 36 completion composition/sequence tests. TypeScript, ESLint, formatting, library build and packed-package consumer checks pass. Consumers cover NodeNext/Bundler type resolution, runtime exports and CSS bundling in both themes plus a neutral-only consumer. Storybook builds with 355 entries, 21 groups, two themes and six bundled fonts. This executor denies the network-interface enumeration syscall; the static Storybook build uses an external build-only preload returning an empty interface list. That preload is not committed or shipped.

## Review limits

Unit and package checks establish contracts and cancellation, not Android frame timing or visual parity. Browser capture is attempted in this executor; Chromium fails at `process_singleton_posix.cc:297` with `socket() failed: Operation not permitted (1)`. No fresh screenshot, Android recording, frame-drop measurement, safe-area or no-scrollbar result is claimed.

Owner review remains pending in the Sequence, Sheet and Solved Board stories at 393×852 and 360×780, both themes, default/reduced motion and large text. App #49 retains physical checks for WebView frame drops, document height, board position, background flashes, edge Back, focus and once-only completion events. Daily/monthly rewards and supplied glyph consolidation remain separate slices.
