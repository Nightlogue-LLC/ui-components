# V4 Phase 1 — board review

Issue #34; tracking epic #33. Audited library main:
`2f8267a0022d033d688dbb9a6ae2259f1b162bb0`.

## Audit and reuse

| Existing source                                     | Reused                                                                                       |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `src/projects/grim-glimmer/board.ts`                | DOM factory, fixed-cell guard, state updates, accessible cell/clue descriptions              |
| `src/projects/grim-glimmer/grim-glimmer.css`        | SVG masks and existing tentative/X treatment; V4 overrides are scoped inside the new fixture |
| `src/projects/grim-glimmer/assets/{star,spire}.svg` | Unchanged artwork, including view boxes                                                      |
| `src/themes/moonlit-oxblood/moonlit-oxblood.css`    | Current theme and font roles, occupied fills, default palette                                |
| `stories/lib/stage.ts`, `.storybook/preview.ts`     | Existing theme toolbar and light/dark comparison layout; two additive viewport presets       |

New composition factories and CSS live only in
`stories/projects/grim-glimmer-v4/`. They are excluded from the library package
and application. No `src/` files, package dependencies, existing component APIs,
V3 compositions, glyph assets or production tokens change. The catalog guard
now accepts both V3 and V4 and requires the new board stories.

The repository is plain TypeScript DOM factories with HTML Storybook, not React.
Phase 1 needs no React or Framer dependency. It introduces no animation or native
haptic side effect. Activation is a Storybook Actions callback; the haptics
adapter and animated hint ring belong to later phases.

## Stories and review controls

Under **Projects / Grim & Glimmer / V4 / Board**:

- **Cell**: Playground and Light Dark Comparison; five cell states plus hint and
  conflict specimens.
- **Grid**: Grid 5x5, Grid 6x6, Grid 8x8, Grid 15x15, Proposed Palette,
  Light Dark Comparison and Interaction Demo.
- **Clues**: Default, Satisfied Including Zero, Over Including Zero,
  Full Contrast Satisfied and Light Dark Comparison.

Use the existing Mode toolbar and the new **V4 mobile 393 × 852** / **V4 mobile
360 × 780** presets. Controls expose current/proposal palette, size, static star
glow, momentary guides, satisfied dimming, interactive/read-only, conflict and hint.
The interaction play function demonstrates tentative → confirmed → empty.
All states, clue counts and conflicts are illustrative mock reports, not puzzles.

## Token reconciliation

**Current** is the default. The proposed values are isolated `--gg-v4-*` variables
on the opted-in fixture. No `--nl-color-*` declarations are overwritten.

| Role       | Current light → proposal | Current dark → proposal |
| ---------- | ------------------------ | ----------------------- |
| Background | #EFEBE6 → #EEEAE6        | #120C0E → #0F0B0D       |
| Surface    | #F8F5F1 → #F6F4F1        | #1C1417 → #181214       |
| Ink        | #170F12 → #14090E        | #EFE8E2 → #F3E9ED       |
| Accent     | #681F35 → #5E1F33        | #B87A8C → #C98A9E       |
| Star       | #681F35 → #5E1F33        | #F4F0F2 → #FFF4F8       |
| Spire      | #170F12 → #2B1D22        | #B87A8C → #B98294       |
| Error      | #B83A22 → #B3263E        | #E5533A → #E5738A       |

Both variants retain the approved occupied fills: light spire #E1DAD5, star
#EAD8DE; dark spire #332329, star #3B202A. X/empty remain bare. The source did not
specify replacement occupied-fill tokens. Dark proposal hairlines use the supplied
14%/32% rose roles; grid lines retain 20%/38% ink. New ink-dim/surface-2 roles
are not added in this phase because no Phase 1 component needs them.

## Sizing decision and measured limits

These are **calculated CSS budgets**, not browser or physical-device measurements.
Zero safe-area insets are assumed; insets can reduce the available space further.

