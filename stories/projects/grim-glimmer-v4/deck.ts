import {
  createTarotDeck,
  type TarotDeckOptions,
} from '../../../src/projects/grim-glimmer/index.js';
import { fixtureDeckCard } from './deck-card.js';
import { dragPoses, transform } from './deck-model.js';
export interface DeckOptions {
  initialCard?: number;
  dx?: number;
  reducedMotion?: boolean;
  firstVisit?: boolean;
  launch?: 'cold' | 'return';
  haptics?: boolean;
  inProgress?: boolean;
  epithet?: string;
  tick?: () => void;
  onCard?: (index: number) => void;
  onPlay?: () => void;
  onResume?: () => void;
  onNewPuzzle?: () => void;
  onLocked?: () => void;
}

export function fixtureDeckOptions(options: DeckOptions = {}): TarotDeckOptions {
  const index = ((Math.trunc(options.initialCard ?? 0) % 3) + 3) % 3;
  const cards = [
    fixtureDeckCard(0, options.inProgress),
    fixtureDeckCard(1),
    fixtureDeckCard(2),
  ] as const;
  return {
    ...options,
    cards,
    initialCardId: cards[index]!.id,
    onActivate: () => {
      if (options.inProgress) options.onResume?.();
      else options.onPlay?.();
    },
    onLocked: () => options.onLocked?.(),
    onCardChange: (id) => options.onCard?.(cards.findIndex((card) => card.id === id)),
  };
}
export function createDeck(options: DeckOptions = {}) {
  const config = fixtureDeckOptions(options),
    deck = createTarotDeck(config);
  function previewOffset() {
    if (!options.dx) return;
    const selected = config.cards.findIndex((card) => card.id === deck.selected());
    for (let depth = 0; depth < 3; depth++)
      deck.cards[(selected + depth) % 3]!.style.transform = transform(
        dragPoses(options.dx, 250, options.reducedMotion)[depth]!,
      );
  }
  previewOffset();
  return {
    ...deck,
    selected: () => config.cards.findIndex((card) => card.id === deck.selected()),
    cycle: (index: number) => deck.cycle(config.cards[index]!.id),
    mount() {
      deck.mount();
      previewOffset();
    },
  };
}
