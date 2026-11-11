# Tarot gameplay identity and supplied glyph review

V4 Storybook-only follow-up to merged PR #49, based on main `36d080cc3201691dc20a7466a6fdecc5e1c2ae78`. No production integration, engine, saves, grading, statistics, tutorial, interaction model or production token edits.

## Current naming proposal

| Tarot identity      | Primary puzzle title |
| ------------------- | -------------------- |
| I · THE CAMPER      | Trees & Tents        |
| II · THE ARBITER    | Unequal              |
| III · THE ARCHITECT | Shikaku              |

`tarot-header.ts` keeps this collection data separate from `createTarotGameplayHeader()`. The factory requires independent numeral, archetypeTitle, puzzleName, difficulty, columns and rows; there is no game-specific default inside the generic factory. Upcoming puzzle examples demonstrate header copy only, without a new game implementation.

The factory composes the existing `createCompactGameHeader()` from `src/projects/grim-glimmer/game-screen.ts`. Hint and overflow are the existing native IconButton controls. The full preview reuses `createAppFrameHeader()` / `createGameScreen()` for the top back/settings bar and screen slots, `createV4Board()` for the board, and `createControlRow()` for the bottom tools. No generic control is copied.

The secondary identity uses the existing `--nl-font-family-label` (bundled Cormorant SC), restrained .08em tracking and `--nl-color-accent`. The main h1 uses existing Cormorant heading typography, centered, roughly 26–29px at the review widths. Difficulty/dimensions retain compact uppercase Inter and the existing accent/status treatment. No new fonts, colors or dependencies.

## Layout review boundary

**Header / TarotGameplayHeader** is the current proposal. The earlier **Header / PuzzleHeader** section is explicitly labelled as a historical comparison; its original layout is retained. Other earlier V4 demonstration screens keep their existing copy/art until a separately approved integration migration. Stars & Spires is absent from the new header's player-facing copy.

The identity sits in the compact header's upper space, above the main title; it adds no normal-flow row. The full two-line/three-line comparison uses the same **88px header slot**, board markup, app navigation and controls. No board dimensions, clue gutter, cell spacing or placement rules change when the identity is toggled. This is a controlled fixture comparison, not a claim of measured production Android bounds. Large text/font loading and physical fit still need device review.

Stories include Camper, both-theme comparison, 393/360 presets, dense 15×15, existing-glyph comparison, before/after layout, three collection headers, and standalone Arbiter/Architect headers. All independent header data fields are available in Controls. The static square board's `size` control is separate from the header's generic columns/rows; preset stories keep them aligned.

## Supplied artwork

The two SVGs were copied byte-for-byte to the V4 assets folder, with descriptive destination names. SHA-256 checks match the original uploads; no paths, fills, metadata, geometry or source colors were rewritten.

| Source upload                 | V4 copy                  |  Bytes | Preview role |
| ----------------------------- | ------------------------ | -----: | ------------ |
| `image.svg-1794376478897.svg` | `assets/camper-tent.svg` | 25,478 | Player tent  |
| `image.svg-1794376007066.svg` | `assets/camper-tree.svg` | 37,608 | Fixed tree   |

Inkscape renders were inspected to identify each silhouette. CSS alpha masks let the existing theme roles color them without modifying the files. Tent uses `--nl-moonlit-star`; tree uses `--nl-moonlit-spire`. These are the current glyph roles, not proposed replacements. On the canonical theme this retains oxblood tents / dark trees in light mode and pale tents / rose trees in dark mode.

The provided square canvases contain transparent padding. Preview mask sizing (170% tent, 125% tree) uses that padding to present legible silhouettes without stretching or tracing their paths. The gallery shows 24/32/48/64px boxes in both themes; the filled-state board specimen shows them at real cell sizes, including 15×15.

The new masks are opt-in under `.gg-v4-camper-glyphs`. Existing V4/production board styles and original star/spire assets remain unchanged. The static supplied-glyph board replaces its sample tentative mark with a confirmed tent, so it does not display an old tentative star beneath the new title. A final tentative-tent outline has **not** been invented: its treatment remains an explicit later approval item. Existing-glyph comparison preserves the earlier tentative state. Board labels and the tool's accessible name use tree/tent only in this isolated preview; internal state names and callbacks remain intact.

## Validation and owner review

Passed: TypeScript, lint, Prettier, **529 existing tests**, **6 focused header/fixture tests**, library/package checks and Storybook build (**354 entries**). Focused tests cover separate identity data, generic future names and rectangular dimension text, hint/menu callbacks, identical non-header markup across the comparison, and opt-in artwork scope. The focused Vitest runner config stays outside the repo, following the V4-only boundary.

Browser screenshots remain unavailable locally: Chromium previously failed at a denied socket operation, and deployed preview inspection reached Vercel sign-in. No Android layout, screen-reader or frame-rate acceptance is claimed from unit tests or vector renders.

- [ ] Review the three-line Camper header in both modes at 393×852 and 360×780.
- [ ] Check the before/after board placement, top nav, hint and overflow positions; test large text/font loading.
- [ ] Approve tree/tent silhouettes, theme colors, 24px legibility and dense board preview.
- [ ] Confirm a tentative-tent treatment separately before full glyph adoption.
- [ ] Approve before merge or production integration.
