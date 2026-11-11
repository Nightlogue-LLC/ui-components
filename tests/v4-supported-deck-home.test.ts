import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createTarotDeck,
  createTarotDeckCard,
  updateTarotDeckCard,
  createTarotHome,
  type TarotCard,
  type TarotCardState,
} from '../src/projects/grim-glimmer/index.js';

const disposals: (() => void)[] = [];
beforeEach(() => {
  vi.stubGlobal('matchMedia', () => Object.assign(new EventTarget(), { matches: false }));
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
});
afterEach(() => {
  disposals.splice(0).forEach((dispose) => dispose());
  document.body.replaceChildren();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function art() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.id = 'art';
  svg.setAttribute('viewBox', '0 0 100 150');
  const defs = document.createElementNS(svg.namespaceURI, 'defs');
  const clip = document.createElementNS(svg.namespaceURI, 'clipPath');
  clip.id = 'clip';
  defs.append(clip);
  const canvas = document.createElementNS(svg.namespaceURI, 'path');
  canvas.setAttribute('data-art-part', 'canvas');
  canvas.setAttribute('fill', '#681F35');
  const scene = document.createElementNS(svg.namespaceURI, 'path');
  scene.setAttribute('clip-path', 'url(#clip)');
  svg.append(defs, canvas, scene);
  return svg;
}
function cards(): [TarotCard, TarotCard, TarotCard] {
  return [
    { id: 'locked-first', title: 'First', locked: true, artwork: art() },
    { id: 'another', title: 'Second', locked: true, artwork: art() },
    { id: 'playable-last', title: 'Third', locked: false, artwork: art() },
  ];
}
const states = (data: readonly TarotCard[]): TarotCardState[] =>
  data.map(({ id, locked, inProgress }) => ({ id, locked, inProgress }));
function setup() {
  const data = cards(),
    activate = vi.fn(),
    locked = vi.fn(),
    change = vi.fn(),
    tick = vi.fn();
  const deck = createTarotDeck({
    cards: data,
    launch: 'return',
    animations: false,
    onActivate: activate,
    onLocked: locked,
    onCardChange: change,
    tick,
    haptics: false,
  });
  document.body.append(deck.element);
  deck.mount();
  disposals.push(deck.dispose);
  return { data, deck, activate, locked, change, tick };
}
const hit = (root: HTMLElement) =>
  root.querySelector<HTMLButtonElement>('.gg-v4-deck-card[data-top="true"] .gg-v4-deck-hit')!;
const navigation = (onNavigate = vi.fn()) => ({
  label: 'Pages',
  value: 'collection',
  items: [
    { value: 'collection', label: 'Collection', icon: art() },
    { value: 'settings', label: 'Settings', icon: art() },
  ],
  onNavigate,
});

describe('supported app-owned deck cards', () => {
  it('clones artwork and isolates root/clip IDs without modifying the supplied DOM', () => {
    const artwork = art(),
      original = artwork.outerHTML;
    const first = createTarotDeckCard({ id: 'a', title: 'A', artwork }),
      second = createTarotDeckCard({ id: 'b', title: 'B', artwork });
    expect(artwork.outerHTML).toBe(original);
    const ids = [...first.querySelectorAll('[id]'), ...second.querySelectorAll('[id]')].map(
      (node) => node.id,
    );
    expect(new Set(ids).size).toBe(ids.length);
    expect(first.querySelector('[clip-path]')!.getAttribute('clip-path')).toBe(
      `url(#${first.querySelector('clipPath')!.id})`,
    );
    expect(first.querySelector('[data-art-part="canvas"]')!.getAttribute('fill')).toBe('#681F35');
    expect(first.querySelector('img')).toBeNull();
  });
  it('keeps button focus/artwork in place during a lock or resume update', () => {
    const activate = vi.fn(),
      locked = vi.fn(),
      root = createTarotDeckCard({
        id: 'a',
        title: 'A',
        artwork: art(),
        onActivate: activate,
        onLocked: locked,
      });
    document.body.append(root);
    const button = root.querySelector<HTMLButtonElement>('button')!,
      svg = root.querySelector('svg');
    button.focus();
    updateTarotDeckCard(root, { id: 'a', locked: true });
    button.click();
    expect(locked).toHaveBeenCalledOnce();
    expect(activate).not.toHaveBeenCalled();
    updateTarotDeckCard(root, { id: 'a', inProgress: true });
    expect(button.getAttribute('aria-label')).toBe('Continue A');
    expect(button.hasAttribute('aria-disabled')).toBe(false);
    expect(document.activeElement).toBe(button);
    expect(root.querySelector('svg')).toBe(svg);
    button.click();
    expect(activate).toHaveBeenCalledOnce();
  });
});

describe('supported deck controller', () => {
  it('uses provided identities and locks, including a playable third card', async () => {
    const { deck, activate, locked, change, tick } = setup();
    hit(deck.element).click();
    expect(locked).toHaveBeenCalledExactlyOnceWith('locked-first');
    expect(activate).not.toHaveBeenCalled();
    await deck.cycle('playable-last');
    hit(deck.element).click();
    expect(deck.selected()).toBe('playable-last');
    expect(activate).toHaveBeenCalledExactlyOnceWith('playable-last');
    expect(change).toHaveBeenCalledExactlyOnceWith('playable-last');
    expect(tick).not.toHaveBeenCalled();
    expect(deck.element.querySelectorAll('.gg-v4-deck-card')).toHaveLength(3);
    expect(deck.cards.filter((card) => !card.inert)).toHaveLength(1);
  });
  it('updates selected-card state without navigation or losing the native focus target', () => {
    const { data, deck, activate, change } = setup(),
      button = hit(deck.element);
    button.focus();
    const next = states(data);
    next[0] = { ...next[0]!, locked: false, inProgress: true };
    deck.update({ cards: next, haptics: false, animations: false });
    expect(hit(deck.element)).toBe(button);
    expect(document.activeElement).toBe(button);
    expect(button.getAttribute('aria-label')).toBe('Continue First');
    expect(deck.element.querySelector('[role="status"]')!.textContent).toContain('First, continue');
    expect(activate).not.toHaveBeenCalled();
    expect(change).not.toHaveBeenCalled();
  });
  it('moves an existing card focus target when an external selection is accepted', () => {
    const { data, deck, change } = setup();
    hit(deck.element).focus();
    deck.update({ cards: states(data), selectedId: 'playable-last' });
    expect(document.activeElement).toBe(hit(deck.element));
    expect(deck.selected()).toBe('playable-last');
    expect(change).not.toHaveBeenCalled();
  });
  it('rejects changed identities and unknown selection before changing rendered state', () => {
    const { data, deck } = setup(),
      original = deck.element.outerHTML;
    expect(() => deck.update({ cards: states(data).reverse() })).toThrow();
    expect(() => deck.update({ cards: states(data), selectedId: 'missing' })).toThrow();
    expect(deck.element.outerHTML).toBe(original);
    expect(() => deck.cycle('missing')).toThrow();
    expect(() =>
      createTarotDeck({ cards: [data[0], data[0], data[2]], onActivate: vi.fn() }),
    ).toThrow();
  });
  it('blocks all activation when inactive or disposed, without remounting stale work', async () => {
    const { data, deck, activate, locked, change } = setup();
    deck.update({ cards: states(data), active: false });
    hit(deck.element).click();
    await deck.cycle('another');
    expect(activate).not.toHaveBeenCalled();
    expect(locked).not.toHaveBeenCalled();
    expect(change).not.toHaveBeenCalled();
    deck.dispose();
    deck.mount();
    hit(deck.element).click();
    await deck.cycle('another');
    expect(deck.selected()).toBe('locked-first');
    expect(locked).not.toHaveBeenCalled();
  });
  it('suppresses late swipe settlement after removal, including callbacks and feedback', async () => {
    const { data, deck, change, tick } = setup();
    const finishes: (() => void)[] = [];
    deck.cards.forEach((card) => {
      card.animate = () => {
        let finish!: () => void;
        const finished = new Promise<void>((resolve) => {
          finish = resolve;
        });
        finishes.push(finish);
        return { finished, cancel: vi.fn() } as unknown as Animation;
      };
    });
    deck.update({ cards: states(data), animations: true, haptics: true });
    const pending = deck.cycle('another');
    deck.element.remove();
    finishes.forEach((finish) => finish());
    await pending;
    await Promise.resolve();
    expect(change).not.toHaveBeenCalled();
    expect(tick).not.toHaveBeenCalled();
    hit(deck.element).click();
    expect(change).not.toHaveBeenCalled();
  });
});

describe('supported Home composition', () => {
  it('defaults Daily Draw off without a widget, placeholder, logo or statistics block', () => {
    const home = createTarotHome({
      deck: { cards: cards(), onActivate: vi.fn(), animations: false },
      navigation: navigation(),
      ambient: false,
    });
    document.body.append(home.element);
    home.mount();
    disposals.push(home.dispose);
    expect(home.element.querySelector('.nl-grim-glimmer-tarot-home__daily')).toBeNull();
    expect(
      home.element.querySelector('.gg-v4-home-logo, .gg-v4-home-status, .gg-v4-home-tagline'),
    ).toBeNull();
    expect(home.element.querySelectorAll('.gg-v4-deck-card')).toHaveLength(3);
    expect(home.element.querySelector('.nl-bottom-nav--icon-only')).not.toBeNull();
  });
  it('mounts only an explicitly enabled app-owned daily widget and removes its slot when disabled', () => {
    const data = cards(),
      daily = document.createElement('button');
    daily.textContent = 'Ready app widget';
    const home = createTarotHome({
      deck: { cards: data, onActivate: vi.fn(), animations: false },
      navigation: navigation(),
      daily,
    });
    document.body.append(home.element);
    home.mount();
    disposals.push(home.dispose);
    expect(home.element.contains(daily)).toBe(false);
    home.update({ cards: states(data), dailyEnabled: true });
    expect(home.element.contains(daily)).toBe(true);
    home.update({ cards: states(data), dailyEnabled: false });
    expect(home.element.querySelector('.nl-grim-glimmer-tarot-home__daily')).toBeNull();
    expect(() =>
      createTarotHome({
        deck: { cards: data, onActivate: vi.fn() },
        navigation: navigation(),
        dailyEnabled: true,
      }),
    ).toThrow();
  });
  it('requests navigation without accepting it or writing history/storage, then gates stale requests', () => {
    const data = cards(),
      onNavigate = vi.fn(),
      history = vi.spyOn(window.history, 'pushState'),
      storage = vi.spyOn(Storage.prototype, 'setItem');
    const home = createTarotHome({
      deck: { cards: data, onActivate: vi.fn(), animations: false },
      navigation: navigation(onNavigate),
      ambient: false,
    });
    document.body.append(home.element);
    home.mount();
    disposals.push(home.dispose);
    const settings = home.element.querySelector<HTMLButtonElement>('[aria-label="Settings"]')!;
    settings.click();
    expect(onNavigate).toHaveBeenCalledExactlyOnceWith('settings');
    expect(settings.hasAttribute('aria-current')).toBe(false);
    home.update({ cards: states(data), navigationValue: 'settings' });
    expect(settings.getAttribute('aria-current')).toBe('page');
    expect(history).not.toHaveBeenCalled();
    expect(storage).not.toHaveBeenCalled();
    home.dispose();
    home.element.querySelector<HTMLButtonElement>('[aria-label="Collection"]')!.click();
    expect(onNavigate).toHaveBeenCalledOnce();
  });
});
