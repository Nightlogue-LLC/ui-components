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
  if (options.onClick) tile.addEventListener('click', options.onClick);
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
