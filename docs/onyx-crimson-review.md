# Onyx & Crimson — screen palette review

Light background approved as **#F5F5F5**. Its only source is --nl-color-bg;
surface and button text reference that token. Dark A uses background for every surface.
Dark B uses #003049 for cards, boards, menu sheets, settings groups and completion dialogs.
All other requested RGB and alpha values remain exact. No default or old theme was removed.

Review **Projects → Grim & Glimmer — Editorial V3 → Onyx & Crimson**:
Home, Game Screen, Game Menu Sheet, Settings, Puzzle Complete, Light Dark Comparison,
All Variants and Contrast Audit. All Variants has a screen selector for side-by-side
Onyx, Moonlit Oxblood and original plum/cream comparisons.

These use the real library screen, card, board, settings, menu and success components.
Fixtures show fixed spires, confirmed stars, a maybe and exclusion; no puzzle engine runs.
Menu and completion are positioned as sheets within each preview, without a top-layer dialog
covering neighboring comparisons. Native dismissal and production integration remain later work.

Selected controls use 1.5px text borders. Red is restricted to star, ampersand, error underline
and ornaments. Buttons are solid ink/paper. Glyph masks preserve the approved silhouettes.

## Contrast audit

Text, muted text, spires, exclusion X and selected borders pass their required thresholds.
Primary button text passes 4.5:1. Red on light and Dark A passes 3:1.
Computed failures (alpha composited over each surface):

| Variant / surface   | Red star and error | Maybe at 45% | Hairline |
| ------------------- | ------------------ | ------------ | -------- |
| Light bg / surface  | Pass               | 2.25         | 1.55     |
| Dark A bg / surface | Pass               | 1.63         | 1.68     |
| Dark B bg           | Pass               | 1.63         | 1.68     |
| Dark B blue surface | **2.79**           | 1.30         | 1.73     |

No silent adjustments. Dark B's exact red/blue pair cannot meet 3:1; approval is needed
to change either color or put the red marks on background-colored areas.
Maybe marks require more opacity to meet 3:1. Decorative dividers are exempt from WCAG's
non-text criterion, but borders conveying essential information require stronger contrast.

Full audit: 42 pairs, calculated from theme CSS with alias resolution and alpha compositing.
Old generic accent-fill checks now test actual ink/paper primary controls for Onyx; the
separate Onyx audit reports red graphics without disguising the known failures.

## Review recommendation

Use Dark A as the leading candidate: confirmed crimson stars pass on its background,
and the flat surface treatment preserves the supplied colors. Keep Dark B as a comparison
until the red-on-blue pairing is resolved. Neither option is a new application default.

Before integration, distinguish tentative stars with a readable shape or stronger opacity,
and give essential grid boundaries a separate higher-contrast token. Faint decorative rules
can retain their supplied alpha. These are proposals; this preview preserves the exact values.

Completion currently uses the existing success component as a palette fixture. Its View board
action is not the approved final completion flow; the later redesign needs New game and
Return home actions with the X retaining dismissal.

Validation: the full check completed with 481 tests passing, including the Storybook build
and consumer package checks. The two Onyx test files passed again on continuation.
Browser acceptance is pending: local Chromium fails to create its process socket, and the
separate browser cannot reach the local preview server.
