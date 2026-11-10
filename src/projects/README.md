# Project-specific code

Each Nightlogue project that needs more than the shared components gets its own folder here:

```
src/projects/<project>/
  index.ts          # project-specific components (TypeScript)
  <project>.css     # their styles
```

Rules (details in [docs/project-themes.md](../../docs/project-themes.md)):

- Project code may import from `../../components/*` and `../../core/*`. Shared code must never import from `projects/`.
- Projects must not import from each other.
- CSS classes use the `nl-<project>-` prefix, so project styles cannot collide with shared (`nl-`) styles or with another project.
- The matching theme lives in `src/themes/<project>/<project>.css`.

Each folder is exposed automatically as `@nightlogue-llc/ui-components/projects/<project>` (JS) and `.../projects/<project>.css` (styles). No `package.json` edit is needed.

Grim & Glimmer production APIs live in `grim-glimmer/`. The `grim-glimmer-v3/` foundation exports retain compatibility; V3 does not require renaming consumer imports. See [the V3 audit](../../docs/v3-consolidation-audit.md).
