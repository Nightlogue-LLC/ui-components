import { applyTheme } from '../../../src/core/index.js';
import { createButton } from '../../../src/components/button/index.js';
import { el } from '../../lib/dom.js';
import { specimen } from './shared.js';
import './moonlit.css';
const star = new URL('../grim-glimmer/assets/glyph-star.png', import.meta.url).href;
const spire = new URL('../grim-glimmer/assets/glyph-spire-light.png', import.meta.url).href;
export function moonlitGlyph(kind: 'star' | 'spire' | 'maybe' | 'exclusion'): HTMLElement {
  const node = el('span', { className: 'sb-moonlit-glyph', text: kind === 'exclusion' ? '×' : '' });
  node.dataset.glyph = kind;
  node.setAttribute('role', 'img');
  node.setAttribute('aria-label', kind);
  if (kind !== 'exclusion')
    node.style.setProperty('--glyph', `url("${kind === 'spire' ? spire : star}")`);
  return node;
}
export function moonlitSpecimen(mode: 'light' | 'dark'): HTMLElement {
  const root = specimen('buttons');
  applyTheme(root, 'moonlit-oxblood', mode);
  root.classList.add('sb-moonlit');
  root
    .querySelector('h2')!
    .replaceChildren(
      'Grim ',
      el('span', { className: 'sb-moonlit-accent', text: '&' }),
      ' Glimmer',
    );
  root.querySelector('p')!.textContent = 'Moonlit Oxblood · ' + mode;
  root.append(
    el(
      'div',
      { className: 'nl-grim-glimmer-v3-row' },
      (['star', 'spire', 'maybe', 'exclusion'] as const).map((kind) =>
        el('div', {}, [moonlitGlyph(kind), el('p', { text: kind })]),
      ),
    ),
  );
  root.append(el('p', { className: 'sb-moonlit-muted', text: 'Muted supporting text' }));
  root.append(
    el('p', {}, ['Clue error: ', el('span', { className: 'sb-moonlit-error', text: '2' })]),
  );
  root.append(createButton({ label: 'Selected', variant: 'secondary' }));
  const selected = root.lastElementChild as HTMLElement;
  selected.style.borderColor = 'var(--nl-color-accent)';
  for (const name of [
    'bg',
    'surface',
    'surface-high',
    'text',
    'text-muted',
    'label',
    'accent',
    'star',
    'spire',
    'hairline',
    'error',
  ]) {
    const token = ['surface-high', 'text-muted', 'star', 'spire'].includes(name)
      ? '--nl-moonlit-' + name
      : ['label', 'hairline', 'error'].includes(name)
        ? '--nl-grim-glimmer-v3-' + name
        : '--nl-color-' + name;
    const row = el('p', {}, [el('span', { text: '■ ' }), name]);
    (row.firstElementChild as HTMLElement).style.color = `var(${token})`;
    root.append(row);
  }
  return root;
}
export function moonlitComparison(): HTMLElement {
  return el(
    'div',
    { className: 'sb-compare' },
    (['light', 'dark'] as const).flatMap((mode) => {
      const old = specimen('buttons');
      applyTheme(old, 'grim-glimmer-v3', mode);
      old.querySelector('p')!.textContent = 'Dark Plum / Light Cream · ' + mode;
      return [old, moonlitSpecimen(mode)];
    }),
  );
}
