import { createIconButton } from '../../components/icon-button/index.js';
import { createIcon } from '../../components/icon/index.js';
import { createPuzzleGlyph } from './glyphs.js';
import type { GameMarkMode } from './game-screen.js';

export interface GameControlState {
  mode: GameMarkMode;
  canUndo: boolean;
  hint?: 'available' | 'idle' | 'disabled';
  disabled?: boolean;
  reducedMotion?: boolean;
  haptics?: boolean;
}
export interface EditorialControlsOptions extends GameControlState {
  tentLabel?: string;
  tentIcon?: Node;
  showHint?: boolean;
  tick?: () => void;
  onModeChange?: (mode: GameMarkMode) => void;
  onUndo?: () => void;
  onHint?: () => void;
  onRestart?: () => void;
}

const updates = new WeakMap<HTMLElement, (state: GameControlState) => void>();

/** Controlled tool state: clicks request changes; the consumer calls the updater. */
export function createGameToolToggle(options: EditorialControlsOptions): HTMLElement {
  let state: GameControlState = { ...options };
  const root = document.createElement('div');
  root.className = 'nl-grim-glimmer-v4 gg-v4-tools';
  root.setAttribute('role', 'group');
  root.setAttribute('aria-label', 'Marking tool');
  const indicator = document.createElement('span');
  indicator.className = 'gg-v4-tool-indicator';
  indicator.setAttribute('aria-hidden', 'true');
  root.append(indicator);
  const buttons = (['tent', 'exclude'] as const).map((mode) => {
    const button = createIconButton({
      label: mode === 'tent' ? (options.tentLabel ?? 'Place tent') : 'Exclude cell',
      icon:
        mode === 'tent' ? (options.tentIcon ?? createPuzzleGlyph('star')) : createIcon('exclude'),
      onClick: () => {
        if (button.disabled || state.mode === mode) return;
        if (state.haptics) options.tick?.();
        options.onModeChange?.(mode);
      },
    });
    button.classList.add('gg-v4-control');
    button.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const target =
        event.key === 'Home'
          ? buttons[0]!
          : event.key === 'End'
            ? buttons[1]!
            : buttons[mode === 'tent' ? 1 : 0]!;
      if (target.disabled) return;
      target.focus();
      target.click();
    });
    return button;
  });
  root.append(...buttons);
  const paint = (next: GameControlState) => {
    state = { ...next };
    root.dataset.tool = state.mode === 'tent' ? 'star' : 'exclude';
    root.dataset.reducedMotion = String(state.reducedMotion ?? false);
    buttons.forEach((button, index) => {
      button.disabled = state.disabled === true || !options.onModeChange;
      button.setAttribute(
        'aria-pressed',
        String((index === 0 ? 'tent' : 'exclude') === state.mode),
      );
    });
  };
  updates.set(root, paint);
  paint(state);
  return root;
}

/** Presentation callbacks only: the app owns confirmation, history and restart semantics. */
export function createGameControlRow(options: EditorialControlsOptions): HTMLElement {
  let state: GameControlState = { ...options };
  const root = document.createElement('div');
  root.className = 'nl-grim-glimmer-v4 gg-v4-control-row';
  root.setAttribute('role', 'group');
  root.setAttribute('aria-label', 'Puzzle controls');
  const tools = createGameToolToggle(options);
  const actions = document.createElement('div');
  actions.className = 'gg-v4-control-actions';
  const controls = (
    ['undo', ...(options.showHint === false ? [] : ['hint']), 'restart'] as const
  ).map((name) => {
    const action =
      name === 'undo' ? options.onUndo : name === 'hint' ? options.onHint : options.onRestart;
    const button = createIconButton({
      label: name === 'undo' ? 'Undo move' : name === 'hint' ? 'Hint' : 'Restart board',
      icon: createIcon(name === 'undo' ? 'undo' : name === 'hint' ? 'hint' : 'restart'),
      onClick: () => {
        if (button.disabled) return;
        if (state.haptics) options.tick?.();
        action?.();
      },
    });
    button.classList.add('gg-v4-control');
    actions.append(button);
    return { name, button, action };
  });
  root.append(tools, actions);
  const paint = (next: GameControlState) => {
    state = { ...next };
    root.dataset.reducedMotion = String(state.reducedMotion ?? false);
    updateGameToolToggle(tools, state);
    for (const { name, button, action } of controls) {
      button.disabled =
        state.disabled === true ||
        !action ||
        (name === 'undo' && !state.canUndo) ||
        (name === 'hint' && state.hint === 'disabled');
      if (name === 'hint') {
        button.dataset.hint = state.hint ?? 'idle';
        button.setAttribute('aria-label', state.hint === 'available' ? 'Hint available' : 'Hint');
      }
    }
  };
  updates.set(root, paint);
  paint(state);
  return root;
}

export function updateGameToolToggle(root: HTMLElement, state: GameControlState): void {
  const update = updates.get(root);
  if (!update) throw new Error('Expected editorial game controls');
  update(state);
}
export const updateGameControlRow = updateGameToolToggle;
