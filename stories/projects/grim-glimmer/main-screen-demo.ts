import { createIcon } from '../../../src/components/icon/index.js';
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
          card('Stars & Spires', 'continue', 1, true),
          card('Ghosts & Graves', 'coming-soon', 4),
          card('Placeholder puzzle', 'coming-soon', 5),
        ],
        { label: 'Puzzles' },
      ),
    ],
  );
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
      collection: createIcon('home'),
      achievements: createIcon('achievements'),
      settings: createIcon('settings'),
    },
    onNavigate: (next) => updateMainScreen(screen, next),
  });
  screen.classList.add('sb-grim-main-screen');
  return screen;
}
