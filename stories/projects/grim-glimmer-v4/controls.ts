import { createIconButton } from '../../../src/components/icon-button/index.js';
import { createIcon } from '../../../src/components/icon/index.js';
import { createV4Board, fixture } from './board.js';
import { updateBoard, type BoardCellState } from '../../../src/projects/grim-glimmer/index.js';
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
export function createToolToggle(options: ControlsOptions = {}) {
  let tool = options.tool ?? 'star';
  const root = el('div', { className: 'gg-v4-tools gg-v4-scope' });
  root.dataset.reducedMotion = String(options.reducedMotion ?? false);
  root.setAttribute('role', 'group');
  root.setAttribute('aria-label', 'Marking tool');
  const indicator = el('span', { className: 'gg-v4-tool-indicator' });
  indicator.setAttribute('aria-hidden', 'true');
  root.append(indicator);
  const buttons = (['star', 'exclude'] as const).map((value) => {
    const glyph =
      value === 'star'
        ? el('span', { className: 'nl-grim-glimmer-glyph nl-grim-glimmer-glyph--star' })
        : createIcon('exclude');
    const button = createIconButton({
      label: value === 'star' ? 'Place star' : 'Exclude cell',
      icon: glyph,
      disabled: options.disabled,
      onClick: () => {
        if (tool === value) return;
        tool = value;
        paint();
        if (options.haptics) options.tick?.();
        options.onTool?.(tool);
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
            : buttons[value === 'star' ? 1 : 0]!;
      target.focus();
      target.click();
    });
    return button;
  });
  function paint() {
    root.dataset.tool = tool;
    buttons.forEach((button, index) =>
      button.setAttribute('aria-pressed', String((index === 0 ? 'star' : 'exclude') === tool)),
    );
  }
  root.append(...buttons);
  paint();
  return root;
}
export function createControlRow(options: ControlsOptions = {}) {
  const root = el('div', { className: 'gg-v4-control-row gg-v4-scope' });
  root.setAttribute('role', 'group');
  root.setAttribute('aria-label', 'Puzzle controls');
  const tools = createToolToggle(options);
  const actions = el('div', { className: 'gg-v4-control-actions' });
  for (const [name, label, disabled, action] of [
    ['undo', 'Undo move', !options.canUndo, options.onUndo],
    [
      'hint',
      options.hint === 'available' ? 'Hint available' : 'Hint',
      options.hint === 'disabled',
      options.onHint,
    ],
    ['restart', 'Restart board', false, options.onRestart],
  ] as const) {
    const button = createIconButton({
      label,
      icon: createIcon(name),
      disabled: options.disabled === true || disabled,
      onClick: () => {
        if (options.haptics) options.tick?.();
        action?.();
      },
    });
    button.classList.add('gg-v4-control');
    if (name === 'hint') button.dataset.hint = options.hint ?? 'idle';
    actions.append(button);
  }
  root.append(tools, actions);
  return root;
}

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
