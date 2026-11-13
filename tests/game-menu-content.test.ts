import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createGameMenuContent,
  createGameMenuSheet,
  GAME_MENU_SIZES,
  GAME_MENU_DIFFICULTIES,
  type GameMenuAvailability,
  type GameMenuSelection,
} from '../src/projects/grim-glimmer/index.js';

afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
});
const button = (root: HTMLElement, text: string) =>
  [...root.querySelectorAll('button')].find((b) => b.textContent === text)!;
function setup(selection: GameMenuSelection = { size: null, difficulty: null }) {
  const onStart = vi.fn(),
    onSelectionChange = vi.fn(),
    onHowToPlay = vi.fn(),
    onGameSettings = vi.fn();
  let availability: GameMenuAvailability = { status: 'ready' };
  const content = createGameMenuContent({
    selection,
    getAvailability: () => availability,
    onStart,
    onSelectionChange,
    onHowToPlay,
    onGameSettings,
  });
  const trigger = document.createElement('button');
  const menu = createGameMenuSheet({
    trigger,
    content: content.element,
    presentation: 'popover',
    history: false,
    animations: () => false,
  });
  document.body.append(trigger, menu.element);
  return {
    content,
    trigger,
    menu,
    onStart,
    onSelectionChange,
    onHowToPlay,
    onGameSettings,
    setAvailability: (next: GameMenuAvailability) => {
      availability = next;
    },
  };
}
describe('GameMenu optional New Game selection', () => {
  it.each(GAME_MENU_SIZES)('toggles size %s independently, without starting a puzzle', (size) => {
    const s = setup({ size: null, difficulty: 'hard' });
    s.menu.open();
    const choice = button(s.content.element, `${size}×${size}`);
    choice.click();
    expect(s.content.selection).toEqual({ size, difficulty: 'hard' });
    expect(choice.getAttribute('aria-pressed')).toBe('true');
    expect(s.onSelectionChange).toHaveBeenLastCalledWith({ size, difficulty: 'hard' });
    choice.click();
    expect(s.content.selection).toEqual({ size: null, difficulty: 'hard' });
    expect(s.onStart).not.toHaveBeenCalled();
    s.menu.destroy();
  });
  it.each(GAME_MENU_DIFFICULTIES)('toggles %s difficulty independently', (difficulty) => {
    const s = setup({ size: 10, difficulty: null });
    s.menu.open();
    const choice = button(s.content.element, difficulty[0]!.toUpperCase() + difficulty.slice(1));
    choice.click();
    choice.click();
    expect(s.content.selection).toEqual({ size: 10, difficulty: null });
    expect(choice.getAttribute('aria-pressed')).toBe('false');
    s.menu.destroy();
  });
  it.each([
    { size: 8, difficulty: 'hard' },
    { size: null, difficulty: 'hard' },
    { size: 10, difficulty: null },
    { size: null, difficulty: null },
  ] satisfies GameMenuSelection[])(
    'starts only the explicitly submitted selection $size/$difficulty',
    (selection) => {
      const s = setup(selection);
      s.menu.open();
      expect(s.onStart).not.toHaveBeenCalled();
      button(s.content.element, 'Start New Game').click();
      expect(s.onStart).toHaveBeenCalledExactlyOnceWith(selection);
      s.menu.destroy();
    },
  );
  it.each(['toggle', 'escape', 'back', 'scrim'] as const)(
    'discards drafts on %s and reopens the committed value',
    (route) => {
      const s = setup({ size: 6, difficulty: 'easy' });
      s.menu.open();
      button(s.content.element, 'Hard').click();
      if (route === 'toggle') s.trigger.click();
      else if (route === 'escape')
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      else if (route === 'back') window.dispatchEvent(new PopStateEvent('popstate'));
      else s.menu.element.querySelector<HTMLElement>('.nl-grim-glimmer-menu-sheet__scrim')!.click();
      expect(document.activeElement).toBe(s.trigger);
      s.menu.open();
      expect(s.content.selection).toEqual({ size: 6, difficulty: 'easy' });
      expect(s.onStart).not.toHaveBeenCalled();
      s.menu.destroy();
    },
  );
  it('accepts a new committed value without replacing buttons or emitting user changes', () => {
    const s = setup();
    s.menu.open();
    const hard = button(s.content.element, 'Hard');
    hard.focus();
    s.content.reset({ size: 15, difficulty: 'hard' });
    expect(document.activeElement).toBe(hard);
    expect(hard.getAttribute('aria-pressed')).toBe('true');
    s.menu.close();
    s.menu.open();
    expect(s.content.selection).toEqual({ size: 15, difficulty: 'hard' });
    expect(s.onSelectionChange).not.toHaveBeenCalled();
    s.menu.destroy();
  });
  it('blocks loading/unavailable submissions and rechecks stale availability on activation', () => {
    const s = setup();
    s.menu.open();
    const start = button(s.content.element, 'Start New Game');
    s.setAvailability({ status: 'unavailable', message: 'No Hard 15×15 puzzles in this catalog.' });
    start.click();
    expect(s.onStart).not.toHaveBeenCalled();
    expect(start.disabled).toBe(true);
    expect(s.content.element.querySelector('[role=status]')!.textContent).toContain(
      'No Hard 15×15',
    );
    s.setAvailability({ status: 'loading' });
    s.content.refresh();
    expect(start.getAttribute('aria-busy')).toBe('true');
    start.click();
    s.setAvailability({ status: 'ready' });
    s.content.refresh();
    start.click();
    expect(s.onStart).toHaveBeenCalledTimes(1);
    expect(start.hasAttribute('aria-busy')).toBe(false);
    s.menu.destroy();
  });
  it('keeps snapshots isolated, real callbacks distinct, and random semantics accessible', () => {
    const s = setup();
    s.menu.open();
    const snapshot = s.content.selection;
    snapshot.size = 15;
    expect(s.content.selection.size).toBeNull();
    expect(s.content.element.querySelectorAll('fieldset')).toHaveLength(2);
    expect(s.content.element.textContent).toContain('No selection means random');
    expect(s.content.element.querySelector('[role=status]')!.textContent).toContain('Random size');
    button(s.content.element, 'How to Play').click();
    button(s.content.element, 'Game Settings').click();
    expect(s.onHowToPlay).toHaveBeenCalledOnce();
    expect(s.onGameSettings).toHaveBeenCalledOnce();
    expect(s.content.element.querySelector('dialog')).toBeNull();
    expect(s.content.element.textContent).not.toMatch(
      /Sound effects|Music|Haptic feedback|Surprise Me/,
    );
    s.menu.destroy();
  });
  it('discards pending changes on teardown without committing or routing', () => {
    const s = setup();
    s.menu.open();
    button(s.content.element, 'Hard').click();
    s.menu.destroy();
    expect(s.content.selection).toEqual({ size: null, difficulty: null });
    expect(s.onStart).not.toHaveBeenCalled();
  });
});
