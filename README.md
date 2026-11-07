# @nightlogue-llc/ui-components

Reusable, framework-independent UI components, design tokens, and per-project themes for Nightlogue LLC projects. Plain TypeScript + CSS; works in vanilla apps and Capacitor Android WebViews. No runtime dependencies.

> Status: early. Not published (`"private": true`). Includes a neutral example theme and `button`, the provisional Grim & Glimmer theme, and its project compositions (see docs).

## Quick start

Requires Node 22.12+ (`.nvmrc` pins 22).

```bash
npm install
npm run storybook  # component catalog at http://localhost:6006
npm run storybook:lan  # same, reachable from a phone on your network (see the warning in docs/storybook.md)
npm run check      # everything CI runs
```

## How it fits together

```
src/
  core/          framework-independent helpers (applyTheme)
  tokens/        foundation tokens (tokens.css) + the theme contract (contract.ts)
  components/    shared components: <name>/{index.ts, <name>.ts, <name>.css}
  themes/        one folder per theme: <name>/<name>.css  (scoped by [data-nl-theme])
  projects/      project-specific components: <project>/{index.ts, <project>.css}
  styles.css     aggregate of tokens + all shared component CSS
stories/         Storybook stories (the visual catalog; not published)
.storybook/      Storybook configuration (theme/mode/viewport toolbar)
scripts/         build + package verification
tests/           architecture tests (theme contract, scoping, import boundaries)
```

- **Shared components** read colors only through a fixed set of `--nl-color-*` tokens (the _theme contract_).
- **Themes** supply those tokens, scoped to `[data-nl-theme='<name>']`, so several themes can coexist and none can leak.
- **Project-specific** components live in their own folder and import shared code, never the reverse.

## Docs

| Doc                                                                  | Covers                                                                    |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| [docs/architecture.md](docs/architecture.md)                         | Structure, isolation rules, browser support, tools and why                |
| [docs/storybook.md](docs/storybook.md)                               | The Storybook catalog: running it, structure, Vercel previews, parity     |
| [docs/development.md](docs/development.md)                           | Scripts, tooling, CI                                                      |
| [docs/components.md](docs/components.md)                             | Shared component APIs, accessibility behavior, usage                      |
| [docs/adding-components.md](docs/adding-components.md)               | Adding a shared component, story, and tests                               |
| [docs/project-themes.md](docs/project-themes.md)                     | Creating a project theme and project-specific components                  |
| [docs/grim-glimmer-theme.md](docs/grim-glimmer-theme.md)             | Grim & Glimmer provisional theme: tokens, contrast results, departures    |
| [docs/grim-glimmer-integration.md](docs/grim-glimmer-integration.md) | Grim & Glimmer compositions and the contracts the game app must implement |
| [docs/consuming.md](docs/consuming.md)                               | Using the library from another repository (incl. Vite/Capacitor)          |
| [docs/distribution.md](docs/distribution.md)                         | Recommended packaging, versioning, and release strategy                   |
