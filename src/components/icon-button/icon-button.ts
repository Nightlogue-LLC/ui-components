export const ICON_BUTTON_VARIANTS = ['secondary', 'ghost'] as const;
export type IconButtonVariant = (typeof ICON_BUTTON_VARIANTS)[number];

export interface IconButtonProps {
  /** Accessible name. Required and must not be blank: the button has no visible text. */
  label: string;
  /** Defaults to 'ghost'. */
  variant?: IconButtonVariant;
  disabled?: boolean;
}

export interface IconButtonOptions extends IconButtonProps {
  /**
   * Icon artwork supplied by the consumer as a DOM node (e.g. an `<svg>` element). It is cloned,
   * so the node you pass is left untouched. Strings are deliberately not accepted: no HTML or SVG
   * markup is ever parsed from text.
   */
  icon: Node;
  onClick?: (event: MouseEvent) => void;
}

function assertLabel(label: string): void {
  if (label.trim() === '') {
    throw new Error('IconButton requires a non-empty `label` (it is the only accessible name).');
  }
}

/** Creates a square, theme-aware icon-only button (minimum 44x44 CSS px target). */
export function createIconButton(options: IconButtonOptions): HTMLButtonElement {
  const { icon, onClick, ...props } = options;
  assertLabel(props.label);

  const button = document.createElement('button');
  button.classList.add('nl-icon-button');
  button.type = 'button';

  const glyph = document.createElement('span');
  glyph.className = 'nl-icon-button__icon';
  glyph.setAttribute('aria-hidden', 'true');
  glyph.append(icon.cloneNode(true));
  button.append(glyph);

  updateIconButton(button, props);
  if (onClick) button.addEventListener('click', onClick);
  return button;
}

/** Applies the full props (label, variant, disabled) to a button made by `createIconButton`. */
export function updateIconButton(button: HTMLButtonElement, props: IconButtonProps): void {
  assertLabel(props.label);
  const { label, variant = 'ghost', disabled = false } = props;

  for (const v of ICON_BUTTON_VARIANTS) {
    button.classList.toggle(`nl-icon-button--${v}`, v === variant);
  }
  button.setAttribute('aria-label', label);
  button.disabled = disabled;
}
