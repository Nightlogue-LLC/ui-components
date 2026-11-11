import {
  createGameToolToggle,
  updateGameToolToggle,
  createGameControlRow,
  updateGameControlRow,
  updateBoard,
  type BoardCellState,
  type GameControlState,
} from '../../../src/projects/grim-glimmer/index.js';
import { createV4Board, fixture } from './board.js';
import { el } from '../../lib/dom.js';
import './controls.css';
export type Tool = 'star' | 'exclude';
export interface ControlsOptions {
  tool?: Tool;
  canUndo?: boolean;
  hint?: 'available' | 'idle' | 'disabled';
  disabled?: boolean;
  reducedMotion?: boolean;
  haptics?: boolean;
  tick?: () => void;
  onTool?: (tool: Tool) => void;
  onUndo?: () => void;
  onHint?: () => void;
  onRestart?: () => void;
}
function createControls(options: ControlsOptions, row: boolean) {
  let tool = options.tool ?? 'star';
  const state = (): GameControlState => ({
    ...options,
    mode: tool === 'star' ? 'tent' : 'exclude',
    canUndo: options.canUndo ?? false,
  });
  const root = (row ? createGameControlRow : createGameToolToggle)({
    ...state(),
    tentLabel: 'Place star',
    tick: options.tick,
    onModeChange: (mode) => {
      tool = mode === 'tent' ? 'star' : 'exclude';
      (row ? updateGameControlRow : updateGameToolToggle)(root, state());
      options.onTool?.(tool);
    },
    onUndo: options.onUndo ?? (() => undefined),
    onHint: options.onHint ?? (() => undefined),
    onRestart: options.onRestart ?? (() => undefined),
  });
  root.classList.add('gg-v4-scope');
  return root;
}
export const createToolToggle = (options: ControlsOptions = {}) => createControls(options, false);
export const createControlRow = (options: ControlsOptions = {}) => createControls(options, true);

export interface DemoOptions extends ControlsOptions {
  onTransaction?: (action: string) => void;
}
export function createControlsDemo(options: DemoOptions = {}) {
  const root = el('section');
  root.className = 'gg-v4-controls-demo gg-v4-scope';
  root.dataset.palette = 'current';
  root.dataset.reducedMotion = String(options.reducedMotion ?? false);
  const heading = el('h2', { text: 'Stars & Spires' });
  const note = el('p', { text: 'V4 controls · mock history only' });
  const initial = fixture(6);
  let cells = [...initial];
  let tool = options.tool ?? 'star';
  const history: BoardCellState[][] =
    options.canUndo === false
      ? []
      : [
          initial.map((state) =>
            state === 'placed' || state === 'tentative' || state === 'excluded' ? 'empty' : state,
          ),
        ];
  const board = createV4Board({ size: 6, cells, interactive: false, conflict: false, hint: false });
  const summary = el('p');
  summary.setAttribute('role', 'status');
  const controlsHost = el('div');
  const restoreFocus = () =>
    controlsHost
      .querySelector<HTMLButtonElement>('[aria-label="Restart board"]')
      ?.focus({ preventScroll: true });
  function undo() {
    const previous = history.pop();
    if (!previous) return;
    cells = previous;
    options.onTransaction?.('undo');
    options.onUndo?.();
    refresh();
  }
  function refresh() {
    updateBoard(board.querySelector<HTMLElement>('.nl-grim-glimmer-board')!, { cells });
    summary.textContent = `${cells.filter((cell) => ['placed', 'tentative', 'excluded'].includes(cell)).length} marks · ${history.length} mock history entries`;
    const activeLabel = controlsHost.contains(document.activeElement)
      ? document.activeElement?.getAttribute('aria-label')
      : null;
    controlsHost.replaceChildren(
      createControlRow({
        ...options,
        tool,
        onTool: (next) => {
          tool = next;
          options.onTool?.(next);
        },
        canUndo: history.length > 0,
        onUndo: () => {
          undo();
        },
        onRestart: () => {
          history.push([...cells]);
          cells = cells.map((cell) => (cell === 'fixed' ? cell : 'empty'));
          options.onTransaction?.('restart: one snapshot');
          options.onRestart?.();
          refresh();
        },
      }),
    );
    if (activeLabel)
      [...controlsHost.querySelectorAll<HTMLButtonElement>('button')]
        .find((button) => button.getAttribute('aria-label') === activeLabel && !button.disabled)
        ?.focus({ preventScroll: true });
    if (activeLabel && !controlsHost.contains(document.activeElement)) restoreFocus();
  }
  refresh();
  root.append(heading, note, board, summary, controlsHost);
  return root;
}
