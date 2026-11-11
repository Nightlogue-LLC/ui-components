import { applyTheme } from '../../../src/core/theme.js';
import { createCard } from '../../../src/components/card/index.js';
import { createButton } from '../../../src/components/button/index.js';
import { el } from '../../lib/dom.js';
import { star } from './home-parts.js';
import './deck.css';
export const DECK_ART = new URL('./assets/trees-tents-card.png', import.meta.url).href;
const emblem = star(8);
emblem.setAttribute('fill', 'currentColor');
export const DECK_EMBLEM = `data:image/svg+xml,${encodeURIComponent(new XMLSerializer().serializeToString(emblem))}`;
export interface DeckCardOptions {
  index: number;
  inProgress?: boolean;
  epithet?: string;
  onOpen?: () => void;
  onNewPuzzle?: () => void;
}
/** Integrated artwork above a live editorial plate; no asset cropping or repainting. */
export function createCardFrame(options: DeckCardOptions) {
  const root = el('div', { className: 'gg-v4-deck-card' });
  root.dataset.card = String(options.index);
  applyTheme(root, 'moonlit-oxblood', 'dark');
  const body = el('div', { className: 'gg-v4-deck-body' });
  body.setAttribute('aria-hidden', 'true');
  const art = el('div', { className: 'gg-v4-deck-art' });
  const image = document.createElement('img');
  image.alt = '';
  image.src = options.index === 0 ? DECK_ART : DECK_EMBLEM;
  image.loading = 'eager';
  image.decoding = 'async';
  image.draggable = false;
  image.fetchPriority = 'high';
  if (options.index === 0) {
    image.width = 961;
    image.height = 1536;
  } else {
    art.style.setProperty('--deck-emblem', `url("${DECK_EMBLEM}")`);
    image.width = 32;
    image.height = 32;
    image.className = 'gg-v4-deck-emblem';
  }
  art.append(image);
  const numeral = el('span', {
    className: 'gg-v4-deck-numeral',
    text: ['I', 'II', 'III'][options.index],
  });
  const plate = el('div', { className: 'gg-v4-deck-plate' }, [
    el('span', { className: 'gg-v4-deck-heading' }, [
      numeral,
      el('span', {
        className: 'gg-v4-deck-title',
        text: options.index === 0 ? 'Trees & Tents' : 'Unrevealed',
      }),
    ]),
    el('span', {
      className: 'gg-v4-deck-epithet',
      text:
        options.index === 0
          ? (options.epithet ?? 'A quiet place to ponder')
          : 'A puzzle yet to unfold',
    }),
    el('span', {
      className: 'gg-v4-deck-status',
      text:
        options.index === 0
          ? options.inProgress
            ? 'Continue · Medium 8×8 · 03:12'
            : 'Easy · Medium · Hard'
          : 'Locked puzzle',
    }),
  ]);
  if (options.index !== 0) {
    plate.querySelector('.gg-v4-deck-epithet')?.remove();
    plate.querySelector('.gg-v4-deck-status')?.remove();
  }
  body.append(art, plate);
  const hit = createCard({
    interactive: true,
    label:
      options.index === 0
        ? options.inProgress
          ? 'Continue Trees & Tents, Medium 8 by 8'
          : 'Play Trees & Tents'
        : `Unrevealed puzzle ${options.index + 1}, locked`,
    onClick: options.onOpen,
  });
  hit.classList.add('gg-v4-deck-hit');
  if (options.index !== 0) hit.setAttribute('aria-disabled', 'true');
  const sheen = el('span', { className: 'gg-v4-deck-sheen' });
  sheen.setAttribute('aria-hidden', 'true');
  const shell = el('div', { className: 'gg-v4-deck-shell' }, [body, hit, sheen]);
  root.append(shell);
  if (options.inProgress && options.index === 0) {
    const wrap = el('div', { className: 'gg-v4-deck-new' }, [
      createButton({
        label: 'New puzzle',
        variant: 'ghost',
        size: 'sm',
        onClick: options.onNewPuzzle,
      }),
    ]);
    shell.append(wrap);
    root.dataset.continue = 'true';
  }
  return root;
}
