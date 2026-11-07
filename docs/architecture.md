# Architecture

## Goals

- Framework-independent core: no React/Vue/Lit required, no runtime dependencies.
- Works in a Capacitor Android WebView.
- Each project gets its own look without touching shared foundations, and without one project's styles affecting another.

## Layers

| Layer              | Location                 | May import               | Contains                                              |
| ------------------ | ------------------------ | ------------------------ | ----------------------------------------------------- |
| Tokens             | `src/tokens/`            | nothing                  | Foundation CSS tokens, theme contract (`contract.ts`) |
| Core               | `src/core/`              | nothing                  | DOM helpers such as `applyTheme`                      |
| Shared components  | `src/components/<name>/` | core, tokens             | TS factory + CSS per component                        |
| Themes             | `src/themes/<name>/`     | (CSS only)               | Values for the theme contract, scoped by attribute    |
| Project components | `src/projects/<name>/`   | core, tokens, components | Components that only one project needs                |

Enforced by `tests/architecture.test.ts`: shared code never imports `projects/`, projects never import each other, library code uses no Node APIs.

## How styling isolation works

1. **Tokens, not values.** Component CSS never contains brand colors. It reads `--nl-color-*` custom properties.
2. **The theme contract** (`src/tokens/contract.ts`) lists the color tokens every theme must define. A test checks every theme in `src/themes/` defines all of them.
3. **Attribute scoping.** A theme's CSS is written under `[data-nl-theme='<name>']` (and optionally `[data-nl-mode='dark']`). `applyTheme(el, 'name', 'dark')` sets those attributes. Nothing is applied until an element opts in, so two themes can sit side by side and a theme can't restyle the host app. A test fails any selector in a theme file that is not scoped to its own theme.
4. **Foundation tokens** (spacing, sizing, font stack, radius, motion) live on `:root` as neutral defaults. A theme may override any of them inside its own scope.
5. **Namespaced classes.** Shared classes are `nl-<component>`; project classes are `nl-<project>-<component>`. A test checks each shared component only styles its own `nl-<component>` classes.
6. **Optional theme hooks.** Typography roles (`--nl-font-family-display / -heading / -label`, their weights, the responsive size scale, line heights and label tracking), `--nl-shadow-card` and `--nl-shadow-dialog` may be defined by a theme but are not required. Components read them only with a use-site fallback (`var(--nl-shadow-card, none)`), so themes that omit them are unaffected. Enforced by test. **Fonts are theme assets:** a theme bundles its own font files (with licenses) and maps them to those role tokens; shared CSS/TS never names a font, loads a font file, or declares `@font-face` (also enforced by test).
7. **Per-component hooks.** A component may expose optional `--nl-<component>-*` properties (e.g. `--nl-button-radius`) so a theme can tune it without overriding selectors. Components use `var(--hook, default)`, so no theme is required to set them.

## Component model

A component is **CSS classes + a small TypeScript factory** that builds the markup (`createButton`) and an updater (`updateButton`). The classes are the contract, so the same markup works in any framework or as hand-written HTML. We deliberately did not use custom elements or Shadow DOM: shadow boundaries make token theming and app-level CSS harder, and the first consumer uses native DOM rendering.

## Distribution shape

The library is published as **unbundled ES modules + `.d.ts`** (built with plain `tsc`) with **plain `.css` files copied alongside**. Consumers import only what they use (`.../components/button`), and their bundler handles tree-shaking and CSS. See `package.json` `exports`; the wildcard entries mean new components, themes and projects need no `package.json` edit.

## Browser baseline (Capacitor Android WebView)

Target: Android System WebView / Chrome ~90+. TS compiles to ES2020, the Storybook preview build targets `chrome90`.

CSS conventions to stay inside that baseline: custom properties, flex/grid, `env(safe-area-inset-*)`, `:focus-visible`, `prefers-reduced-motion`. **Avoid** `@layer`, native CSS nesting, `color-mix()`, `:has()`, and container queries unless the consumer's minimum WebView is confirmed to support them. This is a convention, not an automated check (see limitations in the PR).

Touch: controls default to a 44px height (`--nl-size-control-md`); `sm` is smaller and is for dense desktop-style contexts. Hover styles are wrapped in `@media (hover: hover)` so taps don't leave a stuck hover.

## Tools and dependencies

Runtime dependencies: **none**. Dev dependencies, and why each exists:

| Tool                       | Why                                                                                                                                          |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| TypeScript (pinned `~6.0`) | Type-checking and emitting the package. Pinned below 6.1 because `typescript-eslint` doesn't yet support newer.                              |
| Storybook (HTML + Vite)    | The visual catalog and docs site (dev only). Brings Vite as its builder; the library itself is built with `tsc`. Addons: docs and a11y only. |
| Vite                       | Storybook's builder and Vitest's pipeline. Not used to build the library.                                                                    |
| Vitest + jsdom             | Unit tests for DOM factories and architecture tests. Reuses Vite's pipeline.                                                                 |
| ESLint + typescript-eslint | Linting, including type-aware rules.                                                                                                         |
| Prettier                   | Formatting (TS, CSS, Markdown, JSON).                                                                                                        |
| publint                    | Validates `exports`/`files` of the built package.                                                                                            |

### Deliberately not used

- ~~**Storybook**~~ **Adopted in [#6](https://github.com/Nightlogue-LLC/ui-components/issues/6)**, replacing the custom Vite gallery. The earlier "not used" reasoning (a lot of dependencies, its own build system and upgrade treadmill) still stands as a cost: it is accepted because the catalog is now the long-term, hosted visual reference for every Nightlogue project, which was the reconsider-trigger we named (non-engineers browsing a hosted catalog, interaction testing, and per-PR previews). Mitigations: it is **dev-only** (the package keeps zero runtime dependencies), the addon set is deliberately small (docs and a11y; controls, actions, viewport and interactions are Storybook core), the framework is HTML + Vite so no React/Vue/web-component layer is introduced, and telemetry is disabled. See [storybook.md](storybook.md).
- **Lit / web components** - adds a runtime dependency and Shadow DOM theming complexity; the first consumer renders plain DOM. Reconsider if a consumer needs framework-agnostic _custom elements_ specifically.
- **Tailwind / daisyUI** - utility frameworks pull styling decisions into markup and bring their own design vocabulary and build step, which fights the token/theme-contract model and per-project isolation. Plain CSS with custom properties does the job with zero tooling.
- **Monorepo tooling (workspaces, Turborepo, Nx)** - one package is enough for now. See [distribution.md](distribution.md) for when to split.
- **CSS preprocessors, CSS-in-JS, stylelint** - not needed yet. Stylelint is the most likely addition (to automate the browser-baseline conventions above).
