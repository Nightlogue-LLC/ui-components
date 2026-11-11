import { createCard } from '../../components/card/index.js';
import { uniqueId } from '../../core/id.js';
import { deckElement as el } from './deck-dom.js';

export interface TarotCardState {
  id: string;
  locked?: boolean;
  inProgress?: boolean;
  /** Optional localized accessible name; the default includes Play/Continue/locked. */
  label?: string;
}
export interface TarotCard extends TarotCardState {
  title: string;
  /** Trusted app-owned vector DOM, cloned. No markup strings are parsed by the library. */
  artwork: SVGSVGElement;
  /** Optional matching source URL for eager local image preload. */
  preloadSrc?: string;
}
export interface TarotDeckCardOptions extends TarotCard {
  onActivate?: () => void;
  onLocked?: () => void;
}
const states = new WeakMap<
  HTMLElement,
  { title: string; state: TarotCardState; hit: HTMLElement }
>();
export function tarotCardLabel(title: string, state: TarotCardState): string {
  return (
    state.label ??
    (state.locked ? `${title}, locked` : `${state.inProgress ? 'Continue' : 'Play'} ${title}`)
  );
}

/** Original artwork remains app-owned. Only IDs/references on the clone are namespaced. */
export function createTarotDeckCard(options: TarotDeckCardOptions): HTMLElement {
  if (!options.id.trim() || !options.title.trim() || options.label?.trim() === '')
    throw new Error('Card identity and label must contain text');
  if (
    options.artwork.namespaceURI !== 'http://www.w3.org/2000/svg' ||
    options.artwork.localName !== 'svg'
  )
    throw new Error('Card artwork must be trusted SVG DOM');
  const root = el('div', { className: 'nl-grim-glimmer-v4 gg-v4-deck-card gg-v4-vector-card' });
  root.dataset.card = options.id;
  const body = el('div', { className: 'gg-v4-deck-body' });
  body.setAttribute('aria-hidden', 'true');
  const svg = options.artwork.cloneNode(true) as SVGSVGElement;
  const prefix = uniqueId('nl-deck-art'),
    ids = new Map<string, string>();
  for (const node of [svg, ...svg.querySelectorAll('[id]')]) {
    if (!node.id) continue;
    ids.set(node.id, `${prefix}-${node.id}`);
    node.id = `${prefix}-${node.id}`;
  }
  for (const node of [svg, ...svg.querySelectorAll('*')]) {
    for (const attr of [...node.attributes]) {
      let value = attr.value;
      for (const [id, next] of ids) {
        value = value.split(`url(#${id})`).join(`url(#${next})`);
        if (value === `#${id}`) value = `#${next}`;
      }
      if (value !== attr.value) node.setAttribute(attr.name, value);
    }
  }
  svg.classList.add('gg-v4-deck-vector');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  if (options.preloadSrc) {
    const preload = document.createElement('img');
    preload.hidden = true;
    preload.className = 'gg-v4-vector-preload';
    preload.alt = '';
    preload.src = options.preloadSrc;
    preload.loading = 'eager';
    preload.decoding = 'async';
    body.append(preload);
  }
  body.append(svg);
  const hit = createCard({
    interactive: true,
    onClick: () => {
      const state = states.get(root)?.state;
      if (!state) return;
      if (state.locked) options.onLocked?.();
      else options.onActivate?.();
    },
  });
  hit.classList.add('gg-v4-deck-hit');
  states.set(root, { title: options.title, state: { ...options }, hit });
  const sheen = el('span', { className: 'gg-v4-deck-sheen' });
  sheen.setAttribute('aria-hidden', 'true');
  root.append(el('div', { className: 'gg-v4-deck-shell' }, [body, hit, sheen]));
  updateTarotDeckCard(root, options);
  return root;
}

/** State-only update preserves original artwork and native button focus. */
export function updateTarotDeckCard(root: HTMLElement, state: TarotCardState): void {
  const config = states.get(root);
  if (config?.state.id !== state.id || state.label?.trim() === '')
    throw new Error('Expected state for this card identity');
  config.state = { ...state };
  config.hit.setAttribute('aria-label', tarotCardLabel(config.title, state));
  if (state.locked) config.hit.setAttribute('aria-disabled', 'true');
  else config.hit.removeAttribute('aria-disabled');
}
