export const BUTTON_VARIANTS = ['primary', 'secondary', 'ghost'] as const;
export const BUTTON_SIZES = ['sm', 'md', 'lg'] as const;

export type ButtonVariant = (typeof BUTTON_VARIANTS)[number];
export type ButtonSize = (typeof BUTTON_SIZES)[number];

export interface ButtonProps {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  /** Shows a spinner and blocks interaction. Implemented with `disabled` + `aria-busy`. */
  loading?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export interface ButtonOptions extends ButtonProps {
  onClick?: (event: MouseEvent) => void;
}

/**
 * Creates a themed button. The CSS classes (see button.css) are the real contract, so the same
 * markup can also be written by hand in any framework or template.
 */
export function createButton(options: ButtonOptions): HTMLButtonElement {
  const { onClick, ...props } = options;
  const button = document.createElement('button');
  button.classList.add('nl-button');

  const label = document.createElement('span');
  label.className = 'nl-button__label';
  button.append(label);

  updateButton(button, props);
  if (onClick) button.addEventListener('click', onClick);
  return button;
}

/**
 * Applies the full set of props to a button made by `createButton`. Pass the complete props every
 * time (not a partial) so state like `disabled` vs `loading` never depends on hidden history.
 */
export function updateButton(button: HTMLButtonElement, props: ButtonProps): void {
  const { label, variant = 'primary', size = 'md', disabled = false, loading = false } = props;

  for (const v of BUTTON_VARIANTS) button.classList.toggle(`nl-button--${v}`, v === variant);
  for (const s of BUTTON_SIZES) button.classList.toggle(`nl-button--${s}`, s === size);

  button.type = props.type ?? 'button';
  button.disabled = disabled || loading;
  if (loading) {
    button.setAttribute('aria-busy', 'true');
  } else {
    button.removeAttribute('aria-busy');
  }

  const labelEl = button.querySelector('.nl-button__label');
  if (labelEl) labelEl.textContent = label;
}
