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
    'Provisional Grim & Glimmer palette, geometry and contrast results, light and dark side by side. The palette awaits visual sign-off. Typography is approved and has its own story.',
  scope: 'self',
  showLog: false,
  controls: [],
  defaults: {},
  render: () => el('div', { className: 'gal-gg-panels' }, [panel('light'), panel('dark')]),
});
