import type { Meta, StoryObj } from '@storybook/html-vite';
import { optionalThemeTokens, requiredThemeTokens } from '../../src/tokens/index.js';
import { el } from '../lib/dom.js';
import { compareModes } from '../lib/stage.js';

/** The nearest themed ancestor: where the tokens are resolved. */
const themed = (node: Element): Element =>
  node.closest('[data-nl-theme]') ?? document.documentElement;

/** Reads a custom property as the browser resolves it for `node`'s theme scope. */
const tokenValue = (node: Element, token: string): string =>
  getComputedStyle(themed(node)).getPropertyValue(token).trim();

/** Run once the story is attached, so computed values reflect the active theme and mode. */
function whenAttached<T extends HTMLElement>(node: T, fill: (node: T) => void): T {
  requestAnimationFrame(() => {
    if (node.isConnected) fill(node);
  });
  return node;
}

const section = (title: string, ...children: Node[]) =>
  el('section', { className: 'sb-gg-section' }, [
    el('h4', { className: 'sb-gg-h', text: title }),
    ...children,
  ]);

function colorContract(): HTMLElement {
  const list = el(
    'ul',
    { className: 'sb-tok-list' },
    requiredThemeTokens.map((token) => {
      const chip = el('span', { className: 'sb-tok-chip' });
      chip.style.background = `var(${token})`;
      const value = el('span', { className: 'sb-gg-note' });
      value.dataset.token = token;
      return el('li', { className: 'sb-tok-item' }, [
        chip,
        el('span', { className: 'sb-gg-swatch__name', text: token }),
        value,
      ]);
    }),
  );
  return whenAttached(section('Theme contract: colors every theme defines', list), (root) => {
    for (const note of root.querySelectorAll<HTMLElement>('[data-token]')) {
      note.textContent = tokenValue(root, note.dataset.token!).toUpperCase() || '(not defined)';
    }
  });
}

const SCALE = [
  '--nl-space-1',
  '--nl-space-2',
  '--nl-space-3',
  '--nl-space-4',
  '--nl-space-5',
  '--nl-space-6',
];

function foundationTokens(): HTMLElement {
  const bars = el(
    'div',
    { className: 'sb-tok-bars' },
    SCALE.map((token) => {
      const bar = el('span', { className: 'sb-tok-bar' });
      bar.style.width = `var(${token})`;
      const value = el('span', { className: 'sb-gg-note' });
      value.dataset.token = token;
      return el('div', { className: 'sb-tok-barrow' }, [el('code', { text: token }), bar, value]);
    }),
  );
  const shape = el(
    'ul',
    { className: 'sb-tok-list' },
    [
      '--nl-radius-md',
      '--nl-border-width',
      '--nl-size-control-sm',
      '--nl-size-control-md',
      '--nl-size-control-lg',
      '--nl-duration-fast',
      '--nl-focus-ring-width',
    ].map((token) => {
      const value = el('span', { className: 'sb-gg-note' });
      value.dataset.token = token;
      return el('li', { className: 'sb-tok-item sb-tok-item--plain' }, [
        el('code', { text: token }),
        value,
      ]);
    }),
  );
  return whenAttached(
    section(
      'Foundation tokens: spacing, shape, sizing, motion (neutral defaults; a theme may override)',
      bars,
      shape,
    ),
    (root) => {
      for (const note of root.querySelectorAll<HTMLElement>('[data-token]')) {
        note.textContent = tokenValue(root, note.dataset.token!);
      }
    },
  );
}

const ROLES = [
  {
    cls: 'display',
    label: 'display',
    note: 'Expressive titles',
    sample: 'Sample puzzle title',
    tokens: '--nl-font-family-display',
  },
  {
    cls: 'heading',
    label: 'heading',
    note: 'Headings',
    sample: 'Sample heading',
    tokens: '--nl-font-family-heading',
  },
  {
    cls: 'label',
    label: 'label',
    note: 'Editorial labels',
    sample: 'Editorial label',
    tokens: '--nl-font-family-label',
  },
  {
    cls: 'ui',
    label: 'ui',
    note: 'Functional text',
    sample: 'Interface text 0123456789',
    tokens: '--nl-font-family',
  },
] as const;

function typographyRoles(): HTMLElement {
  const rows = ROLES.map((role) => {
    const meta = el('span', { className: 'sb-gg-note' });
    meta.dataset.role = role.cls;
    return el('div', { className: 'sb-tok-role' }, [
      el('p', { className: 'sb-gg-note', text: `${role.label} · ${role.note} · ${role.tokens}` }),
      el('p', {
        className: `sb-tok-role__sample sb-tok-role__sample--${role.cls}`,
        text: role.sample,
      }),
      meta,
    ]);
  });
  return whenAttached(
    section(
      'Typography roles: shared components read these semantic tokens, never a font name',
      el('p', {
        className: 'sb-gg-note',
        text: 'A theme that does not define a role falls back to the UI font. Switch the toolbar theme to compare.',
      }),
      ...rows,
    ),
    (root) => {
      for (const meta of root.querySelectorAll<HTMLElement>('[data-role]')) {
        const sample = meta.previousElementSibling as HTMLElement;
        const c = getComputedStyle(sample);
        const first = (c.fontFamily.split(',')[0] ?? '').replace(/["']/g, '');
        meta.textContent = `Now: ${first} · ${c.fontWeight} · ${Math.round(parseFloat(c.fontSize) * 10) / 10}px`;
      }
    },
  );
}

const meta = {
  title: 'Foundations/Tokens & Typography',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
The design-token layer, as the **selected theme** resolves it. Switch **Theme** and **Mode** in the toolbar: the
values update, and only the stage changes (theme CSS is scoped to \`[data-nl-theme]\`).

- **Theme contract:** the ${requiredThemeTokens.length} color tokens every theme must define. Shared components read colors only through these.
- **Foundation tokens:** neutral structural defaults (spacing, shape, control sizes, motion) that any theme may override.
- **Typography roles:** optional semantic tokens (${optionalThemeTokens.filter((t) => t.includes('font-family')).join(', ')}, ...). Components read them with a fallback to the UI font, so every component works in every theme.

Fonts are theme assets: the neutral theme uses system fonts, and the Grim & Glimmer theme bundles Cormorant and
Inter. See **Projects / Grim & Glimmer / Foundations**.
`,
      },
    },
  },
  render: () => document.createElement('div'),
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const ColorContract: Story = { render: () => colorContract() };

export const FoundationTokens: Story = { render: () => foundationTokens() };

export const TypographyRoles: Story = { render: () => typographyRoles() };

/** The color contract in light and dark, side by side, for the toolbar's theme. */
export const ColorContractLightDark: Story = {
  parameters: { nlStage: 'self' },
  render: (_args, context) => compareModes(context, () => colorContract()),
};
