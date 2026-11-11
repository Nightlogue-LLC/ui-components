import { createRitualDraw, type RitualDrawOptions } from './ritual-draw.js';
import { createDeck, fixtureDeckOptions, type DeckOptions } from './deck.js';
import { homeHost } from './home.js';
import { createTarotHome } from '../../../src/projects/grim-glimmer/index.js';
import { createIcon } from '../../../src/components/icon/index.js';
export interface StackHomeOptions extends DeckOptions {
  dailyEnabled?: boolean;
  draw?: RitualDrawOptions;
  onNavigate?: (page: string) => void;
}
export function createStackPreview(options: DeckOptions = {}) {
  const root = homeHost('gg-v4-deck-review');
  const deck = createDeck(options);
  root.append(deck.element);
  root.start = () => deck.mount();
  root.cleanup = () => deck.dispose();
  return root;
}
export function createStackHome(options: StackHomeOptions = {}) {
  const root = homeHost('gg-v4-home-review');
  const home = createTarotHome({
    deck: fixtureDeckOptions(options),
    dailyEnabled: options.dailyEnabled !== false,
    daily:
      options.dailyEnabled === false
        ? undefined
        : createRitualDraw({
            now: '2026-11-10T16:18:00',
            state: 'unplayed',
            reducedMotion: options.reducedMotion,
            haptics: options.haptics,
            light: options.tick,
            medium: options.tick,
            ...options.draw,
            enabled: true,
          }),
    navigation: {
      label: 'Main navigation',
      value: 'home',
      iconOnly: true,
      items: [
        { value: 'home', label: 'Home', icon: createIcon('home') },
        { value: 'achievements', label: 'Achievements', icon: createIcon('achievements') },
        { value: 'settings', label: 'Settings', icon: createIcon('settings') },
      ],
      onNavigate: (value) => options.onNavigate?.(value),
    },
  });
  root.append(home.element);
  root.start = () => home.mount();
  root.cleanup = () => home.dispose();
  return root;
}
