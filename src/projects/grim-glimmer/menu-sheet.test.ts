import { afterEach, describe, expect, it, vi } from 'vitest';
import { createGameMenuSheet, type GameMenuSheet } from './menu-sheet.js';
import { createCompactGameHeader, createGameScreen, createGameMenu } from './game-screen.js';
import { createIcon } from '../../components/icon/index.js';
let sheet: GameMenuSheet | undefined;
afterEach(() => {
  sheet?.destroy();
  document.body.replaceChildren();
});
function setup(history = false) {
  const header = createCompactGameHeader({
    title: 'Stars & Spires',
    status: 'Easy',
    icons: { hint: createIcon('hint'), menu: createIcon('more') },
  });
  const trigger = header.querySelector<HTMLButtonElement>('[aria-label="Game menu"]')!;
  const content = document.createElement('div');
  const button = document.createElement('button');
  button.textContent = 'New Game';
  content.append(button);
  sheet = createGameMenuSheet({ trigger, content, history, animations: () => false });
  const game = createGameScreen({
    header,
    board: document.createElement('div'),
    controls: document.createElement('div'),
  });
  game.append(sheet.element);
  document.body.append(game);
  return { trigger, button, game, sheet };
}
describe('shared game menu sheet', () => {
  it('moves and restores focus without asking the viewport to scroll', () => {
    const { trigger, button, sheet } = setup();
    const enter = vi.spyOn(button, 'focus');
    const restore = vi.spyOn(trigger, 'focus');
    sheet.open();
    expect(enter).toHaveBeenCalledWith({ preventScroll: true });
    sheet.close();
    expect(restore).toHaveBeenCalledWith({ preventScroll: true });
    enter.mockRestore();
    restore.mockRestore();
  });
  it('toggles the persistent dots/X control, traps focus, and restores focus on Escape', () => {
    const { trigger, button, game, sheet } = setup();
    trigger.focus();
    trigger.click();
    expect(sheet.isOpen).toBe(true);
    expect(document.activeElement).toBe(button);
    expect(trigger.getAttribute('aria-label')).toBe('Game menu');
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(trigger.dataset.animations).toBe('off');
    expect(game.querySelector<HTMLElement>('[data-slot="board"]')!.inert).toBe(true);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    expect(document.activeElement).toBe(trigger);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(sheet.isOpen).toBe(false);
    expect(document.activeElement).toBe(trigger);
    expect(game.querySelector<HTMLElement>('[data-slot="board"]')!.inert).toBeFalsy();
    trigger.click();
    trigger.click();
    expect(sheet.isOpen).toBe(false);
  });
  it('dismisses via scrim and downward swipe, ignoring short/horizontal gestures', () => {
    const { sheet } = setup();
    sheet.open();
    sheet.element.querySelector<HTMLElement>('.nl-grim-glimmer-menu-sheet__scrim')!.click();
    expect(sheet.isOpen).toBe(false);
    sheet.open();
    const panel = sheet.element.querySelector('.nl-grim-glimmer-menu-sheet__panel')!;
    const pointer = (type: string, x: number, y: number) => {
      const e = new Event(type);
      Object.assign(e, { pointerId: 1, clientX: x, clientY: y });
      panel.dispatchEvent(e);
    };
    pointer('pointerdown', 20, 20);
    pointer('pointerup', 120, 30);
    expect(sheet.isOpen).toBe(true);
    pointer('pointerdown', 20, 20);
    pointer('pointerup', 25, 110);
    expect(sheet.isOpen).toBe(false);
  });
  it('composes existing menu choices without nested dialog semantics', () => {
    const fixture = setup();
    fixture.sheet.destroy();
    const content = createGameMenu({
      difficulty: 'easy',
      options: [{ value: 'easy', label: 'Easy', size: 6 }],
      onDeal: () => undefined,
    });
    sheet = createGameMenuSheet({ trigger: fixture.trigger, content, history: false });
    fixture.game.append(sheet.element);
    sheet.open();
    expect(sheet.element.querySelectorAll('[role="dialog"]')).toHaveLength(1);
    expect(content.hidden).toBe(false);
    sheet.close();
    expect(fixture.trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('browser Back consumes the sheet entry first, without changing the route', async () => {
    const { sheet } = setup(true);
    const url = window.location.href;
    sheet.open();
    const back = new Promise<void>((resolve) =>
      window.addEventListener('popstate', () => resolve(), { once: true }),
    );
    window.history.back();
    await back;
    expect(sheet.isOpen).toBe(false);
    expect(window.location.href).toBe(url);
  });
  it('runs navigation only after its history entry is consumed', async () => {
    const { sheet } = setup(true);
    const action = vi.fn();
    sheet.open();
    await new Promise<void>((resolve) =>
      sheet.close(() => {
        action();
        resolve();
      }),
    );
    expect(action).toHaveBeenCalledOnce();
    expect((window.history.state as { nlGameMenu?: unknown } | null)?.nlGameMenu).toBeUndefined();
  });
});
