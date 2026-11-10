import { createButton } from '../../../src/components/button/index.js';
import { updateBoard } from '../../../src/projects/grim-glimmer/index.js';
import { createV4Board, fixture, type Size } from './board.js';
import { InteractionModel, type SelectionAdapter } from './interaction-model.js';
import { createInteractionDemo } from './interaction.js';
import { createMotionSystem } from './motion.js';
import { el } from '../../lib/dom.js';
class MotionHost extends HTMLElement {
  mount?: () => void;
  dispose?: () => void;
  connectedCallback() {
    this.mount?.();
  }
  disconnectedCallback() {
    this.dispose?.();
  }
}
if (!customElements.get('gg-v4-motion-host'))
  customElements.define('gg-v4-motion-host', MotionHost);
export interface MotionOptions {
  size?: Size;
  mark?: 'placed' | 'excluded' | 'erase';
  reducedMotion?: boolean;
  haptics?: boolean;
  adapter?: SelectionAdapter;
  onTransaction?: (kind: string) => void;
}
function host(title: string, description: string) {
  const root = document.createElement('gg-v4-motion-host') as MotionHost;
  root.className = 'gg-v4-motion-preview gg-v4-scope';
  root.append(el('h2', { text: title }), el('p', { text: description }));
  return root;
}
export function createMarkPreview(options: MotionOptions = {}) {
  const size = options.size ?? 6;
  const mark = options.mark ?? 'placed';
  const root = host(
    'Mark placement',
    'Replay the proposed motion. State and one-entry history use the Phase 3 adapter.',
  );
  const initial = fixture(size);
  initial[0] = mark === 'erase' ? 'placed' : 'empty';
  const board = createV4Board({
    size,
    cells: initial,
    interactive: false,
    hint: false,
    conflict: false,
  });
  const grid = board.querySelector<HTMLElement>('.nl-grim-glimmer-board')!;
  const motion = createMotionSystem(options);
  const status = el('p');
  status.setAttribute('role', 'status');
  let previous = [...initial];
  let quiet = false;
  const model = new InteractionModel({
    size,
    cells: initial,
    haptics: options.haptics,
    adapter: options.adapter,
    onTransaction: options.onTransaction,
    onChange: () => {
      updateBoard(grid, { cells: model.cells });
      if (!quiet) motion.changes(grid, previous, model.cells);
      previous = [...model.cells];
      status.textContent = `${model.history.length} undo entries`;
    },
  });
  model.tool = mark === 'excluded' ? 'exclude' : 'star';
  const replay = createButton({
    label: 'Replay mark',
    onClick: () => {
      motion.cancel();
      quiet = true;
      model.undo();
      quiet = false;
      model.begin(0);
      model.commit();
    },
  });
  root.append(board, status, el('div', { className: 'gg-v4-motion-actions' }, [replay]));
  status.textContent = '0 undo entries';
  root.mount = motion.mount;
  root.dispose = () => {
    model.cancel();
    motion.dispose();
  };
  return root;
}
export function createIntegratedMotion(options: MotionOptions = {}) {
  const motion = createMotionSystem(options);
  const root = createInteractionDemo({
    ...options,
    onCellsChange: (grid, before, after) => motion.changes(grid, before, after),
    onMount: () => motion.mount(),
    onDispose: () => motion.dispose(),
  });
  return root;
}
export function createHintPreview(options: MotionOptions = {}) {
  const root = host(
    'Hint target',
    'A target ring, not a tentative star. Pulse pauses when backgrounded; reduced motion keeps it static.',
  );
  const board = createV4Board({
    size: options.size ?? 6,
    interactive: false,
    hint: false,
    conflict: false,
  });
  const cell = board.querySelector<HTMLElement>('.nl-grim-glimmer-board__cell--empty')!;
  const ring = el('span', { className: 'gg-v4-hint gg-v4-motion-target' });
  ring.setAttribute('aria-hidden', 'true');
  cell.append(ring);
  cell.setAttribute('aria-label', `${cell.getAttribute('aria-label')}; hint target`);
  const motion = createMotionSystem({ ...options, hint: ring });
  root.append(
    board,
    el('div', { className: 'gg-v4-motion-actions' }, [
      createButton({
        label: 'Replay hint',
        onClick: () => {
          motion.dispose();
          motion.mount();
        },
      }),
    ]),
  );
  root.mount = motion.mount;
  root.dispose = motion.dispose;
  return root;
}
export function createScreenPreview(options: MotionOptions = {}) {
  const root = host(
    'Screen push',
    'Isolated transition specimen · 280ms · 24px. No navigation changes.',
  );
  const page = el('section', { className: 'gg-v4-motion-page' }, [
    el('h3', { text: 'Stars & Spires' }),
    el('p', { text: 'Preview content keeps its layout and focus throughout the transition.' }),
  ]);
  const motion = createMotionSystem(options);
  root.append(
    el('div', { className: 'gg-v4-motion-page-window' }, [page]),
    el('div', { className: 'gg-v4-motion-actions' }, [
      createButton({ label: 'Replay screen push', onClick: () => motion.screen(page) }),
    ]),
  );
  root.mount = motion.mount;
  root.dispose = motion.dispose;
  return root;
}
export function createDissolvePreview(options: MotionOptions = {}) {
  const size = options.size ?? 6;
  const root = host(
    'New-board dissolve',
    'Center-distance stagger, including the fade, stays within 300ms. Prototype clear is one undo entry.',
  );
  const initial = fixture(size);
  const board = createV4Board({
    size,
    cells: initial,
    interactive: false,
    hint: false,
    conflict: false,
  });
  const grid = board.querySelector<HTMLElement>('.nl-grim-glimmer-board')!;
  const motion = createMotionSystem(options);
  const status = el('p');
  status.setAttribute('role', 'status');
  status.textContent = '0 undo entries';
  const undo = createButton({
    label: 'Undo preview',
    variant: 'secondary',
    disabled: true,
    onClick: () => {
      motion.cancel();
      model.undo();
    },
  });
  const model = new InteractionModel({
    size,
    cells: initial,
    onTransaction: options.onTransaction,
    onChange: () => {
      updateBoard(grid, { cells: model.cells });
      status.textContent = `${model.history.length} undo entries`;
      undo.disabled = model.history.length === 0;
      if (undo.disabled && document.activeElement === undo) replay.focus({ preventScroll: true });
    },
  });
  const replay = createButton({
    label: 'Replay dissolve',
    onClick: () => {
      motion.cancel();
      model.undo();
      motion.dissolve(grid, size, () => model.restart());
    },
  });
  root.append(board, status, el('div', { className: 'gg-v4-motion-actions' }, [replay, undo]));
  root.mount = motion.mount;
  root.dispose = motion.dispose;
  return root;
}
