import { createIconButton } from '../../../src/components/icon-button/index.js';
import { createIcon } from '../../../src/components/icon/index.js';
import { createButton } from '../../../src/components/button/index.js';
import { createV4Board } from './board.js';
import { createHomeNav, star } from './home-parts.js';
import { homeHost, createAtmosphere } from './home.js';
import { createHomeMotion, createLoopMotion } from './home-motion.js';
import { createMotionSystem } from './motion.js';
import { el } from '../../lib/dom.js';
export interface SupportOptions {
  reducedMotion?: boolean;
  placed?: number;
  total?: number;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  onBack?: () => void;
  onMenu?: () => void;
  onCurrent?: () => void;
  onNavigate?: (page: string) => void;
}
export function createPuzzleHeader(options: SupportOptions = {}) {
  const root = el('header', { className: 'gg-v4-puzzle-header gg-v4-scope' });
  const title = el('div', { className: 'gg-v4-puzzle-title' }, [
    el('h1', { text: 'Stars & Spires' }),
    el('span', { className: 'gg-v4-title-rule' }, [star()]),
    el('p', { text: `${options.difficulty ?? 'Easy'} · 5×5` }),
  ]);
  root.append(
    createIconButton({ label: 'Return Home', icon: createIcon('back'), onClick: options.onBack }),
    title,
    createIconButton({ label: 'Game menu', icon: createIcon('more'), onClick: options.onMenu }),
  );
  const total = Math.max(0, options.total ?? 5),
    placed = Math.min(total, Math.max(0, options.placed ?? 2));
  const progress = el('div', { className: 'gg-v4-header-progress' });
  progress.setAttribute('role', 'progressbar');
  progress.setAttribute('aria-label', 'Confirmed stars placed');
  progress.setAttribute('aria-valuemin', '0');
  progress.setAttribute('aria-valuemax', String(total || 1));
  progress.setAttribute('aria-valuenow', String(placed));
  progress.setAttribute(
    'aria-valuetext',
    total
      ? `${placed} of ${total} confirmed stars placed; not a validation of the solution`
      : 'No placement target supplied',
  );
  const fill = el('span');
  fill.style.transform = `scaleX(${total ? placed / total : 0})`;
  progress.append(fill);
  root.append(progress);
  return root;
}
export function createHeaderPreview(options: SupportOptions = {}) {
  const root = homeHost('gg-v4-support-screen');
  root.append(
    createPuzzleHeader(options),
    createV4Board({ size: 5, interactive: false, conflict: false, hint: false }),
  );
  return root;
}
export function createConstellationPath(options: SupportOptions = {}) {
  const root = homeHost('gg-v4-support-screen gg-v4-path');
  root.append(
    el('h1', { text: 'Constellation Path' }),
    el('p', { text: 'Illustrative progression · no level selection or saved progress' }),
  );
  const list = el('ol', { className: 'gg-v4-path-list' });
  list.setAttribute('aria-label', 'Sample constellation progress');
  for (let i = 0; i < 5; i++) {
    const state = i < 2 ? 'solved' : i === 2 ? 'current' : 'locked';
    const item = el('li');
    item.dataset.state = state;
    const glyph = el('span', { className: 'gg-v4-path-star' }, [star()]);
    glyph.setAttribute('aria-hidden', 'true');
    const text = el('span', {
      text: `Constellation ${['I', 'II', 'III', 'IV', 'V'][i]} · ${state}`,
    });
    item.append(glyph, text);
    if (state === 'current') {
      const ring = el('span', { className: 'gg-v4-path-ring' });
      ring.setAttribute('aria-hidden', 'true');
      glyph.append(ring);
      item.append(
        createButton({ label: 'Continue', variant: 'secondary', onClick: options.onCurrent }),
      );
    }
    list.append(item);
  }
  root.append(list, createHomeNav(options.onNavigate));
  const motion = createMotionSystem({
    hint: root.querySelector<HTMLElement>('.gg-v4-path-ring')!,
    reducedMotion: options.reducedMotion,
  });
  root.start = () => motion.mount();
  root.cleanup = () => motion.dispose();
  return root;
}
export function createBackgroundPreview(options: SupportOptions = {}) {
  const root = homeHost('gg-v4-home gg-v4-background-review');
  root.append(
    createAtmosphere(),
    el('p', { text: 'Five edge stars · static baked noise · canonical theme roles' }),
  );
  const motion = createHomeMotion(root, { ...options, launch: 'return' });
  root.start = () => motion.mount();
  root.cleanup = () => motion.dispose();
  return root;
}
export function createLoading(options: SupportOptions = {}) {
  const root = homeHost('gg-v4-support-screen gg-v4-loading');
  root.setAttribute('aria-busy', 'true');
  root.setAttribute('role', 'region');
  root.setAttribute('aria-label', 'Preparing your puzzle');
  root.append(
    createPuzzleHeader({ ...options, placed: 0, total: 0 }),
    el('p', { text: 'Preparing your puzzle…' }),
  );
  const board = el('div', { className: 'gg-v4-loading-board' });
  board.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < 25; i++) board.append(el('span'));
  const sweep = el('span', { className: 'gg-v4-loading-sweep' });
  board.append(sweep);
  root.append(board);
  const motion = createLoopMotion(
    () => [
      {
        node: sweep,
        frames: [
          { transform: 'translateX(-150%)', opacity: 0 },
          { transform: 'translateX(150%)', opacity: 1 },
        ],
        duration: 1600,
      },
    ],
    options.reducedMotion,
  );
  root.start = () => motion.mount();
  root.cleanup = () => motion.dispose();
  return root;
}
export function createEmpty(options: SupportOptions = {}) {
  const root = homeHost('gg-v4-support-screen gg-v4-empty');
  root.append(
    el('h1', { text: 'Achievements' }),
    createIcon('achievements'),
    el('p', { text: 'No constellations charted yet.' }),
    createHomeNav(options.onNavigate),
  );
  return root;
}
