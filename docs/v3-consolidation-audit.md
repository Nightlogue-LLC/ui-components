# Grim & Glimmer V3 consolidation — issue #15

## Baselines and authority

Audit: library `012a0be` (merged #28, dynamic completion sheet), app
`6447b49e42254b20867b9196f3af2d89ca7bf9b9`. The app pins library
`335b8227c3d299fcacfe61ebffc23bc4037c037c`, before the completion-sheet merge.

Moonlit Oxblood is the sole product theme. Its 13 color roles in each mode match
the issue brief. `src/themes/moonlit-oxblood/moonlit-oxblood.css` owns colors,
font roles, glyph colors, radii and button hooks. Neutral is a generic example.
The black/light primary-button surface hooks are deliberate merged V3 behavior;
the accent token is still oxblood/rose. Do not replace those hooks with gold.

Evidence: merged library #25 foundations, #26 production theme, #27 app shell,
#28 completion; `docs/editorial-v3-review.md`, `docs/moonlit-oxblood-review.md`,
`docs/app-shell-icon-audit.md`, `docs/guided-tutorial-review.md`, and the owner's
current issue brief. The brief resolves stale documentation that calls for
navigation labels: keep the compact icon-only Collection/Achievements/Settings bar.

V3 is a visual version, not a new public import path. The production components
remain under `src/projects/grim-glimmer/`; V3 screen fixtures already import them.
Deleting that folder would break the app and the V3 examples.

## Complete story inventory and disposition

All paths below are relative to the library root.

| Source                                                       | Baseline role                                                               | Disposition                                                                    |
| ------------------------------------------------------------ | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `stories/projects/grim-glimmer/Foundations.stories.ts`       | Earlier palette/type/card specimens                                         | Archive; current foundations are V3                                            |
| `stories/projects/grim-glimmer/Collection.stories.ts`        | Cards, wrapping and Home composition                                        | Keep card regressions, archive competing Home composition                      |
| `stories/projects/grim-glimmer/Gameplay.stories.ts`          | Interactive gameplay, dense 15×15 mock, board states                        | Keep as V3 Gameplay; mocks do not add production difficulties                  |
| `stories/projects/grim-glimmer/GameHeader.stories.ts`        | Current merged persistent menu toggle                                       | Keep as V3 component reference                                                 |
| `stories/projects/grim-glimmer/AppSettings.stories.ts`       | Current page and gameplay settings presentation                             | Keep as V3 Settings                                                            |
| `stories/projects/grim-glimmer/Achievements.stories.ts`      | Existing stub, no achievement engine                                        | Keep as V3 placeholder                                                         |
| `stories/projects/grim-glimmer/SuccessSheet.stories.ts`      | Approved centered completion and message bank                               | Keep as V3 Completion                                                          |
| `stories/projects/grim-glimmer/Dialogs.stories.ts`           | Mixed legacy tutorial/success/flow and current guided tutorial/confirmation | Extract current guided tutorial and confirmation; archive obsolete simulations |
| `stories/projects/grim-glimmer-v3/MoonlitScreens.stories.ts` | Palette fixtures using shipped components                                   | Keep as V3 screen comparison; correct stale nav and label controls             |
| `stories/projects/grim-glimmer-v3/Foundations.stories.ts`    | V3 foundation specimen                                                      | Current foundation; remove specimen-only button overrides                      |
| `stories/projects/grim-glimmer-v3/Buttons.stories.ts`        | Shared Button under project theme                                           | Keep as reusable themed specimen                                               |
| `stories/projects/grim-glimmer-v3/Icon.stories.ts`           | Delegates to shared Phosphor icons                                          | Keep as themed specimen; compatibility wrapper is not separate artwork         |
| `stories/projects/grim-glimmer-v3/Toggle.stories.ts`         | Experimental standalone switch                                              | Archive; current app uses labeled native checkboxes, no approved replacement   |

No V1-named story directory exists. Earlier V1/V2 presentations are mixed in the
unversioned project stories above. `shared.ts`, `board-glyphs.ts`,
`tutorial-lessons.ts`, V3 `screen-fixtures.ts`, `screen-fixtures.css`, `shared.ts`
and `moonlit-contrast.ts` remain fixture dependencies. Generic stories in
`stories/components/{actions,feedback,inputs,navigation,overlays,surfaces}` and
`stories/components/Icon.stories.ts` remain available for other projects.
`stories/reference-gallery.css` is historical, not a product theme.

Archived stories stay in git under an excluded archive directory for regression
recovery. They are not current designs or a second active Storybook section.

## Component inventory and affected dependencies

| Component          | Current implementation                                                      | V3 reference                               | Action                                                                             | Target location / affected consumers                            |
| ------------------ | --------------------------------------------------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Buttons            | `src/components/button/button.ts`, `.css`                                   | V3 `Buttons.stories.ts`                    | Keep; remove specimen-only shadow/disabled/ink overrides                           | Library; all project dialogs, menu actions, app `playScreen.ts` |
| Icon buttons       | `src/components/icon-button/icon-button.ts`, `.css`                         | `GameHeader.stories.ts`, shared IconButton | Consolidate dialog close through shared factory                                    | Library; Dialog/BottomSheet/tutorial/completion                 |
| Bottom sheets      | `src/components/bottom-sheet/bottom-sheet.ts`, `.css`                       | `SuccessSheet.stories.ts`                  | Keep shared dialog semantics; add matching exit and shared motion lifecycle        | Library; completion; generic BottomSheet stories                |
| Header-local sheet | `src/projects/grim-glimmer/menu-sheet.ts` and project CSS                   | `GameHeader.stories.ts`                    | Preserve persistent toggle/history/inert behavior; reuse shared motion primitive   | Library; app difficulty/New Game menu, Gameplay fixtures        |
| Dialogs            | `src/components/dialog/dialog.ts`, `.css`; project `dialogs.ts`             | guided tutorial and discard confirmation   | Keep centered presentation; deprecate old tutorial/success APIs without removal    | Library; app tutorial/reset/new-game confirmation               |
| Navigation         | `src/components/bottom-nav/*`, project `main-screen.ts`, `game-screen.ts`   | V3 Gameplay, Settings, app shell           | Keep icon-only shell; fix stale comparison fixture                                 | Library shell; app composes routes/pages                        |
| Cards              | `src/components/card/*`, project `collection-card.ts`                       | Collection card regressions                | Keep shared interactive Card; status Badge is not a nested CTA button              | Library; app `collectionV2.ts` supplies previews                |
| Inputs/selects     | `src/components/select/*`, `segmented-control/*`; project `app-settings.ts` | AppSettings and Game Menu                  | Keep in-app Select; native checkbox is intentional. Archive experimental V3 switch | Library; no app-native select replacement needed                |
| Puzzle controls    | project `game-screen.ts`, `board.ts`, `glyphs.ts`, project CSS              | V3 Gameplay and board states               | Keep library controls; move touch-hover correction from app into board styles      | Library presentation; app owns marking/session/count state      |
| Motion primitives  | BottomSheet CSS, Dialog CSS, menu toggle CSS, completion keyframes          | shared BottomSheet and Completion          | Consolidate sheet entry/exit timing/easing; retain distinct press/success roles    | Library; app boot readiness/fades remain app-owned              |
| Icons              | `src/components/icon/*`, V3 `icons.ts` compatibility export                 | shared Icons                               | Keep one Phosphor map, retain wrapper for consumers                                | Library; app `shared/ui/icons.ts` delegates                     |
| Settings toggles   | project `app-settings.ts` checkbox vs V3 `toggle.ts` switch                 | AppSettings is current                     | Document experimental switch deprecation; no silent UI replacement                 | Library; exported V3 toggle retained for compatibility          |

## App audit

App paths are relative to `Nightlogue-LLC/gothic-cozy-puzzles`.

| Screen/pattern      | Source                                                             | Difference and decision                                                                                                                              |
| ------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Collection          | `src/app/screens/collectionV2.ts`, `collection-v2.css`             | Uses shared cards/shell. Wordmark references old `src/app/v2/assets` crop; migrate references to approved public PNGs unchanged                      |
| Gameplay            | `src/app/screens/playScreen.ts`, `gameplay-v2.css`                 | Shared board/headers/controls/menu are current. App hover patch duplicates reusable board behavior; move it to library                               |
| Tutorial            | `src/app/screens/dialogFlowV2.ts`, `tutorialLessons.ts`            | Current guided tutorial already shipped; preserve local practice, lesson copy, seen key and modal presentation                                       |
| Completion          | `playScreen.ts` calls `createSuccessDialog`                        | App is behind merged #28; adopt SuccessSheet, message picker, New Game and Return Home                                                               |
| Settings            | `collectionV2.ts`, `playScreen.ts`                                 | Shared settings page/overlay with persistent header; not a bottom sheet. Preserve presentation                                                       |
| Difficulty/New Game | `playScreen.ts` + library GameMenu                                 | Current header-local sheet, Easy only. Preserve difficulty and replacement logic, no new screens                                                     |
| Splash/loading      | `src/app/boot/bootOverlay.ts`, `boot.css`                          | Approved public cat PNG and native handoff retained. Cat animation stays in #28                                                                      |
| Global cascade      | `src/main.ts`, `src/shared/styles/{fonts,tokens,global,gg-ui}.css` | Imports old fonts/colors/button CSS globally. Remove unused legacy imports from active entry; retain historical files/tests until consumers migrated |
| Legacy selection    | `src/app/screens/selectScreen.ts`                                  | Still routed at `#/puzzles`; inspect before retiring. Preserve route compatibility with collection rather than expose old list                       |
| Clue feedback       | `src/app/screens/clueFeedback.ts`                                  | App owns confirmed counts/conflict report and status data. Keep semantics and zero-clue behavior; theme colors already shared                        |

App-specific composition, puzzle engine, persistence, tutorial lessons, haptic
adapters, routing, native system bars and boot readiness belong in the app.
They are not duplicate generic controls. No source assets, glyph artwork, save
schema, engine, generator or platform resources should change.

## Original issue #15 reconciliation

Each original checklist group is recorded here; retain this history when replacing
the issue body with the V3 checklist.

| Original requirement                     | Classification                | V3 disposition                                                           |
| ---------------------------------------- | ----------------------------- | ------------------------------------------------------------------------ |
| Gold playable border/elevation           | Superseded                    | Shared Moonlit Card, no gold/glow                                        |
| Gold Continue/Play gradient pill         | Superseded                    | Current Card/Badge hierarchy; no nested CTA                              |
| Unavailable cards noninteractive         | Already completed             | Shared CollectionCard renders static unavailable cards                   |
| Debossed cream thumbnail                 | Superseded                    | Theme surface and shared preview                                         |
| Thin preview grid                        | Still relevant                | Inspect mobile regressions without changing glyphs                       |
| Decorative preview only                  | Already completed             | Preview mode, aria-hidden container                                      |
| Flavor descriptor per title              | Requires user visual approval | Optional copy/layout addition absent from approved composition           |
| Single-line descriptor fit               | Requires user visual approval | Depends on descriptor decision                                           |
| Anchored nav surface/divider             | Already completed             | Shared safe-area BottomNav                                               |
| Active indicator dot                     | Superseded                    | Keep current shared active line/Fill icon                                |
| Compact icon-only nav                    | Already completed             | App correct; comparison fixture stale                                    |
| Replace warning triangle with star       | Already completed             | Shared custom SVG glyph                                                  |
| Star vs spire clarification              | Already completed             | Star marks, fixed spires                                                 |
| Star/X cycle and clear                   | Already completed             | Existing session bridge; retain                                          |
| Satisfied gold clue                      | Superseded                    | Current theme accent/dimming                                             |
| Exceeded crimson background              | Superseded                    | Theme error and color-independent underline                              |
| Confirmed-star counts only               | Already completed             | App rule report                                                          |
| Zero/overfill/accessibility tests        | Already completed             | `clueFeedbackV2.test.ts` and library board tests                         |
| Gold active-cell glow                    | Superseded                    | No persistent tap marks; focus ring retained                             |
| Row/column crosshair                     | Superseded                    | No unapproved crosshair                                                  |
| Dense 6/8/15 previews                    | Still relevant                | Visual fixtures only, no generator work                                  |
| Keyboard/touch preservation              | Still relevant                | Verify shared controls and hover behavior                                |
| Pre-dialog pulse/glow exploration        | Superseded                    | Approved completion sheet's restrained one-shot star/copy motion         |
| Reduced motion / animation preference    | Still relevant                | Verify every shared sheet path                                           |
| Preserve completion/save semantics       | Already completed             | Keep session callback and save format                                    |
| Explicit celebration acceptance          | Already completed             | Approved merged #28 sheet; no new board effect                           |
| Both themes/token colors                 | Still relevant                | Exact Moonlit theme, remove legacy cascade                               |
| Glyph legibility/appearance preference   | Still relevant                | Preserve artwork/colors; review screenshots                              |
| Storybook/app alignment                  | Still relevant                | Consolidation and explicit dependency pin                                |
| Engine/platform/saves unchanged          | Still relevant                | Guard in diff and tests                                                  |
| Formatting/types/tests/build             | Still relevant                | Both repositories, applicable scripts                                    |
| Physical phone/safe areas/reduced motion | Requires user visual approval | Automated browser coverage cannot establish physical haptics/native bars |
| Light/dark screenshots                   | Still relevant                | Capture comparable screen states                                         |

## Compatibility and migration

No public export is deleted in the catalog PR. Legacy `createTutorialDialog`,
`createSuccessDialog` and `createGameHeader` remain callable; their old stories
move out of active navigation. The V3 icon wrapper delegates to the shared icon
factory. The experimental V3 switch API remains available but is not a current
app settings reference. Generic tactile surfaces serve other consumers and stay.
External consumer use cannot be proven absent from these two repositories;
public removals require a separate release/migration, not inference from age.

The header-local GameMenuSheet is an intentional presentation adapter: a native
top-layer modal would cover its persistent header toggle. It must share motion
with BottomSheet without changing focus/history semantics or becoming a new copy
of the completion overlay. Settings and confirmations stay in their approved forms.

## PR sequence and validation

1. Catalog and audit: one V3 section, archive obsolete compositions, promote
   guided tutorial/confirmation, remove specimen-only button styles, document APIs.
2. Shared sheet motion: reusable entry/exit lifecycle, timing/easing, reduced
   motion, shared close control, focused dismissal/focus tests. Depends on PR 1.
3. App: pin exact library commit; adopt approved completion; remove legacy
   cascade/duplicate hover styling; use approved logo references. Preserve routes,
   session/new-game behavior and platform adapters. Depends on PR 2.
4. Acceptance: screenshots, remaining approved corrections, issue checklist.
   No automatic merge or claim of physical-phone acceptance.

Run library `npm run check` (lint, format, types, tests, build, package and
Storybook checks); app typecheck/tests/production build and applicable formatter.
Capture light/dark Home, gameplay, tutorial, completion, settings and game menu
at narrow/large mobile widths; check dense preview, scroll, keyboard focus,
Escape/backdrop/Back and reduced motion. Record actual outcomes in PR reports.
