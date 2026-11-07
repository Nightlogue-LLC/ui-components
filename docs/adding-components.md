# Adding a shared component

Use `src/components/button/` as the reference. Example: adding `badge`.

1. **Create the folder** `src/components/badge/` with:
   - `badge.css` - styles. Rules:
     - Class names `nl-badge`, `nl-badge--<modifier>`, `nl-badge__<part>` only.
     - Colors only via contract tokens (`--nl-color-*`); sizes/spacing via foundation tokens (`--nl-space-*`, etc.). No hard-coded colors or fonts.
     - Optional theme hooks are `--nl-badge-*`, used as `var(--nl-badge-radius, var(--nl-radius-md))`.
     - Private working variables use `--_name`.
     - Respect the [browser baseline](architecture.md#browser-baseline-capacitor-android-webview), add `:focus-visible` styling for anything interactive, gate hover with `@media (hover: hover)`, and honor `prefers-reduced-motion`.
   - `badge.ts` - a `createBadge(props)` factory returning an element and, if state changes after creation, `updateBadge(el, props)` taking the **full** props. Set text with `textContent`, never `innerHTML`.
   - `index.ts` - re-exports the public API (including types).
   - `badge.test.ts` - behavior tests (defaults, each prop, events, escaping).
2. **Wire it up** (the architecture test fails if you forget):
   - add `@import './components/badge/badge.css';` to `src/styles.css`
   - add `export * from './badge/index.js';` to `src/components/index.ts`
3. **Add a Storybook story** `stories/components/<group>/Badge.stories.ts` (groups: `actions`, `surfaces`, `inputs`, `overlays`, `feedback`; the sidebar comes from the story's `title`, for example `Components/Feedback/Badge`). Copy an existing one (for example `Badge.stories.ts`) and provide: typed CSF with `satisfies Meta<Args>`, `argTypes` for each prop, `fn()` for callbacks, a Playground, the variants and states, a `LightDarkComparison` story (`compareModes`), and usage guidance in `parameters.docs.description.component`. `npm run build-storybook` fails if a shared component has no comparison story. See [storybook.md](storybook.md).
4. **Need a new color?** Prefer reusing an existing contract token. If a component truly needs a new one, add it to `src/tokens/contract.ts` **and** to every theme in `src/themes/` (the architecture test lists what's missing).
5. Run `npm run check`.

Existing components (APIs, accessibility notes) are documented in [components.md](components.md); add yours there too. `package.json` needs no change: `exports` has wildcards, so consumers can immediately `import '@nightlogue-llc/ui-components/components/badge'` and `.../components/badge.css`.
