import { createButton } from '../../../src/components/button/index.js';
import { el } from '../../lib/dom.js';
import { createCardCarousel, type CarouselOptions } from './home-carousel.js';
import {
  createFaceDownCard,
  createDailyDraw,
  createHomeLogo,
  createHomeNav,
  createStatusLine,
  star,
} from './home-parts.js';
import { createHomeMotion } from './home-motion.js';
import { DAILY_DRAW_ENABLED, type DailyState, type DailyPlaceholder } from './home-model.js';
class HomeHost extends HTMLElement {
  start?: () => void;
  cleanup?: () => void;
  connectedCallback() {
    this.start?.();
  }
  disconnectedCallback() {
    this.cleanup?.();
  }
}
if (!customElements.get('gg-v4-home-host')) customElements.define('gg-v4-home-host', HomeHost);
export function homeHost(className: string) {
  const node = document.createElement('gg-v4-home-host') as HomeHost;
  node.className = `gg-v4-scope ${className}`;
  return node;
}
export interface HomeOptions extends CarouselOptions {
  date?: string;
  daily?: DailyState;
  dailyEnabled?: boolean;
  solved?: number;
  streak?: number;
  launch?: 'cold' | 'return';
  ambient?: boolean;
  onDaily?: (daily: DailyPlaceholder) => void;
  onNavigate?: (page: string) => void;
}
export function createAtmosphere() {
  const root = el('div', { className: 'gg-v4-atmosphere' });
  root.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < 5; i++) {
    const dot = el('span', { className: 'gg-v4-ambient-star' }, [star()]);
    dot.dataset.star = String(i);
    root.append(dot);
  }
  return root;
}
export function createHome(options: HomeOptions = {}) {
  const root = homeHost('gg-v4-home');
  root.dataset.reducedMotion = String(options.reducedMotion ?? false);
  const motion = createHomeMotion(root, options);
  const carousel = createCardCarousel({
    ...options,
    onLocked: (node) => {
      motion.shake(node);
      options.onLocked?.(node);
    },
  });
  const daily =
    (options.dailyEnabled ?? DAILY_DRAW_ENABLED) ? (options.daily ?? 'unplayed') : 'hidden';
  root.append(
    createAtmosphere(),
    createHomeLogo(),
    createStatusLine(options.solved, options.streak),
    createDailyDraw({ date: options.date ?? '2026-11-10', state: daily, onOpen: options.onDaily }),
    carousel.element,
    createHomeNav(options.onNavigate),
  );
  root.start = () => {
    carousel.mount();
    motion.mount();
  };
  root.cleanup = () => {
    carousel.dispose();
    motion.dispose();
  };
  return root;
}
export function createEntrancePreview(options: HomeOptions = {}) {
  const host = homeHost('gg-v4-home-review');
  let home = createHome(options);
  const replay = createButton({
    label: 'Replay entrance',
    variant: 'secondary',
    onClick: () => {
      home.remove();
      home = createHome(options);
      host.append(home);
    },
  });
  host.append(el('div', { className: 'gg-v4-home-review-bar' }, [replay]), home);
  return host;
}
export function createCarouselPreview(options: HomeOptions = {}) {
  const root = homeHost('gg-v4-carousel-review');
  root.dataset.reducedMotion = String(options.reducedMotion ?? false);
  const motion = createHomeMotion(root, { ...options, launch: 'return' });
  const carousel = createCardCarousel({
    ...options,
    onLocked: (node) => {
      motion.shake(node);
      options.onLocked?.(node);
    },
  });
  root.append(carousel.element);
  root.start = () => {
    carousel.mount();
    motion.mount();
  };
  root.cleanup = () => {
    carousel.dispose();
    motion.dispose();
  };
  return root;
}

export function createFaceDownPreview(options: HomeOptions = {}) {
  const root = homeHost('gg-v4-card-review');
  root.dataset.reducedMotion = String(options.reducedMotion ?? false);
  const motion = createHomeMotion(root, { ...options, launch: 'return', ambient: false });
  const card = createFaceDownCard('II', () => {
    if (options.haptics) options.tick?.();
    motion.shake(card);
    options.onLocked?.(card);
  });
  root.append(card);
  root.start = () => motion.mount();
  root.cleanup = () => motion.dispose();
  return root;
}
