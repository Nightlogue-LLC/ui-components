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

/** Minimal gameplay header: Help · difficulty/size status · Menu. No puzzle title. */
export interface CompactGameHeaderOptions {
  status: string;
  icons: { help: Node; menu: Node };
  onHelp?: (event: MouseEvent) => void;
  onMenu?: (event: MouseEvent) => void;
}

export function createCompactGameHeader(options: CompactGameHeaderOptions): HTMLElement {
  const header = document.createElement('header');
  header.className = 'nl-grim-glimmer-game-header nl-grim-glimmer-game-header--compact';
  const help = createIconButton({
    label: 'Help and rules',
    icon: options.icons.help,
    ...(options.onHelp ? { onClick: options.onHelp } : {}),
  });
  const status = document.createElement('p');
  status.className = 'nl-grim-glimmer-game-header__status';
  status.textContent = options.status;
  const menu = createIconButton({
    label: 'Game menu',
    icon: options.icons.menu,
    ...(options.onMenu ? { onClick: options.onMenu } : {}),
  });
  header.append(help, status, menu);
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

/** Difficulty choice is staged in the menu until Deal New Puzzle is pressed. */
export interface GameMenuOptions {
  difficulty: string;
  options: readonly (GameDifficultyOption & { size: number })[];
  onDeal: (difficulty: string) => void;
  title?: string;
  dealLabel?: string;
}

export function createGameMenu(options: GameMenuOptions): HTMLDialogElement {
  if (!options.options.some((option) => option.value === options.difficulty)) {
    throw new Error('createGameMenu: difficulty must match an option');
  }
  const dialog = document.createElement('dialog');
  dialog.className = 'nl-grim-glimmer-game-menu';
  dialog.setAttribute('aria-label', options.title ?? 'Game Menu');
  const panel = document.createElement('div');
  panel.className = 'nl-grim-glimmer-game-menu__panel';

  const heading = document.createElement('div');
  heading.className = 'nl-grim-glimmer-game-menu__heading';
  const title = document.createElement('h2');
  title.textContent = options.title ?? 'Game Menu';
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'nl-grim-glimmer-game-menu__close';
  close.setAttribute('aria-label', 'Close game menu');
  close.textContent = '×';
  close.addEventListener('click', () => dialog.close());
  heading.append(title, close);

  const label = document.createElement('p');
  label.className = 'nl-grim-glimmer-game-menu__label';
  label.textContent = 'Select difficulty';

  const choices = document.createElement('div');
  choices.className = 'nl-grim-glimmer-game-menu__choices';
  choices.setAttribute('role', 'group');
  choices.setAttribute('aria-label', 'Difficulty options');
  let selected = options.difficulty;
  const nodes: HTMLButtonElement[] = [];
  options.options.forEach((option) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'nl-grim-glimmer-game-menu__choice';
    button.dataset.value = option.value;
    const name = document.createElement('span');
    name.textContent = option.label;
    const size = document.createElement('span');
    size.textContent = `${option.size} × ${option.size}`;
    button.append(name, size);
    button.addEventListener('click', () => {
      selected = option.value;
      nodes.forEach((node) => {
        const active = node.dataset.value === selected;
        node.classList.toggle('nl-grim-glimmer-game-menu__choice--selected', active);
        node.setAttribute('aria-pressed', String(active));
      });
    });
    choices.append(button);
    nodes.push(button);
  });
  nodes.forEach((node) => {
    const active = node.dataset.value === selected;
    node.classList.toggle('nl-grim-glimmer-game-menu__choice--selected', active);
    node.setAttribute('aria-pressed', String(active));
  });

  const deal = createButton({
    label: options.dealLabel ?? 'Deal New Puzzle',
    variant: 'primary',
    onClick: () => {
      dialog.close();
      options.onDeal(selected);
    },
  });
  deal.classList.add('nl-grim-glimmer-game-menu__deal');
  panel.append(heading, label, choices, deal);
  dialog.append(panel);
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => {
    // A cancelled menu must not retain a staged difficulty choice.
    selected = options.difficulty;
    nodes.forEach((node) => {
      const active = node.dataset.value === selected;
      node.classList.toggle('nl-grim-glimmer-game-menu__choice--selected', active);
      node.setAttribute('aria-pressed', String(active));
    });
  });
  return dialog;
}

