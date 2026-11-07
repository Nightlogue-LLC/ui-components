# Grim & Glimmer font files

These are theme assets: only the `grim-glimmer` theme loads them. Shared components never reference them; they read semantic typography tokens (`--nl-font-family-*`, see `src/tokens/contract.ts`) that this theme maps to these families.

All four families are licensed under the **SIL Open Font License 1.1**. Each license file below is the unmodified `LICENSE` from the corresponding Fontsource package and carries the copyright notice the OFL requires when redistributing.

| Role                            | Family            | File used                            | Weight | License file                |
| ------------------------------- | ----------------- | ------------------------------------ | ------ | --------------------------- |
| Puzzle titles                   | Cormorant Upright | `cormorant-upright-latin-500-normal` | 500    | `OFL-cormorant-upright.txt` |
| Primary headings                | Cormorant Infant  | `cormorant-infant-latin-600-normal`  | 600    | `OFL-cormorant-infant.txt`  |
| Primary headings (softer, soft) | Cormorant Infant  | `cormorant-infant-latin-400-normal`  | 400    | `OFL-cormorant-infant.txt`  |
| Editorial labels                | Cormorant SC      | `cormorant-sc-latin-600-normal`      | 600    | `OFL-cormorant-sc.txt`      |
| Functional UI                   | Inter             | `inter-latin-400-normal`             | 400    | `OFL-inter.txt`             |
| Functional UI (emphasis)        | Inter             | `inter-latin-600-normal`             | 600    | `OFL-inter.txt`             |

## Provenance

- Source: the `@fontsource/cormorant-upright`, `@fontsource/cormorant-infant`, `@fontsource/cormorant-sc` and `@fontsource/inter` npm packages, version 5.3.0 (all declare `OFL-1.1`).
- The files are copied **as published**: WOFF2, normal style, **Latin subset** (Basic Latin and Latin-1 Supplement plus common punctuation, currency and typographic symbols). We did no further subsetting or modification.
- Only the weights listed above are shipped, because only those are used (a test enforces that every declared weight is referenced by a token).

SHA-256 of the shipped files (to detect accidental changes):

```
8dfad6e1799f90c571919734e9b9c6d87673f38a6b9b0025751994a861fa956a  cormorant-infant-latin-400-normal.woff2
fea204fe067da76892ffed31eeedbf43384f58b9bafbaa1583ed7da5c10b5d42  cormorant-infant-latin-600-normal.woff2
12e0111fadbbbd005472837880657dd323d93441ac4b09cbdb34ebd6e8614fff  cormorant-sc-latin-600-normal.woff2
26671b8a788d5af0e47a34f284e64b57e696a14c808ee730375571d0cff315ab  cormorant-upright-latin-500-normal.woff2
8909904ab6c872eb994093482a88a28eca2cd95912d7b6fecd72103b0dc07edc  inter-latin-400-normal.woff2
f9a06e79cd3a2a20951c0f0e28f66dd0e6d3fda73911d640a2125c8fcb78f21a  inter-latin-600-normal.woff2
```

## Known limits

- **Latin only.** Characters outside the subset (for example Polish `ł`, Czech `ř`, Cyrillic, Greek) fall back to the next family in the stack (Georgia or system sans). Add the matching `latin-ext` files (and `@font-face` rules with their `unicode-range`) before shipping a localization that needs them.
- Cormorant has no italic in Upright and we do not load Infant or Inter italics: italics would be synthesized by the browser. Do not use italic styles in this theme until real italics are added.

## Changing a font or weight

Replace the file here, update the matching `@font-face` in `../grim-glimmer.css` and the table and hashes above. Keep the license file with it.
