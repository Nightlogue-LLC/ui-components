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

## Frameless follow-up

- All sizes default to no card border, padding, background or shadow. The DOM
  composition wrapper remains for shared accessible clues; it paints no card.
- Grid perimeter alone is 1px `--hairline-strong`, radius 8px. Warm shadow is
  `0 12px 28px -18px`; top highlight is inset over the cell paint. There is no
  inset perimeter hairline or ornament.
- `framed: true` restores the 24px card with 16px padding for 5×5–8×8.
  Dense boards ignore this option. The old self-referential padding variable
  has been removed; the optional framed layout now has explicit real padding.
- Page margins 8px each side, respecting larger safe-area insets. Clue gutter
  24px for all sizes, including superscript space; no extra inter-gutter gap.
- Clue type follows 32% of the actual cell width, clamped to 10–20px.
  CSS container units follow the board content box, so framed, narrow and
  height-constrained previews scale with their own grids. Superscripts follow
  half the clue size, clamped to 7–10px, remain 1px from the number and center
  the combined number/marker group. Clue overflow stays visible. This budgets the complete group
  inside the 24px row gutter and leaves space between neighboring column groups.
  Pixel geometry still requires browser/device acceptance.
- 5th/10th dividers now use 32% ink. Interior grid remains 20%.
- Satisfied clues use 55% opacity and a diagonal strike instead of a check,
  per the latest owner revision. Over-count color and exclamation stay unchanged. Tentative outline, occupied fills and filled stars
  remain from the prior revision. No production tokens or original assets change.

## Calculated dense sizing

Zero safe-area insets; height does not constrain these viewports.

| Viewport | Composition width | Grid  | Cell      |
| -------- | ----------------- | ----- | --------- |
| 393×852  | 377px             | 353px | 22.4667px |
| 360×780  | 344px             | 320px | 20.2667px |

Formula: composition = width − 16; grid = composition − 24 clue gutter;
cell = (grid − 2 perimeter borders − 14 internal gaps) / 15.
The requested approximate 23.5px target at 393px does not fit these margins and
clue gutter; it needs 408.5px viewport width. A 23px cell needs 401px.
Zoom remains Phase 3. These are calculated budgets, not browser measurements.

## Updated review stories

Under **Projects / Grim & Glimmer / V4 / Board**:

- Grid: updated 5×5, 6×6, 8×8, 15×15; All Sizes Light Dark; Framed Small Board
  and a framed control for optional small-board restoration.
- Frame review / Before After: actual framed reference versus frameless board,
  both modes and 6×6/15×15. Historical dense padding appears only in the labelled
  reference, never as a current dense option.
- Frame review / Corner Crops, Tentative Corners, Hint Corners: each grid corner
  at 6×6 and 15×15 in both themes, magnified 3×. The crop anchors to the actual
  grid edge rather than the former card or clue gutter. Grid width is 353px,
  matching the 393px layout. Separate specimens expose placed/outline/hint clipping.
- Cell and satisfied crossed-out Clues stories remain available in both modes.

## Android back gesture device acceptance

8px page margins reduce available edge spacing. The right outer column is 8px
from the viewport edge; the left outer column has the extra 24px clue gutter.
System back recognition may compete with future drag-paint. No Android gesture
exclusion zones or platform behavior changes are introduced by this prototype.

- [ ] On physical Android with gesture navigation, start a drag-paint on the
      outermost column from **both edges**. Check intended paint versus accidental
      Back, correct cancellation and no stray marks. Repeat in light/dark, portrait
      and representative board sizes once Phase 3 drag-paint exists.
- [ ] For this Phase 1 preview, check outer-column taps/press/release and Back
      cancellation; drag-paint is not implemented yet.
- [ ] Check all corner crops and superscript alignment on device; no clipping,
      collision or attribution to neighboring row/column clues.

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

## Cell-proportional clue follow-up

The viewport-based 12px cap is replaced with board-container sizing. At a 393px
viewport the calculated clue font sizes are 20px (5×5), 18.45px (6×6), 13.76px
(8×8), and 10px (15×15). The 24px gutter, board width and dense cell budgets do
not change. The upper cap reserves room for the superscript; the lower cap keeps
dense clues readable. Both themes share this sizing rule. Browser/device visual
acceptance remains pending; Phase 2 has not started.

## Satisfied clue follow-up

Satisfied numerals now dim to 55% opacity and carry a thin diagonal slash through
that numeral. No checkmark is rendered, and no superscript space is reserved for
satisfied state. The spoken satisfied status, including zero, is retained.
Over-count terracotta and superscript exclamation remain unchanged. The latest
owner request supersedes the prior full-contrast satisfied treatment.
