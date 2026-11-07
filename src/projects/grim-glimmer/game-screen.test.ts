import { describe, expect, it, vi } from 'vitest';
import {
  createGameControls,
  createGameHeader,
  createGameScreen,
  getGameScreenSlot,
} from './game-screen.js';

const icon = () => document.createElementNS('http://www.w3.org/2000/svg', 'svg');

describe('createGameHeader', () => {
  it('has a back button, the title as the page heading, and a help button', () => {
    const header = createGameHeader({
      title: 'Tents & Trees',
      icons: { back: icon(), help: icon() },
    });
    expect(header.tagName).toBe('HEADER');
    expect(header.querySelector('h1')!.textContent).toBe('Tents & Trees');
    const buttons = [...header.querySelectorAll('button')];
    expect(buttons.map((b) => b.getAttribute('aria-label'))).toEqual(['Back', 'Help']);
    expect(buttons.every((b) => b.classList.contains('nl-icon-button'))).toBe(true);
  });

  it('wires callbacks and supports translated labels', () => {
    const onBack = vi.fn();
    const onHelp = vi.fn();
    const header = createGameHeader({
      title: 't',
      icons: { back: icon(), help: icon() },
      backLabel: 'Zurück',
      helpLabel: 'Hilfe',
      onBack,
      onHelp,
    });
    const [back, help] = [...header.querySelectorAll('button')];
    expect(back!.getAttribute('aria-label')).toBe('Zurück');
    back!.click();
    help!.click();
    expect(onBack).toHaveBeenCalledTimes(1);
    expect(onHelp).toHaveBeenCalledTimes(1);
  });

  it('sets the title as text, never HTML', () => {
    const header = createGameHeader({ title: '<b>x</b>', icons: { back: icon(), help: icon() } });
    expect(header.querySelector('b')).toBeNull();
  });
});

describe('createGameControls', () => {
  it('offers a New Game button (and no navigation)', () => {
    const onNewGame = vi.fn();
    const controls = createGameControls({ onNewGame });
    const button = controls.querySelector('button')!;
    expect(button.textContent).toBe('New Game');
    button.click();
    expect(onNewGame).toHaveBeenCalledTimes(1);
    expect(controls.querySelector('nav')).toBeNull();
  });
});

describe('createGameScreen', () => {
  it('lays out header, difficulty, board, controls in order, with swappable slots', () => {
    const parts = {
      header: document.createElement('i'),
      difficulty: document.createElement('i'),
      board: document.createElement('i'),
      controls: document.createElement('i'),
    };
    const screen = createGameScreen(parts);
    expect([...screen.children].map((c) => (c as HTMLElement).dataset.slot)).toEqual([
      'header',
      'difficulty',
      'board',
      'controls',
    ]);
    expect(getGameScreenSlot(screen, 'board').firstElementChild).toBe(parts.board);

    const replacement = document.createElement('b');
    getGameScreenSlot(screen, 'board').replaceChildren(replacement);
    expect(screen.contains(parts.board)).toBe(false);
    expect(screen.querySelector('nav, [role="tablist"]')).toBeNull();
  });

  it('rejects foreign elements in the slot accessor', () => {
    expect(() => getGameScreenSlot(document.createElement('div'), 'board')).toThrow();
  });
});
