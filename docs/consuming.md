# Consuming the library from another repository

The package is not published yet. Until it is, use one of the options under [Installing](#installing). Everything below assumes the package name `@nightlogue-llc/ui-components`.

## Installing

- **Local co-development** (both repos on your machine): from the consumer, `npm install ../ui-components` after `npm run build` in this repo, or `npm link`. Re-run `npm run build` here after changes.
- **Tarball**: in this repo `npm run build && npm pack`, then `npm install /path/to/nightlogue-llc-ui-components-<version>.tgz` in the consumer.
- **After publishing** (recommended path, see [distribution.md](distribution.md)): `npm install @nightlogue-llc/ui-components@^0.1.0`.

## Using it (Vite + TypeScript, vanilla DOM)

```ts
// main.ts
import '@nightlogue-llc/ui-components/styles.css'; // tokens + all shared component CSS
import '@nightlogue-llc/ui-components/themes/<project>.css'; // the project's theme
import { applyTheme, createButton } from '@nightlogue-llc/ui-components';

applyTheme(document.documentElement, '<project>', 'dark'); // scope the theme app-wide

document.body.append(createButton({ label: 'Start', onClick: () => startGame() }));
```

Prefer smaller bundles? Import per component:

```ts
import '@nightlogue-llc/ui-components/tokens.css';
import '@nightlogue-llc/ui-components/components/button.css';
import { createButton } from '@nightlogue-llc/ui-components/components/button';
```

Project-specific pieces:

```ts
import '@nightlogue-llc/ui-components/projects/<project>.css';
import { createHealthBar } from '@nightlogue-llc/ui-components/projects/<project>';
```

## Entry points

| Import                                                              | Gives you                                              |
| ------------------------------------------------------------------- | ------------------------------------------------------ |
| `@nightlogue-llc/ui-components`                                     | core + tokens contract + all shared components         |
| `.../core`, `.../tokens`, `.../components`, `.../components/<name>` | the same pieces individually                           |
| `.../styles.css`                                                    | foundation tokens + all shared component CSS           |
| `.../tokens.css`, `.../components/<name>.css`                       | individual stylesheets                                 |
| `.../themes/<theme>.css`                                            | a theme (opt-in; nothing is themed until `applyTheme`) |
| `.../projects/<project>`, `.../projects/<project>.css`              | project-specific components and styles                 |

Requirements for the consumer: an ES-module-aware bundler (Vite is fine) and TypeScript `moduleResolution` of `Bundler` or `NodeNext` (the package uses `exports`, not `main`). `npm run package:check` verifies both resolution modes plus a real Vite build.

## Capacitor Android

Nothing special is required: the output is plain JS and CSS. Include `viewport-fit=cover` in your `index.html` viewport meta and use `env(safe-area-inset-*)` in your app shell (the gallery does the same). Confirm your minimum Android System WebView version against the [browser baseline](architecture.md#browser-baseline-capacitor-android-webview).

## Theming an app region differently

Because themes are attribute-scoped, you can theme a subtree: `applyTheme(dialogEl, 'other-theme')`.
