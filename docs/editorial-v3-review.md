# Grim & Glimmer — Editorial V3

Phase 1 of the puzzle screen, navigation and visual polish brief.
Review in **Projects → Grim & Glimmer — Editorial V3**.

The existing Grim & Glimmer project is the current baseline. V3 is opt-in through its own
theme and project CSS. No app dependency or existing component is changed.

## Review

- **Current versus proposed → Light Dark Comparison**: current and proposed action styles in both modes.
- **Foundations → Light Dark Comparison**: typography, surfaces, controls and icon vocabulary.
- **Buttons**, **Toggle**, **Icon**: each has a playground and Light Dark Comparison.
- Toggle Animations off to review motion-free controls. OS reduced motion takes precedence.
- Switches use native button keyboard behavior with switch semantics and visible focus.
- Icons are interim hairline drawings behind one name map, with slashed off states.
  The Phase 2 marker controls must use the approved board artwork through this abstraction.

## Implementation

Import JS from `@nightlogue-llc/ui-components/projects/grim-glimmer-v3`,
plus shared styles, `themes/grim-glimmer-v3.css`, and `projects/grim-glimmer-v3.css`.
Use `data-nl-theme="grim-glimmer-v3"` and the
`nl-grim-glimmer-v3-foundations` scope. Existing bundled fonts are reused through a
local CSS import; no additional font downloads or dependencies.

Reuses the color contract, typography roles, spacing and shared Button.
The existing control radius token is 4px in V3; a surface radius hook is 12px.
New project hooks cover decorative hairlines, editorial label color, button ink and oxblood.
Decorative rules are faint; interactive boundaries retain 3:1 contrast.
Gold labels and flat gold button text have explicit 4.5:1 tests. Light labels use #89662C;
the suggested #8F6B2F measured 4.36:1 on cream and did not pass AA.
The proposed colors are scoped and do not recolor existing stories.
Shadows are absent from V3 surfaces and actions.

## Separate review phases

1. Foundations (this PR).
2. Puzzle screen: header, square controls, centered board, frame/grid/clues.
3. Game menu sheet: shared setting callbacks, difficulty, actions, dismissal gestures and back handling.
4. Navigation: Home/Settings tabs, conditional Stats, focused puzzle mode, Settings page.
5. Completion and dialogs: sequence, sheet, confirmations and haptics.
6. Home polish: hairline thumbnails and In the works cards.

Each phase receives its own PR and component light/dark stories. App wiring follows visual approval.

## Decisions before Phase 2

The brief requests a placeable Spire tool; the current puzzle has fixed spires, player stars
and X exclusions. Confirm the intended second tool before wiring gameplay semantics.
The brief requests only two radii but gives the board a 2px radius; settle the board exception
during its visual review. Cormorant Garamond clue typography is deferred to the board phase;
Phase 1 reuses the bundled Cormorant families.

## Validation limits

Automated tests cover theme boundaries, contrast, switch transitions, disabled behavior,
icon semantics and existing library behavior. Browser/phone visual acceptance is a separate review.
No native Android back, sound, music or haptic implementation is claimed in this foundation phase.
