import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { createDeck } from './deck.js';
import { createStackHome } from './deck-fixtures.js';
import { createCardIllustration } from './deck-card.js';
import {
  dragPoses,
  fan,
  dismisses,
  springDisplacement,
  deckBudget,
  stackHomeBudget,
} from './deck-model.js';
let media: EventTarget & { matches: boolean };
const decks: ReturnType<typeof createDeck>[] = [];
let original: PropertyDescriptor | undefined;
const records: {
  node: HTMLElement;
  frames: Keyframe[];
  options: KeyframeAnimationOptions;
  cancel: ReturnType<typeof vi.fn>;
}[] = [];
beforeEach(() => {
  vi.useFakeTimers();
  records.length = 0;
  media = Object.assign(new EventTarget(), { matches: false });
  vi.stubGlobal('matchMedia', () => media);
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
  original = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'animate');
  Object.defineProperty(HTMLElement.prototype, 'animate', {
    configurable: true,
    value: function (this: HTMLElement, frames: Keyframe[], options: KeyframeAnimationOptions) {
      let finish!: () => void, reject!: (reason?: unknown) => void;
      const finished = new Promise<void>((resolve, fail) => {
        finish = resolve;
        reject = fail;
      });
      const timer = setTimeout(finish, Number(options.duration ?? 0) + Number(options.delay ?? 0));
      const cancel = vi.fn(() => {
        clearTimeout(timer);
        reject(new Error('cancel'));
      });
      records.push({ node: this, frames, options, cancel });
      return { finished, cancel, pause: vi.fn(), play: vi.fn() } as unknown as Animation;
    },
  });
});
afterEach(async () => {
  decks.splice(0).forEach((deck) => deck.dispose());
  document.body.replaceChildren();
  await Promise.resolve();
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  if (original) Object.defineProperty(HTMLElement.prototype, 'animate', original);
  else Reflect.deleteProperty(HTMLElement.prototype, 'animate');
});
function setup(options: Parameters<typeof createDeck>[0] = {}) {
  const deck = createDeck({ launch: 'return', ...options });
  decks.push(deck);
  document.body.append(deck.element);
  deck.cards.forEach((card) =>
    vi.spyOn(card, 'getBoundingClientRect').mockReturnValue({ width: 250 } as DOMRect),
  );
  deck.mount();
  return deck;
}
function pointer(node: HTMLElement, type: string, x: number, t: number, y = 0) {
  const e = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    button: 0,
    clientX: x,
    clientY: y,
  });
  Object.defineProperties(e, {
    pointerId: { value: 1 },
    isPrimary: { value: true },
    timeStamp: { value: t },
  });
  node.dispatchEvent(e);
}
const hit = (deck: ReturnType<typeof createDeck>) =>
  deck.cards[deck.selected()]!.querySelector<HTMLButtonElement>('.gg-v4-deck-hit')!;
