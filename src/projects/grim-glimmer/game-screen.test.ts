import { describe, expect, it, vi } from 'vitest';
import {
  createGameControls,
  createAppFrameHeader,
  updateAppFrameSettingsOpen,
  createCompactGameHeader,
  createGameMenu,
  toggleGameMenu,
  closeGameMenu,
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
    const [tent, exclude] = [
      ...controls.querySelectorAll<HTMLButtonElement>('.nl-grim-glimmer-game-controls__mode'),
    ];
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
    const actions = [
      ...controls.querySelectorAll<HTMLButtonElement>(
        '.nl-grim-glimmer-game-controls__actions button',
      ),
    ];
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

describe('Two-layer mobile gameplay navigation', () => {
  it('separates app navigation from a puzzle header with a future hint badge', () => {
    const back = vi.fn();
    const settings = vi.fn();
    const appHeader = createAppFrameHeader({
      icons: { back: icon(), settings: icon() },
      onBack: back,
      onSettings: settings,
    });
    expect(appHeader.querySelectorAll('button')).toHaveLength(2);
    expect(appHeader.getAttribute('aria-label')).toContain('Grim');
    const [backButton, settingsButton] = [...appHeader.querySelectorAll('button')];
    backButton!.click();
    settingsButton!.click();
    expect(back).toHaveBeenCalledOnce();
    expect(settings).toHaveBeenCalledOnce();

    const hint = vi.fn();
    const puzzle = createCompactGameHeader({
      title: 'Tents & Trees',
      status: 'Easy · 5×5',
      freeHints: 3,
      icons: { hint: icon(), menu: icon() },
      onHint: hint,
    });
    expect(puzzle.querySelector('h1')?.textContent).toBe('Tents & Trees');
    expect(puzzle.querySelector('.nl-grim-glimmer-game-header__status')?.textContent).toContain(
      '5×5',
    );
    expect(puzzle.querySelector('.nl-grim-glimmer-game-header__hint-badge')?.textContent).toBe('3');
    puzzle.querySelector<HTMLButtonElement>('[aria-label="Hint (3 free remaining)"]')!.click();
    expect(hint).toHaveBeenCalledOnce();
    expect(() =>
      createCompactGameHeader({
        title: 'Tents & Trees',
        status: 'Easy',
        freeHints: -1,
        icons: { hint: icon(), menu: icon() },
      }),
    ).toThrow(/freeHints/);
  });

  it('toggles the same settings icon and hides Back in the open state', () => {
    const header = createAppFrameHeader({
      icons: { back: icon(), settings: icon() },
    });
    const toggle = header.querySelector<HTMLButtonElement>(
      '.nl-grim-glimmer-app-header__settings-toggle',
    )!;
    const back = header.querySelector<HTMLButtonElement>('[aria-label="Back to collection"]')!;
    expect(toggle.getAttribute('aria-pressed')).toBe('false');
    updateAppFrameSettingsOpen(header, true);
    expect(toggle.getAttribute('aria-pressed')).toBe('true');
    expect(toggle.getAttribute('aria-label')).toBe('Close app settings');
    expect(back.hidden).toBe(true);
    expect(header.classList.contains('nl-grim-glimmer-app-header--settings-open')).toBe(true);
    updateAppFrameSettingsOpen(header, false);
    expect(toggle.getAttribute('aria-pressed')).toBe('false');
    expect(back.hidden).toBe(false);
  });

  it('keeps Tent/X and Clear in a single icon-only toolbar, with no Hint or New Game', () => {
    const clear = vi.fn();
    const controls = createGameControls({
      compact: true,
      showHint: false,
      showNewGame: false,
      icons: { tent: icon(), exclude: icon(), clear: icon() },
      onClear: clear,
    });
    expect(controls.querySelector('.nl-grim-glimmer-game-controls--compact')).toBeNull();
    expect(controls.classList.contains('nl-grim-glimmer-game-controls--compact')).toBe(true);
    const buttons = [...controls.querySelectorAll('button')];
    expect(buttons.map((button) => button.getAttribute('aria-label'))).toEqual([
      'Tent',
      'X',
      'Clear marks',
    ]);
    expect(controls.querySelectorAll('svg')).toHaveLength(3);
    buttons[2]!.click();
    expect(clear).toHaveBeenCalledOnce();
  });

  it('opens and closes a compact staged game menu without changing difficulty before New Game', () => {
    const deal = vi.fn();
    const help = vi.fn();
    const menu = createGameMenu({
      difficulty: 'easy',
      options: [
        { value: 'easy', label: 'Easy', size: 5 },
        { value: 'medium', label: 'Medium', size: 8 },
      ],
      onDeal: deal,
      onHelp: help,
    });
    expect(menu.hidden).toBe(true);
    toggleGameMenu(menu);
    expect(menu.hidden).toBe(false);
    const medium = menu.querySelector<HTMLButtonElement>('[data-value="medium"]')!;
    medium.click();
    expect(medium.getAttribute('aria-pressed')).toBe('true');
    expect(deal).not.toHaveBeenCalled();
    closeGameMenu(menu);
    expect(menu.hidden).toBe(true);
    toggleGameMenu(menu);
    expect(medium.getAttribute('aria-pressed')).toBe('false');
    const actions = [
      ...menu.querySelectorAll<HTMLButtonElement>('.nl-grim-glimmer-game-menu__actions button'),
    ];
    actions[0]!.click();
    expect(help).toHaveBeenCalledOnce();
    toggleGameMenu(menu);
    medium.click();
    actions[1]!.click();
    expect(deal).toHaveBeenCalledExactlyOnceWith('medium');
  });

  it('places shared app header before the puzzle header without adding a difficulty row', () => {
    const screen = createGameScreen({
      appHeader: document.createElement('nav'),
      header: document.createElement('header'),
      board: document.createElement('div'),
      controls: document.createElement('div'),
    });
    expect(
      [...screen.children].slice(0, 4).map((child) => (child as HTMLElement).dataset.slot),
    ).toEqual(['appHeader', 'header', 'board', 'controls']);
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
