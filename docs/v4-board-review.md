# V4 Phase 1 — revised board review

Issue #34; epic #33. Original audit main: `2f8267a0022d033d688dbb9a6ae2259f1b162bb0`.
This revision follows the owner's physical Android review. Phase 2 is not started.

## Reuse and scope

| Source                                              | Reuse                                                                        |
| --------------------------------------------------- | ---------------------------------------------------------------------------- |
| `src/projects/grim-glimmer/board.ts`                | DOM factory, accessible cell/clue labels, fixed-cell guard, in-place updates |
| `src/projects/grim-glimmer/grim-glimmer.css`        | Shared cell semantics, X treatment and shipped glyph masks                   |
| `src/projects/grim-glimmer/assets/{star,spire}.svg` | Original files unchanged                                                     |
| `src/themes/moonlit-oxblood/moonlit-oxblood.css`    | Default palette, fonts and occupied fills                                    |
| `stories/lib/stage.ts`                              | Light/dark comparison                                                        |

All revised presentation lives under `stories/projects/grim-glimmer-v4/`.
No src/, dependencies, production tokens, V3 compositions or app files change.
Current Moonlit remains the default; the prior scoped proposal comparison remains available.
No production adoption, native haptics or motion was added.

## Revised frame and cells

- Removed ornaments and inset inner hairline from every current board.
- Single 1px outer border uses the local `--hairline-strong` alias of the existing
  V4 edge role. Grid perimeter uses that exact role at 1px.
- Outer radius 24px. Grid radius is `24px - card padding`: 8px for small boards,
  18px for dense boards. Both the grid and wrapper clip their contents.
  Isolated Cell specimens use the same clipped 1px perimeter and 8px radius.
- Original inset top highlight and warm shadow depth retained unchanged.
- Dense padding 6px, page margins 12px each, clue gutter 22px plus 4px gap.
  Interior 1px gaps and 5th/10th dividers remain.
- Tentative stars use a fully opaque accent outline, derived from the exact
  original path in a story-only stroke mask (`tentative-outline.svg`). Original
  approved artwork is unchanged. The mask view box has 8-unit breathing room
  to avoid clipping the 12-unit stroke. Placed stars retain the filled mask.
- Tentative outline uses oxblood in light and the existing rose accent in dark.
  This follows the mode's oxblood system rather than a low-contrast literal dark red.
- Full-contrast satisfied numerals use accent plus check. Over-count uses
  story-only terracotta #A44832 / #E49A80 plus exclamation mark.
  Both markers are anchored to the numeral span, 1px beside it, as superscripts.
  The 35% rule and control are removed entirely.

## Calculated dense sizing

Zero safe-area insets; height does not constrain these two viewports.

| Viewport | Card  | Grid  | Cell      |
| -------- | ----- | ----- | --------- |
| 393×852  | 369px | 329px | 20.8667px |
| 360×780  | 336px | 296px | 18.6667px |

Formula: card = width − 24; grid = card − 2 outer borders − 12 padding − 22 gutter − 4 gap;
cell = (grid − 2 perimeter borders − 14 internal gaps) / 15.
A 23px cell now requires 425px viewport width. Zoom remains Phase 3.
These are computed budgets, not a claim of browser or touch-target acceptance.

## Stories

Under **Projects / Grim & Glimmer / V4 / Board**:

- Grid: existing 5×5, 6×6, 8×8, 15×15 and theme controls updated;
  All Sizes Light Dark renders every size in both modes.
- Frame review / Before After: archival pre-revision frame schematic beside the
  actual revised 6×6 board, light/dark. The schematic is labelled and is not a
  device screenshot or a second current board implementation. Its historical
  strokes appear only in this explicitly requested before reference.
- Frame review / Corner Crops: all four corners at 6×6 and 15×15, light/dark,
  magnified 3× at a 369px card width. Occupied corner cells expose fill clipping.
- Cell / Tentative Placed Comparison remains visible in both modes, alongside
  existing individual states, conflict and hint examples.
- Clues / Full Contrast Satisfied remains; zero satisfied/over examples remain.

## Phase 2 proposal — CSS sliding indicator

Recommend CSS-only for a two-position tool-toggle indicator. A single positioned
indicator can translate between segments using transform and a shared transition;
reduced-motion can remove that transition. Keep input state and keyboard semantics
in the existing TypeScript pattern. No new implementation in this revision.

Bundle note: CSS adds zero JavaScript dependency bytes. This repository uses plain
DOM/HTML Storybook and has no React runtime. Framer Motion would introduce a new
framework integration and runtime cost for one indicator. An exact compressed
bundle delta would require an integration build; none was installed or measured.
Reassess a motion dependency only if later phases need coordinated interruption
or sequencing that the existing motion primitives cannot handle cleanly.

## Validation and limits

Run the full repository check: lint, formatting, TypeScript, unit tests, library
build, package checks and Storybook build. Focused tests cover sizing, fixed cells,
state cycles/focus, transient guides and anchored zero-clue status semantics.
Local Chromium previously failed before capture with a socket permission error;
this revision does not claim rendered screenshots or browser geometry validation.
The new corner crops are executable review stories, not captured images.
Physical Android visual acceptance remains with the owner. Stop for review.
