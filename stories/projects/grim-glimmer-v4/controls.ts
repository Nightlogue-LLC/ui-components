import { createIconButton } from '../../../src/components/icon-button/index.js';
import { createButton } from '../../../src/components/button/index.js';
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

// Standard custom-element disconnection prevents abandoned story timers/listeners.
class ReviewHost extends HTMLElement {
  cleanup?: () => void;
  disconnectedCallback() {
    this.cleanup?.();
  }
}
if (!customElements.get('gg-v4-controls-host'))
  customElements.define('gg-v4-controls-host', ReviewHost);
function reviewHost() {
  return document.createElement('gg-v4-controls-host') as ReviewHost;
}

export function createRestartToast(onUndo: () => void, onExpire?: () => void) {
  const root = reviewHost();
  root.className = 'gg-v4-restart-toast';
  root.hidden = true;
  const announcement = el('span');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', 'polite');
  const undo = createButton({
    label: 'Undo',
    variant: 'ghost',
    size: 'sm',
    onClick: () => {
      hide();
      onUndo();
    },
  });
  root.append(announcement, el('span', { text: '·' }), undo);
  let timer: ReturnType<typeof setTimeout> | undefined;
  let remaining = 5000;
  let started = 0;
  const paused = new Set<string>();
  function cancel() {
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
  }
  function schedule() {
    if (root.hidden || paused.size) return;
    started = Date.now();
    timer = setTimeout(() => {
      hide();
      onExpire?.();
    }, remaining);
  }
  function pause(reason: string) {
    if (!paused.size && timer !== undefined)
      remaining = Math.max(0, remaining - (Date.now() - started));
    paused.add(reason);
    cancel();
  }
  function resume(reason: string) {
    if (!paused.has(reason)) return;
    paused.delete(reason);
    cancel();
    schedule();
  }
  function visibility() {
    if (document.hidden) pause('hidden');
    else resume('hidden');
  }
  root.addEventListener('pointerenter', () => pause('hover'));
  root.addEventListener('pointerleave', () => resume('hover'));
  root.addEventListener('focusin', () => pause('focus'));
  root.addEventListener('focusout', (event) => {
    if (!root.contains(event.relatedTarget as Node | null)) resume('focus');
  });
  function hide() {
    cancel();
    root.hidden = true;
    announcement.textContent = '';
    document.removeEventListener('visibilitychange', visibility);
  }
  function show() {
    hide();
    remaining = 5000;
    paused.clear();
    root.hidden = false;
    announcement.textContent = 'Board cleared';
    if (root.contains(document.activeElement)) paused.add('focus');
    if (root.matches(':hover')) paused.add('hover');
    if (document.hidden) paused.add('hidden');
    document.addEventListener('visibilitychange', visibility);
    schedule();
  }
  root.cleanup = hide;
  return { root, show, hide };
}

export interface DemoOptions extends ControlsOptions {
  onTransaction?: (action: string) => void;
}
export function createControlsDemo(options: DemoOptions = {}) {
  const root = reviewHost();
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
  const toast = createRestartToast(() => {
    if (options.haptics) options.tick?.();
    undo();
    restoreFocus();
  });
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
          toast.hide();
          undo();
        },
        onRestart: () => {
          toast.hide();
          history.push([...cells]);
          cells = cells.map((cell) => (cell === 'fixed' ? cell : 'empty'));
          options.onTransaction?.('restart: one snapshot');
          options.onRestart?.();
          refresh();
          toast.show();
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
  const toastSlot = el('div', { className: 'gg-v4-toast-slot' }, [toast.root]);
  root.append(heading, note, board, summary, toastSlot, controlsHost);
  root.cleanup = toast.hide;
  return root;
}
