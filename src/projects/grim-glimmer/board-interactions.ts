import { clampView, interpolate, pinchView, type Point, type View } from './board-view.js';

/** App-owned transactions. Begin/visit may preview; only commit may persist a stroke. */
export interface BoardStrokeAdapter {
  begin: (index: number) => void;
  visit: (index: number) => void;
  commit: () => void;
  cancel: () => void;
}
export interface BoardInteractionOptions {
  /** Interactive editorial board made by createCluedBoard. Do not replace its cell nodes. */
  board: HTMLElement;
  size: number;
  stroke: BoardStrokeAdapter;
  /** Explicit app decision. Defaults off; the accepted dense-board fixture opts in at 15×15. */
  zoom?: boolean;
  /** Native keyboard/assistive activation. Defaults to a single-cell stroke. */
  onActivate?: (index: number) => void;
  onViewChange?: (view: Readonly<View>) => void;
}
const owners = new WeakSet<HTMLElement>();

/** Delegated gestures and view state only: no cells, tools, history, haptics or persistence. */
export function createBoardInteractions(options: BoardInteractionOptions) {
  const { board, size, stroke } = options;
  const required = (selector: string): HTMLElement => {
    const node = board.querySelector<HTMLElement>(selector);
    if (!node)
      throw new Error('createBoardInteractions requires an interactive editorial clued board');
    return node;
  };
  const frame = required('.gg-v4-grid-frame');
  const grid = required('.nl-grim-glimmer-board--interactive');
  const columns = required('.nl-grim-glimmer-clued-board__columns');
  const rows = required('.nl-grim-glimmer-clued-board__rows');
  if (
    !frame ||
    !grid ||
    !columns ||
    !rows ||
    !Number.isInteger(size) ||
    size < 1 ||
    grid.children.length !== size * size ||
    grid.style.getPropertyValue('--nl-grim-glimmer-board-size') !== String(size)
  )
    throw new Error(
      'createBoardInteractions requires a matching interactive editorial clued board',
    );
  if (owners.has(board)) throw new Error('Board already has an interaction adapter');
  owners.add(board);
  const content = document.createElement('div');
  content.className = 'nl-grim-glimmer-zoom-content';
  content.append(...frame.childNodes);
  frame.append(content);
  const columnWindow = document.createElement('div');
  columnWindow.className = 'nl-grim-glimmer-column-window';
  columns.replaceWith(columnWindow);
  columnWindow.append(columns);
  const rowWindow = document.createElement('div');
  rowWindow.className = 'nl-grim-glimmer-row-window';
  rows.replaceWith(rowWindow);
  rowWindow.append(rows);
  board.classList.add('nl-grim-glimmer-board-interactions');
  frame.classList.add('nl-grim-glimmer-pointer-viewport');
  const tabIndices = [...grid.children].map((node) =>
    (node as HTMLElement).getAttribute('tabindex'),
  );
  const originalColumnsTransform = columns.style.transform;
  const originalRowsTransform = rows.style.transform;
  const originalZoom = board.style.getPropertyValue('--nl-grim-glimmer-inverse-zoom');
  let view: View = { scale: 1, x: 0, y: 0 };
  let mounted = false;
  let destroyed = false;
  let enabled = true;
  let strokeOpen = false;
  let multi = false;
  let previous: Point | undefined;
  let pinch: { view: View; points: [Point, Point] } | undefined;
  const pointers = new Map<number, Point>();
  const listeners: (() => void)[] = [];
  let removal: MutationObserver | undefined;
  let resizeObserver: ResizeObserver | undefined;
  const pair = () => [...pointers.values()].slice(0, 2) as [Point, Point];
  const local = (point: Point) => {
    const rect = frame.getBoundingClientRect();
    return { x: point.x - rect.left, y: point.y - rect.top };
  };
  const active = () => mounted && !destroyed && enabled && board.isConnected && !document.hidden;
  function render() {
    content.style.transform = `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.scale})`;
    columns.style.transform = `translate3d(${view.x}px, 0, 0) scaleX(${view.scale})`;
    rows.style.transform = `translate3d(0, ${view.y}px, 0) scaleY(${view.scale})`;
    board.style.setProperty('--nl-grim-glimmer-inverse-zoom', String(1 / view.scale));
    options.onViewChange?.({ ...view });
  }
  function release(id: number) {
    if (frame.hasPointerCapture?.(id)) frame.releasePointerCapture(id);
  }
  function cancel() {
    const captured = [...pointers.keys()];
    pointers.clear();
    previous = undefined;
    pinch = undefined;
    multi = false;
    if (strokeOpen) {
      strokeOpen = false;
      stroke.cancel();
    }
    captured.forEach(release);
  }
  function indexAt(point: Point): number | undefined {
    // Check the viewport before hit testing: captured events can land on clipped cells.
    const viewport = frame.getBoundingClientRect();
    if (
      point.x < viewport.left ||
      point.x >= viewport.right ||
      point.y < viewport.top ||
      point.y >= viewport.bottom ||
      viewport.width <= 0 ||
      viewport.height <= 0
    )
      return;
    const hit = document.elementFromPoint?.(point.x, point.y)?.closest<HTMLElement>('[data-index]');
    if (hit?.parentElement === grid) return Number(hit.dataset.index);
    const rect = grid.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const col = Math.floor(((point.x - rect.left) / rect.width) * size);
    const row = Math.floor(((point.y - rect.top) / rect.height) * size);
    if (row >= 0 && row < size && col >= 0 && col < size) return row * size + col;
    return;
  }
  function paintSegment(point: Point) {
    const rect = grid.getBoundingClientRect();
    for (const sample of interpolate(previous ?? point, point, rect.width / size / 3)) {
      const index = indexAt(sample);
      if (index !== undefined) stroke.visit(index);
    }
    previous = point;
  }
  function down(event: PointerEvent) {
    if (!active() || (event.pointerType === 'mouse' && event.button !== 0)) return;
    event.preventDefault();
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (event.isTrusted) frame.setPointerCapture?.(event.pointerId);
    if (pointers.size >= 2) {
      if (strokeOpen) {
        strokeOpen = false;
        stroke.cancel();
      }
      multi = true;
      previous = undefined;
      pinch =
        options.zoom && pointers.size === 2
          ? { view: { ...view }, points: pair().map(local) as [Point, Point] }
          : undefined;
      return;
    }
    if (multi) return;
    previous = { x: event.clientX, y: event.clientY };
    const index = indexAt(previous);
    if (
      index !== undefined &&
      (grid.children[index] as HTMLElement).getAttribute('aria-disabled') !== 'true'
    ) {
      strokeOpen = true;
      stroke.begin(index);
    }
  }
  function move(event: PointerEvent) {
    if (!active()) {
      cancel();
      return;
    }
    if (!pointers.has(event.pointerId)) return;
    event.preventDefault();
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (multi) {
      if (options.zoom && pointers.size === 2 && pinch) {
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
    if (!strokeOpen) return;
    for (const point of event.getCoalescedEvents?.() ?? [event])
      paintSegment({ x: point.clientX, y: point.clientY });
    paintSegment({ x: event.clientX, y: event.clientY });
  }
  function up(event: PointerEvent) {
    if (!active()) {
      cancel();
      return;
    }
    if (!pointers.has(event.pointerId)) return;
    if (!multi && strokeOpen) {
      paintSegment({ x: event.clientX, y: event.clientY });
      strokeOpen = false;
      stroke.commit();
    }
    pointers.delete(event.pointerId);
    release(event.pointerId);
    if (pointers.size === 0) {
      multi = false;
      previous = undefined;
      pinch = undefined;
    } else if (pointers.size === 2 && options.zoom)
      pinch = { view: { ...view }, points: pair().map(local) as [Point, Point] };
    else pinch = undefined;
  }
  function cellFrom(event: Event) {
    const cell =
      event.target instanceof Element ? event.target.closest<HTMLElement>('[data-index]') : null;
    return cell?.parentElement === grid ? cell : undefined;
  }
  function rove(cell: HTMLElement) {
    for (const node of grid.children) (node as HTMLElement).tabIndex = node === cell ? 0 : -1;
  }
  function click(event: MouseEvent) {
    // Own activation in capture phase so a createBoard callback cannot mutate a second time.
    event.stopImmediatePropagation();
    if (!active() || event.detail !== 0 || pointers.size || multi) return;
    const cell = cellFrom(event);
    if (!cell || cell.getAttribute('aria-disabled') === 'true') return;
    const index = Number(cell.dataset.index);
    if (options.onActivate) options.onActivate(index);
    else {
      stroke.begin(index);
      stroke.commit();
    }
  }
  function keydown(event: KeyboardEvent) {
    if (!active()) return;
    const cell = cellFrom(event);
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
    const target = grid.children[next] as HTMLElement;
    rove(target);
    target.focus({ preventScroll: true });
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
  }
  function resetView() {
    if (destroyed) return;
    cancel();
    view = { scale: 1, x: 0, y: 0 };
    render();
  }
  function setView(next: View) {
    if (destroyed) return;
    if (![next.scale, next.x, next.y].every(Number.isFinite))
      throw new Error('View must be finite');
    cancel();
    const rect = frame.getBoundingClientRect();
    view = options.zoom ? clampView(next, rect.width, rect.height) : { scale: 1, x: 0, y: 0 };
    render();
  }
  function listen(target: EventTarget, type: string, handler: EventListener, capture = false) {
    target.addEventListener(type, handler, capture);
    listeners.push(() => target.removeEventListener(type, handler, capture));
  }
  function unmount() {
    if (!mounted) return;
    mounted = false;
    cancel();
    listeners.splice(0).forEach((remove) => remove());
    removal?.disconnect();
    resizeObserver?.disconnect();
    resetView();
  }
  function mount() {
    if (destroyed || mounted) return;
    if (!board.isConnected) throw new Error('Append the board before mounting interactions');
    mounted = true;
    rove(
      grid.contains(document.activeElement)
        ? (document.activeElement as HTMLElement)
        : (grid.children[0] as HTMLElement),
    );
    listen(frame, 'pointerdown', down as EventListener);
    listen(frame, 'pointermove', move as EventListener);
    listen(frame, 'pointerup', up as EventListener);
    listen(frame, 'pointercancel', cancel);
    listen(frame, 'lostpointercapture', ((event: PointerEvent) => {
      if (pointers.has(event.pointerId)) cancel();
    }) as EventListener);
    listen(grid, 'click', click as EventListener, true);
    listen(grid, 'keydown', keydown as EventListener);
    listen(grid, 'focusin', ((event: FocusEvent) => {
      const cell = cellFrom(event);
      if (cell) rove(cell);
    }) as EventListener);
    listen(window, 'blur', cancel);
    listen(window, 'resize', resetView);
    listen(document, 'visibilitychange', () => {
      if (document.hidden) cancel();
    });
    removal = new MutationObserver(() => {
      if (!board.isConnected) unmount();
    });
    removal.observe(document.documentElement, { childList: true, subtree: true });
    if (typeof ResizeObserver !== 'undefined') {
      let last = frame.getBoundingClientRect();
      resizeObserver = new ResizeObserver(() => {
        const rect = frame.getBoundingClientRect();
        if (rect.width !== last.width || rect.height !== last.height) {
          last = rect;
          resetView();
        }
      });
      resizeObserver.observe(frame);
    }
    render();
  }
  function destroy() {
    if (destroyed) return;
    unmount();
    destroyed = true;
    content.replaceWith(...content.childNodes);
    columnWindow.replaceWith(columns);
    rowWindow.replaceWith(rows);
    columns.style.transform = originalColumnsTransform;
    rows.style.transform = originalRowsTransform;
    if (originalZoom) board.style.setProperty('--nl-grim-glimmer-inverse-zoom', originalZoom);
    else board.style.removeProperty('--nl-grim-glimmer-inverse-zoom');
    board.classList.remove('nl-grim-glimmer-board-interactions');
    frame.classList.remove('nl-grim-glimmer-pointer-viewport');
    [...grid.children].forEach((node, index) => {
      const value = tabIndices[index];
      if (value === null) node.removeAttribute('tabindex');
      else node.setAttribute('tabindex', value!);
    });
    owners.delete(board);
  }
  return {
    mount,
    unmount,
    destroy,
    cancel,
    resetView,
    setView,
    getView: (): Readonly<View> => ({ ...view }),
    setEnabled(value: boolean) {
      if (!destroyed) {
        cancel();
        enabled = value;
      }
    },
  };
}
