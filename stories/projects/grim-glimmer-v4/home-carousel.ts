import { createIconButton } from '../../../src/components/icon-button/index.js';
import { createHeroCard, createFaceDownCard, star, type HeroOptions } from './home-parts.js';
import { el } from '../../lib/dom.js';
export interface CarouselOptions extends HeroOptions {
  haptics?: boolean;
  tick?: () => void;
  reducedMotion?: boolean;
  onCard?: (index: number) => void;
  onLocked?: (node: HTMLElement) => void;
}
/** Three logical cards; inert edge clones give the initial hero two real peeks. */
export function createCardCarousel(options: CarouselOptions = {}) {
  const root = el('section', { className: 'gg-v4-carousel' });
  root.setAttribute('aria-label', 'Puzzle carousel');
  const list = el('ul', { className: 'gg-v4-carousel-track' });
  list.setAttribute('aria-label', 'Puzzles');
  list.dir = 'ltr';
  const cards = [
    createHeroCard(options),
    createFaceDownCard('II', () => locked(1)),
    createFaceDownCard('III', () => locked(2)),
  ];
  function locked(index: number) {
    if (options.haptics) options.tick?.();
    options.onLocked?.(cards[index]!);
  }
  const items = cards.map((card, index) => {
    const li = el('li', { className: 'gg-v4-carousel-item' }, [card]);
    li.dataset.logical = String(index);
    return li;
  });
  function clone(item: HTMLElement) {
    const node = item.cloneNode(true) as HTMLElement;
    node.dataset.clone = 'true';
    node.setAttribute('aria-hidden', 'true');
    node.inert = true;
    node.querySelectorAll('button').forEach((button) => {
      button.tabIndex = -1;
      button.disabled = true;
    });
    return node;
  }
  const leading = clone(items[2]!),
    trailing = clone(items[0]!);
  list.append(leading, ...items, trailing);
  const indicators = el('div', { className: 'gg-v4-carousel-indicators' });
  indicators.setAttribute('role', 'group');
  indicators.setAttribute('aria-label', 'Choose a card');
  const live = el('span', { className: 'nl-grim-glimmer-visually-hidden' });
  live.setAttribute('role', 'status');
  live.setAttribute('aria-live', 'polite');
  let selected = 0,
    timer: ReturnType<typeof setTimeout> | undefined,
    observer: ResizeObserver | undefined,
    mounted = false,
    frame = 0;
  const buttons = cards.map((_, index) => {
    const button = createIconButton({
      label: `Show card ${['I', 'II', 'III'][index]}`,
      icon: star(),
      onClick: () => go(index),
    });
    indicators.append(button);
    return button;
  });
  function reduced() {
    return (
      options.reducedMotion === true ||
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
    );
  }
  function center(node: HTMLElement) {
    return Math.max(0, node.offsetLeft + (node.offsetWidth - list.clientWidth) / 2);
  }
  function paint() {
    buttons.forEach((button, index) =>
      button.setAttribute('aria-pressed', String(index === selected)),
    );
    live.textContent = `Card ${selected + 1} of 3. ${selected === 0 ? 'Stars & Spires, playable' : 'Unrevealed, locked'}`;
  }
  function appearance() {
    const middle = list.scrollLeft + list.clientWidth / 2;
    [...list.children].forEach((child) => {
      const node = child as HTMLElement;
      const distance =
        Math.abs(node.offsetLeft + node.offsetWidth / 2 - middle) /
        Math.max(1, node.offsetWidth + 20);
      const side = Math.min(1, distance);
      node.style.setProperty('--gg-v4-card-scale', String(1 - side * 0.08));
      node.style.setProperty('--gg-v4-card-opacity', String(1 - side * 0.3));
    });
  }
  function place(node: HTMLElement, behavior: ScrollBehavior = 'instant') {
    const left = center(node);
    if (typeof list.scrollTo === 'function') list.scrollTo({ left, behavior });
    else list.scrollLeft = left;
  }
  function settle() {
    clearTimeout(timer);
    timer = undefined;
    if (!mounted || !list.clientWidth) return;
    const nearest = [...list.children].reduce((best, node) =>
      Math.abs(center(node as HTMLElement) - list.scrollLeft) <
      Math.abs(center(best as HTMLElement) - list.scrollLeft)
        ? node
        : best,
    ) as HTMLElement;
    const logical = Number(nearest.dataset.logical);
    if (nearest.dataset.clone) place(items[logical]!);
    if (logical !== selected) {
      selected = logical;
      paint();
      if (options.haptics) options.tick?.();
      options.onCard?.(logical);
    }
    appearance();
  }
  function scroll() {
    if (frame === 0)
      frame = requestAnimationFrame(() => {
        frame = 0;
        appearance();
      });
    clearTimeout(timer);
    timer = setTimeout(settle, 140);
  }
  function go(index: number, focus = false) {
    const next = Math.max(0, Math.min(2, index));
    place(items[next]!, reduced() ? 'instant' : 'smooth');
    if (focus)
      cards[next]!.querySelector<HTMLButtonElement>('.gg-v4-tarot-hit')?.focus({
        preventScroll: true,
      });
    if (focus && next !== 0) cards[next]!.focus({ preventScroll: true });
    if (reduced()) settle();
  }
  function keyboard(event: KeyboardEvent) {
    const index = items.findIndex((item) => item.contains(event.target as Node));
    if (index < 0) return;
    const next =
      event.key === 'ArrowRight'
        ? Math.min(2, index + 1)
        : event.key === 'ArrowLeft'
          ? Math.max(0, index - 1)
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? 2
              : -1;
    if (next < 0) return;
    event.preventDefault();
    go(next, true);
  }
  function resize() {
    place(items[selected]!);
    appearance();
  }
  function focus(event: FocusEvent) {
    const index = items.findIndex((item) => item.contains(event.target as Node));
    if (index >= 0) go(index);
  }
  root.append(list, indicators, live);
  paint();
  return {
    element: root,
    list,
    cards,
    mount() {
      if (mounted) return;
      mounted = true;
      resize();
      list.addEventListener('scroll', scroll, { passive: true });
      list.addEventListener('scrollend', settle);
      list.addEventListener('keydown', keyboard);
      list.addEventListener('focusin', focus);
      window.addEventListener('resize', resize);
      if (typeof ResizeObserver === 'function') {
        observer = new ResizeObserver(resize);
        observer.observe(list);
      }
    },
    dispose() {
      mounted = false;
      clearTimeout(timer);
      cancelAnimationFrame(frame);
      frame = 0;
      observer?.disconnect();
      list.removeEventListener('scroll', scroll);
      list.removeEventListener('scrollend', settle);
      list.removeEventListener('keydown', keyboard);
      list.removeEventListener('focusin', focus);
      window.removeEventListener('resize', resize);
    },
    go,
    settle,
    selected: () => selected,
  };
}
