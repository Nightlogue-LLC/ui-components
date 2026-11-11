import { createCard } from '../../../src/components/card/index.js';
import { createButton } from '../../../src/components/button/index.js';
import { createIcon } from '../../../src/components/icon/index.js';
import { createBottomNav } from '../../../src/components/bottom-nav/index.js';
import { previewBoard } from '../grim-glimmer/shared.js';
import { el } from '../../lib/dom.js';
import {
  moonPhase,
  dailyPlaceholder,
  type DailyState,
  type DailyPlaceholder,
} from './home-model.js';
import './home.css';
export const NS = 'http://www.w3.org/2000/svg';
export function svgPart(tag: string, attrs: Record<string, string>) {
  const node = document.createElementNS(NS, tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  return node;
}
export function star(points: 4 | 8 = 4) {
  const svg = svgPart('svg', { viewBox: '0 0 32 32', 'aria-hidden': 'true', focusable: 'false' });
  const vertices = Array.from({ length: points * 2 }, (_, i) => {
    const angle = (i * Math.PI) / points - Math.PI / 2,
      r = i % 2 ? 5 : 15;
    return `${16 + Math.cos(angle) * r},${16 + Math.sin(angle) * r}`;
  }).join(' ');
  svg.append(svgPart('polygon', { points: vertices }));
  return svg;
}
/** Additive story utility; no production shape token is introduced. */
export function createArchFrame(content: Node) {
  const frame = el('div', { className: 'gg-v4-arch' });
  frame.append(content);
  return frame;
}
export function createHomeLogo(options: { tagline?: boolean } = {}) {
  const root = el('header', { className: 'gg-v4-home-logo' });
  const mark = el('div', { className: 'sb-gg-wordmark' });
  mark.setAttribute('role', 'img');
  mark.setAttribute('aria-label', 'Grim & Glimmer');
  for (const mode of ['light', 'dark'] as const) {
    const svg = svgPart('svg', {
      viewBox: '237 949 1533 247',
      class: `sb-gg-wordmark__${mode}`,
      'aria-hidden': 'true',
    });
    svg.append(
      svgPart('image', {
        width: '2000',
        height: '2000',
        href:
          mode === 'light'
            ? new URL('../grim-glimmer/assets/wordmark-light.png', import.meta.url).href
            : new URL('../grim-glimmer/assets/wordmark-dark.png', import.meta.url).href,
      }),
    );
    mark.append(svg);
  }
  root.append(mark);
  if (options.tagline !== false)
    root.append(el('p', { className: 'gg-v4-home-tagline', text: 'The Puzzle Collection' }));
  return root;
}
export function createStatusLine(solved = 0, streak = 0) {
  const node = el('p', { className: 'gg-v4-home-status' });
  const count = Math.max(0, Number.isFinite(solved) ? Math.trunc(solved) : 0),
    nights = Math.max(0, Number.isFinite(streak) ? Math.trunc(streak) : 0);
  node.hidden = count === 0;
  node.textContent = count ? `${count} solved${nights ? ` · ${nights}-night streak` : ''}` : '';
  return node;
}
export function createDailyDraw(options: {
  date: string;
  state: DailyState;
  onOpen?: (daily: DailyPlaceholder) => void;
}) {
  const root = createCard({
    interactive: options.state !== 'hidden',
    label:
      options.state === 'solved'
        ? 'Tonight’s Draw, drawn'
        : options.state === 'in-progress'
          ? 'Continue Tonight’s Draw'
          : 'Tonight’s Draw',
    onClick: () => options.onOpen?.(dailyPlaceholder(options.date)),
  });
  root.classList.add('gg-v4-daily');
  root.hidden = options.state === 'hidden';
  const phase = moonPhase(options.date),
    svg = svgPart('svg', {
      viewBox: '0 0 32 32',
      'aria-hidden': 'true',
      class: 'gg-v4-daily-moon',
    });
  svg.append(
    svgPart('circle', {
      cx: '16',
      cy: '16',
      r: '12',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '1',
    }),
  );
  if (options.state === 'solved' || phase === 4)
    svg.append(svgPart('circle', { cx: '16', cy: '16', r: '10', fill: 'currentColor' }));
  else if (phase !== 0) {
    const fraction = phase < 4 ? phase : 8 - phase;
    const closing = fraction === 2 ? 'L16 6' : `A7 10 0 0 ${fraction === 1 ? 0 : 1} 16 6`;
    svg.append(
      svgPart('path', {
        d: `M16 6 A10 10 0 0 1 16 26 ${closing}`,
        fill: 'currentColor',
        transform: phase > 4 ? 'translate(32 0) scale(-1 1)' : 'translate(0 0)',
      }),
    );
  }
  const chevron = createIcon('chevronDown');
  chevron.classList.add('gg-v4-daily-chevron');
  root.dataset.phase = String(phase);
  root.append(
    svg,
    el('span', { className: 'gg-v4-daily-copy' }, [
      el('span', { text: 'Tonight’s Draw' }),
      el('span', {
        text:
          options.state === 'solved'
            ? 'Drawn'
            : options.state === 'in-progress'
              ? 'Continue your draw'
              : options.date,
      }),
    ]),
    chevron,
  );
  return root;
}
export interface HeroOptions {
  reducedMotion?: boolean;
  inProgress?: boolean;
  title?: string;
  onPlay?: () => void;
  onResume?: () => void;
  onNewPuzzle?: () => void;
}
export function createHeroCard(options: HeroOptions = {}) {
  const root = createCard();
  root.classList.add('gg-v4-tarot', 'gg-v4-hero');
  root.dataset.reducedMotion = String(options.reducedMotion ?? false);
  const title = options.title ?? 'Stars & Spires';
  const visual = el('div', { className: 'gg-v4-tarot-visual' });
  visual.setAttribute('aria-hidden', 'true');
  const preview = previewBoard(1, true);
  preview.classList.add('gg-v4-tarot-board');
  visual.append(
    el('span', { className: 'gg-v4-tarot-numeral', text: 'I' }),
    createArchFrame(preview),
    el('span', { className: 'gg-v4-tarot-title', text: title }),
    el('span', {
      className: 'gg-v4-tarot-detail',
      text: options.inProgress ? 'Continue · Medium 8×8 · 03:12' : 'Easy · Medium · Hard',
    }),
  );
  const hit = createCard({
    interactive: true,
    label: options.inProgress
      ? `Continue ${title}, Medium 8 by 8, 3 minutes 12 seconds`
      : `Play ${title}`,
    onClick: () => (options.inProgress ? options.onResume?.() : options.onPlay?.()),
  });
  hit.classList.add('gg-v4-tarot-hit');
  const sheen = el('span', { className: 'gg-v4-tarot-sheen' });
  sheen.setAttribute('aria-hidden', 'true');
  root.append(visual, hit, sheen);
  if (options.inProgress) {
    const fresh = createButton({
      label: 'New puzzle',
      variant: 'ghost',
      size: 'sm',
      onClick: options.onNewPuzzle,
    });
    fresh.classList.add('gg-v4-tarot-new');
    root.append(el('div', { className: 'gg-v4-tarot-new-wrap' }, [fresh]));
    root.dataset.continue = 'true';
  }
  return root;
}
export function createFaceDownCard(numeral: 'II' | 'III', onLocked?: () => void) {
  const root = createCard({
    interactive: true,
    label: `Unrevealed puzzle ${numeral}, locked, not yet available`,
    onClick: onLocked,
  });
  root.classList.add('gg-v4-tarot', 'gg-v4-face-down');
  root.setAttribute('aria-disabled', 'true');
  const visual = el('span', { className: 'gg-v4-tarot-visual' });
  visual.setAttribute('aria-hidden', 'true');
  const seal = el('span', { className: 'gg-v4-tarot-seal' }, [star(8)]);
  visual.append(
    el('span', { className: 'gg-v4-tarot-numeral', text: numeral }),
    seal,
    el('span', { className: 'gg-v4-tarot-detail', text: 'Unrevealed' }),
  );
  root.append(visual);
  return root;
}
export function createHomeNav(onNavigate?: (page: string) => void) {
  const nav = createBottomNav({
    label: 'Main navigation',
    value: 'home',
    iconOnly: true,
    items: [
      { value: 'home', label: 'Home', icon: createIcon('home') },
      { value: 'achievements', label: 'Achievements', icon: createIcon('achievements') },
      { value: 'settings', label: 'Settings', icon: createIcon('settings') },
    ],
    onNavigate: (value) => onNavigate?.(value),
  });
  nav.classList.add('gg-v4-home-nav');
  return nav;
}
