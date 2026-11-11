import {
  createAppFrameHeader,
  createGameScreen,
} from '../../../src/projects/grim-glimmer/index.js';
import { createIcon } from '../../../src/components/icon/index.js';
import { createV4Board, fixture, type Size } from './board.js';
import { createControlRow } from './controls.js';
import {
  createTarotGameplayHeader,
  PUZZLE_IDENTITIES,
  type TarotHeaderOptions,
} from './tarot-header.js';
import { el } from '../../lib/dom.js';
export interface TarotPreviewOptions extends Partial<TarotHeaderOptions> {
  size?: Size;
  glyphs?: 'existing' | 'supplied';
  onBack?: () => void;
  onSettings?: () => void;
}
export function createTarotHeaderPreview(options: TarotPreviewOptions = {}) {
  const size = options.size ?? 6;
  const supplied = (options.glyphs ?? 'supplied') === 'supplied';
  // Static art approval: tentative tent styling remains a separate review decision.
  const cells = fixture(size).map((state) =>
    supplied && state === 'tentative' ? 'placed' : state,
  );
  const board = createV4Board({ size, cells, interactive: false, hint: false, conflict: false });
  if (supplied) {
    board.setAttribute(
      'aria-label',
      'Trees & Tents supplied glyph preview; illustrative, not a playable puzzle',
    );
    for (const cell of board.querySelectorAll<HTMLElement>('.nl-grim-glimmer-board__cell'))
      cell.setAttribute(
        'aria-label',
        (cell.getAttribute('aria-label') ?? '')
          .split('spire')
          .join('tree')
          .split('star')
          .join('tent'),
      );
  }
  const controls = createControlRow();
  if (supplied)
    controls.querySelector('[aria-label="Place star"]')?.setAttribute('aria-label', 'Place tent');
  const root = createGameScreen({
    appHeader: createAppFrameHeader({
      icons: { back: createIcon('back'), settings: createIcon('settings') },
      onBack: options.onBack,
      onSettings: options.onSettings,
    }),
    header: createTarotGameplayHeader({
      ...PUZZLE_IDENTITIES.camper,
      difficulty: 'Easy',
      columns: size,
      rows: size,
      ...options,
    }),
    board,
    controls,
  });
  root.classList.add('gg-v4-scope', 'gg-v4-identity-screen');
  if (supplied) root.classList.add('gg-v4-camper-glyphs');
  return root;
}
export function createGlyphSpecimens() {
  const root = el('section', { className: 'gg-v4-glyph-specimens gg-v4-scope' });
  root.setAttribute('aria-label', 'Supplied tree and tent silhouettes');
  for (const size of [24, 32, 48, 64])
    for (const kind of ['tree', 'tent']) {
      const glyph = el('span', { className: `gg-v4-camper-glyph gg-v4-camper-glyph--${kind}` });
      glyph.setAttribute('aria-hidden', 'true');
      glyph.style.setProperty('--gg-v4-specimen-size', `${size}px`);
      root.append(el('figure', {}, [glyph, el('figcaption', { text: `${kind} · ${size}px` })]));
    }
  return root;
}