| Viewport | Board | Card width | Cell width |
| -------- | ----- | ---------- | ---------- |
| 393×852  | 5×5   | 369px      | 59.2px     |
| 393×852  | 6×6   | 369px      | 49.17px    |
| 393×852  | 8×8   | 369px      | 36.63px    |
| 393×852  | 15×15 | 369px      | 19.87px    |
| 360×780  | 5×5   | 336px      | 52.6px     |
| 360×780  | 6×6   | 336px      | 43.67px    |
| 360×780  | 8×8   | 336px      | 32.5px     |
| 360×780  | 15×15 | 336px      | 17.67px    |

Budget: 24px outside, two 1px card borders, 16px padding on small boards / 10px
on 15×15, 28px clue gutter plus 4px gap, two 1.5px grid edges, 1px internal gaps.
Dense 23px cells need **440px width** with these dimensions. The supplied target
cannot fit at 393px or 360px without changing the frame/gutter budget or adding
zoom/overflow. This preview preserves the requested frame and fits the screen.
Phase 3 owns zoom; it is not silently implemented here. Small dense cells are
not claimed to satisfy a 44px touch-target requirement.

## Presentation and accessibility

- 24px frame, 14px grid, inset hairline at 4px and four ornaments consisting of
  a 10px arc plus a tiny 4-point star. Dense dividers cover the boundary gaps at
  rows/columns 5 and 10 without adding children to the shared board grid.
- Spire/star silhouettes remain unchanged, scaled to 78%/70%. Dark star glow
  and radial cell glow are static and can be disabled. No board backdrop blur.
- Depth uses warm black instead of the source's literal #000, following its
  warm-shadow-only instruction. No shadows or filters are animated.
- Active row/column tint exists only during a press. Release, cancellation,
  capture loss and focus exit clear it. No production crosshair change.
- Conflicts use a 1px inset error ring and spoken label, no error fill.
- The hint target is a static ring pending Phase 4; it is not a faded star.
- Clues retain spoken required/confirmed/status descriptions. Visible check/!
  markers make state independent of color. Only the satisfied numeral dims;
  the check remains opaque. Full Contrast Satisfied is the alternative.

Calculated base-fill contrast (before optional decorative glow):

| Variant        | Confirmed star | Spire   | 50% tentative star | 35% satisfied numeral |
| -------------- | -------------- | ------- | ------------------ | --------------------- |
| Current light  | 8.37:1         | 13.64:1 | 2.59:1             | 1.98:1                |
| Proposal light | 8.94:1         | 11.67:1 | 2.64:1             | 2.00:1                |
| Current dark   | 13.04:1        | 4.39:1  | 4.38:1             | 1.73:1                |
| Proposal dark  | 13.71:1        | 4.73:1  | 4.54:1             | 1.87:1                |

Confirmed glyphs exceed 3:1. The requested numeral dimming and existing light
tentative opacity do not meet normal contrast targets. They remain explicit
review proposals, with a full-opacity satisfied alternative, not accessibility
acceptance claims.

## Validation and pending review

Focused tests cover the sizing limits, all board densities, fixed-cell behavior,
in-place state changes/focus, stale conflict cleanup, transient guide cleanup,
read-only behavior and zero-clue status descriptions. Storybook includes a play
demo, but a static Storybook build does not execute its browser interactions.

Local Chromium exits before page capture with
`process_singleton_posix.cc: socket() failed: Operation not permitted`. Browser
play execution, actual mobile layout measurements, comparable screenshots and
physical Android rendering remain pending. Unit tests do not establish pixel
layout or physical-device performance. No workaround or browser permission
change is included in the repository.

Owner decisions after review: current versus proposed palette; acceptable dense
fit size versus a revised size budget; full-opacity satisfied clues versus the
requested dim; optional static star glow. Later-phase motion and gestures remain
tracked separately. Stop after Phase 1; do not start Phase 2 or adopt V4 in the app
without the next review instruction.
