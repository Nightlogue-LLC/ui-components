# Shared components

Brand-neutral primitives in `src/components/`. They read colors only through the theme contract, never contain project colors or names, and never parse HTML from strings (text goes through `textContent`, icons through DOM nodes). All follow the same shape: `createX(options)` builds an element; most have `updateX(el, fullProps)` to re-apply state. Pass the **complete** props to updaters (not a partial), so state never depends on hidden history.

```ts
import {
  createButton,
  createIconButton,
  createCard,
  createSegmentedControl,
  createDialog,
  createBadge,
} from '@nightlogue-llc/ui-components';
// or per component: '@nightlogue-llc/ui-components/components/dialog'
```

Remember to load the CSS (`.../styles.css` or `.../components/<name>.css`) and a theme, and to put components inside an element that called `applyTheme(...)`.

## Button

`createButton({ label, variant?, size?, disabled?, loading?, type?, onClick? })` / `updateButton(el, props)`. Variants `primary | secondary | ghost`; sizes `sm | md | lg`. `md` is at least 44px tall and `lg` at least 52px (`sm` is not for touch-critical actions). `loading` sets `disabled` + `aria-busy` and shows a spinner. Unchanged by the Grim & Glimmer work: it is styled purely by theme tokens.

## IconButton

`createIconButton({ label, icon, variant?, disabled?, onClick? })` / `updateIconButton(el, { label, variant?, disabled? })`.

- `label` is the accessible name and is **required**; a blank label throws.
- `icon` is a DOM `Node` (e.g. an `<svg>` element). It is cloned, wrapped in an `aria-hidden` span, and no markup strings are accepted. The library ships no artwork; the app supplies it.
- Variants `secondary | ghost` (default `ghost`). At least 44x44px, even if you lower the size hook; raise it (e.g. 48px) with `--nl-icon-button-size`.

## Card

`createCard({ interactive?, label?, onClick? })` returns a `div`, or a native `<button>` when interactive. Interactive defaults to "true when `onClick` is given"; `interactive: false` ignores `onClick`.

- Compose content with `card.append(...)`. Cards hold no art, titles or status.
- An interactive card needs an accessible name: pass `label`, or include visible text.
- Because an interactive card is a `<button>`, give it **phrasing content** (`span`, `svg`, `img`) and lay it out with CSS `display`, not `div`/headings.
- Hover, pressed and focus styles apply to interactive cards only. Fills its column (`--nl-card-width`, `--nl-card-padding` hooks); elevation uses the optional `--nl-shadow-card`.

## SegmentedControl

`createSegmentedControl({ label, options, value, onChange })` / `updateSegmentedControl(el, { label, options, value })`.

- Built from **native radio inputs** in a `role="radiogroup"` named by `label`. Keyboard is the browser's radio-group behavior: Tab enters on the selected option, arrow keys move and select, Space selects. Options need full text labels (no icon-only).
- **Controlled:** when the user picks an option the control snaps back to `value` and calls `onChange(next)`. The app accepts by calling `updateSegmentedControl(el, { ..., value: next })`, or declines by doing nothing, for example while a discard confirmation is open. This is how the app, not the control, decides about confirmations.
- If only `value`/`label` changed, the existing DOM (and keyboard focus) is kept.
- Selected = accent fill; keyboard focus = a ring drawn outside the segment, so they never look alike.

## Dialog

`createDialog({ title, dismissible?, closeLabel?, onClose? })`, `openDialog(d)`, `closeDialog(d)`, `getDialogBody(d)`, `getDialogActions(d)`.

```ts
const dialog = createDialog({
  title: 'Start a new game?',
  dismissible: false,
  onClose: (why) => {},
});
getDialogBody(dialog).append(paragraph);
getDialogActions(dialog).append(cancelButton, confirmButton);
themedContainer.append(dialog); // inside the themed element so it inherits the theme
openDialog(dialog);
```

- Native `<dialog>` + `showModal()`: browser-provided focus trap, inert background, top layer. The title is the accessible name (`aria-labelledby`). Created closed and detached; it must be in the document to open.
- `onClose(reason)` fires once, after closing, with `'close-button' | 'escape' | 'backdrop' | 'programmatic'`.
- `dismissible: true` (default) honors the close button, Escape and backdrop clicks. A backdrop click only counts if the press also started on the backdrop, so dragging a text selection out of the content does not dismiss.
- `dismissible: false` is for compulsory choices: no close button, Escape and backdrop are ignored, and if the browser closes it anyway (Chrome does this on a repeated Escape) it is reopened. Only `closeDialog` closes it.
- Focus returns to the opener on close. To choose the initial focus (for example the safe choice in a confirmation), put the `autofocus` attribute on that control.
- No global listeners remain after it closes, and the dialog never touches keyboard or game controls.
- Fallback when `showModal` is missing: opens via the `open` attribute, styled as a fixed overlay, Escape handled by a temporary document listener. No focus trap or `inert` in that path. The supported Android WebView baseline has native support.
- The page behind is not scroll-locked; the dialog body scrolls (for large text) and contains its own overscroll.

## Badge

`createBadge({ label, tone? })` / `updateBadge(el, props)`. Tones `neutral | accent | muted`. A compact, non-interactive `span`; the text carries the meaning and tone is emphasis only. Do not put interactive elements inside it.

## Theme hooks

Optional per-component custom properties let a theme tune a component without overriding selectors: `--nl-button-radius`, `--nl-button-padding-x`, `--nl-icon-button-size`, `--nl-icon-button-radius`, `--nl-card-padding`, `--nl-card-width`, `--nl-segmented-control-radius`, `--nl-badge-radius`. Colors always come from the theme contract.

## How these are verified

- Unit tests per component (`*.test.ts`) cover defaults, each prop, events, text safety, focus and dismissal. jsdom has no `<dialog>` methods, so dialog tests use a small test-only polyfill that mimics native semantics (`tests/helpers/dialog-polyfill.ts`), plus the no-`showModal` fallback path.
- `tests/shared-components.test.ts` checks, from source, touch-target sizing, `:focus-visible`, reduced-motion handling, hover gating and brand neutrality.
- jsdom does not do layout and is not a real browser. Native dialog behavior, real keyboard handling and measured sizes were additionally checked in Chromium with a one-off Playwright script (not part of CI). See the PR description for the list.
