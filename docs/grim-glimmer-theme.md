# Grim & Glimmer theme

> **Approved direction:** **deep plum in dark mode, warm cream in light mode**, with antique-gold accents and the established Cormorant/Inter typography roles. The decision applies to the live `grim-glimmer` theme, not only the Storybook concept gallery.

## Viewing it

Run `npm run storybook` and open **Projects / Grim & Glimmer / Foundations** to inspect real themed components side by side. **Projects / Grim & Glimmer / Reference Gallery** retains the earlier mock comparison sheet and bottom navigation as a separate composition study.

## Using it

```ts
import '@nightlogue-llc/ui-components/styles.css';
import '@nightlogue-llc/ui-components/themes/grim-glimmer.css';
import { applyTheme } from '@nightlogue-llc/ui-components';

applyTheme(document.documentElement, 'grim-glimmer', 'dark'); // 'dark' = plum, 'light' = cream
```

## Approved semantic palette

| Token            | Light (cream) | Dark (plum) |
| ---------------- | ------------- | ----------- |
| Background       | `#FAF5EC`     | `#261624`   |
| Surface          | `#FFFDF9`     | `#382536`   |
| Hover surface    | `#EEE7DE`     | `#4B3348`   |
| Text             | `#211720`     | `#F6E9DA`   |
| Border           | `#827369`     | `#A99AA4`   |
| Accent           | `#916B34`     | `#D6B279`   |
| Accent hover     | `#805D2B`     | `#E3C796`   |
| Accent active    | `#6F4F23`     | `#C39A60`   |
| Text on accent   | `#FFFFFF`     | `#261624`   |
| Focus ring       | `#80602F`     | `#F0D29B`   |
| Disabled surface | `#E7DFD7`     | `#503D4C`   |
| Disabled text    | `#71666F`     | `#C4B2BF`   |

The light-mode action gold and the semantic borders are deliberately adjusted from the illustrative reference colors. The token contract enforces **4.5:1 for functional text** and **3:1 for control outlines, accent fills and focus indicators** on the relevant backgrounds, via `tests/contrast.test.ts`.

The existing tactile Button, TactileTile, RecessedSlot and EditorialCallout use palette-specific gradients, shadows and gold selection states. Geometry and accessibility behaviors remain unchanged. Neutral/shared themes remain untouched.

The reference gallery's four-item bottom navigation is an earlier visual study. The approved main shell now uses Collection, Achievements and Settings; Journal is excluded. Gameplay keeps its separate header with no bottom bar. Clue gutters are available through createCluedBoard.

## Typography

Approved system: four typefaces, each with one role. They are **theme assets**: the font files, their licenses and the `@font-face` rules live with this theme (`src/themes/grim-glimmer/fonts/`), the shared library neutral defaults are untouched, and shared components never import or name a font. They read **semantic role tokens**, and this theme maps the roles to the fonts.

| Role    | Typeface          | Weight(s) loaded                    | Used for                                                                                        |
| ------- | ----------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------- |
| display | Cormorant Upright | 500                                 | Puzzle titles: collection cards, individual puzzle names                                        |
| heading | Cormorant Infant  | 600 (major), 400 (softer editorial) | Screen headings, section titles, modal headings, success messages                               |
| label   | Cormorant SC      | 600                                 | Small uppercase labels, category headings, decorative supporting text. Never functional UI text |
| ui      | Inter             | 400, 600                            | Buttons, navigation, difficulty selectors, instructions, settings, puzzle clues and numbers     |

The brief fixed the typefaces and (for Infant) the weights. **The other weights are my choices**, flagged for review: Upright 500 (the thin 300/400 cuts are fragile at card sizes), SC 600 (legibility at 14px), Inter 400 + 600 (600 is the existing button and control weight, `--nl-font-weight-medium`).

### Tokens

All optional (listed in `optionalThemeTokens`, `src/tokens/contract.ts`), so a theme that omits them is unaffected; components read them with a use-site fallback, e.g. `var(--nl-font-family-heading, var(--nl-font-family))`. The UI family is the existing `--nl-font-family`.

