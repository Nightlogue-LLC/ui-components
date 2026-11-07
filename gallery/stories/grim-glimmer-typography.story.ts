import { applyTheme } from '../../src/core/index.js';
import { el } from '../lib/dom.js';
import type { ModeName } from '../lib/theme-tokens.js';
import { defineStory } from './types.js';

const THEME = 'grim-glimmer';

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

/** Hierarchy levels. Each row's meta line is filled with the real computed values after attach. */
const LEVELS = [
  {
    cls: 'display-lg',
    level: 'Display large',
    text: 'Ghosts & Graves',
    tokens: 'display · --nl-font-size-display-lg',
  },
  {
    cls: 'display-md',
    level: 'Display medium',
    text: 'Tents & Trees',
    tokens: 'display · --nl-font-size-display-md',
  },
  {
    cls: 'heading-lg',
    level: 'Heading large',
    text: 'Choose a puzzle',
    tokens: 'heading 600 · --nl-font-size-heading-lg',
  },
  {
    cls: 'heading-md',
    level: 'Heading medium',
    text: 'How to play',
    tokens: 'heading 600 · --nl-font-size-heading-md',
  },
  {
    cls: 'heading-sm',
    level: 'Heading small',
    text: 'Puzzle complete',
    tokens: 'heading 600 · --nl-font-size-heading-sm',
  },
  {
    cls: 'heading-soft',
    level: 'Heading, soft editorial',
    text: 'Nicely done. Another puzzle awaits.',
    tokens: 'heading 400 · --nl-font-size-heading-sm',
  },
  {
    cls: 'label',
    level: 'Editorial label',
    text: 'Collection',
    tokens: 'label · --nl-font-size-label',
  },
  {
    cls: 'ui-body',
    level: 'UI body',
    text: 'Place a tent beside every tree.',
    tokens: 'ui 400 · --nl-font-size-md',
  },
  { cls: 'ui-strong', level: 'UI control', text: 'New Game', tokens: 'ui 600 · --nl-font-size-md' },
  { cls: 'ui-small', level: 'UI small', text: 'Step 1 of 3', tokens: 'ui 400 · --nl-font-size-sm' },
  {
    cls: 'ui-numbers',
    level: 'Clues and numbers',
    text: '1 2 3 4 5  ·  12 08 31',
    tokens: 'ui 600 · tabular figures',
  },
] as const;

const family = (css: string) =>
  (css.split(',')[0] ?? '').replace(/["']/g, '').replace(/^GG /, '').trim();

function section(title: string, ...children: Node[]): HTMLElement {
  return el('section', { className: 'gal-gg-section' }, [
    el('h4', { className: 'gal-gg-h', text: title }),
    ...children,
  ]);
}

function typefaces(): HTMLElement {
  return section(
    'Typefaces',
    ...TYPEFACES.map((face) => {
      const status = el('span', { className: 'gal-ty-status', text: 'checking…' });
      status.dataset.check = face.check;
      return el('div', { className: 'gal-ty-face' }, [
        el('p', { className: 'gal-ty-face__name' }, [
          face.name,
          el('span', { className: 'gal-ty-face__role', text: ` · ${face.role}` }),
        ]),
        el('p', { className: `gal-ty-spec gal-ty-spec--${face.cls}`, text: face.sample }),
        ...face.lines.map((line) =>
          el('p', { className: `gal-ty-alphabet gal-ty-spec--${face.cls}`, text: line }),
        ),
        el('p', {
          className: 'gal-gg-note',
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
      const meta = el('span', { className: 'gal-gg-note' });
      meta.dataset.level = row.cls;
      return el('div', { className: 'gal-ty-row' }, [
        el('p', { className: 'gal-ty-row__level', text: row.level }),
        el('p', { className: `gal-ty-sample gal-ty-${row.cls}`, text: row.text }),
        el('p', { className: 'gal-gg-note', text: row.tokens }),
        meta,
      ]);
    }),
  );
}

/** Fills the meta lines with the real computed values and reports whether each face loaded. */
async function annotate(panel: HTMLElement): Promise<void> {
  for (const meta of panel.querySelectorAll<HTMLElement>('[data-level]')) {
    const sample = meta.parentElement?.querySelector<HTMLElement>('.gal-ty-sample');
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

function panel(mode: ModeName): HTMLElement {
  const root = el('div', { className: 'gal-gg-panel' }, [
    el('h3', { className: 'gal-gg-mode', text: mode === 'light' ? 'Light' : 'Dark' }),
    typefaces(),
    hierarchy(),
  ]);
  applyTheme(root, THEME, mode);
  requestAnimationFrame(() => {
    if (root.isConnected) void annotate(root);
  });
  return root;
}

export default defineStory({
  id: 'grim-glimmer-typography',
  title: 'G&G · Typography',
  description:
    'The approved type system, light and dark side by side: Cormorant Upright for puzzle titles, Cormorant Infant for headings, Cormorant SC for editorial labels, Inter for functional UI. Sizes are the live computed values at the current viewport width.',
  scope: 'self',
  showLog: false,
  controls: [],
  defaults: {},
  render: () => el('div', { className: 'gal-gg-panels' }, [panel('light'), panel('dark')]),
});