export type GameMarkMode = 'tent' | 'exclude';

export interface GameControlsOptions {
  /** Active marking mode. Tent mode uses tentative, then confirmed, marks in app logic. */
  mode?: GameMarkMode;
  onModeChange?: (mode: GameMarkMode) => void;
  onClear?: (event: MouseEvent) => void;
  onHint?: (event: MouseEvent) => void;
  onNewGame?: (event: MouseEvent) => void;
  /** Visible labels can be localized. */
  tentLabel?: string;
  excludeLabel?: string;
  clearLabel?: string;
  hintLabel?: string;
  newGameLabel?: string;
}

/**
 * Compact, two-mode marking toolbar and separate board actions.
 * Mark semantics are app-owned; this component reports mode requests.
 */
export function createGameControls(options: GameControlsOptions = {}): HTMLElement {
  const controls = document.createElement('div');
  controls.className = 'nl-grim-glimmer-game-controls';

  const choices = document.createElement('div');
  choices.className = 'nl-grim-glimmer-game-controls__modes';
  choices.setAttribute('role', 'group');
  choices.setAttribute('aria-label', 'Marking mode');

  const buttons: { mode: GameMarkMode; button: HTMLButtonElement }[] = [];
  const setMode = (mode: GameMarkMode) => {
    for (const choice of buttons) {
      const active = choice.mode === mode;
      choice.button.classList.toggle('nl-grim-glimmer-game-controls__mode--selected', active);
      choice.button.setAttribute('aria-pressed', String(active));
    }
  };

  for (const [mode, label] of [
    ['tent', options.tentLabel ?? 'Tent'],
    ['exclude', options.excludeLabel ?? 'X'],
  ] as const) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'nl-grim-glimmer-game-controls__mode';
    button.textContent = label;
    button.addEventListener('click', () => {
      setMode(mode);
      options.onModeChange?.(mode);
    });
    choices.append(button);
    buttons.push({ mode, button });
  }
  setMode(options.mode ?? 'tent');

  const actions = document.createElement('div');
  actions.className = 'nl-grim-glimmer-game-controls__actions';
  actions.append(
    createButton({
      label: options.hintLabel ?? 'Hint',
      variant: 'ghost',
      ...(options.onHint ? { onClick: options.onHint } : {}),
    }),
    createButton({
      label: options.clearLabel ?? 'Clear',
      variant: 'ghost',
      ...(options.onClear ? { onClick: options.onClear } : {}),
    }),
    createButton({
      label: options.newGameLabel ?? 'New Game',
      variant: 'secondary',
      ...(options.onNewGame ? { onClick: options.onNewGame } : {}),
    }),
  );
  controls.append(choices, actions);
  return controls;
}

export interface GameScreenParts {
  header: Node;
  /** Legacy difficulty slot; compact gameplay moves difficulty into the menu. */
  difficulty?: Node;
  board: Node;
  controls: Node;
  /** Optional slide-over menu attached to this screen. */
  menu?: Node;
}

export type GameScreenSlot = keyof GameScreenParts;

/**
 * The game screen layout: header, difficulty, board, controls, in one column with 24px side
 * padding (plus safe-area insets). Use `getGameScreenSlot` to swap a part (e.g. the board) later.
 */
export function createGameScreen(parts: GameScreenParts): HTMLElement {
  const screen = document.createElement('section');
  screen.className = 'nl-grim-glimmer-screen';
  if (!parts.difficulty) screen.classList.add('nl-grim-glimmer-screen--compact');
  for (const slot of ['header', 'difficulty', 'board', 'controls'] as const) {
    if (slot === 'difficulty' && !parts.difficulty) continue;
    const box = document.createElement('div');
    box.className = `nl-grim-glimmer-screen__${slot}`;
    box.dataset.slot = slot;
    box.append(parts[slot]);
    screen.append(box);
  }
  if (parts.menu) screen.append(parts.menu);
  return screen;
}

export function getGameScreenSlot(screen: HTMLElement, slot: GameScreenSlot): HTMLElement {
  const box = screen.querySelector<HTMLElement>(`[data-slot="${slot}"]`);
  if (!box) throw new Error('Not a game screen made by createGameScreen');
  return box;
}
