import { applyTheme } from '../../src/core/index.js';
import { createButton } from '../../src/components/button/index.js';
import { requiredThemeTokens } from '../../src/tokens/index.js';
import themeCss from '../../src/themes/grim-glimmer/grim-glimmer.css?raw';
import { contrastRatio } from '../lib/contrast.js';
import { contrastPairs } from '../lib/contrast-pairs.js';
import { el } from '../lib/dom.js';
import { parseThemeModes, type ModeName } from '../lib/theme-tokens.js';
import { defineStory } from './types.js';

const THEME = 'grim-glimmer';
const modes = parseThemeModes(themeCss);
const short = (token: string) => token.replace('--nl-color-', '');

function section(title: string, ...children: Node[]): HTMLElement {
  return el('section', { className: 'gal-gg-section' }, [
    el('h4', { className: 'gal-gg-h', text: title }),
    ...children,
  ]);
}

function typography(): HTMLElement {
  const sample = (cls: string, text: string, note: string) =>
    el('div', { className: 'gal-gg-type' }, [
      el('span', { className: `gal-gg-type__sample ${cls}`, text }),
      el('span', { className: 'gal-gg-note', text: note }),
    ]);
  return section(
    'Typography',
    sample('gal-gg-display-xl', 'Grim & Glimmer', 'Display XL · serif (display hook) · 32px'),
    sample('gal-gg-display-l', 'Tents & Trees', 'Display L · serif (display hook) · 24px'),
    sample('gal-gg-title', "Today's puzzle", 'Title · sans · --nl-font-size-lg, medium'),
    sample('gal-gg-body', 'Place a tent beside every tree.', 'Body · sans · --nl-font-size-md'),
    sample('gal-gg-label', 'Continue', 'Label · sans · --nl-font-size-sm, caps'),
    sample('gal-gg-numerals', '1 2 3 4 5', 'Puzzle numerals · sans · tabular figures'),
  );
}

function palette(mode: ModeName): HTMLElement {
  const values = modes[mode];
  const swatches = requiredThemeTokens.map((token) => {
    const chip = el('span', { className: 'gal-gg-swatch__chip' });
    chip.style.background = `var(${token})`;
    return el('li', { className: 'gal-gg-swatch' }, [
      chip,
      el('span', { className: 'gal-gg-swatch__name', text: short(token) }),
      el('span', { className: 'gal-gg-note', text: (values[token] ?? '?').toUpperCase() }),
    ]);
  });
  return section('Palette', el('ul', { className: 'gal-gg-swatches' }, swatches));
}

function contrast(mode: ModeName): HTMLElement {
  const values = modes[mode];
  const rows = contrastPairs.map((pair) => {
    const fg = values[pair.fg];
    const bg = values[pair.bg];
    const ratio = fg && bg ? contrastRatio(fg, bg) : 0;
    const pass = ratio >= pair.min;
    const status = !pair.enforced ? 'Exempt' : pass ? 'Pass' : 'FAIL';
    const sample = el('span', { className: 'gal-gg-contrast__sample', text: 'Aa' });
    sample.style.cssText = `color: var(${pair.fg}); background: var(${pair.bg})`;
    return el('li', { className: 'gal-gg-contrast' }, [
      sample,
      el('span', { className: 'gal-gg-contrast__label' }, [
        pair.label,
        el('span', {
          className: 'gal-gg-note',
          text: `${ratio.toFixed(2)}:1 · min ${pair.min}:1`,
        }),
      ]),
      el('span', { className: 'gal-gg-contrast__status', text: status }),
    ]);
  });
  return section('Contrast (WCAG AA)', el('ul', { className: 'gal-gg-contrast-list' }, rows));
}

function geometry(): HTMLElement {
  const box = (cls: string, text: string) => el('div', { className: `gal-gg-box ${cls}`, text });
  return section(
    'Geometry and elevation',
    el('div', { className: 'gal-gg-boxes' }, [
      box('gal-gg-box--card', 'Card · 5px radius · 1px border · --nl-shadow-card'),
      box('gal-gg-box--dialog', 'Dialog · --nl-shadow-dialog'),
    ]),
  );
}

function buttons(): HTMLElement {
  return section(
    'Button on this theme',
    el('div', { className: 'gal-gg-row' }, [
      createButton({ label: 'Primary' }),
      createButton({ label: 'Secondary', variant: 'secondary' }),
      createButton({ label: 'Ghost', variant: 'ghost' }),
      createButton({ label: 'Disabled', disabled: true }),
      createButton({ label: 'Loading', loading: true }),
    ]),
  );
}

function panel(mode: ModeName): HTMLElement {
  const root = el('div', { className: 'gal-gg-panel' }, [
    el('h3', { className: 'gal-gg-mode', text: mode === 'light' ? 'Light' : 'Dark' }),
    typography(),
    palette(mode),
    contrast(mode),
    geometry(),
    buttons(),
  ]);
  applyTheme(root, THEME, mode);
  return root;
}

export default defineStory({
  id: 'grim-glimmer-foundations',
  title: 'G&G · Foundations',
  description:
    'Provisional Grim & Glimmer palette, type, geometry and contrast results, light and dark side by side. Palette and display font await visual sign-off.',
  scope: 'self',
  showLog: false,
  controls: [],
  defaults: {},
  render: () => el('div', { className: 'gal-gg-panels' }, [panel('light'), panel('dark')]),
});
