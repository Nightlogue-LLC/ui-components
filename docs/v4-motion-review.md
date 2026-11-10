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
| Screen push    | translateX 24px → 0 plus opacity 0 → 1, 560ms cubic-bezier(.2,.8,.2,1)                              |
| Board dissolve | Center comparison: 480ms fade, delay = min(720ms, Euclidean center distance × 48ms)                 |

The source stroke-dashoffset proposal conflicts with the transform/opacity-only rule.
This review uses a transform reveal with two fixed axes; no dash offset, path, mask,
shadow, gradient, filter, border or color animation. Existing star glow/shadow styling
stays static. No React, Framer or motion dependency. Hint is a target ring rather than
a faded tentative star. The screen specimen demonstrates motion only; no new navigation
or alternate approved screen composition is introduced.

The owner's follow-up replaces the original 300ms dissolve cap with the preferred
four-times-slower proposal. Screen push now takes 560ms, matching the former half-speed
preview. This does not change the shared production sheet timing.

Pixel dissolve is now the default: 120ms opacity fades, shuffled delays spanning 840ms,
960ms total for every grid size. Larger cells subdivide into grid-aligned pieces so
5×5/6×6/8×8 have a texture similar to 15×15. Cell subdivision is ceil(15 / size):

| Size  | Pieces per cell | Total pixel tiles |
| ----- | --------------- | ----------------- |
| 5×5   | 3×3             | 225               |
| 6×6   | 3×3             | 324               |
| 8×8   | 2×2             | 256               |
| 15×15 | 1×1             | 225               |

Static clipped copies preserve the actual glyph/fill at full size behind each tile.
Only tile opacity animates; no raster generation, asset edits, animated clipping,
canvas or particle simulation. Original cell nodes remain in place. Tiles have no
cell index, role or tab stop, and are aria-hidden. Copies and hidden-source classes
are removed on completion/cancel/replay/reduction/disposal. Seed 42 is reproducible;
replay increments the seed for a fresh pattern. Controls expose the initial seed.

Comparison variants retain random whole cells and the prior center stagger. At the
preferred timing the center reference totals 615.76 / 649.71 / 717.59 / 955.18ms for
5/6/8/15. It was always the same algorithm at both densities; smaller cells made the
dense version look finer. Default fine pixels keep the new random effect consistent
across densities. The story-only timing ceiling is now 1200ms, superseding the old
source cap by explicit owner preference.

The read-only preview clears mock marks as one Phase 3 restart snapshot after the
sequence. Undo restores it. It does not generate/select a new puzzle. Replay cancels
old pending completions; no timer, toast or input lock is introduced.

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
  Light Dark Comparison, Proposed Timing, Random Cells and Center Reference. Size Controls apply to board dissolve.

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

## Playback controls

The default 1× now means the owner's preferred proposal: 560ms screen push and 960ms
random pixel dissolve. Quarter/half playback remain available for closer inspection,
relative to those new baselines. Reduced motion stays immediate. Mark, X, erase and
hint timing values are unchanged. MarkPlacement targets the top-left cell.

Random pixel rendering and its maximum 324 mask copies still need physical Android
performance and visual acceptance; unit tests do not establish frame rate. Review
fine pixels versus random whole cells before accepting the final dissolve style.
