# V4 Phase 2 — controls review

Issue #35, epic #33. Based on merged Phase 1 main `f171be4cd8cfdc072a24e6f041db5f403065b917`.
Storybook-only proposal; Phase 3 and app adoption are not started.

## Audit and reuse

| Source                                      | Reuse / decision                                                                                       |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `src/components/icon-button/`               | Native disabled behavior, accessible names, theme focus styles; additive scoped V4 square presentation |
| `src/components/button/`                    | No extra action after toast removal                                                                    |
| `src/components/icon/`                      | Existing Phosphor light hint, exclude, undo and restart map; no new icon dependency                    |
| `src/projects/grim-glimmer/assets/star.svg` | Existing filled star mask unchanged                                                                    |
| `stories/projects/grim-glimmer-v4/board.ts` | Approved Phase 1 board in read-only mock fixture                                                       |
| Existing tokens and `stories/lib/stage.ts`  | Canonical Moonlit roles and light/dark comparisons                                                     |

No src/, package/dependency, production token, V3 screen, app, engine or saved data changes.
New story-only factories/CSS live in `stories/projects/grim-glimmer-v4/controls.*`.
The existing Button/IconButton APIs and defaults remain unchanged.

## Presentation and behavior

- Left: Star and X. Right: Undo, Hint, Restart. No Redo. Undo is a V4 preview proposal,
  not restoration of a production control.
- Every control has a 56px hit target with an inset 52px square visual and 8px gaps.
  Five targets plus four gaps require 312px. The 360px fixture has 344px available,
  leaving a 40px gap between the groups (8px minimum plus 32px slack);
  at 393px the gap is 73px. Targets do not overlap
  by this CSS budget. Pixel/device acceptance is still pending.
- Selected indicator: 1.5px current-theme accent ring, 8% accent fill. It moves 64px
  using a 220ms CSS transform transition. No framework dependency or spring runtime.
- Shared icons map Undo → arrow-u-up-left, Restart → arrow-counter-clockwise,
  Hint → lightbulb. Retain the approved shared Phosphor light silhouettes rather than
  substituting Lucide artwork or restroking filled paths. They are optical light assets,
  not a new exact 1.5px SVG stroke contract. The star remains the approved solid glyph.
- Hint states: available (accent dot and accessible label), idle, disabled.
  The hint request is an Actions callback, not a real hint or monetization policy.
- Button press scales to .97 over 90ms. Indicator/press animate transform only.
  OS reduced motion removes transitions and press movement; Reduced Motion stories
  offer an explicit preview override. Bottom padding uses max(safe-area, 16px).
- Both native toggle buttons expose aria-pressed. Tab/Shift+Tab, Space/Enter remain
  native; arrow keys/Home/End provide optional group selection without role changes.
- One injected selection-tick callback, gated by the story preference, logs to Actions.
  No native haptics call. Same selected tool does not repeat the tick.

## Restart and history

The owner removed the toast after review. Restart stores one mock snapshot and
clears player marks, retaining fixed spires. The existing row Undo restores the
snapshot; selected tool and keyboard focus persist. No confirmation dialog, toast,
countdown, timer, toast slot or additional Undo action remains. A quiet existing
status summary announces mark/history changes without stealing focus.
Phase 3 supplies the integrated interaction/history model; no persistence change.

## Stories

`Projects / Grim & Glimmer / V4 / Controls`:

- ControlRow: Playground, No Undo, Hint Disabled, Hint Idle, Disabled, Haptics Off,
  Light Dark Comparison, Interaction Demo, Reduced Motion.
- ToolToggle: Star Selected, Exclusion Selected, Disabled, Light Dark Comparison,
  Keyboard Demo, Reduced Motion.

Use the existing 393×852 / 360×780 viewport presets and theme toolbar. Actions log
selection ticks, tool/hint requests and mock history actions. Browser play demos
exercise tool switch, hint, restart, row Undo and keyboard selection.

## Validation and remaining acceptance

Focused tests cover selection/keyboard, preference gating, disabled actions, hint
states and exact one-snapshot restore with preserved spires/tool/focus. Run full
lint, formatting, TypeScript, tests, library/package checks and Storybook build.
A static build does not execute browser play functions.

- [ ] Comparable light/dark screenshots, mobile hit-target geometry and no overflow
      at 393×852 / 360×780. Local browser capture remains blocked by the prior Chromium
      socket permission failure; no screenshots or physical-device performance claimed.
- [ ] Owner acceptance of control density, CSS timing, available-hint dot.
- [ ] Check screen-reader announcement and keyboard focus on device.

No new token conflict: canonical Moonlit values remain the default; selection fill
uses the existing accent, not the source document's approximate literal #5E1F33.
The CSS timing replaces the proposed Framer spring by the owner's accepted
architecture choice. Browser screenshots and integrated Phase 3 history remain
pending. Stop after this phase; do not merge automatically.
