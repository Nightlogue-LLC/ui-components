# Development

Requires Node 22.12+ (`nvm use` reads `.nvmrc`).

```bash
npm install
```

## Scripts

| Script                            | What it does                                                                                                                       |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`                     | Starts the gallery dev server (`http://localhost:5173`, also bound to your LAN)                                                    |
| `npm run gallery:build`           | Builds the gallery to `gallery-dist/` and checks every theme made it into the bundle                                               |
| `npm run gallery:preview`         | Serves the built gallery                                                                                                           |
| `npm run build`                   | Builds the library into `dist/` (tsc + copies CSS)                                                                                 |
| `npm run typecheck`               | `tsc --noEmit` over library, gallery, tests, and configs                                                                           |
| `npm run lint`                    | ESLint (type-aware)                                                                                                                |
| `npm run format` / `format:check` | Prettier write / verify                                                                                                            |
| `npm test` / `test:watch`         | Vitest (unit + architecture tests)                                                                                                 |
| `npm run package:check`           | `publint`, then installs the packed tarball into a temp project and type-checks, resolves, and Vite-bundles it. Run after `build`. |
| `npm run check`                   | All of the above, in CI order                                                                                                      |

## The gallery

`npm run dev`, then use the toolbar:

- **Theme**: every `src/themes/<name>/<name>.css` is discovered automatically.
- **Mode**: light/dark (themes opt in via `[data-nl-mode='dark']`).
- **Viewport**: full width, 768px tablet, or 375px mobile preview width.
- **Playground**: each story's controls change the live component; clicks etc. appear in the event log.
- **Stories that manage their own themes** (`scope: 'self'`, e.g. G&G · Foundations) ignore the Theme/Mode toolbar so light and dark can be shown side by side.
- **States**: a static grid of notable states (e.g. disabled, loading) for the current theme.

The selected story/theme/mode/viewport are kept in the URL hash, so a view can be bookmarked or shared.

### Testing on a phone

The dev server listens on your network (`server.host: true`). Open the printed `Network:` URL on a phone on the same Wi-Fi. For Android: Chrome DevTools remote debugging (`chrome://inspect`) works against that page, and against a Capacitor app's WebView.

**Limitation:** the viewport selector constrains the preview _container width_. It does not change the browser viewport, so `@media (max-width)` rules inside components are not triggered by it. Use browser device emulation or a real device for that. Prefer container-relative sizing in components.

Note: until the first `src/projects/<project>/` exists, `publint` prints three warnings that the `projects/*` export patterns match no files. That is expected and not a failure; it disappears with the first project.

## CI

`.github/workflows/ci.yml` runs on every PR and push to `main`: `npm ci`, lint, format check, typecheck, tests, library build, package check, gallery build. Nothing is published or deployed.

## Conventions

- ES modules with `.js` extensions on relative imports in TS (required by `NodeNext`).
- Library code (`src/`) may only use DOM + ES2020 APIs (the build uses no Node types).
- Keep `src/**/*.test.ts` next to the code; cross-cutting rules go in `tests/`.
