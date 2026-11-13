import { createButton, updateButton } from '../../components/button/index.js';
import { createIconButton } from '../../components/icon-button/index.js';
import { createIcon } from '../../components/icon/index.js';
import {
  createSegmentedControl,
  updateSegmentedControl,
} from '../../components/segmented-control/index.js';
import { uniqueId } from '../../core/id.js';

export const GAME_MENU_SIZES = [6, 8, 10, 12, 15] as const;
export const GAME_MENU_DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
export interface GameMenuSelection {
  size: (typeof GAME_MENU_SIZES)[number];
  difficulty: (typeof GAME_MENU_DIFFICULTIES)[number];
}
export interface GameMenuAvailability {
  status: 'ready' | 'loading' | 'unavailable';
  /** App-owned catalog/loading explanation; never inferred from mock puzzles. */
  message?: string;
}
export interface GameMenuContentOptions {
  /** Last committed required size and difficulty. */
  selection: GameMenuSelection;
  getSurpriseAvailability: () => GameMenuAvailability;
  onSurprise: () => void;
  /** False pauses the decorative glow independently of the OS motion preference. */
  animations?: () => boolean;
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
  heading.id = uniqueId('nl-game-menu-heading');
  heading.textContent = 'Game Menu';
  section.setAttribute('aria-labelledby', heading.id);
  const groups: {
    element: HTMLElement;
    key: 'size' | 'difficulty';
    label: string;
    options: { value: string; label: string }[];
  }[] = [];
  function group(key: 'size' | 'difficulty', label: string, values: readonly (number | string)[]) {
    const fieldset = document.createElement('fieldset');
    const legend = document.createElement('legend');
    legend.textContent = label;
    const choices = values.map((value) => ({
      value: String(value),
      label:
        typeof value === 'number' ? `${value}×${value}` : value[0]!.toUpperCase() + value.slice(1),
    }));
    const control = createSegmentedControl({
      label,
      options: choices,
      value: String(draft[key]),
      onChange: (value) => {
        if (key === 'size') draft = { ...draft, size: Number(value) as GameMenuSelection['size'] };
        else draft = { ...draft, difficulty: value as GameMenuSelection['difficulty'] };
        refresh();
        options.onSelectionChange?.({ ...draft });
      },
    });
    control.classList.add('nl-grim-glimmer-menu-content__choices');
    groups.push({ element: control, key, label, options: choices });
    fieldset.append(legend, control);
    return fieldset;
  }
  const summary = document.createElement('p');
  summary.id = uniqueId('nl-game-selection-status');
  summary.className = 'nl-grim-glimmer-menu-content__status';
  summary.setAttribute('role', 'status');
  summary.setAttribute('aria-atomic', 'true');
  const start = createButton({
    label: 'New Game',
    onClick: () => {
      // Availability may change between rendering and activation (e.g. catalog refresh).
      refresh();
      if (!start.disabled) options.onStart({ ...draft });
    },
  });
  start.classList.add('nl-grim-glimmer-menu-content__start');
  start.setAttribute('aria-describedby', summary.id);
  const surprise = createIconButton({
    label: 'Surprise Me',
    icon: createIcon('magic-wand'),
    variant: 'secondary',
    onClick: () => {
      refresh();
      if (!surprise.disabled) options.onSurprise();
    },
  });
  surprise.title = 'Surprise Me — random size and difficulty';
  surprise.classList.add('nl-grim-glimmer-menu-content__surprise');
  const surpriseStatus = document.createElement('span');
  surpriseStatus.id = uniqueId('nl-surprise-status');
  surpriseStatus.className = 'nl-grim-glimmer-menu-content__sr-only';
  surpriseStatus.setAttribute('role', 'status');
  surprise.setAttribute('aria-describedby', surpriseStatus.id);
  const row = document.createElement('div');
  row.className = 'nl-grim-glimmer-menu-content__button-row';
  const glow = document.createElement('span');
  glow.className = 'nl-grim-glimmer-menu-content__surprise-shell';
  glow.append(surprise);
  row.append(start, glow);
  section.append(
    heading,
    group('size', 'Grid size', GAME_MENU_SIZES),
    group('difficulty', 'Difficulty', GAME_MENU_DIFFICULTIES),
    summary,
    row,
    surpriseStatus,
  );
  const actions = document.createElement('div');
  actions.className = 'nl-grim-glimmer-menu-content__actions';
  actions.append(
    createButton({ label: 'How to Play', variant: 'ghost', onClick: options.onHowToPlay }),
    createButton({ label: 'Game Settings', variant: 'ghost', onClick: options.onGameSettings }),
  );
  root.append(section, actions);
  function refresh() {
    for (const group of groups)
      updateSegmentedControl(group.element, {
        label: group.label,
        options: group.options,
        value: String(draft[group.key]),
      });
    root.dataset.animations = options.animations?.() === false ? 'off' : 'on';
    const availability = options.getAvailability({ ...draft });
    const selected = `${draft.size}×${draft.size} · ${draft.difficulty}`;
    const message =
      availability.message ??
      (availability.status === 'loading'
        ? 'Checking available puzzles…'
        : availability.status === 'unavailable'
          ? 'No puzzles available for this selection.'
          : '');
    summary.textContent = message ? `${selected}. ${message}` : selected;
    const random = options.getSurpriseAvailability();
    surprise.disabled = random.status !== 'ready';
    surprise.setAttribute('aria-busy', String(random.status === 'loading'));
    glow.dataset.disabled = String(surprise.disabled);
    surpriseStatus.textContent =
      random.message ??
      (random.status === 'loading'
        ? 'Checking random puzzles…'
        : random.status === 'unavailable'
          ? 'No puzzles available for Surprise Me.'
          : 'Random size and difficulty. Does not change your selected preferences.');
    updateButton(start, {
      label: 'New Game',
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
