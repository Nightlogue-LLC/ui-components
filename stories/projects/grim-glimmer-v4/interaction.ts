import {
  createBoard,
  updateBoard,
  type BoardCellState,
} from '../../../src/projects/grim-glimmer/index.js';
import { createButton } from '../../../src/components/button/index.js';
import { createControlRow, type Tool } from './controls.js';
import { createV4Board, fixture, type Size } from './board.js';
import {
  InteractionModel,
  clampView,
  interpolate,
  pinchView,
  type Point,
  type View,
  type SelectionAdapter,
} from './interaction-model.js';
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
  const content = el('div', { className: 'gg-v4-zoom-content' });
  content.append(...frame.childNodes);
  frame.append(content);
  frame.classList.add('gg-v4-pointer-viewport');
  // Clipping windows are fixed; the tracks follow only their own pan axis.
  const columns = board.querySelector<HTMLElement>('.nl-grim-glimmer-clued-board__columns')!;
  const rows = board.querySelector<HTMLElement>('.nl-grim-glimmer-clued-board__rows')!;
  const columnWindow = el('div', { className: 'gg-v4-column-window' });
  columns.replaceWith(columnWindow);
  columnWindow.append(columns);
  const rowWindow = el('div', { className: 'gg-v4-row-window' });
  rows.replaceWith(rowWindow);
  rowWindow.append(rows);
  const status = el('p');
  status.setAttribute('role', 'status');
  const controlHost = el('div');
  let view: View = { scale: 1, x: 0, y: 0 };
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
  const pointers = new Map<number, Point>();
  let multi = false;
  let previous: Point | undefined;
  let pinch: { view: View; points: [Point, Point] } | undefined;
  const pair = () => [...pointers.values()].slice(0, 2) as [Point, Point];
  const local = (point: Point) => {
    const rect = frame.getBoundingClientRect();
    return { x: point.x - rect.left, y: point.y - rect.top };
  };
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
    status.textContent = `${model.history.length} undo entries · ${Math.round(view.scale * 100)}% zoom${model.painting ? ' · painting' : ''}`;
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
    content.style.transform = `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.scale})`;
    columns.style.transform = `translate3d(${view.x}px, 0, 0) scaleX(${view.scale})`;
    rows.style.transform = `translate3d(0, ${view.y}px, 0) scaleY(${view.scale})`;
    board.style.setProperty('--gg-v4-inverse-zoom', String(1 / view.scale));
    rendering = false;
  }
  function indexAt(point: Point): number | undefined {
    const hit = document
      .elementFromPoint(point.x, point.y)
      ?.closest<HTMLElement>('[data-r][data-c]');
    if (hit && grid.contains(hit)) return Number(hit.dataset.r) * size + Number(hit.dataset.c);
    // Internal one-pixel grid gaps still map to the nearest cell, never outside the viewport.
    const viewport = frame.getBoundingClientRect();
    if (
      point.x < viewport.left ||
      point.x >= viewport.right ||
      point.y < viewport.top ||
      point.y >= viewport.bottom
    )
      return;
    const rect = grid.getBoundingClientRect();
    const col = Math.floor(((point.x - rect.left) / rect.width) * size);
    const row = Math.floor(((point.y - rect.top) / rect.height) * size);
    if (row >= 0 && row < size && col >= 0 && col < size) return row * size + col;
    return;
  }
  function cancel() {
    model.cancel();
    const captured = [...pointers.keys()];
    pointers.clear();
    for (const id of captured) if (frame.hasPointerCapture?.(id)) frame.releasePointerCapture(id);
    previous = undefined;
    pinch = undefined;
    multi = false;
  }
  function paintSegment(point: Point) {
    const rect = grid.getBoundingClientRect();
    for (const sample of interpolate(previous ?? point, point, rect.width / size / 3)) {
      const index = indexAt(sample);
      if (index !== undefined) model.visit(index);
    }
    previous = point;
  }
  frame.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    event.preventDefault();
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (event.isTrusted) frame.setPointerCapture?.(event.pointerId);
    if (pointers.size >= 2) {
      model.cancel();
      multi = true;
      previous = undefined;
      if (size === 15) pinch = { view: { ...view }, points: pair().map(local) as [Point, Point] };
      return;
    }
    if (multi) return;
    previous = { x: event.clientX, y: event.clientY };
    const index = indexAt(previous);
    if (index !== undefined) model.begin(index);
  });
  frame.addEventListener('pointermove', (event) => {
    if (!pointers.has(event.pointerId)) return;
    event.preventDefault();
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (multi) {
      if (size === 15 && pointers.size === 2 && pinch) {
        const rect = frame.getBoundingClientRect();
        view = pinchView(
          pinch.view,
          pinch.points,
          pair().map(local) as [Point, Point],
          rect.width,
          rect.height,
        );
        render();
      }
      return;
    }
    for (const point of event.getCoalescedEvents?.() ?? [event])
      paintSegment({ x: point.clientX, y: point.clientY });
    paintSegment({ x: event.clientX, y: event.clientY });
  });
  frame.addEventListener('pointerup', (event) => {
    if (!pointers.has(event.pointerId)) return;
    if (!multi) {
      paintSegment({ x: event.clientX, y: event.clientY });
      model.commit();
    }
    pointers.delete(event.pointerId);
    if (pointers.size === 0) {
      multi = false;
      previous = undefined;
      pinch = undefined;
    } else if (pointers.size === 2 && size === 15)
      pinch = { view: { ...view }, points: pair().map(local) as [Point, Point] };
  });
  frame.addEventListener('pointercancel', cancel);
  frame.addEventListener('lostpointercapture', (event) => {
    if (pointers.has(event.pointerId)) cancel();
  });
  // Native Enter/Space clicks have detail 0. Pointer-generated clicks never paint twice.
  grid.addEventListener('click', (event) => {
    if (event.detail !== 0 || pointers.size || multi) return;
    const cell =
      event.target instanceof Element ? event.target.closest<HTMLElement>('[data-index]') : null;
    if (cell) {
      model.begin(Number(cell.dataset.index));
      model.commit();
    }
  });
  grid.addEventListener('keydown', (event) => {
    const cell =
      event.target instanceof Element ? event.target.closest<HTMLElement>('[data-index]') : null;
    if (!cell) return;
    const index = Number(cell.dataset.index);
    let next: number;
    if (event.key === 'ArrowRight') next = Math.min(size * size - 1, index + 1);
    else if (event.key === 'ArrowLeft') next = Math.max(0, index - 1);
    else if (event.key === 'ArrowDown') next = Math.min(size * size - 1, index + size);
    else if (event.key === 'ArrowUp') next = Math.max(0, index - size);
    else if (event.key === 'Home') next = Math.floor(index / size) * size;
    else if (event.key === 'End') next = Math.floor(index / size) * size + size - 1;
    else return;
    event.preventDefault();
    cell.tabIndex = -1;
    const target = grid.children[next] as HTMLElement;
    target.tabIndex = 0;
    target.focus({ preventScroll: true });
    // Keep a keyboard-selected cell inside the zoom viewport, without scrolling the page.
    const rect = frame.getBoundingClientRect();
    const unitX = (rect.width / size) * view.scale;
    const unitY = (rect.height / size) * view.scale;
    const left = (next % size) * unitX + view.x;
    const top = Math.floor(next / size) * unitY + view.y;
    view = clampView(
      {
        ...view,
        x:
          left < 0
            ? view.x - left
            : left + unitX > rect.width
              ? view.x - (left + unitX - rect.width)
              : view.x,
        y:
          top < 0
            ? view.y - top
            : top + unitY > rect.height
              ? view.y - (top + unitY - rect.height)
              : view.y,
      },
      rect.width,
      rect.height,
    );
    render();
  });
  const visibility = () => {
    if (document.hidden) cancel();
  };
  const resize = () => {
    cancel();
    view = { scale: 1, x: 0, y: 0 };
    render();
  };
  root.connect = () => {
    options.onMount?.();
    window.addEventListener('blur', cancel);
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('resize', resize);
  };
  root.disconnect = () => {
    cancel();
    view = { scale: 1, x: 0, y: 0 };
    window.removeEventListener('blur', cancel);
    document.removeEventListener('visibilitychange', visibility);
    window.removeEventListener('resize', resize);
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
    onClick: resize,
  });
  const zoomIn = createButton({
    label: 'Zoom in',
    variant: 'ghost',
    size: 'sm',
    onClick: () => {
      cancel();
      const rect = frame.getBoundingClientRect();
      const scale = Math.min(1.8, view.scale + 0.2);
      view = clampView(
        {
          scale,
          x: rect.width / 2 - ((rect.width / 2 - view.x) * scale) / view.scale,
          y: rect.height / 2 - ((rect.height / 2 - view.y) * scale) / view.scale,
        },
        rect.width,
        rect.height,
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
