# Storybook catalog

Storybook (HTML + Vite) is the visual catalog and documentation site for every Nightlogue component and project. It replaced the earlier custom Vite gallery ([issue #6](https://github.com/Nightlogue-LLC/ui-components/issues/6)).

- It is **development-only**. The library stays plain TypeScript DOM factories plus CSS, with **zero runtime dependencies**; no React, Vue, web components, Tailwind or daisyUI were added to host stories.
- Addons are deliberately few: **docs** (autodocs and MDX) and **a11y** (axe). Controls, actions, viewport and interactions are Storybook core.
- Anonymous telemetry and "what's new" fetches are disabled in `.storybook/main.ts`.

## Run it

```bash
npm run storybook          # http://localhost:6006, localhost only
npm run build-storybook    # static site in storybook-static/, plus a build check
```

### Previewing on a phone over your network

```bash
npm run storybook:lan
```

This binds the dev server to **all network interfaces**, so **anyone on the same network can reach it**, including the source files the dev server serves. Use it only on a network you trust, never on public Wi-Fi, and stop it when you are done. Open the printed `Network:` URL on the phone. For Android, Chrome remote debugging (`chrome://inspect`) works against that page and against a Capacitor app's WebView.

If you only need phone-sized layout, the **Viewport** toolbar is safer: it resizes the preview frame, so media queries apply (the old gallery's width selector did not do that).

## Sidebar structure

The sidebar comes from each story's `title`. New groups and projects need no change to shared code.

| Sidebar                                                                    | Contents                                                                                                                               |
| -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **Introduction**                                                           | How to use the catalog                                                                                                                 |
| **Foundations / Tokens & Typography**                                      | Theme contract colors, foundation tokens and typography roles, as the selected theme resolves them                                     |
| **Components / Actions**                                                   | Button, IconButton                                                                                                                     |
| **Components / Surfaces**                                                  | Card                                                                                                                                   |
| **Components / Inputs**                                                    | SegmentedControl                                                                                                                       |
| **Components / Overlays**                                                  | Dialog                                                                                                                                 |
| **Components / Feedback**                                                  | Badge                                                                                                                                  |
| **Projects / Grim & Glimmer / Foundations, Collection, Gameplay, Dialogs** | Palette, contrast, typefaces and hierarchy; home screen and cards; game screen and boards; tutorial, success, confirmation, modal flow |

Files live in `stories/<group>/<Name>.stories.ts`. Story-only helpers are in `stories/lib/` (theme parsing, contrast math, the mock board generator, the side-by-side comparison helper) and story-only CSS in `stories/story-styles.css`; none of it is part of the package.

## Toolbar

- **Theme** and **Mode** call the library's own `applyTheme()` on a stage element wrapped around the story, setting `[data-nl-theme]` / `[data-nl-mode]` **on that element only**. Nothing is set on `<html>` or `<body>`, and a test run over all stories checks that no theme leaks outside the stage.
- **Theme: Auto** (default) uses each story's `parameters.nlTheme`: `neutral` for shared components and the project theme (for example `grim-glimmer`) on project stories. Choosing a theme overrides it everywhere, which is useful for checking how a project component behaves under the neutral theme.
- **Viewport** offers 320, 375 and 430 (phones), 768 (tablet) and 1280 (desktop).
- Themes, projects and their CSS are discovered from `src/themes/*/*.css` and `src/projects/*/*.css`; adding one needs no catalog change.

### Comparison stories

Each shared component has a **Light dark comparison** story (the build fails if one is missing), and the Grim & Glimmer foundations, collection and gameplay stories show both modes side by side. They use `compareModes()` (`stories/lib/stage.ts`), which gives every pane its own `applyTheme` scope, independent of the toolbar's Mode. Mark such a story with `parameters: { nlStage: 'self' }`.

`parameters.nlStage`: `'default'` wraps the story in one themed stage; `'bleed'` does so edge to edge (full-width screens); `'self'` leaves wrapping to the story.

## Docs, controls, accessibility

- Every component has an **autodocs** page: description, a usage example, the live Playground, a Controls table and each story. "Show code" displays the rendered markup, which is useful because the CSS classes are the library's contract.
- **Controls** change props live; callbacks (`fn()`) appear in **Actions**.
- The **Accessibility** panel runs axe on the open story. It is advisory (`a11y.test: 'todo'`): it does not fail the build, and automated checks cover only part of accessibility, so also test with the keyboard and a screen reader.
- The **Interactions** panel replays a story's `play` function.

## Reviewing and testing dialogs on mobile

The Dialog docs page carries this checklist; it is repeated here.

1. Choose a phone size in **Viewport** (320, 375, 430).
2. Open **Components / Overlays / Dialog** stories **Dismissible**, **Compulsory** and **Long content**. Their `play` step opens the dialog automatically (replay it in **Interactions**). For Grim & Glimmer, use **Projects / Grim & Glimmer / Dialogs**: **Tutorial**, **Success**, **Discard confirmation**, and **Modal flow** for the full sequence.
3. Check focus: it starts inside, **Tab** stays inside, **Escape** closes (or does nothing when compulsory), a backdrop tap closes (or does not), and focus returns to the opener. Each close reason appears in **Actions**.
4. Check layout: the dialog stays inside the viewport, long content scrolls inside it, and large text (browser zoom or a larger default font size) still works. The tutorial's 5×5 demo should fit 375×667 without scrolling.
5. Check both themes and modes (toolbar Theme and Mode).
6. For real device behavior (soft keyboard, safe areas, Android back button), use the LAN preview or a device build. The library does not handle the Android back button; that belongs to the app.

## Adding a story

1. Create `stories/<group>/<Name>.stories.ts` with a `title` from the structure above.
2. Write typed CSF with `satisfies Meta<Args>`, `argTypes` for each prop and `fn()` for callbacks.
3. Provide a **Playground**, the variants and states, and a `LightDarkComparison` story; put usage guidance in `parameters.docs.description.component`.
4. For a new project, add `stories/projects/<project>/` stories and set `parameters.nlTheme` to the project theme. Never import a project's fonts or styles into a shared component's story.
5. If you add a story that the catalog must always contain, add its id to `scripts/check-storybook-build.mjs`.

## Vercel

### What I found (read-only, 2026-11-07)

Inspected through the Vercel connector without changing anything:

- A Vercel project **`ui-components`** (team `shavonne-cobbs-projects`) **is connected to this GitHub repo** and builds a **preview deployment for every pushed branch**, including the PR #3, #4 and #5 branches (all `READY`).
- Its framework preset is **Vite** and its Node.js version is **26.x**. These deployments were built with the project's current settings, not with the Storybook build; I did not examine what they serve.
- **No production deployment exists** (`live: false`; every deployment is a preview).
- **Vercel Authentication (SSO) protects deployments** (`all_except_custom_domains`); password protection and trusted IPs are off. So previews currently require a Vercel login, and **adding a custom domain would leave that domain public**.

### What this repo now configures (`vercel.json`)

| Setting                                 | Effect                                                                                                                        |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `buildCommand: npm run build-storybook` | Builds the static catalog (and runs the build check)                                                                          |
| `outputDirectory: storybook-static`     | Serves Storybook's output                                                                                                     |
| `framework: null`, `installCommand`     | Framework "Other"; `npm ci` for reproducible installs                                                                         |
| `git.deploymentEnabled.main: false`     | **Disables automatic deployment of `main`.** Without it, merging to `main` would create the project's first production deploy |
| `X-Robots-Tag: noindex, nofollow`       | Keeps catalog pages out of search engines                                                                                     |

`vercel.json` applies to the branch that contains it, so it changes nothing for existing branches until they include it. It overrides the dashboard's build settings for those deployments only.

### Per-PR previews

Once this file is in a branch, each push to a PR branch gets its own preview at `https://ui-components-git-<branch>-shavonne-cobbs-projects.vercel.app` (and a unique per-deployment URL). The Vercel bot comments the link on the PR. Previews are SSO-protected, so viewers need access to the team; for a one-off share, use Vercel's "Share" link, which creates a time-limited bypass.

### Steps for you (nothing here was done for you)

1. **Node version:** this repo is developed and tested on Node 22 (`.nvmrc`, CI). The Vercel project is set to 26.x, which is untested with Storybook 10 here. In the dashboard: Settings → General → **Node.js Version → 22.x**.
2. **Preview check:** open the next PR preview and confirm the catalog loads (Framework Preset can stay as is; `vercel.json` sets it to Other).
3. **Production, only when you decide to:**
   - remove the `git.deploymentEnabled` block from `vercel.json` (or set `main` to `true`), then merge to `main`; the first production deployment is then created automatically. Confirm the Production Branch is `main` in Settings → Git;
   - decide who may see it first (next section).
4. Keep **Vercel Authentication** on. If the catalog should be shared more widely, prefer, in order: SSO for team members, password protection (a paid feature), or trusted IPs (enterprise), over turning protection off.

### Private repo and public exposure

The catalog shows component examples, theme values, fonts, and the Grim & Glimmer placeholders and copy. If the repository is private, a **public** deployment would expose all of that. Do not disable deployment protection, and do not add a custom domain, without deciding that deliberately (the current protection mode does not cover custom domains).

## Before and after: gallery parity

The custom gallery was removed only after every story and behavior below was reproduced and checked in Storybook (see the verification list in the PR).

| Old gallery                                                                                                   | Storybook                                                                                                                        |
| ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Button: controls (label, variant, size, disabled, loading), 18-cell state grid, variant × size × state matrix | Components/Actions/Button: Playground (same controls), Variants, Sizes, States, Variant size state matrix, Light dark comparison |
| IconButton: controls, state grid                                                                              | Components/Actions/IconButton: Playground, States, Glyphs, Light dark comparison                                                 |
| Card: controls, static / interactive / long text                                                              | Components/Surfaces/Card: Playground, Static, Interactive, Long text, Static vs interactive, Light dark comparison               |
| SegmentedControl: value and rejectChange controls                                                             | Components/Inputs/SegmentedControl: Playground, Selected states, Declined change, Light dark comparison                          |
| Badge: controls, tones                                                                                        | Components/Feedback/Badge: Playground, Tones, Status examples, Light dark comparison                                             |
| Dialog: title, dismissible, longContent controls                                                              | Components/Overlays/Dialog: Playground, Dismissible, Compulsory, Long content (the last three open automatically)                |
| G&G Foundations (palette, contrast, geometry, buttons)                                                        | Projects/Grim & Glimmer/Foundations: Palette, Contrast, Geometry and elevation, Buttons on theme                                 |
| G&G Typography (typefaces, hierarchy, sample cards)                                                           | Projects/Grim & Glimmer/Foundations: Typography typefaces, hierarchy, sample puzzle cards                                        |
| G&G Overview (home, game, card statuses)                                                                      | Collection: Home screen, Card statuses, Long titles. Gameplay: Game screen, Board modes                                          |
| G&G Modal flow (tutorial, confirmation, success)                                                              | Dialogs: Modal flow (with `confirmUntouched` control), plus Tutorial, Success and Discard confirmation as separate stories       |
| Theme select (auto-discovered)                                                                                | Toolbar Theme (auto-discovered, plus **Auto**)                                                                                   |
| Mode select                                                                                                   | Toolbar Mode                                                                                                                     |
| Viewport: full / 768 / 375 container width                                                                    | Toolbar Viewport: 320 / 375 / 430 / 768 / 1280, a real frame resize                                                              |
| Event log                                                                                                     | Actions panel (`fn()` callbacks)                                                                                                 |
| URL hash state                                                                                                | Storybook URL (story id, args, globals)                                                                                          |
| Edge-to-edge screens (`bleed`)                                                                                | `parameters.nlStage: 'bleed'` and `compareModes(..., { bleed: true })`                                                           |
| Build check: every theme and font in the bundle                                                               | `scripts/check-storybook-build.mjs`: all expected stories, themes, local fonts, no network font URLs                             |
| `npm run dev`, LAN bound by default                                                                           | `npm run storybook` (localhost) and `npm run storybook:lan` (opt-in, with a warning)                                             |
| _(new)_                                                                                                       | Introduction page, Foundations/Tokens & Typography, autodocs pages, a11y panel, interaction `play` steps, Auto theme             |

## Known gaps

- **Hover, pressed and focus** cells in state grids are still **simulated** with story CSS (as before) to keep the addon set small; the playground shows the real states. A pseudo-states addon could replace this later.
- **Interaction `play` steps and a11y checks are not run in CI.** They run in the Storybook UI. Running them headlessly needs a test runner (Storybook's Vitest addon or `test-runner`) and a Playwright browser install, which I did not add.
- The old gallery's "States" and "Playground" sections are now separate stories, so one page no longer shows everything at once; use the docs pages for that.
- Hosted previews are SSO-protected and the Vercel project's Node version is 26.x (see the steps above).
- `npm audit` reports the same single moderate `minimatch` advisory as before; Storybook adds no new advisory, only more packages in the affected tree. It is dev tooling only.
- Storybook's static build warns about chunks over 500 kB; acceptable for an internal catalog.
