import { createCard } from '../../../src/components/card/index.js';
import { uniqueId } from '../../../src/core/id.js';
import { el } from '../../lib/dom.js';
import camper from './assets/camper.svg?raw';
import arbiter from './assets/arbiter.svg?raw';
import architect from './assets/architect.svg?raw';
import './deck.css';
export const DECK_ART = new URL('./assets/camper.svg', import.meta.url).href;
export const DECK_IMAGES = [
  DECK_ART,
  new URL('./assets/arbiter.svg', import.meta.url).href,
  new URL('./assets/architect.svg', import.meta.url).href,
];
export const DECK_NAMES = ['The Camper', 'The Arbiter', 'The Architect'] as const;
export interface DeckCardOptions {
  index: number;
  inProgress?: boolean;
  epithet?: string;
  onOpen?: () => void;
  onNewPuzzle?: () => void;
}
/** Trusted local SVGs, with per-instance IDs for safe repeated comparison panes. */
export function createCardIllustration(options: DeckCardOptions) {
  const root = el('div', { className: 'gg-v4-deck-card gg-v4-vector-card' });
  root.dataset.card = String(options.index);
  const body = el('div', { className: 'gg-v4-deck-body' });
  body.setAttribute('aria-hidden', 'true');
  const source = new DOMParser().parseFromString(
    [camper, arbiter, architect][options.index]!,
    'image/svg+xml',
  );
  const svg = document.importNode(source.documentElement, true) as unknown as SVGSVGElement;
  const prefix = uniqueId('gg-v4-art');
  const ids = new Map<string, string>();
  svg.querySelectorAll('[id]').forEach((node) => {
    const id = node.id;
    ids.set(id, `${prefix}-${id}`);
    node.id = `${prefix}-${id}`;
  });
  svg.querySelectorAll('*').forEach((node) => {
    for (const attr of [...node.attributes]) {
      let value = attr.value;
      for (const [id, next] of ids) {
        value = value.split(`url(#${id})`).join(`url(#${next})`);
        if (value === `#${id}`) value = `#${next}`;
      }
      if (value !== attr.value) node.setAttribute(attr.name, value);
    }
  });
  svg.classList.add('gg-v4-deck-vector');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  const preload = document.createElement('img');
  preload.hidden = true;
  preload.className = 'gg-v4-vector-preload';
  preload.alt = '';
  preload.src = DECK_IMAGES[options.index]!;
  preload.loading = 'eager';
  preload.decoding = 'async';
  body.append(preload, svg);
  const hit = createCard({
    interactive: true,
    label:
      options.index === 0
        ? `${options.inProgress ? 'Continue' : 'Play'} The Camper`
        : `${DECK_NAMES[options.index]}, locked`,
    onClick: options.onOpen,
  });
  hit.classList.add('gg-v4-deck-hit');
  if (options.index !== 0) hit.setAttribute('aria-disabled', 'true');
  const sheen = el('span', { className: 'gg-v4-deck-sheen' });
  sheen.setAttribute('aria-hidden', 'true');
  root.append(el('div', { className: 'gg-v4-deck-shell' }, [body, hit, sheen]));
  return root;
}
