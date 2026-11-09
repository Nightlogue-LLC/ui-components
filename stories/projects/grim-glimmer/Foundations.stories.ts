import type { Meta, StoryObj } from '@storybook/html-vite';
import { createPuzzleCollection } from '../../../src/projects/grim-glimmer/index.js';
import { createButton } from '../../../src/components/button/index.js';
import { requiredThemeTokens } from '../../../src/tokens/index.js';
import themeCss from '../../../src/themes/grim-glimmer/grim-glimmer.css?raw';
import { contrastRatio } from '../../lib/contrast.js';
import { contrastPairs } from '../../lib/contrast-pairs.js';
import { el } from '../../lib/dom.js';
import { compareModes } from '../../lib/stage.js';
import { parseThemeModes, type ModeName } from '../../lib/theme-tokens.js';
import { THEME, sampleCards } from './shared.js';

const modes = parseThemeModes(themeCss);
const short = (token: string) => token.replace('--nl-color-', '');

function section(title: string, ...children: Node[]): HTMLElement {
  return el('section', { className: 'sb-gg-section' }, [
    el('h4', { className: 'sb-gg-h', text: title }),
    ...children,
  ]);
}

function palette(mode: ModeName): HTMLElement {
  const values = modes[mode];
  const swatches = requiredThemeTokens.map((token) => {
    const chip = el('span', { className: 'sb-gg-swatch__chip' });
    chip.style.background = `var(${token})`;
    return el('li', { className: 'sb-gg-swatch' }, [
      chip,
      el('span', { className: 'sb-gg-swatch__name', text: short(token) }),
      el('span', { className: 'sb-gg-note', text: (values[token] ?? '?').toUpperCase() }),
    ]);
  });
  return section('Palette', el('ul', { className: 'sb-gg-swatches' }, swatches));
}

function contrast(mode: ModeName): HTMLElement {
  const values = modes[mode];
  const rows = contrastPairs.map((pair) => {
    const fg = values[pair.fg];
    const bg = values[pair.bg];
    const ratio = fg && bg ? contrastRatio(fg, bg) : 0;
    const pass = ratio >= pair.min;
    const status = !pair.enforced ? 'Exempt' : pass ? 'Pass' : 'FAIL';
    const sample = el('span', { className: 'sb-gg-contrast__sample', text: 'Aa' });
    sample.style.cssText = `color: var(${pair.fg}); background: var(${pair.bg})`;
    return el('li', { className: 'sb-gg-contrast' }, [
      sample,
      el('span', { className: 'sb-gg-contrast__label' }, [
        pair.label,
        el('span', {
          className: 'sb-gg-note',
          text: `${ratio.toFixed(2)}:1 · min ${pair.min}:1`,
        }),
      ]),
      el('span', { className: 'sb-gg-contrast__status', text: status }),
    ]);
  });
  return section('Contrast (WCAG AA)', el('ul', { className: 'sb-gg-contrast-list' }, rows));
}

function geometry(): HTMLElement {
  const box = (cls: string, text: string) => el('div', { className: `sb-gg-box ${cls}`, text });
  return section(
    'Geometry and elevation',
    el('div', { className: 'sb-gg-boxes' }, [
      box('sb-gg-box--card', 'Card · 5px radius · 1px border · --nl-shadow-card'),
      box('sb-gg-box--dialog', 'Dialog · --nl-shadow-dialog'),
    ]),
  );
}

function buttons(): HTMLElement {
  return section(
    'Button on this theme',
    el('div', { className: 'sb-gg-row' }, [
      createButton({ label: 'Primary' }),
      createButton({ label: 'Secondary', variant: 'secondary' }),
      createButton({ label: 'Ghost', variant: 'ghost' }),
      createButton({ label: 'Disabled', disabled: true }),
      createButton({ label: 'Loading', loading: true }),
    ]),
  );
}

/** The four approved typefaces, mapped to their semantic role and the face a check must find. */
const TYPEFACES = [
  {
    cls: 'display',
    name: 'Cormorant Upright',
    role: 'Puzzle titles',
    usage: 'Collection cards and individual puzzle names',
    weights: '500',
    check: '500 24px "GG Cormorant Upright"',
    sample: 'Ghosts & Graves',
    lines: ['ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz', '0123456789 & ? ! ’ “ ”'],
  },
  {
    cls: 'heading',
    name: 'Cormorant Infant',
    role: 'Primary headings',
    usage: 'Screen headings, section titles, modal headings, success messages',
    weights: '600 · 400',
    check: '600 24px "GG Cormorant Infant"',
    sample: 'Choose a puzzle',
    lines: ['ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz', '0123456789 & ? ! ’ “ ”'],
  },
  {
    cls: 'label',
    name: 'Cormorant SC',
    role: 'Editorial labels',
    usage: 'Small uppercase labels, category headings, decorative supporting text',
    weights: '600',
    check: '600 16px "GG Cormorant SC"',
    sample: 'Collection · Chapter One',
    lines: ['ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz', '0123456789 & ? !'],
  },
  {
    cls: 'ui',
    name: 'Inter',
    role: 'Functional UI',
    usage: 'Buttons, navigation, difficulty selectors, instructions, settings, clues and numbers',
    weights: '400 · 600',
    check: '600 16px "GG Inter"',
    sample: 'Start new game',
    lines: ['ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz', '0123456789 & ? ! ’ “ ”'],
  },
] as const;

