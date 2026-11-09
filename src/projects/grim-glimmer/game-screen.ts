import { createPuzzleGlyph } from './glyphs.js';
import { createSelect } from '../../components/select/index.js';
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

/** Back button, short title, help button. 48px touch targets. Gameplay has no bottom navigation. */
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

/** App-level navigation is independent of the puzzle header and controls. */
export interface AppFrameHeaderOptions {
  icons: { back: Node; settings: Node };
  onBack?: (event: MouseEvent) => void;
  onSettings?: (event: MouseEvent) => void;
  /** Show an active settings icon, suitable for a toggleable settings view. */
  settingsOpen?: boolean;
  /** Hide back navigation when settings is toggled over the current screen. */
  hideBack?: boolean;
}

export function createAppFrameHeader(options: AppFrameHeaderOptions): HTMLElement {
  const header = document.createElement('nav');
  header.className = 'nl-grim-glimmer-app-header';
  header.setAttribute('aria-label', 'Grim and Glimmer navigation');
  if (!options.hideBack) {
    header.append(
      createIconButton({
        label: 'Back to collection',
        icon: options.icons.back,
        ...(options.onBack ? { onClick: options.onBack } : {}),
      }),
    );
  } else {
    header.classList.add('nl-grim-glimmer-app-header--settings-open');
  }
  const settings = createIconButton({
    label: options.settingsOpen ? 'Close app settings' : 'App settings',
    icon: options.icons.settings,
    ...(options.onSettings ? { onClick: options.onSettings } : {}),
  });
  settings.classList.add('nl-grim-glimmer-app-header__settings-toggle');
  settings.setAttribute('aria-pressed', String(options.settingsOpen ?? false));
  header.append(settings);
  return header;
}

/** Toggle the same persistent settings button so its rotation can animate. */
export function updateAppFrameSettingsOpen(header: HTMLElement, open: boolean): void {
  if (!header.classList.contains('nl-grim-glimmer-app-header')) {
    throw new Error('updateAppFrameSettingsOpen: expected an app frame header');
  }
  header.classList.toggle('nl-grim-glimmer-app-header--settings-open', open);
  const back = header.querySelector<HTMLButtonElement>('[aria-label="Back to collection"]');
  if (back) back.hidden = open;
  const settings = header.querySelector<HTMLButtonElement>(
    '.nl-grim-glimmer-app-header__settings-toggle',
  );
  if (!settings) throw new Error('updateAppFrameSettingsOpen: missing settings toggle');
  settings.setAttribute('aria-pressed', String(open));
  settings.setAttribute('aria-label', open ? 'Close app settings' : 'App settings');
}

export interface CompactGameHeaderOptions {
  title: string;
  status: string;
  icons: { hint: Node; menu: Node };
  /** Optional future allocation of free hints; omit to render no badge. */
  freeHints?: number;
  onHint?: (event: MouseEvent) => void;
  onMenu?: (event: MouseEvent) => void;
}