const advance = async (ms: number) => {
  await vi.advanceTimersByTimeAsync(ms);
};
describe('deck model', () => {
  it('interpolates the next two cards and uses the specified tilt', () => {
    expect(fan(1)).toMatchObject({ y: 12, scale: 0.95, rotation: -4 });
    expect(fan(2)).toMatchObject({ y: 24, scale: 0.9, rotation: 4 });
    const poses = dragPoses(125, 250);
    expect(poses[0]!.rotation).toBe(7);
    expect(poses[1]).toEqual(fan(0));
    expect(poses[2]).toEqual(fan(1));
    expect(dragPoses(90, 250, true).every((p) => p.rotation === 0 && p.x === 0)).toBe(true);
  });
  it.each([
    [75, 0, false],
    [76, 0, true],
    [10, 501, true],
    [7, 2000, false],
    [10, 500, false],
  ])('distance %s velocity %s dismisses %s', (dx, velocity, value) => {
    expect(dismisses(dx, 250, velocity)).toBe(value);
  });
  it('has a unit-mass 400/30 spring and default-font size budgets', () => {
    expect(springDisplacement(0)).toBe(1);
    expect(Math.abs(springDisplacement(0.6))).toBeLessThan(0.001);
    expect(stackHomeBudget(393, 852)).toMatchObject({ width: 336, height: 504 });
    expect(stackHomeBudget(360, 780)).toMatchObject({ width: 302, height: 453 });
    expect(deckBudget(393, 852)).toMatchObject({ width: 280, height: 420 });
    expect(deckBudget(360, 780)).toMatchObject({ width: 266, height: 399 });
  });
});
describe('deck pointers and outcomes', () => {
  it('treats <8px as a playable tap and suppresses the click after a dismissed drag', async () => {
    const onPlay = vi.fn(),
      onCard = vi.fn();
    const deck = setup({ onPlay, onCard });
    let button = hit(deck);
    pointer(button, 'pointerdown', 0, 0);
    pointer(button, 'pointermove', 7, 100);
    pointer(button, 'pointerup', 7, 120);
    button.click();
    expect(onPlay).toHaveBeenCalledOnce();
    button = hit(deck);
    pointer(button, 'pointerdown', 0, 200);
    pointer(button, 'pointermove', 100, 500);
    pointer(button, 'pointerup', 100, 520);
    button.click();
    expect(onPlay).toHaveBeenCalledOnce();
    await advance(380);
    expect(deck.selected()).toBe(1);
    expect(onCard).toHaveBeenCalledExactlyOnceWith(1);
  });
  it('springs back without navigation for an insufficient drag or cancellation', async () => {
    const onPlay = vi.fn();
    const deck = setup({ onPlay });
    const button = hit(deck);
    pointer(button, 'pointerdown', 0, 0);
    pointer(button, 'pointermove', 35, 300);
    pointer(button, 'pointerup', 35, 500);
    button.click();
    await advance(600);
    expect(deck.selected()).toBe(0);
    expect(onPlay).not.toHaveBeenCalled();
    pointer(button, 'pointerdown', 0, 600);
    pointer(button, 'pointermove', 140, 900);
    pointer(button, 'pointercancel', 140, 950);
    await advance(600);
    expect(deck.selected()).toBe(0);
  });
  it('preserves vertical pans and ignores secondary pointers', () => {
    const deck = setup();
    const button = hit(deck);
    pointer(button, 'pointerdown', 0, 0);
    pointer(button, 'pointermove', 2, 100, 30);
    pointer(button, 'pointerup', 100, 200, 40);
    expect(deck.selected()).toBe(0);
    button.dispatchEvent(new MouseEvent('pointerdown', { button: 2, bubbles: true }));
    pointer(button, 'pointermove', 200, 500);
    pointer(button, 'pointerup', 200, 510);
    expect(deck.selected()).toBe(0);
  });
  it('emits threshold tick, re-arms after returning below both thresholds, then emits settle', async () => {
    const tick = vi.fn();
    const deck = setup({ haptics: true, tick });
    const button = hit(deck);
    pointer(button, 'pointerdown', 0, 0);
    pointer(button, 'pointermove', 90, 400);
    expect(tick).toHaveBeenCalledOnce();
    pointer(button, 'pointermove', 100, 500);
    expect(tick).toHaveBeenCalledOnce();
    pointer(button, 'pointermove', 10, 900);
    pointer(button, 'pointermove', 90, 1300);
    expect(tick).toHaveBeenCalledTimes(2);
    pointer(button, 'pointerup', 90, 1310);
    await advance(380);
    expect(tick).toHaveBeenCalledTimes(3);
  });
  it('uses the recent velocity sample for a short flick and forgets it after a pause', async () => {
    const deck = setup();
    let button = hit(deck);
    pointer(button, 'pointerdown', 0, 0);
    pointer(button, 'pointermove', 20, 20);
    pointer(button, 'pointerup', 20, 21);
    await advance(380);
    expect(deck.selected()).toBe(1);
    button = hit(deck);
    pointer(button, 'pointerdown', 0, 100);
    pointer(button, 'pointermove', 20, 120);
    pointer(button, 'pointerup', 20, 400);
    await advance(600);
    expect(deck.selected()).toBe(1);
  });
  it('wraps after three cycles, with one settled callback per card', async () => {
    const onCard = vi.fn();
    const deck = setup({ onCard });
    for (const index of [1, 2, 0]) {
      void deck.cycle(index);
      await advance(380);
      expect(deck.selected()).toBe(index);
    }
    expect(onCard.mock.calls.map((call) => call[0] as number)).toEqual([1, 2, 0]);
    expect(deck.element.querySelectorAll('.gg-v4-deck-card')).toHaveLength(3);
  });
  it('locks tap navigation but gives a 200ms shake with a gated adapter', () => {
    const onPlay = vi.fn(),
      onLocked = vi.fn(),
      tick = vi.fn();
    const deck = setup({ initialCard: 1, onPlay, onLocked, tick, haptics: true });
    hit(deck).click();
    expect(onPlay).not.toHaveBeenCalled();
    expect(onLocked).toHaveBeenCalledOnce();
    expect(tick).toHaveBeenCalledOnce();
    expect(records.at(-1)!.options.duration).toBe(200);
  });
  it('blocks stale results after disposal or replacement by an indicator', async () => {
    const onCard = vi.fn(),
      tick = vi.fn();
    const deck = setup({ onCard, tick, haptics: true });
    void deck.cycle(1);
    deck.dispose();
    await advance(1000);
    expect(onCard).not.toHaveBeenCalled();
    expect(tick).not.toHaveBeenCalled();
    const second = setup({ onCard });
    void second.cycle(1);
    second.element.querySelector<HTMLButtonElement>('[aria-label="Show card 3"]')!.click();
    await advance(380);
    expect(second.selected()).toBe(2);
    expect(onCard).toHaveBeenCalledExactlyOnceWith(2);
  });
});
describe('accessibility and reduced motion', () => {
  it('exposes one current card and 44px indicator hooks, retaining focus after keyboard cycling', async () => {
    const deck = setup({ reducedMotion: true });
    expect(deck.element.getAttribute('aria-roledescription')).toBe('deck');
    expect(deck.cards.filter((c) => !c.inert)).toHaveLength(1);
    hit(deck).focus();
    hit(deck).dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }),
    );
    await advance(150);
    expect(deck.selected()).toBe(1);
    expect(document.activeElement).toBe(hit(deck));
    expect(deck.element.querySelector('[role="status"]')?.textContent).toBe(
      'Card 2 of 3: locked puzzle',
    );
    expect(deck.element.querySelectorAll('[aria-pressed="true"]')).toHaveLength(1);
  });
  it('crossfades over 150ms, no fan/tilt/shake/nudge, and gates all haptics', async () => {
    const tick = vi.fn();
    const deck = setup({ reducedMotion: true, firstVisit: true, tick, haptics: false });
    void deck.cycle(1);
    await advance(150);
    expect(deck.selected()).toBe(1);
    hit(deck).click();
    await advance(2000);
    expect(
      records.every((r) => r.frames.every((f) => Object.keys(f).every((key) => key === 'opacity'))),
    ).toBe(true);
    expect(records.every((r) => Number(r.options.duration) === 150)).toBe(true);
    expect(tick).not.toHaveBeenCalled();
  });
  it('cancels pending work when OS reduction changes or the page backgrounds', async () => {
    const onCard = vi.fn();
    const deck = setup({ onCard });
    void deck.cycle(1);
    media.matches = true;
    media.dispatchEvent(new Event('change'));
    await advance(380);
    expect(onCard).not.toHaveBeenCalled();
    expect(deck.element.dataset.reducedMotion).toBe('true');
    media.matches = false;
    media.dispatchEvent(new Event('change'));
    void deck.cycle(1);
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
    document.dispatchEvent(new Event('visibilitychange'));
    await advance(380);
    expect(onCard).not.toHaveBeenCalled();
  });
});
describe('entrance, art and idle hint', () => {
  it('deals only real cards with 450ms/70ms staggering and one top-only sheen', () => {
    setup({ launch: 'cold' });
    expect(records.filter((r) => r.options.duration === 450).map((r) => r.options.delay)).toEqual([
      0, 70, 140,
    ]);
    expect(records.filter((r) => r.node.classList.contains('gg-v4-deck-sheen'))).toHaveLength(1);
  });
  it('nudges once after 1200ms, skips return visits and cancels on interaction', async () => {
    setup({ firstVisit: true });
    await advance(1199);
    expect(records).toHaveLength(0);
    await advance(1);
    expect(records.at(-1)!.frames[1]!.transform).toContain('14px');
    await advance(5000);
    expect(records).toHaveLength(1);
    const next = setup({ firstVisit: true });
    hit(next).click();
    const count = records.length;
    await advance(2000);
    expect(records).toHaveLength(count);
  });
  it('uses the supplied SVG without added labels, plate or extra frame', () => {
    const card = createCardIllustration({ index: 0, inProgress: true });
    expect(card.querySelector('.gg-v4-deck-plate')).toBeNull();
    expect(card.querySelector('img')?.getAttribute('src')).toContain('camper.svg');
    expect(card.querySelector('img')?.loading).toBe('eager');
    expect(card.querySelector('button button')).toBeNull();
    expect(card.querySelector('svg [data-art-part="numeral"]')).not.toBeNull();
    expect(card.textContent).not.toContain('Stars & Spires');
    const home = createStackHome({ launch: 'return', reducedMotion: true });
    document.body.append(home);
    expect(home.querySelectorAll('.gg-v4-deck-card')).toHaveLength(3);
    expect(home.querySelector('.gg-v4-carousel')).toBeNull();
  });
});

