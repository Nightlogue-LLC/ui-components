export interface SwitchProps {
  label: string;
  checked: boolean;
  disabled?: boolean;
  reducedMotion?: boolean;
}
export interface SwitchOptions extends SwitchProps {
  onChange?: (checked: boolean) => void;
}
const inputs = new WeakMap<HTMLElement, HTMLInputElement>();

/** A labelled native checkbox with switch semantics. No preference persistence or feedback policy. */
export function createSwitch(options: SwitchOptions): HTMLElement {
  const row = document.createElement('label');
  row.className = 'nl-switch';
  const label = document.createElement('span');
  label.className = 'nl-switch__label';
  const target = document.createElement('span');
  target.className = 'nl-switch__target';
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.setAttribute('role', 'switch');
  const track = document.createElement('span');
  track.className = 'nl-switch__track';
  track.setAttribute('aria-hidden', 'true');
  const thumb = document.createElement('span');
  thumb.className = 'nl-switch__thumb';
  track.append(thumb);
  target.append(input, track);
  row.append(label, target);
  inputs.set(row, input);
  input.addEventListener('change', () => {
    if (!input.disabled) options.onChange?.(input.checked);
  });
  updateSwitch(row, options);
  return row;
}

/** Apply external preference state in place; never emits onChange. */
export function updateSwitch(row: HTMLElement, props: SwitchProps): void {
  if (!props.label.trim()) throw new Error('Switch requires a non-empty label');
  const input = inputs.get(row);
  if (!input) throw new Error('Expected a switch made by createSwitch');
  row.querySelector('.nl-switch__label')!.textContent = props.label;
  input.checked = props.checked;
  input.disabled = props.disabled ?? false;
  row.dataset.disabled = String(input.disabled);
  row.dataset.reducedMotion = String(props.reducedMotion ?? false);
}