export function createCompactGameHeader(options: CompactGameHeaderOptions): HTMLElement {
  const header = document.createElement('header');
  header.className = 'nl-grim-glimmer-game-header nl-grim-glimmer-game-header--compact';
  const hintHolder = document.createElement('div');
  hintHolder.className = 'nl-grim-glimmer-game-header__hint';
  const hint = createIconButton({
    label: options.freeHints === undefined ? 'Hint' : `Hint (${options.freeHints} free remaining)`,
    icon: options.icons.hint,
    ...(options.onHint ? { onClick: options.onHint } : {}),
  });
  hintHolder.append(hint);
  if (options.freeHints !== undefined) {
    if (!Number.isInteger(options.freeHints) || options.freeHints < 0) {
      throw new Error('createCompactGameHeader: freeHints must be a nonnegative integer');
    }
    const badge = document.createElement('span');
    badge.className = 'nl-grim-glimmer-game-header__hint-badge';
    badge.textContent = String(options.freeHints);
    badge.setAttribute('aria-hidden', 'true');
    hintHolder.append(badge);
  }
  const heading = document.createElement('div');
  heading.className = 'nl-grim-glimmer-game-header__heading';
  const title = document.createElement('h1');
  title.className = 'nl-grim-glimmer-game-header__title';
  title.textContent = options.title;
  const status = document.createElement('p');
  status.className = 'nl-grim-glimmer-game-header__status';
  status.textContent = options.status;
  heading.append(title, status);
  const menu = createIconButton({
    label: 'Game menu',
    icon: options.icons.menu,
    ...(options.onMenu ? { onClick: options.onMenu } : {}),
  });
  menu.setAttribute('aria-haspopup', 'dialog');
  header.append(hintHolder, heading, menu);
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

/** Themed in-app difficulty picker. The consumer owns the chosen value. */
export function createGameDifficulty(options: GameDifficultyOptions): HTMLElement {
  if (!options.options.some((entry) => entry.value === options.value)) {
    throw new Error('createGameDifficulty: selected value must match an option');
  }
  const control = document.createElement('div');
  control.className = 'nl-grim-glimmer-game-difficulty';
  const label = document.createElement('span');
  label.className = 'nl-grim-glimmer-game-difficulty__label';
  label.textContent = options.label ?? 'Difficulty';
  const select = createSelect({
    label: options.label ?? 'Difficulty',
    value: options.value,
    options: options.options,
    onChange: options.onChange,
  });
  control.append(label, select);
  return control;
}

/** Small puzzle-specific popover. App-wide settings live in a separate app control. */
export interface GameMenuOptions {
  difficulty: string;
  options: readonly (GameDifficultyOption & { size: number })[];
  onDeal: (difficulty: string) => void;
  onHelp?: () => void;
  title?: string;
  dealLabel?: string;
  helpLabel?: string;
}

export function createGameMenu(options: GameMenuOptions): HTMLElement {
  if (!options.options.some((option) => option.value === options.difficulty)) {
    throw new Error('createGameMenu: difficulty must match an option');
  }
  const menu = document.createElement('section');
  menu.className = 'nl-grim-glimmer-game-menu';
  menu.setAttribute('role', 'dialog');
  menu.setAttribute('aria-label', options.title ?? 'Game menu');
  menu.hidden = true;
  const heading = document.createElement('p');
  heading.className = 'nl-grim-glimmer-game-menu__label';
  heading.textContent = 'Difficulty';
  const choices = document.createElement('div');
  choices.className = 'nl-grim-glimmer-game-menu__choices';
  choices.setAttribute('role', 'group');
  choices.setAttribute('aria-label', 'Choose difficulty');
  let selected = options.difficulty;
  const nodes: HTMLButtonElement[] = [];
  const paint = () => {
    nodes.forEach((button) => {
      const active = button.dataset.value === selected;
      button.classList.toggle('nl-grim-glimmer-game-menu__choice--selected', active);
      button.setAttribute('aria-pressed', String(active));
    });
  };
  for (const option of options.options) {
    const choice = document.createElement('button');
    choice.type = 'button';
    choice.className = 'nl-grim-glimmer-game-menu__choice';
    choice.dataset.value = option.value;
    const label = document.createElement('span');
    label.textContent = option.label;
    const size = document.createElement('span');
    size.textContent = `${option.size}×${option.size}`;
    choice.append(label, size);
    choice.addEventListener('click', () => {
      selected = option.value;
      paint();
    });
    choices.append(choice);
    nodes.push(choice);
  }
  paint();
  const actions = document.createElement('div');
  actions.className = 'nl-grim-glimmer-game-menu__actions';
  if (options.onHelp) {
    actions.append(
      createButton({
        label: options.helpLabel ?? 'How to Play',
        variant: 'ghost',
        onClick: () => {
          closeGameMenu(menu);
          options.onHelp?.();
        },
      }),
    );
  }
  actions.append(
    createButton({
      label: options.dealLabel ?? 'New Game',
      variant: 'primary',
      onClick: () => {
        const next = selected;
        closeGameMenu(menu);
        options.onDeal(next);
      },
    }),
  );
  menu.append(heading, choices, actions);
  menu.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeGameMenu(menu);
    }
  });
  menu.addEventListener('game-menu-close', () => {
    selected = options.difficulty;
    paint();
  });
  return menu;
}

