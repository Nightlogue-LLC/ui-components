import { uniqueId } from '../../core/id.js';

export interface SegmentedOption {
  value: string;
  /** Full visible label. Icon-only options are intentionally not supported. */
  label: string;
}

export interface SegmentedControlProps {
  /** Accessible name of the group (e.g. "Difficulty"). */
  label: string;
  options: readonly SegmentedOption[];
  /** The value the app currently considers selected. */
  value: string;
}

export interface SegmentedControlOptions extends SegmentedControlProps {
  /** Called with the option the user asked for. See "controlled" below. */
  onChange: (next: string) => void;
}

interface State {
  value: string;
  optionsKey: string;
  name: string;
  onChange: (next: string) => void;
}

const states = new WeakMap<HTMLElement, State>();

/**
 * Creates a single-select segmented control built from native radio inputs inside a
 * `role="radiogroup"`. Keyboard behavior is therefore the browser's own radio-group behavior:
 * Tab enters the group on the selected option, arrow keys move and select, and Space selects.
 *
 * The control is CONTROLLED. When the user picks an option it immediately snaps back to
 * `value` and reports the request through `onChange(next)`. The app decides: call
 * `updateSegmentedControl(el, { ..., value: next })` to accept, or do nothing (or call it with
 * the old value) to reject, e.g. while a discard confirmation is shown.
 */
export function createSegmentedControl(options: SegmentedControlOptions): HTMLElement {
  const { onChange, ...props } = options;
  const root = document.createElement('div');
  root.classList.add('nl-segmented-control');
  root.setAttribute('role', 'radiogroup');
  states.set(root, {
    value: props.value,
    optionsKey: '',
    name: uniqueId('nl-segmented-control'),
    onChange,
  });

  root.addEventListener('change', (event) => {
    const input = event.target;
    const state = states.get(root);
    if (!state || !(input instanceof HTMLInputElement) || input.type !== 'radio') return;
    const next = input.value;
    syncChecked(root, state.value); // snap back; the app decides whether to accept
    state.onChange(next);
  });

  updateSegmentedControl(root, props);
  return root;
}

/**
 * Applies the full props to a control made by `createSegmentedControl`. If only `value` or
 * `label` changed, existing DOM (and keyboard focus) is kept.
 */
export function updateSegmentedControl(root: HTMLElement, props: SegmentedControlProps): void {
  const state = states.get(root);
  if (!state)
    throw new Error('updateSegmentedControl: element was not made by createSegmentedControl');

  root.setAttribute('aria-label', props.label);

  const optionsKey = JSON.stringify(props.options);
  if (optionsKey !== state.optionsKey) {
    state.optionsKey = optionsKey;
    root.replaceChildren(...props.options.map((option) => renderOption(option, state.name)));
  }

  state.value = props.value;
  syncChecked(root, props.value);
}

function renderOption(option: SegmentedOption, name: string): HTMLLabelElement {
  const label = document.createElement('label');
  label.className = 'nl-segmented-control__option';

  const input = document.createElement('input');
  input.type = 'radio';
  input.name = name;
  input.value = option.value;
  input.className = 'nl-segmented-control__input';

  const text = document.createElement('span');
  text.className = 'nl-segmented-control__label';
  text.textContent = option.label;

  label.append(input, text);
  return label;
}

function syncChecked(root: HTMLElement, value: string): void {
  for (const input of root.querySelectorAll<HTMLInputElement>('input[type="radio"]')) {
    input.checked = input.value === value;
  }
}
