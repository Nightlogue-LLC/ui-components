# Development

Requires Node 22.12+ (`nvm use` reads `.nvmrc`).

```bash
npm install
```

## Scripts

| Script                            | What it does                                                                                                                               |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `npm run storybook`               | Starts the Storybook catalog at `http://localhost:6006` (localhost only)                                                                   |
| `npm run storybook:lan`           | Same, bound to all network interfaces so a phone can open it. **Exposes the dev server to your network**, see [storybook.md](storybook.md) |
| `npm run build-storybook`         | Builds the static catalog to `storybook-static/` and checks it (all expected stories, every theme, local fonts, no network URLs)           |
| `npm run build`                   | Builds the library into `dist/` (tsc + copies CSS, fonts and licenses)                                                                     |
| `npm run typecheck`               | `tsc --noEmit` over library, stories, Storybook config and tests                                                                           |
| `npm run lint`                    | ESLint (type-aware)                                                                                                                        |
| `npm run format` / `format:check` | Prettier write / verify                                                                                                                    |
| `npm test` / `test:watch`         | Vitest (unit + architecture tests)                                                                                                         |
| `npm run package:check`           | `publint`, then installs the packed tarball into a temp project and type-checks, resolves, and Vite-bundles it. Run after `build`.         |
| `npm run check`                   | All of the above, in CI order (includes the production Storybook build)                                                                    |

## Storybook

The visual catalog for every component and project. Start it with `npm run storybook`; everything about it (toolbar, sidebar structure, adding stories, reviewing dialogs on mobile, LAN preview, Vercel previews) is in [storybook.md](storybook.md).

## CI

`.github/workflows/ci.yml` runs on every PR and push to `main`: `npm ci`, lint, format check, typecheck, tests, library build, package check and the Storybook build. Nothing is published or deployed by this workflow.

## Conventions

- ES modules with `.js` extensions on relative imports in TS (required by `NodeNext`).
- Library code (`src/`) may only use DOM + ES2020 APIs (the build uses no Node types).
- Keep `src/**/*.test.ts` next to the code; cross-cutting rules go in `tests/`.
