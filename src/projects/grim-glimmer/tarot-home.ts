import {
  createBottomNav,
  updateBottomNav,
  type BottomNavOptions,
} from '../../components/bottom-nav/index.js';
import { createLoopMotion } from '../../core/loop-motion.js';
import { createTarotDeck, type TarotDeckOptions, type TarotDeckState } from './tarot-deck.js';
import { deckElement as el, deckStar } from './deck-dom.js';

export interface TarotHomeOptions {
  deck: TarotDeckOptions;
  navigation: BottomNavOptions;
  ambient?: boolean;
  /** Off by default. The app supplies a ready widget; no daily provider is bundled. */
  dailyEnabled?: boolean;
  daily?: HTMLElement;
}
export interface TarotHomeState extends TarotDeckState {
  navigationValue?: string;
  dailyEnabled?: boolean;
  daily?: HTMLElement;
}

/** The accepted logo-free composition; data, navigation acceptance and optional daily content are app-owned. */
export function createTarotHome(options: TarotHomeOptions) {
  if (options.dailyEnabled && !options.daily)
    throw new Error('Enabled Daily Draw requires an app-owned widget');
  const root = el('section', {
    className: 'nl-grim-glimmer-v4 nl-grim-glimmer-tarot-home gg-v4-home gg-v4-stack-home',
  });
  const atmosphere = el('div', { className: 'gg-v4-atmosphere' });
  atmosphere.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < 5; i++) {
    const dot = el('span', { className: 'gg-v4-ambient-star' }, [deckStar()]);
    dot.dataset.star = String(i);
    atmosphere.append(dot);
  }
  const deck = createTarotDeck(options.deck);
  let active = true,
    mounted = false,
    disposed = false;
  let animations = options.deck.animations !== false,
    reduced = options.deck.reducedMotion === true;
  let dailyEnabled = options.dailyEnabled === true,
    daily = options.daily;
  const dailySlot = el('div', { className: 'nl-grim-glimmer-tarot-home__daily' });
  const nav = createBottomNav({
    ...options.navigation,
    iconOnly: true,
    onNavigate: (value) => {
      if (!disposed && mounted && active && root.isConnected) options.navigation.onNavigate(value);
    },
  });
  nav.classList.add('gg-v4-home-nav');
  const ambient = createLoopMotion(
    () =>
      options.ambient === false
        ? []
        : [...atmosphere.querySelectorAll<HTMLElement>('.gg-v4-ambient-star')].map((node, i) => ({
            node,
            frames: [{ opacity: 0.25 }, { opacity: 0.8 }, { opacity: 0.25 }],
            duration: 4000 + i * 400,
            delay: i * 170,
          })),
    reduced,
  );
  function paint() {
    root.dataset.reducedMotion = String(reduced || !animations);
    root.inert = !active;
    if (dailyEnabled && daily) {
      if (daily.parentElement !== dailySlot) dailySlot.replaceChildren(daily);
      if (!dailySlot.isConnected || dailySlot.parentElement !== root)
        root.insertBefore(dailySlot, deck.element);
    } else {
      dailySlot.replaceChildren();
      dailySlot.remove();
    }
    ambient.setReducedMotion(reduced);
    ambient.setEnabled(animations && active);
  }
  root.append(atmosphere, deck.element, nav);
  paint();
  const observer = new MutationObserver(() => {
    if (mounted && !root.isConnected) dispose();
  });
  function dispose() {
    if (disposed) return;
    disposed = true;
    root.inert = true;
    mounted = false;
    observer.disconnect();
    deck.dispose();
    ambient.dispose();
  }
  return {
    element: root,
    deck,
    mount() {
      if (mounted || disposed) return;
      if (!root.isConnected) throw new Error('Mount Home after attaching it to the document');
      mounted = true;
      observer.observe(document.documentElement, { childList: true, subtree: true });
      deck.mount();
      ambient.mount();
    },
    update(state: TarotHomeState) {
      if (disposed) return;
      const nextDailyEnabled = state.dailyEnabled ?? dailyEnabled,
        nextDaily = state.daily ?? daily;
      if (nextDailyEnabled && !nextDaily)
        throw new Error('Enabled Daily Draw requires an app-owned widget');
      if (
        state.navigationValue !== undefined &&
        !options.navigation.items.some((item) => item.value === state.navigationValue)
      )
        throw new Error('Unknown navigation destination');
      deck.update(state);
      if (state.navigationValue !== undefined) updateBottomNav(nav, state.navigationValue);
      if (state.active !== undefined) active = state.active;
      if (state.animations !== undefined) animations = state.animations;
      if (state.reducedMotion !== undefined) reduced = state.reducedMotion;
      dailyEnabled = nextDailyEnabled;
      daily = nextDaily;
      paint();
    },
    dispose,
  };
}
