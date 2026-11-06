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
     /* optional: component hooks, e.g. --nl-button-radius */
     background: var(--nl-color-bg);
     color: var(--nl-color-text);
   }

   /* optional dark mode; must repeat every contract token */
   [data-nl-theme='<project>'][data-nl-mode='dark'] {
     /* ... */
   }
   ```

3. `npm test` tells you exactly which contract tokens are missing or which selectors are unscoped.
4. `npm run dev`: the theme appears in the gallery's Theme menu automatically.

Fonts: add `@font-face` in the theme CSS (or an extra CSS file `@import`ed by it) and ship font files with the theme. For a Capacitor app, prefer fonts bundled with the app over network fonts.

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
