import { createButton, updateButton } from '../../../src/components/button/index.js';
import { updateBoard } from '../../../src/projects/grim-glimmer/index.js';
import { createV4Board, fixture, type Size } from './board.js';
import { InteractionModel, type SelectionAdapter } from './interaction-model.js';
import { createInteractionDemo } from './interaction.js';
import { createMotionSystem, type DissolveStyle } from './motion.js';
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
  reviewSpeed?: 0.25 | 0.5 | 1;
  dissolveStyle?: DissolveStyle;
  pixelSeed?: number;
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
    'Watch the top-left cell. Replay shows the selected star, X or erase effect.',
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
function speedControls(settings: MotionOptions, motion: ReturnType<typeof createMotionSystem>) {
  const group = el('div', { className: 'gg-v4-motion-actions' });
  group.setAttribute('role', 'group');
  group.setAttribute('aria-label', 'Review playback speed');
  const text = el('p');
  text.setAttribute('role', 'status');
  const speeds = [0.25, 0.5, 1] as const;
  const labels = ['¼× slow', '½× slow', '1× proposed'];
  const buttons = speeds.map((speed, index) =>
    createButton({
      label: labels[index]!,
      size: 'sm',
      variant: 'ghost',
      onClick: () => {
        motion.cancel();
        settings.reviewSpeed = speed;
        paint();
      },
    }),
  );
  function paint() {
    buttons.forEach((button, index) => {
      const selected = speeds[index] === (settings.reviewSpeed ?? 1);
      updateButton(button, {
        label: labels[index]!,
        size: 'sm',
        variant: selected ? 'secondary' : 'ghost',
      });
      button.setAttribute('aria-pressed', String(selected));
    });
    text.textContent =
      settings.reviewSpeed === 0.25
        ? 'Review playback: 4× slower than proposed timing.'
        : settings.reviewSpeed === 0.5
          ? 'Review playback: 2× slower than proposed timing.'
          : 'Review playback: proposed timing.';
  }
  group.append(...buttons);
  paint();
  return [text, group];
}
export function createScreenPreview(options: MotionOptions = {}) {
  const root = host(
    'Screen push',
    'Proposed timing: 560ms · 24px, matching your preferred half-speed preview.',
  );
  const page = el('section', { className: 'gg-v4-motion-page' }, [
    el('h3', { text: 'Stars & Spires' }),
    el('p', { text: 'Preview content keeps its layout and focus throughout the transition.' }),
  ]);
  const settings = { ...options };
  const motion = createMotionSystem(settings);
  root.append(
    el('div', { className: 'gg-v4-motion-page-window' }, [page]),
    el('div', { className: 'gg-v4-motion-actions' }, [
      createButton({ label: 'Replay screen push', onClick: () => motion.screen(page) }),
    ]),
  );
  root.append(...speedControls(settings, motion));
  root.mount = motion.mount;
  root.dispose = motion.dispose;
  return root;
}
export function createDissolvePreview(options: MotionOptions = {}) {
  const size = options.size ?? 6;
  const root = host(
    'New-board dissolve',
    'Random pixel fragments clear in 960ms. Larger cells subdivide for a texture similar to the dense board. Choose whole-cell or center variants in Controls.',
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
  const settings = { ...options };
  const motion = createMotionSystem(settings);
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
  root.append(...speedControls(settings, motion));
  root.mount = motion.mount;
  root.dispose = motion.dispose;
  return root;
}
