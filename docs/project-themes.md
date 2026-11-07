# Project themes and project-specific components

A project (e.g. a game or app) gets:

1. a **theme**: values for the theme contract (+ optional overrides), in `src/themes/<project>/`
2. optional **project components**: components only that project needs, in `src/projects/<project>/`

Shared components stay untouched. Replace `<project>` with a short kebab-case name.

## Creating a theme

1. Create `src/themes/<project>/<project>.css`. The file name must equal the folder name (that is the exported entry point).
2. Scope **everything** under `[data-nl-theme='<project>']`:

   ```css
   [data-nl-theme='<project>'] {
     color-scheme: light;
     --nl-color-bg: /* ... every token in src/tokens/contract.ts ... */;
     /* optional: override foundation tokens, e.g. --nl-radius-md, --nl-font-family */
     /* optional hooks (src/tokens/contract.ts): typography roles (--nl-font-family-display / -heading / -label, weights, scale), --nl-shadow-card, --nl-shadow-dialog */
     /* optional: component hooks, e.g. --nl-button-radius */
     background: var(--nl-color-bg);
     color: var(--nl-color-text);
   }

   /* optional dark mode; must repeat every contract token */
   [data-nl-theme='<project>'][data-nl-mode='dark'] {
     /* ... */
   }
   ```

3. Use **literal values** (hex) for contract colors so the contrast test can read them. Project themes (everything except the `neutral` example) must meet the WCAG AA policy in `gallery/lib/contrast-pairs.ts`: 4.5:1 for text, 3:1 for control boundaries and the focus ring. A worked example with measured results: [grim-glimmer-theme.md](grim-glimmer-theme.md).
4. `npm test` tells you exactly which contract tokens are missing or which selectors are unscoped.
5. `npm run dev`: the theme appears in the gallery's Theme menu automatically.

Fonts are **theme assets**, never shared-library assets:

- Put the WOFF2 files in `src/themes/<project>/fonts/`, **with each family's license** (`OFL-<family>.txt`) and a `README.md` recording provenance and SHA-256 hashes. Declare `@font-face` rules inside the theme CSS with relative `./fonts/...` URLs, `font-display: swap`, and a `unicode-range`. No network URLs, no `@import`.
- Prefix the family names (the G&G theme uses `GG `) so they cannot clash with another copy of the same font.
- Map the fonts to the semantic **role tokens** (`--nl-font-family`, `-display`, `-heading`, `-label`, their weights and the size scale) inside the theme scope. Components read the roles, never font names.
- Load only the weights actually used, and no italics you do not ship. `tests/fonts.test.ts` enforces all of this and checks the files and licenses.
- For a Capacitor app, the bundler emits the files as local assets; do not use a font CDN.

The worked example is [grim-glimmer-theme.md](grim-glimmer-theme.md#typography).

## Creating project-specific components

Same shape as a [shared component](adding-components.md), under `src/projects/<project>/`:

```
src/projects/<project>/
  index.ts
  <project>.css      # entry stylesheet for the project's components
  <thing>.ts
  <thing>.test.ts
```

- Classes: `nl-<project>-<thing>` (e.g. `nl-<project>-health-bar`). Never reuse or restyle shared `nl-button`-style classes from here; compose them in markup instead, or add a modifier hook in the shared component if every project would benefit.
- Imports: shared `components/` and `core/` are fine; other projects are not; nothing in shared code may import `projects/`. (Tested.)
- Project code is **not** re-exported from the package root. Consumers import it explicitly (`.../projects/<project>`), so an app only bundles its own project.
- Add gallery stories under `gallery/stories/` the same way as shared components.

## What belongs where

| If it...                                          | Put it in                        |
| ------------------------------------------------- | -------------------------------- |
| Is a generic control any project could use        | `src/components/`                |
| Changes only how shared things look               | the project's theme              |
| Is a one-project widget (HUD, card, dialog style) | `src/projects/<project>/`        |
| Is a design-wide default (spacing, motion)        | `src/tokens/tokens.css` (rarely) |
