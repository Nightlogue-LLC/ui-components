# V4 Phase 6 — overlay review

Issue #39; epic #33. Based on merged main `705f38524eae0ef66bc59035d5e0aeeb3842432d`.

Storybook-only proposal. No src/, production token, V3 composition, package/dependency,
app, engine, native plugin, artwork or save-data edits. Phase 7 and production adoption
are not started. All preferences, navigation, New Game and haptics are local mocks;
there is no audio engine or persistence in these stories.

## Audit, reuse and affected consumers

| Existing implementation                             | Phase 6 reuse / impact                                                                                                                                                                                 |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/components/button/`, `icon-button/`, `icon/`   | Shared action variants and approved iconography; no API changes.                                                                                                                                       |
| `src/components/segmented-control/`                 | Controlled native radio groups for appearance and difficulty. In-place updates retain focus.                                                                                                           |
| `src/components/bottom-sheet/`, `dialog/`           | Actual shared native modal, body/actions slots, focus return, Escape, backdrop and matching entry/exit. Existing defaults intact.                                                                      |
| `src/core/motion.ts`                                | Shared 280ms sheet motion and easing, reduced-motion gate. No independent slide-up keyframes.                                                                                                          |
| `src/projects/grim-glimmer/menu-sheet.ts`           | Existing modal focus loop, background inert state, Escape/Back, stable two-icon holder and close/open lifecycle. Story-only top-right positioning/motion replaces its local bottom-sheet presentation. |
| `src/components/bottom-nav/`                        | Shared compact icon-only navigation on the Settings fixture. Routes are Actions callbacks.                                                                                                             |
| `src/projects/grim-glimmer/guided-tutorial.ts`      | All original lesson rendering, mini boards, focus and practice gating. No parallel tutorial engine.                                                                                                    |
| `stories/projects/grim-glimmer/tutorial-lessons.ts` | Eight existing authored lessons retained; still a dependency of V3 Tutorial. Do not delete or migrate that file silently.                                                                              |
| V4 `board.ts`, `controls.ts`, `motion.ts`           | Previously reviewed board/control backdrop and transform/opacity hint pulse. Background controls are deliberately disabled in this overlay fixture.                                                    |

One missing reusable pattern was a switch: the proposal uses a native labelled
checkbox with role=switch, a 44×26 track and a 56×44 input target within a minimum
56px row. It lives in `overlay-primitives.ts`, not src/. Promote it to the shared
library only after visual approval. This avoids changing the production settings API.
The small story-only sheet facade owns handle gesture policy; it delegates actual
modal opening, closing and motion to the shared component.

## Stories and controls

- `Projects/Grim & Glimmer/V4/Sheets/GameMenu`: playground, reduced motion,
  light/dark comparison, open/close/reopen and keyboard/switch play demo.
- `.../Sheets/Difficulty`: playground, reduced motion, light/dark, tall content,
  select/start and help/return/drag-dismiss play demos.
- `.../Settings/Settings`: playground, reduced motion, light/dark and theme/switch demo.
- `.../HowToPlay/Modal`: playground, reduced motion, light/dark, three-tap practice gate
  and direct two-finger zoom guidance entry.

Controls expose difficulty, initial lesson, long content, motion and mocked preferences.
The Actions panel receives tick, preference, route, tutorial and New Game callbacks.
Review buttons explicitly open overlays; none opens on mount. Simulate Back dispatches
modal cancel or closes the menu, avoiding writes to Storybook's browser history.

Settings System follows the actual OS color scheme and listens for changes. Light and
Dark are explicit local preferences. The Settings comparison sets one local preference
per pane so OS System cannot make both sides the same. Settings manages its own theme;
use its segment rather than the toolbar for that standalone fixture. Other fixtures
inherit the normal theme toolbar. Theme changes never touch the document root.

## Resolved source differences

| Source proposal                                         | Review implementation / reason                                                                                                                                                                                                                |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dark glass, 20px blur/saturation, rgb(16 9 12/.5) scrim | Opaque canonical Moonlit Oxblood surfaces and approved Phase 5 warm rgb(26 10 16/.38), no backdrop/board blur. Shared approved visual direction wins over conflicting source effects.                                                         |
| Spring stiffness 420 / damping 38                       | Existing restrained 280ms sheet entrance/exit. No React, Framer Motion or new dependency. Handle rebound uses 180ms shared easing; opacity/transform only.                                                                                    |
| Easy / Medium / Master                                  | Easy / Medium / **Hard**, matching current game naming. No gameplay/difficulty redefinition.                                                                                                                                                  |
| One sheet presentation for all overlays                 | Game menu is a top-right popover (.92→1 scale + opacity, 160ms, matching exit). Difficulty is a bottom sheet on mobile, shared centered dialog on desktop. How-to is a centered dialog. Phase 5 victory remains unchanged, without a grabber. |
| Visual Step 1 of 8                                      | Nine noninteractive progress dots, including the added zoom lesson. A live accessible current/total label remains. All eight original lessons and their order are retained around the insertion before Ready.                                 |

No palette changes. All surface, text, border, accent, focus and on-accent colors use
existing Moonlit Oxblood roles. New literals are limited to the reviewed scrim and warm
shadow depths. No changes to approved Phase 4 dissolve/push timings or glyph silhouettes.

## Gesture, accessibility and lifecycle contract

- Difficulty: mobile top radius 28px, real handle, safe-area actions, fixed overlay;
  tall body scrolls independently through the shared flex/min-height:0 body.
  At desktop widths retain shared responsive modal placement and matching motion.
- Handle-only drag; upward elasticity 0.1. Dismiss for downward distance **>120 CSSpx**
  or average downward velocity **>500 CSSpx/s** with at least **24 CSSpx** travel.
  Velocity uses distance from pointer-down divided by elapsed time. Small fast taps
  cannot dismiss. Cancel/lost capture snaps back; content scrolling does not dismiss.
- The source spring is not emulated. Native and pointer feel require device review.
- Shared native dialog handles modal focus, Escape/cancel, backdrop pointer-origin
  guard and restoration. The native modal is the supported Android/WebView path;
  the existing non-native dialog fallback has no focus trap. It is unchanged.
- Shared application Back integration remains available in production APIs. These
  previews intentionally do not push browser history; Simulate Back exercises the
  cancel path. Actual Android Back/system-bar behavior is outside this phase.
- Menu same-icon close, Tab loop, background inert state and focus return are reused.
  Navigation waits for the story exit. Reopen/removal invalidates queued navigation
  and animation completions, preventing stale callbacks.
- Tutorial keeps its isolated three-tap practice gate, lesson focus and safe text
  rendering. Dots report progress, not navigation. Inherited animated box-shadow is
  suppressed only in V4; reuse the Phase 4 transform/opacity hint ring instead.
- Reduced motion disables popover/sheet/switch/tutorial entrance and hint movement,
  through the shared OS gate and explicit review option. Static outlines remain.
- Unmount removes media listeners, tutorial observer/pulse, menu listeners, active
  modals, drag capture and pending navigation. No preference writes survive remount.

The zoom lesson says **two fingers zoom and pan on 15×15**, one finger places marks,
and Reset view restores the board. It is a gesture illustration, not a new zoom engine.
Optional directional controls for every grid at base zoom remain tracked in
`Nightlogue-LLC/gothic-cozy-puzzles#42`; no nonfunctional settings switch is added here.

