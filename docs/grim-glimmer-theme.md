# Grim & Glimmer theme

> **Status: provisional v1.** The palette and the display font are proposals for visual review in the gallery, not final brand decisions. They are written so they can be adjusted by editing one file, `src/themes/grim-glimmer/grim-glimmer.css`, with no component changes.

Direction: a mobile-first, contemporary occult-editorial puzzle collection. Light = bright surfaces, dark type, sparse gold. Dark = near-black surfaces, light type, sparse gold. Sharp, architectural geometry; thin borders; restrained elevation.

## Viewing it

```bash
npm run dev
```

Open the **G&G · Foundations** story. It shows light and dark side by side regardless of the toolbar's Theme/Mode (it applies its own scopes), with the type specimens, full palette, live contrast results, geometry/elevation, and real `Button`s. Use the Viewport menu or browser device emulation for phone widths. To see any other story in this theme, pick **grim-glimmer** in the Theme menu.

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

Structural values (theme-scoped): `--nl-radius-md: 0.3125rem` (5px), `--nl-border-width: 1px`, `--nl-font-family` = the existing system sans stack, plus the optional hooks `--nl-font-family-display: Georgia, 'Times New Roman', serif`, `--nl-shadow-card`, `--nl-shadow-dialog` (both subtle; stronger black-based in dark). No network fonts and no font files are used. Spacing continues to use the existing `--nl-space-1..6`.

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

## Optional theme hooks

`--nl-font-family-display`, `--nl-shadow-card`, `--nl-shadow-dialog` are **optional**: listed in `optionalThemeTokens` (`src/tokens/contract.ts`), not required of other themes. Components must read them with a fallback (`var(--nl-shadow-card, none)`), which a test enforces. That keeps the `neutral` theme rendering exactly as before.

## Still to sign off

- The palette, especially the bronze-leaning light-mode gold and the stronger borders.
- The display font. Georgia is a system-font placeholder to avoid unlicensed or network fonts; a real editorial serif would need a licensed, bundled font and an `@font-face` in the theme.
