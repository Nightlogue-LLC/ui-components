export interface TactileTileProps {
  /** Accessible text, independent of the decorative glyph. */
  label: string;
  glyph: string;
  caption?: string;
  selected?: boolean;
  disabled?: boolean;
}

export interface TactileTileOptions extends TactileTileProps {
  onClick?: (event: MouseEvent) => void;
  /** Optional host-provided haptic or audio cue; invoked on button activation. */
  onPressFeedback?: () => void;
  /** Optional drag callbacks. The host decides placement and rule validation. */
  onDragMove?: (movement: { x: number; y: number }) => void;
  onDragEnd?: (movement: { x: number; y: number }) => void;
}

/** Stateful visual tile; consumer controls selection using updateTactileTile. */
export function createTactileTile(options: TactileTileOptions): HTMLButtonElement {
  const tile = document.createElement('button');
  tile.className = 'nl-tactile-tile';
  tile.type = 'button';
  const glyph = document.createElement('span');
  glyph.className = 'nl-tactile-tile__glyph';
  glyph.setAttribute('aria-hidden', 'true');
  const caption = document.createElement('span');
  caption.className = 'nl-tactile-tile__caption';
  caption.setAttribute('aria-hidden', 'true');
  tile.append(glyph, caption);
  updateTactileTile(tile, options);
  if (options.onClick || options.onPressFeedback) {
    tile.addEventListener('click', (event) => {
      if (tile.disabled) return;
      options.onPressFeedback?.();
      options.onClick?.(event);
    });
  }
  if (options.onDragMove || options.onDragEnd) {
    tile.classList.add('nl-tactile-tile--draggable');
    let start: { x: number; y: number; id: number } | null = null;
    const finish = (event: PointerEvent) => {
      if (!start || start.id !== event.pointerId) return;
      const movement = { x: event.clientX - start.x, y: event.clientY - start.y };
      tile.classList.remove('nl-tactile-tile--dragging');
      tile.style.removeProperty('--nl-tactile-drag-x');
      tile.style.removeProperty('--nl-tactile-drag-y');
      start = null;
      options.onDragEnd?.(movement);
    };
    tile.addEventListener('pointerdown', (event) => {
      if (tile.disabled || event.button !== 0) return;
      start = { x: event.clientX, y: event.clientY, id: event.pointerId };
      tile.setPointerCapture?.(event.pointerId);
    });
    tile.addEventListener('pointermove', (event) => {
      if (!start || start.id !== event.pointerId) return;
      const movement = { x: event.clientX - start.x, y: event.clientY - start.y };
      if (Math.hypot(movement.x, movement.y) < 4) return;
      tile.classList.add('nl-tactile-tile--dragging');
      tile.style.setProperty('--nl-tactile-drag-x', `${movement.x}px`);
      tile.style.setProperty('--nl-tactile-drag-y', `${movement.y}px`);
      options.onDragMove?.(movement);
    });
    tile.addEventListener('pointerup', finish);
    tile.addEventListener('pointercancel', finish);
  }
  return tile;
}

export function updateTactileTile(tile: HTMLButtonElement, props: TactileTileProps): void {
  tile.setAttribute('aria-label', props.label);
  tile.setAttribute('aria-pressed', String(props.selected ?? false));
  tile.classList.toggle('nl-tactile-tile--selected', props.selected ?? false);
  tile.disabled = props.disabled ?? false;
  const glyph = tile.querySelector('.nl-tactile-tile__glyph');
  const caption = tile.querySelector('.nl-tactile-tile__caption');
  if (glyph) glyph.textContent = props.glyph;
  if (caption) {
    caption.textContent = props.caption ?? '';
    (caption as HTMLElement).hidden = !props.caption;
  }
}