/**
 * Hierarchy levels, rendered with the SAME classes app markup uses (project CSS), so this story
 * shows what an app gets. Each row's meta line is filled with the real computed values after attach.
 */
const LEVELS = [
  {
    id: 'display-lg',
    cls: 'nl-grim-glimmer-puzzle-title nl-grim-glimmer-puzzle-title--lg',
    level: 'Display large',
    text: 'Ghosts & Graves',
    tokens: 'display · --nl-font-size-display-lg',
  },
  {
    id: 'display-md',
    cls: 'nl-grim-glimmer-puzzle-title',
    level: 'Display medium',
    text: 'Stars & Spires',
    tokens: 'display · --nl-font-size-display-md',
  },
  {
    id: 'heading-lg',
    cls: 'nl-grim-glimmer-heading nl-grim-glimmer-heading--lg',
    level: 'Heading large',
    text: 'Choose a puzzle',
    tokens: 'heading 600 · --nl-font-size-heading-lg',
  },
  {
    id: 'heading-md',
    cls: 'nl-grim-glimmer-heading',
    level: 'Heading medium',
    text: 'How to play',
    tokens: 'heading 600 · --nl-font-size-heading-md',
  },
  {
    id: 'heading-sm',
    cls: 'nl-grim-glimmer-heading nl-grim-glimmer-heading--sm',
    level: 'Heading small',
    text: 'Puzzle complete',
    tokens: 'heading 600 · --nl-font-size-heading-sm',
  },
  {
    id: 'heading-soft',
    cls: 'nl-grim-glimmer-heading nl-grim-glimmer-heading--sm nl-grim-glimmer-heading--soft',
    level: 'Heading, soft editorial',
    text: 'Nicely done. Another puzzle awaits.',
    tokens: 'heading 400 · --nl-font-size-heading-sm',
  },
  {
    id: 'label',
    cls: 'nl-grim-glimmer-eyebrow',
    level: 'Editorial label',
    text: 'Collection',
    tokens: 'label · --nl-font-size-label',
  },
  {
    id: 'ui-body',
    cls: 'nl-grim-glimmer-text',
    level: 'UI body',
    text: 'Place a tent beside every tree.',
    tokens: 'ui 400 · --nl-font-size-md',
  },
  {
    id: 'ui-strong',
    cls: 'nl-grim-glimmer-text nl-grim-glimmer-text--strong',
    level: 'UI control',
    text: 'New Game',
    tokens: 'ui 600 · --nl-font-size-md',
  },
  {
    id: 'ui-small',
    cls: 'nl-grim-glimmer-text nl-grim-glimmer-text--small',
    level: 'UI small',
    text: 'Step 1 of 3',
    tokens: 'ui 400 · --nl-font-size-sm',
  },
  {
    id: 'ui-numbers',
    cls: 'nl-grim-glimmer-numerals',
    level: 'Clues and numbers',
    text: '1 2 3 4 5  ·  12 08 31',
    tokens: 'ui 600 · tabular figures',
  },
] as const;

