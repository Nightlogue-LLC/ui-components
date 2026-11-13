import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createGameMenuContent,
  createGameMenuSheet,
  GAME_MENU_SIZES,
  GAME_MENU_DIFFICULTIES,
  type GameMenuSelection,
  type GameMenuAvailability,
} from '../src/projects/grim-glimmer/index.js';
afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
});
const button = (root: HTMLElement, text: string) =>
  [...root.querySelectorAll('button')].find(
    (b) => b.textContent === text || b.getAttribute('aria-label') === text,
  )!;
const radio = (root: HTMLElement, value: string) =>
  root.querySelector<HTMLInputElement>(`input[value="${value}"]`)!;
function setup(selection: GameMenuSelection = { size: 6, difficulty: 'easy' }) {
  const onStart = vi.fn(),
    onSurprise = vi.fn(),
    onSelectionChange = vi.fn(),
    onHowToPlay = vi.fn(),
    onGameSettings = vi.fn();
  let availability: GameMenuAvailability = { status: 'ready' },
    random: GameMenuAvailability = { status: 'ready' };
  const content = createGameMenuContent({
    selection,
    getAvailability: () => availability,
    getSurpriseAvailability: () => random,
    onStart,
    onSurprise,
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
    onSurprise,
    onSelectionChange,
    onHowToPlay,
    onGameSettings,
    setAvailability: (v: GameMenuAvailability) => {
      availability = v;
    },
    setRandom: (v: GameMenuAvailability) => {
      random = v;
    },
  };
}
describe('required Game Menu selections and independent Surprise Me', () => {
  it.each(GAME_MENU_SIZES)(
    'keeps size %s selected when activated again without starting',
    (size) => {
      const s = setup();
      s.menu.open();
      const r = radio(s.content.element, String(size));
      r.click();
      r.click();
      expect(r.checked).toBe(true);
      expect(s.content.selection).toEqual({ size, difficulty: 'easy' });
      expect(s.onStart).not.toHaveBeenCalled();
      s.menu.destroy();
    },
  );
  it.each(GAME_MENU_DIFFICULTIES)('keeps difficulty %s selected independently', (difficulty) => {
    const s = setup({ size: 10, difficulty: 'easy' });
    s.menu.open();
    const r = radio(s.content.element, difficulty);
    r.click();
    r.click();
    expect(r.checked).toBe(true);
    expect(s.content.selection).toEqual({ size: 10, difficulty });
    s.menu.destroy();
  });
  it('tabs between checked groups and actions, leaving arrow navigation to native radios', () => {
    const s = setup();
    s.menu.open();
    expect(document.activeElement).toBe(radio(s.content.element, '6'));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', cancelable: true }));
    expect(document.activeElement).toBe(radio(s.content.element, 'easy'));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', cancelable: true }));
    expect(document.activeElement).toBe(button(s.content.element, 'New Game'));
    s.menu.destroy();
  });
  it('submits only the explicit required selection on New Game', () => {
    const s = setup();
    s.menu.open();
    radio(s.content.element, '8').click();
    radio(s.content.element, 'hard').click();
    expect(s.onStart).not.toHaveBeenCalled();
    button(s.content.element, 'New Game').click();
    expect(s.onStart).toHaveBeenCalledExactlyOnceWith({ size: 8, difficulty: 'hard' });
    expect(s.onSurprise).not.toHaveBeenCalled();
    s.menu.destroy();
  });
  it('sends Surprise Me separately without changing draft or committed preferences', () => {
    const s = setup({ size: 10, difficulty: 'medium' });
    s.menu.open();
    radio(s.content.element, 'hard').click();
    button(s.content.element, 'Surprise Me').click();
    expect(s.onSurprise).toHaveBeenCalledOnce();
    expect(s.onStart).not.toHaveBeenCalled();
    expect(s.content.selection).toEqual({ size: 10, difficulty: 'hard' });
    s.menu.close();
    s.menu.open();
    expect(s.content.selection).toEqual({ size: 10, difficulty: 'medium' });
    s.menu.destroy();
  });
  it.each(['toggle', 'escape', 'back', 'scrim'] as const)('discards drafts on %s', (route) => {
    const s = setup();
    s.menu.open();
    radio(s.content.element, 'hard').click();
    if (route === 'toggle') s.trigger.click();
    else if (route === 'escape')
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    else if (route === 'back') window.dispatchEvent(new PopStateEvent('popstate'));
    else s.menu.element.querySelector<HTMLElement>('.nl-grim-glimmer-menu-sheet__scrim')!.click();
    expect(document.activeElement).toBe(s.trigger);
    s.menu.open();
    expect(s.content.selection).toEqual({ size: 6, difficulty: 'easy' });
    s.menu.destroy();
  });
  it('updates the committed selection without replacing the focused radio', () => {
    const s = setup();
    s.menu.open();
    const hard = radio(s.content.element, 'hard');
    hard.focus();
    s.content.reset({ size: 15, difficulty: 'hard' });
    expect(document.activeElement).toBe(hard);
    expect(hard.checked).toBe(true);
    s.menu.close();
    s.menu.open();
    expect(s.content.selection).toEqual({ size: 15, difficulty: 'hard' });
    expect(s.onSelectionChange).not.toHaveBeenCalled();
    s.menu.destroy();
  });
  it('handles availability for selected and random pools independently and rechecks activation', () => {
    const s = setup();
    s.menu.open();
    s.setAvailability({ status: 'unavailable', message: 'No Hard 15×15 puzzles.' });
    button(s.content.element, 'New Game').click();
    expect(s.onStart).not.toHaveBeenCalled();
    button(s.content.element, 'Surprise Me').click();
    expect(s.onSurprise).toHaveBeenCalledOnce();
    s.setRandom({ status: 'loading' });
    button(s.content.element, 'Surprise Me').click();
    expect(s.onSurprise).toHaveBeenCalledOnce();
    expect(button(s.content.element, 'Surprise Me').getAttribute('aria-busy')).toBe('true');
    s.setAvailability({ status: 'ready' });
    s.setRandom({ status: 'unavailable' });
    s.content.refresh();
    button(s.content.element, 'New Game').click();
    expect(s.onStart).toHaveBeenCalledOnce();
    expect(button(s.content.element, 'Surprise Me').disabled).toBe(true);
    s.menu.destroy();
  });
  it('keeps meaningful accessible groups and real navigation callbacks, without random body copy', () => {
    const s = setup();
    s.menu.open();
    expect(s.content.element.querySelector('h2')?.textContent).toBe('Game Menu');
    expect(s.content.element.querySelectorAll('[role=radiogroup]')).toHaveLength(2);
    expect(s.content.element.querySelectorAll('input:checked')).toHaveLength(2);
    expect(s.content.element.textContent).not.toContain('No selection means random');
    expect(button(s.content.element, 'Surprise Me').querySelector('svg')).not.toBeNull();
    button(s.content.element, 'How to Play').click();
    button(s.content.element, 'Game Settings').click();
    expect(s.onHowToPlay).toHaveBeenCalledOnce();
    expect(s.onGameSettings).toHaveBeenCalledOnce();
    expect(s.content.element.querySelector('dialog')).toBeNull();
    s.menu.destroy();
  });
  it('discards drafts during teardown and isolates returned snapshots', () => {
    const s = setup();
    s.menu.open();
    radio(s.content.element, 'hard').click();
    const snap = s.content.selection;
    snap.size = 15;
    expect(s.content.selection.size).toBe(6);
    s.menu.destroy();
    expect(s.content.selection).toEqual({ size: 6, difficulty: 'easy' });
    expect(s.onStart).not.toHaveBeenCalled();
  });
});
