import { createTarotDeckCard, type TarotCard } from '../../../src/projects/grim-glimmer/index.js';
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

export function fixtureDeckCard(index: number, inProgress = false): TarotCard {
  const svg = new DOMParser().parseFromString([camper, arbiter, architect][index]!, 'image/svg+xml')
    .documentElement as unknown as SVGSVGElement;
  svg.querySelector(':scope > path')?.setAttribute('data-art-part', 'canvas');
  return {
    id: ['camper', 'arbiter', 'architect'][index]!,
    title: DECK_NAMES[index]!,
    artwork: svg,
    preloadSrc: DECK_IMAGES[index]!,
    locked: index !== 0,
    inProgress: index === 0 && inProgress,
  };
}
export function createCardIllustration(options: DeckCardOptions) {
  return createTarotDeckCard({
    ...fixtureDeckCard(options.index, options.inProgress),
    onActivate: options.onOpen,
    onLocked: options.onOpen,
  });
}
