import { createRitualDraw, type RitualDrawOptions } from './ritual-draw.js';
import { createDeck, type DeckOptions } from './deck.js';
import { homeHost, createAtmosphere } from './home.js';
import { createHomeLogo, createHomeNav } from './home-parts.js';
import { createHomeMotion } from './home-motion.js';
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
  const root = homeHost('gg-v4-home gg-v4-stack-home');
  const deck = createDeck(options);
  const ambient = createHomeMotion(root, { ...options, launch: 'return' });
  root.dataset.reducedMotion = String(options.reducedMotion ?? false);
  root.append(
    createAtmosphere(),
    createHomeLogo({ tagline: false }),
    createRitualDraw({
      now: '2026-11-10T16:18:00',
      state: 'unplayed',
      reducedMotion: options.reducedMotion,
      haptics: options.haptics,
      light: options.tick,
      medium: options.tick,
      ...options.draw,
      enabled: options.dailyEnabled !== false,
    }),
    deck.element,
    createHomeNav(options.onNavigate),
  );
  root.start = () => {
    deck.mount();
    ambient.mount();
  };
  root.cleanup = () => {
    deck.dispose();
    ambient.dispose();
  };
  return root;
}
