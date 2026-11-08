import { createButton } from '../../components/button/index.js';
import { createIconButton } from '../../components/icon-button/index.js';

export interface GameHeaderOptions {
  /** Short game title. */
  title: string;
  /** Icon artwork is app-owned: pass DOM nodes (e.g. `<svg>` elements). They are cloned. */
  icons: { back: Node; help: Node };
  /** Accessible names for the icon buttons. Defaults: "Back" / "Help". */
  backLabel?: string;
  helpLabel?: string;
  onBack?: (event: MouseEvent) => void;
  onHelp?: (event: MouseEvent) => void;
}

/** Back button, short title, help button. 48px touch targets. No bottom navigation anywhere. */
export function createGameHeader(options: GameHeaderOptions): HTMLElement {
  const header = document.createElement('header');
  header.className = 'nl-grim-glimmer-game-header';

  const back = createIconButton({
    label: options.backLabel ?? 'Back',
    icon: options.icons.back,
    ...(options.onBack ? { onClick: options.onBack } : {}),
  });
  const help = createIconButton({
    label: options.helpLabel ?? 'Help',
    icon: options.icons.help,
    ...(options.onHelp ? { onClick: options.onHelp } : {}),
  });

  const title = document.createElement('h1');
  title.className = 'nl-grim-glimmer-game-header__title';
  title.textContent = options.title;

  header.append(back, title, help);
  return header;
}

export interface GameDifficultyOption {
  value: string;
  label: string;
}

export interface GameDifficultyOptions {
  label?: string;
  value: string;
  options: readonly GameDifficultyOption[];
  onChange: (value: string) => void;
}

/** Native accessible dropdown for selecting difficulty. The consumer owns the chosen value. */
export function createGameDifficulty(options: GameDifficultyOptions): HTMLElement {
  if (!options.options.some((entry) => entry.value === options.value)) {
    throw new Error('createGameDifficulty: selected value must match an option');
  }
  const control = document.createElement('label');
  control.className = 'nl-grim-glimmer-game-difficulty';
  const label = document.createElement('span');
  label.className = 'nl-grim-glimmer-game-difficulty__label';
  label.textContent = options.label ?? 'Difficulty';
  const select = document.createElement('select');
  select.className = 'nl-grim-glimmer-game-difficulty__select';
  for (const item of options.options) {
    const option = document.createElement('option');
    option.value = item.value;
    option.textContent = item.label;
    select.append(option);
  }
  select.value = options.value;
  select.addEventListener('change', () => options.onChange(select.value));
  control.append(label, select);
  return control;
}

export interface GameControlsOptions {
  /** Default "New Game". */
  newGameLabel?: string;
  onNewGame?: (event: MouseEvent) => void;
  onUndo?: (event: MouseEvent) => void;
  onHint?: (event: MouseEvent) => void;
  undoLabel?: string;
  hintLabel?: string;
}

/** Compact controls shown below the board. */
export function createGameControls(options: GameControlsOptions = {}): HTMLElement {
  const controls = document.createElement('div');
  controls.className = 'nl-grim-glimmer-game-controls';
  if (options.onUndo) {
    controls.append(createButton({
      label: options.undoLabel ?? 'Undo',
      variant: 'ghost',
      onClick: options.onUndo,
    }));
  }
  if (options.onHint) {
    controls.append(createButton({
      label: options.hintLabel ?? 'Hint',
      variant: 'ghost',
      onClick: options.onHint,
    }));
  }
  controls.append(
    createButton({
      label: options.newGameLabel ?? 'New Game',
      variant: 'secondary',
      ...(options.onNewGame ? { onClick: options.onNewGame } : {}),
    }),
  );
  return controls;
}

export interface GameScreenParts {
  header: Node;
  /** Compact difficulty dropdown, kept separate from the header. */
  difficulty: Node;
  board: Node;
  controls: Node;
}

export type GameScreenSlot = keyof GameScreenParts;

/**
 * The game screen layout: header, difficulty, board, controls, in one column with 24px side
 * padding (plus safe-area insets). Use `getGameScreenSlot` to swap a part (e.g. the board) later.
 */
export function createGameScreen(parts: GameScreenParts): HTMLElement {
  const screen = document.createElement('section');
  screen.className = 'nl-grim-glimmer-screen';
  for (const slot of ['header', 'difficulty', 'board', 'controls'] as const) {
    const box = document.createElement('div');
    box.className = `nl-grim-glimmer-screen__${slot}`;
    box.dataset.slot = slot;
    box.append(parts[slot]);
    screen.append(box);
  }
  return screen;
}

export function getGameScreenSlot(screen: HTMLElement, slot: GameScreenSlot): HTMLElement {
  const box = screen.querySelector<HTMLElement>(`[data-slot="${slot}"]`);
  if (!box) throw new Error('Not a game screen made by createGameScreen');
  return box;
}