## Validation and owner review

Focused tests cover menu toggle/focus/Tab/Back, preference haptic gating, theme scopes
and live System changes, difficulty/help selection retention, gesture thresholds,
cancel/body scroll isolation, tutorial practice/progress, shared matching motion,
rapid reopen suppression and disposal. Story play demos are included but require a
real browser to execute; passing Vitest does not imply browser play passed.

Run `npm run check` for lint, Prettier, TypeScript, all unit tests, library build,
package smoke check and static Storybook catalog/build. Record final counts in the PR.
No production application build is applicable: no application files changed.

Comparable screenshots and physical Android validation are pending. Browser capture
is unavailable in this session; no claim of measured frame rate or pixel acceptance.
Use the existing 393×852 and 360×780 viewport presets for this checklist, in both modes:

- [ ] Capture game menu closed/open, difficulty, tall difficulty, Settings, tutorial practice and zoom lesson.
- [ ] Rapid ⋮ open/close/reopen: no white icon background flash or stale route.
- [ ] Open/close sheets from a stable page: no page jump, new scrollbar or scroll-position change.
- [ ] Drag handle slowly past 120px; short fast swipe past 24px; cancel/upward drag; scroll tall body.
- [ ] Close via X, backdrop, Escape, Simulate Back; focus returns to the opener. Check actual Android Back during later app adoption.
- [ ] Toggle each switch with touch/Space, switch themes, check visible focus and 56px row targets.
- [ ] Complete all three practice taps; verify Next gate and all nine progress dots.
- [ ] Review light/dark at both widths, large text, safe areas and reduced motion; no clipping.

Stop for owner review before Phase 7, merge or any production adoption.
