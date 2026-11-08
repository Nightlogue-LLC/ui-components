import {
  createAppSettings,
  createMainScreen,
  updateMainScreen,
  createPuzzleCollection,
  type MainPage,
} from '../../../src/projects/grim-glimmer/index.js';
import { el } from '../../lib/dom.js';
import { card } from './shared.js';

/** Approved app-owned artwork, displayed without its transparent canvas margins. */
function collectionPage(): HTMLElement {
  const wordmark = el('div', { className: 'sb-gg-wordmark' });
  wordmark.setAttribute('role', 'img');
  wordmark.setAttribute('aria-label', 'Grim & Glimmer — Puzzle Collection');
  for (const mode of ['light', 'dark']) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '237 949 1533 247');
    svg.setAttribute('class', `sb-gg-wordmark__${mode}`);
    svg.setAttribute('aria-hidden', 'true');
    const image = document.createElementNS(svg.namespaceURI, 'image');
    image.setAttribute('width', '2000');
    image.setAttribute('height', '2000');
    image.setAttribute(
      'href',
      mode === 'light'
        ? new URL('./assets/wordmark-light.png', import.meta.url).href
        : new URL('./assets/wordmark-dark.png', import.meta.url).href,
    );
    svg.append(image);
    wordmark.append(svg);
  }
  return el(
    'section',
    {
      className: 'nl-grim-glimmer-screen nl-grim-glimmer-collection-home',
    },
    [
      wordmark,
      el('div', { className: 'sb-gg-heading-group' }, [
        el('h1', {
          className: 'nl-grim-glimmer-heading nl-grim-glimmer-heading--lg',
          text: 'Choose a puzzle',
        }),
      ]),
      createPuzzleCollection(
        [
          card('Tents & Trees', 'continue', 1, true),
          card('Ghosts & Graves', 'coming-soon', 4),
          card('Placeholder puzzle', 'coming-soon', 5),
        ],
        { label: 'Puzzles' },
      ),
    ],
  );
}

/** Placeholder glyphs supplied by the story, never bundled as library artwork. */
function icon(paths: readonly string[]): SVGSVGElement {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '1.6');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  for (const d of paths) {
    const path = document.createElementNS(ns, 'path');
    path.setAttribute('d', d);
    svg.append(path);
  }
  return svg;
}

/** Visual-only navigation. No progress writes, game routes, achievements or device effects. */
export function mainScreenDemo(page: MainPage): HTMLElement {
  const achievements = el('div', { className: 'nl-grim-glimmer-main-screen__placeholder' }, [
    el('h1', { text: 'Achievements' }),
    el('p', { text: 'Your puzzle milestones will appear here.' }),
  ]);
  const settings = createAppSettings({
    state: { appearance: 'system', haptics: true, sound: false, autoFill: false, animations: true },
  });
  const screen = createMainScreen({
    value: page,
    pages: { collection: collectionPage(), achievements, settings },
    icons: {
      collection: icon(['M3 10l9-7 9 7', 'M5 9v12h14V9', 'M9 21v-7h6v7']),
      achievements: icon([
        'M8 3h8v7a4 4 0 0 1-8 0V3Z',
        'M8 5H4v3a4 4 0 0 0 4 4',
        'M16 5h4v3a4 4 0 0 1-4 4',
        'M12 14v6',
        'M8 21h8',
      ]),
      settings: icon([
        'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8',
        'M10 3h4l1 3 3 1 3-1 2 4-2 2v3l1 2-3 3-3-1-2 2h-4l-1-3-3-1-3 1-2-4 2-2v-3L2 7l3-3 3 1 2-2Z',
      ]),
    },
    onNavigate: (next) => updateMainScreen(screen, next),
  });
  screen.classList.add('sb-grim-main-screen');
  return screen;
}
