# Grim & Glimmer theme

> **Status:** the **typography is approved** (see [Typography](#typography)). The **palette is still provisional**, a proposal for visual review in the gallery. Both live in one file, `src/themes/grim-glimmer/grim-glimmer.css`, and can be adjusted without component changes.

Direction: a mobile-first, contemporary occult-editorial puzzle collection. Light = bright surfaces, dark type, sparse gold. Dark = near-black surfaces, light type, sparse gold. Sharp, architectural geometry; thin borders; restrained elevation.

## Viewing it

```bash
npm run dev
```

Open **G&G · Foundations** (full palette, live contrast results, geometry/elevation, real `Button`s) and **G&G · Typography** (the four typefaces, the hierarchy with live computed sizes, and whether each bundled font loaded). Both show light and dark side by side regardless of the toolbar's Theme/Mode (they apply their own scopes). Use the Viewport menu or browser device emulation for phone widths. To see any other story in this theme, pick **grim-glimmer** in the Theme menu.

## Using it

```ts
import '@nightlogue-llc/ui-components/styles.css';
import '@nightlogue-llc/ui-components/themes/grim-glimmer.css';
import { applyTheme } from '@nightlogue-llc/ui-components';

applyTheme(document.documentElement, 'grim-glimmer', 'dark'); // or 'light'
```

## Token values

All twelve contract tokens are defined in **both** the light selector and the dark selector.

| Token                      | Light     | Dark      | Differs from the proposal? |
| -------------------------- | --------- | --------- | -------------------------- |
| `--nl-color-bg`            | `#FFFFFF` | `#101011` |                            |
| `--nl-color-surface`       | `#F7F7F5` | `#1A1A1C` |                            |
| `--nl-color-surface-hover` | `#EEEEEB` | `#262629` |                            |
| `--nl-color-text`          | `#151515` | `#F5F3EF` |                            |
| `--nl-color-border`        | `#878683` | `#727077` | **Yes, both modes**        |
| `--nl-color-accent`        | `#916B34` | `#D5AF70` | **Yes, light**             |
| `--nl-color-accent-hover`  | `#805D2B` | `#E4C38B` | **Yes, light**             |
| `--nl-color-accent-active` | `#6F4F23` | `#C49A5A` | **Yes, light**             |
| `--nl-color-on-accent`     | `#FFFFFF` | `#17130D` |                            |
| `--nl-color-focus-ring`    | `#80602F` | `#F0D29B` |                            |
| `--nl-color-disabled-bg`   | `#EAEAE7` | `#333336` |                            |
| `--nl-color-disabled-text` | `#707070` | `#B5B4B4` |                            |

Structural values (theme-scoped): `--nl-radius-md: 0.3125rem` (5px), `--nl-border-width: 1px`, the typography roles below, and the optional elevation hooks `--nl-shadow-card`, `--nl-shadow-dialog` (subtle; stronger black-based in dark). Fonts are bundled locally with the theme, with no network requests. Spacing continues to use the existing `--nl-space-1..6`.

## Contrast results and departures from the proposed swatches

Measured with WCAG 2.x relative luminance. Policy: **4.5:1** for normal text, **3:1** for control boundaries and the focus ring. Enforced for every project theme, both modes, by `tests/contrast.test.ts`; shown live in the Foundations story.

The proposed swatches failed in three places. Each was fixed with the smallest change that passes:

| Problem                                       | Proposed                       | Now                                                                                 | Result               |
| --------------------------------------------- | ------------------------------ | ----------------------------------------------------------------------------------- | -------------------- |
| Light: white label on gold                    | `#A77F43` → 3.65:1             | accent family one step darker, white label kept (`#916B34` / `#805D2B` / `#6F4F23`) | 4.82 / 5.97 / 7.45:1 |
| Light: border vs bg / surface / surface hover | `#D9D8D4` → 1.43 / 1.33 / 1.23 | `#878683`                                                                           | 3.64 / 3.39 / 3.13:1 |
| Dark: border vs bg / surface / surface hover  | `#454448` → 1.97 / 1.80 / 1.56 | `#727077`                                                                           | 3.89 / 3.56 / 3.09:1 |

Why these choices:

- The issue allowed either dark label text or a darker gold for light mode. A dark label would get _worse_ on the darker hover/pressed golds, so the gold itself was darkened. It reads more bronze than bright gold; that is the main thing to judge visually.
- A single `--nl-color-border` serves both card outlines and control outlines, so meeting the 3:1 control-boundary rule makes card hairlines more visible than the proposal. If that is too heavy, the alternative is a new, separate contract token for control boundaries (a contract change touching every theme). That was not done without sign-off.

All measured ratios (min over the light/dark values above):

| Pair                                           | Min required | Light                 | Dark                  |
| ---------------------------------------------- | ------------ | --------------------- | --------------------- |
| Text on background / surface / surface hover   | 4.5          | 18.26 / 17.02 / 15.71 | 17.16 / 15.68 / 13.62 |
| Label on accent / hover / pressed              | 4.5          | 4.82 / 5.97 / 7.45    | 8.98 / 10.99 / 7.15   |
| Border on background / surface / surface hover | 3            | 3.64 / 3.39 / 3.13    | 3.89 / 3.56 / 3.09    |
| Accent fill on background / surface            | 3            | 4.82 / 4.49           | 9.23 / 8.44           |
| Focus ring on background / surface / hover     | 3            | 5.78 / 5.39 / 4.97    | 13.04 / 11.91 / 10.35 |
| Disabled text on disabled background           | exempt       | 4.11                  | 6.09                  |

Not covered: the gold accent used as _text_ or as a thin line on arbitrary backgrounds. Nothing in the library does that yet; if a project component does, check it explicitly.

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

## Still to sign off

- The palette, especially the bronze-leaning light-mode gold and the stronger borders.
- The weights and sizes I chose where the brief did not specify them (see [Typography](#typography)).
