import {
  createBoard,
  updateBoard,
  createBoardInteractions,
  type BoardCellState,
} from '../../../src/projects/grim-glimmer/index.js';
import { createButton } from '../../../src/components/button/index.js';
import { createControlRow, type Tool } from './controls.js';
import { createV4Board, fixture, type Size } from './board.js';
import { InteractionModel, clampView, type SelectionAdapter } from './interaction-model.js';
import { el } from '../../lib/dom.js';
import './interaction.css';

class InteractionHost extends HTMLElement {
  connect?: () => void;
  disconnect?: () => void;
  connectedCallback() {
    this.connect?.();
  }
  disconnectedCallback() {
    this.disconnect?.();
  }
}
if (!customElements.get('gg-v4-interaction-host'))
  customElements.define('gg-v4-interaction-host', InteractionHost);
export interface InteractionOptions {
  size?: Size;
  axisLock?: boolean;
  haptics?: boolean;
  tool?: Tool;
  reducedMotion?: boolean;
  adapter?: SelectionAdapter;
  onTransaction?: (kind: string) => void;
  /** Optional story-only motion observer; state/history stay owned by Phase 3. */
  onCellsChange?: (
    grid: HTMLElement,
    before: readonly BoardCellState[],
    after: readonly BoardCellState[],
  ) => void;
  onMount?: () => void;
  onDispose?: () => void;
}
export function createInteractionDemo(options: InteractionOptions = {}) {
  const size = options.size ?? 6;
  const root = document.createElement('gg-v4-interaction-host') as InteractionHost;
  root.className = 'gg-v4-interaction gg-v4-scope';
  root.dataset.reducedMotion = String(options.reducedMotion ?? false);
  const heading = el('h2', { text: 'Stars & Spires' });
  const help = el('p', {
    text:
      size === 15
        ? 'One finger paints · two fingers zoom/pan · keyboard arrows + Space mark'
        : 'Drag to paint/erase · keyboard arrows + Space mark',
  });
  const board = createV4Board({
    size,
    cells: fixture(size),
    interactive: false,
    hint: false,
    conflict: false,
    guides: false,
  });
  const frame = board.querySelector<HTMLElement>('.gg-v4-grid-frame')!;
  const oldGrid = board.querySelector<HTMLElement>('.nl-grim-glimmer-board')!;
  const grid = createBoard({
    size,
    cells: fixture(size),
    mode: 'interactive',
    label: 'V4 interaction fixture, not a playable puzzle',
    stateLabels: {
      placed: 'star',
      fixed: 'spire',
      tentative: 'tentative star',
      excluded: 'X exclusion',
    },
  });
  oldGrid.replaceWith(grid);
  grid.querySelectorAll<HTMLElement>('[data-index]').forEach((cell, index) => {
    cell.dataset.r = String(Math.floor(index / size));
    cell.dataset.c = String(index % size);
    cell.tabIndex = index === 0 ? 0 : -1;
  });
  const status = el('p');
  status.setAttribute('role', 'status');
  const controlHost = el('div');
  let rendering = false;
  let previousCells = fixture(size);
  const model = new InteractionModel({
    size,
    cells: fixture(size),
    axisLock: options.axisLock,
    haptics: options.haptics,
    adapter: options.adapter,
    onChange: () => render(),
    onTransaction: options.onTransaction,
  });
  model.tool = options.tool ?? 'star';
  function tick() {
    if (options.haptics && options.adapter) {
      options.adapter.selectionStart();
      options.adapter.selectionChanged();
      options.adapter.selectionEnd();
    }
  }
  function render() {
    if (rendering) return;
    rendering = true;
    const before = previousCells;
    previousCells = [...model.cells];
    updateBoard(grid, { cells: model.cells });
    if (before.some((state, index) => state !== model.cells[index]))
      options.onCellsChange?.(grid, before, model.cells);
    status.textContent = `${model.history.length} undo entries · ${Math.round(interactions.getView().scale * 100)}% zoom${model.painting ? ' · painting' : ''}`;
    // Do not replace controls during a stroke or after tool selection.
    const undo = controlHost.querySelector<HTMLButtonElement>('[aria-label="Undo move"]');
    if (undo) {
      const focused = document.activeElement === undo;
      undo.disabled = model.history.length === 0;
      if (focused && undo.disabled)
        controlHost
          .querySelector<HTMLButtonElement>('[aria-label="Restart board"]')
          ?.focus({ preventScroll: true });
    }
    rendering = false;
  }
  const interactions = createBoardInteractions({
    board,
    size,
    stroke: model,
    zoom: size === 15,
    onViewChange: () => render(),
  });
  // Compatibility hooks used by the review story plays; behavior/CSS live in src.
  frame.classList.add('gg-v4-pointer-viewport');
  const cancel = () => interactions.cancel();
  root.connect = () => {
    interactions.mount();
    options.onMount?.();
  };
  root.disconnect = () => {
    interactions.unmount();
    options.onDispose?.();
  };
  controlHost.append(
    createControlRow({
      tool: model.tool,
      haptics: options.haptics,
      reducedMotion: options.reducedMotion,
      tick,
      canUndo: false,
      hint: 'disabled',
      onTool: (tool) => {
        cancel();
        model.tool = tool;
      },
      onUndo: () => {
        cancel();
        model.undo();
      },
      onRestart: () => {
        cancel();
        model.restart();
      },
    }),
  );
  const reset = createButton({
    label: 'Reset view',
    variant: 'ghost',
    size: 'sm',
    onClick: () => interactions.resetView(),
  });
  const zoomIn = createButton({
    label: 'Zoom in',
    variant: 'ghost',
    size: 'sm',
    onClick: () => {
      cancel();
      const rect = frame.getBoundingClientRect();
      const view = interactions.getView();
      const scale = Math.min(1.8, view.scale + 0.2);
      interactions.setView(
        clampView(
          {
            scale,
            x: rect.width / 2 - ((rect.width / 2 - view.x) * scale) / view.scale,
            y: rect.height / 2 - ((rect.height / 2 - view.y) * scale) / view.scale,
          },
          rect.width,
          rect.height,
        ),
      );
      render();
    },
  });
  root.append(heading, help, board, status);
  if (size === 15) root.append(el('div', { className: 'gg-v4-zoom-tools' }, [zoomIn, reset]));
  root.append(controlHost);
  render();
  return root;
}