it('keeps numeral groups, isolates the raven tint, and namespaces references across repeated art', () => {
  const cards = [0, 1, 2].map((index) => createCardIllustration({ index }));
  const repeat = createCardIllustration({ index: 1 });
  cards.forEach((card) => {
    expect(card.querySelectorAll('[data-art-part="numeral"]')).toHaveLength(1);
    expect(card.querySelector('svg')?.getAttribute('preserveAspectRatio')).toBe('xMidYMid meet');
    expect(card.querySelector('.gg-v4-deck-title')).toBeNull();
  });
  const bird = cards[1]!.querySelector('[data-art-part="raven"]')!;
  expect(bird.querySelector('[fill="#681F35"]')).not.toBeNull();
  const ids = [...cards, repeat].flatMap((card) =>
    [...card.querySelectorAll('[id]')].map((node) => node.id),
  );
  expect(new Set(ids).size).toBe(ids.length);
  const clip = repeat.querySelector('[fill="#681F35"]')!.getAttribute('clip-path')!;
  const id = clip.slice(5, -1);
  expect([...repeat.querySelectorAll('[id]')].some((node) => node.id === id)).toBe(true);
});

it('removes duplicate stack-home copy/stats and keeps one decorative grounding shadow', () => {
  const root = createStackHome({ launch: 'return', reducedMotion: true });
  document.body.append(root);
  expect(root.querySelector('.gg-v4-home-logo')).toBeNull();
  expect(root.querySelector('.gg-v4-home-tagline')).toBeNull();
  expect(root.querySelector('.gg-v4-home-status')).toBeNull();
  expect(root.querySelectorAll('.gg-v4-deck-ground-shadow[aria-hidden="true"]')).toHaveLength(1);
  expect(root.querySelectorAll('.gg-v4-deck-vector [data-art-part="canvas"]')).toHaveLength(3);
  expect(root.querySelector('.gg-v4-ritual')).not.toBeNull();
});