| Group            | Tokens                                                                                                                                                                                                    |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Families         | `--nl-font-family` (ui), `--nl-font-family-display`, `--nl-font-family-heading`, `--nl-font-family-label`                                                                                                 |
| Weights          | `--nl-font-weight-display` (500), `--nl-font-weight-heading` (600), `--nl-font-weight-heading-soft` (400), `--nl-font-weight-label` (600), plus the existing `--nl-font-weight-medium` (600, ui emphasis) |
| Responsive scale | `--nl-font-size-display-lg`, `-display-md`, `-heading-lg`, `-heading-md`, `-heading-sm`, `-label` (Inter keeps the existing `--nl-font-size-sm / md / lg`)                                                |
| Rhythm           | `--nl-line-height-display` (1.3), `--nl-line-height-heading` (1.25), `--nl-letter-spacing-label` (0.14em)                                                                                                 |

Computed sizes (clamp-based, so they grow gently with the viewport):

| Level      | 320px  | 375px  | 430px  | 1200px |
| ---------- | ------ | ------ | ------ | ------ |
| display-lg | 28.3px | 29.2px | 30.1px | 34px   |
| display-md | 22.1px | 22.6px | 23.1px | 26px   |
| heading-lg | 28.2px | 28.9px | 29.6px | 34px   |
| heading-md | 22.2px | 22.6px | 23px   | 26px   |
| heading-sm | 18.1px | 18.3px | 18.5px | 20px   |
| label      | 14px   | 14px   | 14px   | 14px   |

Cormorant has a small x-height, so its sizes run larger than Inter's to look balanced beside it. **Line heights are chosen from the fonts' metrics:** every face's content area is 1.21em, so 1.3 (display) and 1.25 (heading) leave room for tall ascenders and long descenders, even under `overflow: hidden` and `line-clamp`. A browser check asserts this.

### Files, licensing and loading

- Six WOFF2 files, about 147KB in total, normal style only, **Latin subset**, copied unmodified from the Fontsource 5.3.0 packages. All four families are **SIL Open Font License 1.1**; each license (with its copyright notice) ships next to the files, and `fonts/README.md` records provenance and SHA-256 hashes (a test checks them). Neither license declares a Reserved Font Name.
- **Local only.** `src/` URLs are relative (`./fonts/...`); a test forbids network URLs and `@import`. Your bundler (Vite) emits the files as hashed assets. They are also exported as `@nightlogue-llc/ui-components/theme-assets/grim-glimmer/fonts/*`.
- **Only what is used.** A test fails if a declared weight is not referenced by a token, or a token weight has no file. No italics are loaded; do not use italic styles in this theme (the browser would fake them).
- `font-display: swap`, so text is always visible. The fallback stacks are Georgia / Times New Roman for the Cormorants and system sans for Inter. Family names are prefixed `GG ` (for example `'GG Cormorant Infant'`) so they cannot clash with another copy of the font.
- **Light/dark:** typography does not change by mode (the role tokens are defined once on the theme scope, which both modes inherit).
- **Limit:** Latin only. Characters outside the subset (Polish `ł`, Czech `ř`, Cyrillic, Greek) fall back to the stack. Add the `latin-ext` files before shipping a localization that needs them.

### The wordmark

The Grim & Glimmer wordmark is artwork owned by the app. These font decisions apply to application typography only, and nothing in this library typesets the wordmark.

## Optional theme hooks

All the typography tokens above, `--nl-shadow-card` and `--nl-shadow-dialog` are **optional**: listed in `optionalThemeTokens` (`src/tokens/contract.ts`), not required of other themes. Components must read them with a fallback (`var(--nl-shadow-card, none)`), which a test enforces. That keeps the `neutral` theme (and any future theme) rendering exactly as before.

## Remaining review

- Review the applied cream/plum theme on the actual gameplay composition and dialogs.
- The Storybook reference gallery is not a full implementation specification. Puzzle logic and navigation are outside this palette change.
