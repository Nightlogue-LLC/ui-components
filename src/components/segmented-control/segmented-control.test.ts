import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSegmentedControl, updateSegmentedControl } from './segmented-control.js';

const options = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
  { value: 'c', label: 'Gamma' },
] as const;

const radios = (root: HTMLElement) => [
  ...root.querySelectorAll<HTMLInputElement>('input[type="radio"]'),
];
afterEach(() => document.body.replaceChildren());

// Mounted in the document: radio inputs only fire `change` on click while connected.
const make = (onChange = vi.fn(), value = 'a') => {
  const root = createSegmentedControl({ label: 'Pick one', options, value, onChange });
  document.body.append(root);
  return root;
};

describe('createSegmentedControl', () => {
  it('is a labelled radiogroup of native radios sharing one name', () => {
    const root = make();
    expect(root.getAttribute('role')).toBe('radiogroup');
    expect(root.getAttribute('aria-label')).toBe('Pick one');
    const inputs = radios(root);
    expect(inputs).toHaveLength(3);
    expect(new Set(inputs.map((i) => i.name)).size).toBe(1);
    expect(inputs.map((i) => i.value)).toEqual(['a', 'b', 'c']);
  });

  it('shows full visible text labels and checks the current value', () => {
    const root = make(undefined, 'b');
    expect(root.textContent).toBe('AlphaBetaGamma');
    expect(radios(root).map((i) => i.checked)).toEqual([false, true, false]);
  });

  it('gives every instance its own radio group name', () => {
    expect(radios(make())[0]!.name).not.toBe(radios(make())[0]!.name);
  });

  it('sets labels as text, never as HTML', () => {
    const root = createSegmentedControl({
      label: 'x',
      options: [{ value: 'a', label: '<b>bold</b>' }],
      value: 'a',
      onChange: vi.fn(),
    });
    expect(root.querySelector('b')).toBeNull();
    expect(root.textContent).toBe('<b>bold</b>');
  });
});

describe('selection is controlled by the app', () => {
  it('reports the requested option and snaps back to the current value', () => {
    const onChange = vi.fn();
    const root = make(onChange, 'a');

    radios(root)[2]!.click(); // user picks Gamma
    expect(onChange).toHaveBeenCalledExactlyOnceWith('c');
    expect(radios(root).map((i) => i.checked)).toEqual([true, false, false]);
  });

  it('applies the selection only when the app accepts it via update', () => {
    const onChange = vi.fn();
    const root = make(onChange, 'a');
    radios(root)[1]!.click();
    updateSegmentedControl(root, { label: 'Pick one', options, value: 'b' });
    expect(radios(root).map((i) => i.checked)).toEqual([false, true, false]);
  });

  it('stays on the old value when the app rejects the request (never updates)', () => {
    const onChange = vi.fn();
    const root = make(onChange, 'a');
    radios(root)[1]!.click();
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(radios(root)[0]!.checked).toBe(true);
  });
});

describe('updateSegmentedControl', () => {
  it('keeps the same DOM nodes (so keyboard focus survives) when options are unchanged', () => {
    const root = make();
    const before = radios(root);
    before[1]!.focus();
    updateSegmentedControl(root, { label: 'Renamed', options, value: 'b' });
    expect(radios(root)).toEqual(before);
    expect(root.getAttribute('aria-label')).toBe('Renamed');
    expect(document.activeElement).toBe(before[1]);
  });

  it('rebuilds when the options change', () => {
    const root = make();
    updateSegmentedControl(root, {
      label: 'Pick one',
      options: [
        { value: 'x', label: 'X' },
        { value: 'y', label: 'Y' },
      ],
      value: 'y',
    });
    expect(radios(root).map((i) => i.value)).toEqual(['x', 'y']);
    expect(radios(root).map((i) => i.checked)).toEqual([false, true]);
  });

  it('checks nothing when the value matches no option', () => {
    const root = make();
    updateSegmentedControl(root, { label: 'Pick one', options, value: 'zzz' });
    expect(radios(root).some((i) => i.checked)).toBe(false);
  });

  it('rejects elements it did not create', () => {
    expect(() =>
      updateSegmentedControl(document.createElement('div'), { label: '', options, value: 'a' }),
    ).toThrow();
  });
});