export function closeGameMenu(menu: HTMLElement): void {
  menu.hidden = true;
  menu.dispatchEvent(new Event('game-menu-close'));
}

export function toggleGameMenu(menu: HTMLElement): void {
  if (!menu.hidden) {
    closeGameMenu(menu);
    return;
  }
  menu.hidden = false;
  menu.querySelector<HTMLButtonElement>('button')?.focus();
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
  /** Compact gameplay puts New Game in its menu instead of the bottom toolbar. */
  showNewGame?: boolean;
  /** Compact gameplay places Hint in its header instead of the toolbar. */
  showHint?: boolean;
  /** Supply local artwork while retaining text labels for accessibility. */
  icons?: { tent: Node; exclude: Node; clear: Node };
  /** One row with an icon switch on the left and a clear icon on the right. */
  compact?: boolean;
}

/**
 * Compact, two-mode marking toolbar and separate board actions.
 * Mark semantics are app-owned; this component reports mode requests.
 */
export function createGameControls(options: GameControlsOptions = {}): HTMLElement {
  const controls = document.createElement('div');
  controls.className = 'nl-grim-glimmer-game-controls';
  if (options.compact) controls.classList.add('nl-grim-glimmer-game-controls--compact');

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
    if (options.icons) {
      const icon = options.icons[mode === 'tent' ? 'tent' : 'exclude'].cloneNode(true);
      button.append(icon);
      button.setAttribute('aria-label', label);
      button.title = label;
    } else {
      if (mode === 'tent') button.append(createPuzzleGlyph('star'));
      const text = document.createElement('span');
      text.textContent = label;
      button.append(text);
    }
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
  if (options.showHint !== false) {
    actions.append(
      createButton({
        label: options.hintLabel ?? 'Hint',
        variant: 'ghost',
        ...(options.onHint ? { onClick: options.onHint } : {}),
      }),
    );
  }
  if (options.compact && options.icons) {
    actions.append(
      createIconButton({
        label: options.clearLabel ?? 'Clear marks',
        icon: options.icons.clear,
        ...(options.onClear ? { onClick: options.onClear } : {}),
      }),
    );
  } else {
    actions.append(
      createButton({
        label: options.clearLabel ?? 'Clear',
        variant: 'ghost',
        ...(options.onClear ? { onClick: options.onClear } : {}),
      }),
    );
  }
  if (options.showNewGame !== false) {
    actions.append(
      createButton({
        label: options.newGameLabel ?? 'New Game',
        variant: 'secondary',
        ...(options.onNewGame ? { onClick: options.onNewGame } : {}),
      }),
    );
  }
  controls.append(choices, actions);
  return controls;
}

export interface GameScreenParts {
  appHeader?: Node;
  header: Node;
  /** Legacy difficulty slot; compact gameplay moves difficulty into the menu. */
  difficulty?: Node;
  board: Node;
  controls: Node;
  /** Optional puzzle popover attached to this screen. */
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
  for (const slot of ['appHeader', 'header', 'difficulty', 'board', 'controls'] as const) {
    if (slot === 'appHeader' && !parts.appHeader) continue;
    if (slot === 'difficulty' && !parts.difficulty) continue;
    const box = document.createElement('div');
    box.className = `nl-grim-glimmer-screen__${slot === 'appHeader' ? 'app-header' : slot}`;
    box.dataset.slot = slot;
    box.append(parts[slot]!);
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
