import { createButton, updateButton } from '../../components/button/index.js';
import { uniqueId } from '../../core/id.js';

export const GAME_MENU_SIZES = [6, 8, 10, 12, 15] as const;
export const GAME_MENU_DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
export interface GameMenuSelection {
  size: (typeof GAME_MENU_SIZES)[number] | null;
  difficulty: (typeof GAME_MENU_DIFFICULTIES)[number] | null;
}
export interface GameMenuAvailability {
  status: 'ready' | 'loading' | 'unavailable';
  /** App-owned catalog/loading explanation; never inferred from mock puzzles. */
  message?: string;
}
export interface GameMenuContentOptions {
  /** Last committed selection. Null means random independently in each category. */
  selection: GameMenuSelection;
  getAvailability: (selection: GameMenuSelection) => GameMenuAvailability;
  onSelectionChange?: (selection: GameMenuSelection) => void;
  onStart: (selection: GameMenuSelection) => void;
  onHowToPlay: () => void;
  onGameSettings: () => void;
}
export interface GameMenuContent {
  element: HTMLElement;
  /** Snapshot of the draft; changing it does not mutate the component. */
  readonly selection: GameMenuSelection;
  /** Supply a new committed value, or discard the draft back to the current one. */
  reset(selection?: GameMenuSelection): void;
  /** Re-read app-owned availability after catalog/loading state changes. */
  refresh(): void;
}

/** Content for the existing GameMenu overlay, not a second dialog or selector sheet. */
export function createGameMenuContent(options: GameMenuContentOptions): GameMenuContent {
  let committed = { ...options.selection };
  let draft = { ...committed };
  const root = document.createElement('div');
  root.className = 'nl-grim-glimmer-menu-content';
  const section = document.createElement('section');
  const heading = document.createElement('h2');
  heading.id = uniqueId('nl-new-game');
  heading.textContent = 'New Game';
  section.setAttribute('aria-labelledby', heading.id);
  const help = document.createElement('p');
  help.id = uniqueId('nl-game-selection-help');
  help.className = 'nl-grim-glimmer-menu-content__help';
  help.textContent = 'No selection means random. Tap a selected option to clear it.';
  const choices: { button: HTMLButtonElement; selected: () => boolean }[] = [];
  function group(key: 'size' | 'difficulty', label: string, values: readonly (number | string)[]) {
    const fieldset = document.createElement('fieldset');
    fieldset.setAttribute('aria-describedby', help.id);
    const legend = document.createElement('legend');
    legend.textContent = label;
    const grid = document.createElement('div');
    grid.className = `nl-grim-glimmer-menu-content__choices nl-grim-glimmer-menu-content__choices--${key}`;
    for (const value of values) {
      const text =
        typeof value === 'number' ? `${value}×${value}` : value[0]!.toUpperCase() + value.slice(1);
      const button = createButton({
        label: text,
        variant: 'secondary',
        onClick: () => {
          if (key === 'size') {
            const size = value as GameMenuSelection['size'];
            draft = { ...draft, size: draft.size === size ? null : size };
          } else {
            const difficulty = value as GameMenuSelection['difficulty'];
            draft = { ...draft, difficulty: draft.difficulty === difficulty ? null : difficulty };
          }
          refresh();
          options.onSelectionChange?.({ ...draft });
        },
      });
      choices.push({ button, selected: () => draft[key] === value });
      grid.append(button);
    }
    fieldset.append(legend, grid);
    return fieldset;
  }
  const summary = document.createElement('p');
  summary.id = uniqueId('nl-game-selection-status');
  summary.className = 'nl-grim-glimmer-menu-content__status';
  summary.setAttribute('role', 'status');
  summary.setAttribute('aria-atomic', 'true');
  const start = createButton({
    label: 'Start New Game',
    onClick: () => {
      // Availability may change between rendering and activation (e.g. catalog refresh).
      refresh();
      if (!start.disabled) options.onStart({ ...draft });
    },
  });
  start.classList.add('nl-grim-glimmer-menu-content__start');
  start.setAttribute('aria-describedby', summary.id);
  section.append(
    heading,
    help,
    group('size', 'Grid size', GAME_MENU_SIZES),
    group('difficulty', 'Difficulty', GAME_MENU_DIFFICULTIES),
    summary,
    start,
  );
  const actions = document.createElement('div');
  actions.className = 'nl-grim-glimmer-menu-content__actions';
  actions.append(
    createButton({ label: 'How to Play', variant: 'ghost', onClick: options.onHowToPlay }),
    createButton({ label: 'Game Settings', variant: 'ghost', onClick: options.onGameSettings }),
  );
  root.append(section, actions);
  function refresh() {
    for (const choice of choices)
      choice.button.setAttribute('aria-pressed', String(choice.selected()));
    const availability = options.getAvailability({ ...draft });
    const selected = `${draft.size === null ? 'Random size' : `${draft.size}×${draft.size}`} · ${draft.difficulty ?? 'random difficulty'}`;
    const message =
      availability.message ??
      (availability.status === 'loading'
        ? 'Checking available puzzles…'
        : availability.status === 'unavailable'
          ? 'No puzzles available for this selection.'
          : '');
    summary.textContent = message ? `${selected}. ${message}` : selected;
    updateButton(start, {
      label: 'Start New Game',
      loading: availability.status === 'loading',
      disabled: availability.status === 'unavailable',
    });
  }
  function reset(selection?: GameMenuSelection) {
    if (selection) committed = { ...selection };
    draft = { ...committed };
    refresh();
  }
  root.addEventListener('game-menu-open', () => reset());
  root.addEventListener('game-menu-close', () => reset());
  refresh();
  return {
    element: root,
    get selection() {
      return { ...draft };
    },
    reset,
    refresh,
  };
}
