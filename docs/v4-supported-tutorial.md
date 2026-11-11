# V4 guided tutorial API — fourth slice of #51

Based on merged library main `17d45e30a4b05dd099deb917964acf64b9a3c0f8` (PR #54). This slice promotes the approved tutorial presentation through the existing guided-tutorial API. It does not add app lessons, teach an unshipped gesture, replace puzzle state or write the tutorial-seen key.

## Supported API

```ts
import {
  createGuidedTutorialDialog,
  destroyGuidedTutorialDialog,
  type TutorialLesson,
} from '@nightlogue-llc/ui-components/projects/grim-glimmer';
import { openDialog } from '@nightlogue-llc/ui-components/components/dialog';
```

Use the existing shared styles, Moonlit Oxblood theme and Grim & Glimmer project CSS entries. The project CSS now includes `editorial-tutorial.css`; no package dependency or additional public stylesheet path is needed.

`createGuidedTutorialDialog({...existingOptions, presentation:'editorial'})` opts into the approved centered dialog, progress dots, static guidance outlines and shared transform/opacity pulse. The default presentation and the existing practice engine remain available. Tutorial is a dialog; it is not converted to a bottom sheet.

| Input                         | Contract                                                                                                                                             |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lessons`                     | Caller-authored lesson data; no fixed count, game name or ninth zoom lesson is bundled.                                                              |
| `presentation`                | Omit for the existing counter presentation; use editorial for the accepted V4 dots and guidance.                                                     |
| `stateLabels`                 | Optional board-state names, such as tree / confirmed tent / tentative tent. Internal fixed/placed/tentative/excluded states stay intact.             |
| `reducedMotion`, `animations` | OS reduction and explicit app preferences suppress movement. Static guidance remains visible.                                                        |
| `initialLesson`               | Existing clamped starting-lesson option for replay/review.                                                                                           |
| `glowDelay`                   | Existing legacy CSS glow delay; editorial guidance uses the accepted shared pulse.                                                                   |
| `onDone`                      | Existing skip/finish outcome callback. The app decides whether and where to remember completion.                                                     |
| `lesson.illustration`         | Optional app-owned visual Node, cloned when rendering that lesson. No string markup is parsed and no gesture capability is inferred from the visual. |

The app supplies instructions, examples, terminology and capability-dependent guidance. App #50 can add the zoom lesson after the real #48 gesture implementation ships. The V4 Storybook fixture still supplies its explicit nine-lesson review sequence; its zoom example and visual remain fixture data. Production APIs contain no sample lesson array or zoom promise.

## Practice and progress

The existing three-tap practice gate, single editable target, Back/Next/Begin controls and focus behavior remain intact. Every required practice state must be reached before Next is enabled. Tutorial practice is local presentation state and never mutates a real game, save or statistics ledger.

Editorial progress is computed directly from the current lesson index and supplied lesson count. There is no MutationObserver parsing the English counter text, no interactive dot navigation and no duplicate spoken progress. One live status announces the current/total value; individual dots are decorative.

Lesson transitions dispose the previous guidance pulse before rendering the next example. Focus moves to the practice target or lesson heading without requesting viewport scroll. Completing practice retains focus on the existing Next/Begin control.

## Lifecycle

Create the dialog detached, append it inside the themed container and call the existing `openDialog`, retaining its normal history option when the app needs Back handling. The shared Dialog emits an internal open lifecycle event after attachment/open; the tutorial starts its pulse at that point, never during detached construction.

Normal close releases motion and observation, then preserves the existing skip/finish outcome. `destroyGuidedTutorialDialog(dialog)` is terminal teardown: it cancels the pulse, disconnects observation, releases underlying dialog resources and removes the element without reporting a skipped or completed tutorial. Removal of an open editorial tutorial triggers that same cleanup. A destroyed dialog cannot be reopened; create a new instance for later replay.

The existing native Dialog still owns modal semantics, backdrop/Escape behavior, history and focus restoration. The fallback retains its current limitations; this promotion does not claim a new fallback focus trap or actual Android Back verification.

## Stories, checks and remaining work

The V4 HowToPlay fixture now calls the supported editorial API and supplies its authored lessons. Its former counter-text observer, duplicate progress builder and private pulse lifetime are removed. Existing V3 tutorial consumers keep their default presentation.

Direct API cases cover supplied lesson counts, custom board labels, all practice taps, default presentation, detached/open/close pulse lifetime, removal without an outcome, safe text/illustration cloning, reduced motion and animations-off behavior. Existing authored-sequence, focus and practice tests remain active. Packed-package consumers compile the new options and teardown export under NodeNext/Bundler and resolve the included styles.

Browser capture was attempted again; Chromium aborts at `process_singleton_posix.cc:297` with `socket() failed: Operation not permitted (1)`. Static Storybook uses the external build-only empty-network-interface preload; it is not committed. Browser/device review still needs both themes, practice before/after three taps, repeated open/close, long lessons, enlarged text, Back/focus and interruption. Unit tests do not establish measured viewport fit or animation performance.

Issue #51 remains open. Completion, pointer/view adapters, settings composition, reviewed tentative-tent glyphs and flagged Daily/monthly presentation remain separate promotion work. App adoption later pins the reviewed library commit and lockfile; the app's tutorial-seen key and save contracts stay unchanged.