const family = (css: string) =>
  (css.split(',')[0] ?? '').replace(/["']/g, '').replace(/^GG /, '').trim();

function typefaces(): HTMLElement {
  return section(
    'Typefaces',
    ...TYPEFACES.map((face) => {
      const status = el('span', { className: 'sb-ty-status', text: 'checking…' });
      status.dataset.check = face.check;
      return el('div', { className: 'sb-ty-face' }, [
        el('p', { className: 'sb-ty-face__name' }, [
          face.name,
          el('span', { className: 'sb-ty-face__role', text: ` · ${face.role}` }),
        ]),
        el('p', { className: `sb-ty-spec sb-ty-spec--${face.cls}`, text: face.sample }),
        ...face.lines.map((line) =>
          el('p', { className: `sb-ty-alphabet sb-ty-spec--${face.cls}`, text: line }),
        ),
        el('p', {
          className: 'sb-gg-note',
          text: `${face.usage}. Weights loaded: ${face.weights}.`,
        }),
        status,
      ]);
    }),
  );
}

function hierarchy(): HTMLElement {
  return section(
    'Hierarchy',
    ...LEVELS.map((row) => {
      const meta = el('span', { className: 'sb-gg-note' });
      meta.dataset.level = row.id;
      return el('div', { className: 'sb-ty-row' }, [
        el('p', { className: 'sb-ty-row__level', text: row.level }),
        el('p', { className: `sb-ty-sample ${row.cls}`, text: row.text }),
        el('p', { className: 'sb-gg-note', text: row.tokens }),
        meta,
      ]);
    }),
  );
}

/** Fills the meta lines with the real computed values and reports whether each face loaded. */
async function annotate(panel: HTMLElement): Promise<void> {
  for (const meta of panel.querySelectorAll<HTMLElement>('[data-level]')) {
    const sample = meta.parentElement?.querySelector<HTMLElement>('.sb-ty-sample');
    if (!sample) continue;
    const c = getComputedStyle(sample);
    const ratio = Math.round((parseFloat(c.lineHeight) / parseFloat(c.fontSize)) * 100) / 100;
    meta.textContent = `Now: ${family(c.fontFamily)} · ${c.fontWeight} · ${Math.round(parseFloat(c.fontSize) * 10) / 10}px / ${ratio}`;
  }
  await document.fonts.ready;
  for (const status of panel.querySelectorAll<HTMLElement>('[data-check]')) {
    // Force the face to load (browsers only fetch faces something is using), then confirm.
    await document.fonts.load(status.dataset.check!);
    const ok = document.fonts.check(status.dataset.check!);
    status.textContent = ok ? 'Bundled font loaded' : 'Bundled font NOT loaded (showing fallback)';
    status.dataset.loaded = String(ok);
  }
}

/** Fills the live computed values and the "bundled font loaded" checks once the node is attached. */
function withAnnotation<T extends HTMLElement>(node: T): T {
  requestAnimationFrame(() => {
    if (node.isConnected) void annotate(node);
  });
  return node;
}

const meta = {
  title: 'Projects/Grim & Glimmer/Foundations',
  tags: ['autodocs'],
  // Project stories start on the project theme; the toolbar can still switch it.
  parameters: {
    nlTheme: THEME,
    nlStage: 'self',
    docs: {
      description: {
        component: `
Grim & Glimmer foundations, light and dark side by side. **The palette is provisional and awaits visual sign-off**; the **typography is approved** (typefaces, hierarchy and sample puzzle cards below). Values are read from the theme
stylesheet, so this page always shows what the theme currently defines.

Contrast is a checked policy (WCAG AA: 4.5:1 text, 3:1 control boundaries and the focus ring), enforced for
every project theme by \`tests/contrast.test.ts\`.
`,
      },
    },
  },
  render: () => document.createElement('div'),
} satisfies Meta;

export default meta;
type Story = StoryObj;

const both =
  (build: (mode: ModeName) => Node): Story['render'] =>
  (_args, context) =>
    compareModes(context, build, { theme: THEME });

export const Palette: Story = { render: both((mode) => palette(mode)) };

export const Contrast: Story = { render: both((mode) => contrast(mode)) };

export const GeometryAndElevation: Story = { render: both(() => geometry()) };

export const ButtonsOnTheme: Story = { render: both(() => buttons()) };

/** Each typeface with its role, weights, alphabet, and whether the bundled font actually loaded. */
export const Typefaces: Story = {
  name: 'Typography: typefaces',
  render: (_args, context) =>
    compareModes(context, () => withAnnotation(typefaces()), { theme: THEME }),
};

/** Every hierarchy level, rendered with the same classes app markup uses. */
export const TypographyHierarchy: Story = {
  name: 'Typography: hierarchy',
  render: (_args, context) =>
    compareModes(context, () => withAnnotation(hierarchy()), { theme: THEME }),
};

/** Real collection cards, including deliberately long titles: up to three whole lines, then an ellipsis. */
export const TypographySampleCards: Story = {
  name: 'Typography: sample puzzle cards',
  render: (_args, context) =>
    compareModes(
      context,
      () =>
        el('div', { className: 'nl-grim-glimmer-screen' }, [
          createPuzzleCollection(sampleCards(), { label: 'Sample puzzle cards' }),
          el('p', {
            className: 'sb-gg-note',
            text: 'Titles in the display face (Cormorant Upright), status in the label face (Cormorant SC). The last two titles are deliberately long.',
          }),
        ]),
      { theme: THEME, bleed: true },
    ),
};

import {
  MoonlitOxblood as moonlit,
  MoonlitOxbloodComparison as comparison,
  MoonlitContrast as audit,
} from './MoonlitStories.js';
export const MoonlitOxblood = moonlit;
export const MoonlitOxbloodComparison = comparison;
export const MoonlitContrast = audit;
