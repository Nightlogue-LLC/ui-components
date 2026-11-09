export interface ToggleOptions {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
}
/** Native button provides Space/Enter activation. State is local; persistence belongs to callers. */
export function createToggle(options: ToggleOptions): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'nl-grim-glimmer-v3-toggle';
  button.setAttribute('role', 'switch');
  button.setAttribute('aria-checked', String(options.checked));
  button.disabled = options.disabled ?? false;
  const label = document.createElement('span');
  label.textContent = options.label;
  const track = document.createElement('span');
  track.className = 'nl-grim-glimmer-v3-toggle__track';
  track.setAttribute('aria-hidden', 'true');
  button.append(label, track);
  button.addEventListener('click', () => {
    const checked = button.getAttribute('aria-checked') !== 'true';
    button.setAttribute('aria-checked', String(checked));
    options.onChange?.(checked);
  });
  return button;
}
