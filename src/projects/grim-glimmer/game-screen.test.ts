import { describe, expect, it, vi } from 'vitest';
import {
  createGameControls,
  createGameDifficulty,
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
  it('starts in Tent mode with an accessible X switch', () => {
    const changes = vi.fn();
    const controls = createGameControls({ onModeChange: changes });
    const [tent, exclude] = [...controls.querySelectorAll<HTMLButtonElement>('.nl-grim-glimmer-game-controls__mode')];
    expect(tent?.getAttribute('aria-pressed')).toBe('true');
    expect(exclude?.getAttribute('aria-pressed')).toBe('false');
    exclude!.click();
    expect(changes).toHaveBeenCalledExactlyOnceWith('exclude');
    expect(tent?.getAttribute('aria-pressed')).toBe('false');
    expect(exclude?.getAttribute('aria-pressed')).toBe('true');
    tent!.click();
    expect(changes).toHaveBeenLastCalledWith('tent');
  });

  it('has Hint, Clear and New Game, with no Undo or Redo', () => {
    const hint = vi.fn();
    const clear = vi.fn();
    const newGame = vi.fn();
    const controls = createGameControls({ onHint: hint, onClear: clear, onNewGame: newGame });
    const actions = [...controls.querySelectorAll<HTMLButtonElement>('.nl-grim-glimmer-game-controls__actions button')];
    expect(actions.map((button) => button.textContent)).toEqual(['Hint', 'Clear', 'New Game']);
    actions.forEach((button) => button.click());
    expect(hint).toHaveBeenCalledOnce();
    expect(clear).toHaveBeenCalledOnce();
    expect(newGame).toHaveBeenCalledOnce();
    expect(controls.querySelector('nav')).toBeNull();
  });
});

describe('createGameDifficulty', () => {
  it('renders a native accessible select and forwards difficulty choices', () => {
    const onChange = vi.fn();
    const difficulty = createGameDifficulty({
      label: 'Choose difficulty',
      value: 'easy',
      options: [
        { value: 'easy', label: 'Easy' },
        { value: 'hard', label: 'Hard' },
      ],
      onChange,
    });
    const select = difficulty.querySelector('select')!;
    expect(difficulty.textContent).toContain('Choose difficulty');
    expect(select.value).toBe('easy');
    select.value = 'hard';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    expect(onChange).toHaveBeenCalledExactlyOnceWith('hard');
  });

  it('rejects a difficulty outside the available options', () => {
    expect(() =>
      createGameDifficulty({ value: 'unknown', options: [], onChange: vi.fn() }),
    ).toThrow();
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
