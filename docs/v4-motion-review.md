# V4 Phase 4 — motion review

Issue #37; epic #33. Audited merged main `4cba6ac90e6001bcbbf016c366fa3bbe9293450f`.
Storybook-only proposal; no src/, dependencies, production tokens, V3 screens, app,
puzzle engine, native platform or saved progress changes. Stop for owner review.

## Audit and reuse

| Existing source                                         | Reused / affected dependency                                                                                                                             |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/core/motion.ts`                                    | `SHEET_MOTION` duration/easing reused for screen translation. `animateSheet` stays unchanged; its vertical geometry is not copied for horizontal motion. |
| `stories/projects/grim-glimmer-v4/board.*`              | Approved cell fills, masks, proportional/struck clues, densities and frameless grid. No changes to these files.                                          |
| `stories/projects/grim-glimmer-v4/interaction-model.ts` | Phase 3 transaction grouping and selection-session adapter; unchanged.                                                                                   |
| `stories/projects/grim-glimmer-v4/interaction.ts`       | Additive optional story hooks for changed cells, mount and disposal. Defaults stay the same. Phase 3 tests remain required.                              |
| `stories/projects/grim-glimmer-v4/controls.*`           | Integrated painting retains approved Phase 2 controls; no toast or Redo.                                                                                 |
| Shared Button and local theme roles                     | Replay/preview actions, native focus and canonical Moonlit palette.                                                                                      |

New story-only `motion.ts` owns animation lifetimes; `motion.css` holds static geometry;
`motion-fixtures.ts` builds review specimens. No approved PNG or SVG file is edited.
Mark overlays reuse the original cell glyph classes/masks. X reveals retain the current
50%-cell-width, 2px round stroke geometry and existing exclusion opacity.

## Timing and conflict resolution

| Effect         | Contract                                                                                            |
| -------------- | --------------------------------------------------------------------------------------------------- |
| Star           | Scale .5 → 1, 200ms, cubic-bezier(.34,1.56,.64,1)                                                   |
| Placement ring | Scale .5 → 1.35, opacity .5 → 0, 280ms ease-out                                                     |
| X reveal       | Two fixed diagonal axes; inner strokes scaleX 0 → 1 for 60ms each, second delayed 60ms; total 120ms |
| Erase          | Old glyph snapshot opacity 1 → 0, 100ms ease-out; actual cell state/fill updates immediately        |
| Hint           | Target ring scale .92 → 1.08 → .92 and opacity .35 → .85 → .35, 1600ms ease-in-out                  |
| Screen push    | translateX 24px → 0 plus opacity 0 → 1, shared 280ms cubic-bezier(.2,.8,.2,1)                       |
| Board dissolve | 120ms opacity fade, delay = min(180ms, Euclidean center distance × 12ms)                            |

The source stroke-dashoffset proposal conflicts with the transform/opacity-only rule.
This review uses a transform reveal with two fixed axes; no dash offset, path, mask,
shadow, gradient, filter, border or color animation. Existing star glow/shadow styling
stays static. No React, Framer or motion dependency. Hint is a target ring rather than
a faded tentative star. The screen specimen demonstrates motion only; no new navigation
or alternate approved screen composition is introduced.

The dissolve cap includes the fade, not merely the stagger. Calculated total times:

| Size  | Latest fade completion |
| ----- | ---------------------- |
| 5×5   | 153.94ms               |
| 6×6   | 162.43ms               |
| 8×8   | 179.40ms               |
| 15×15 | 238.79ms               |

All are below the 300ms global maximum. The read-only dissolve preview clears mock
player marks as one Phase 3 restart snapshot after the fade; Undo preview restores it.
It does not generate/select a new puzzle. Replay cancels an older pending completion
before restoring and starting again. No input lock or timer is introduced.

## State ownership, accessibility and lifecycle

State/history belong to the Phase 3 adapter, never animation completion for interactive
painting. The optional changed-cell hook observes in-place updates. A new change to a
cell cancels its old motion and removes its overlays before starting the new effect.
Completion tokens prevent an older promise from cleaning up a newer animation.
Transient overlays are aria-hidden, have no cell index or tab stop, and cannot intercept
input. Erase does not restore an old fill/selection tint. The existing button/cell node
and keyboard focus stay intact. Replay/Undo controls remain operable during motion.

Each fixture disposes animations/listeners on removal. Backgrounding cancels transient
motion and the hint pulse; visibility restoration restarts only the purposeful hint.
OS or explicit reduced motion applies state immediately, leaves the hint static and
creates no animations. Switching OS reduced motion on mid-dissolve settles the pending
clear once. Missing Web Animations falls back to the final state. Interrupted manual
replay/teardown invalidates pending dissolve callbacks, so stale work cannot commit.

Motion never emits haptics. The existing preference-gated selectionStart →
selectionChanged → selectionEnd session remains solely with Phase 3 state changes.
Replay previews use that same model; there is no duplicated impact or success pulse.
No win detection, success message or victory sequence is added in Phase 4.

## Stories

`Projects / Grim & Glimmer / V4 / Motion`:

- MarkPlacement: Star, X Reveal, Erase, Reduced Motion, Light Dark Comparison,
  Integrated Painting and Replay Demo. Size Controls cover 5/6/8/15.
- HintRing: Target Pulse, Dense Board, Reduced Motion and Light Dark Comparison;
  size Controls cover all approved densities; Replay hint restarts the pulse.
- Transitions: Screen Push, Board Dissolve, Dense Dissolve, Reduced Motion and
  Light Dark Comparison. Size Controls apply to board dissolve.

Mark/replay play demonstrates the resulting state and one-entry history. Integrated
Painting uses Phase 3 drag/keyboard/zoom and Phase 2 controls with mark effects.
Hint and screen/dissolve fixtures remain explicit specimens, not automatic route changes.
Use existing 393×852 / 360×780 presets and light/dark toolbar. Controls can select
mark, density, haptics preference and explicit reduced motion where relevant.

## Validation and acceptance limits

Focused tests use a recorded Web Animations adapter: exact timing/property contracts,
X total duration, stale completion/rejection cleanup, erase focus/state, replay history,
selection-session counts, every dissolve density, reduced-motion changes, background
hint cleanup, disposal and unsupported-API fallback. Phase 3 tests verify additive
hooks preserve existing interaction/history behavior. Run full lint, formatting,
TypeScript, tests, library/package checks and Storybook build. Static builds do not
execute browser play functions, and mocked animation tests do not establish rendering.

- [ ] Comparable light/dark screenshots and actual placement/reveal/erase/hint visuals
      at representative board densities and both mobile viewports.
- [ ] Physical Android: interruption, quick drag/Undo, background/resume, reduced motion
      and final-state alignment without flashes, stale tint, clipping or focus loss.
- [ ] Measure performance of the 225-cell dissolve in the target WebView. Frame drops
      and 60fps are unmeasured; no performance acceptance claim from unit tests.

Local Chromium capture remains unavailable after the earlier socket permission failure;
no new screenshots, browser-play execution or Android measurements are claimed.
Open visual decisions: X transform-reveal delivery, 1600ms hint strength/timing, and
ring prominence on dense boards. No unresolved palette change: canonical Moonlit stays
in use. Phase 5 and production adoption are not started.

## Slower transition review

Transitions now default to quarter-speed playback: screen push takes 1120ms and the
15×15 dissolve approximately 955ms. Half and normal speed are selectable both in the
preview and Storybook Controls; Normal Timing is a separate reference story. Only
review playback scales duration and stagger together. Normal timing constants and
its 300ms dissolve cap are unchanged. Reduced motion still applies immediately.
MarkPlacement targets the top-left cell; Replay mark demonstrates the chosen star,
X or erase effect. Speed changes cancel pending preview work before the next replay.
