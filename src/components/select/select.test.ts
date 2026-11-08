import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSelect } from './select.js';

afterEach(() => document.body.replaceChildren());

function setup() {
  const onChange = vi.fn();
  const root = createSelect({
    label: 'Appearance',
    value: 'system',
    onChange,
    options: [
      { value: 'system', label: 'System' },
      { value: 'light', label: 'Light' },
      { value: 'dark', label: 'Dark' },
    ],
  });
  document.body.append(root);
  const trigger = root.querySelector('button')!;
  const list = root.querySelector<HTMLElement>('[role="listbox"]')!;
  const choices = [...root.querySelectorAll<HTMLElement>('[role="option"]')];
  const key = (value: string) =>
    document.activeElement!.dispatchEvent(
      new KeyboardEvent('keydown', { key: value, bubbles: true, cancelable: true }),
    );
  return { root, trigger, list, choices, key, onChange };
}

describe('in-app select', () => {
  it('opens with a named listbox and commits one choice without native select markup', () => {
    const { root, trigger, list, choices, onChange } = setup();
    expect(root.querySelector('select')).toBeNull();
    trigger.click();
    expect(list.hidden).toBe(false);
    expect(document.activeElement).toBe(choices[0]);
    expect(list.getAttribute('aria-label')).toBe('Appearance');
    expect(trigger.getAttribute('aria-controls')).toBe(list.id);
    choices[2]!.click();
    expect(onChange).toHaveBeenCalledExactlyOnceWith('dark');
    expect(trigger.getAttribute('aria-label')).toBe('Appearance: Dark');
    expect(choices[2]!.getAttribute('aria-selected')).toBe('true');
    expect(list.hidden).toBe(true);
    expect(document.activeElement).toBe(trigger);
    trigger.click();
    choices[2]!.click();
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('supports arrows, Home/End, typeahead, commit and Escape without committing navigation', () => {
    const { trigger, list, choices, key, onChange } = setup();
    trigger.focus();
    key('ArrowDown');
    key('End');
    expect(document.activeElement).toBe(choices[2]);
    key('Home');
    key('l');
    expect(document.activeElement).toBe(choices[1]);
    key('Escape');
    expect(list.hidden).toBe(true);
    expect(document.activeElement).toBe(trigger);
    expect(onChange).not.toHaveBeenCalled();
    key('ArrowUp');
    expect(document.activeElement).toBe(choices[2]);
    key('ArrowDown');
    expect(document.activeElement).toBe(choices[0]);
    key('ArrowUp');
    key('Enter');
    expect(onChange).toHaveBeenCalledExactlyOnceWith('dark');
  });

  it('dismisses on Tab, outside pointer, focus leaving, and removal without changes', async () => {
    const { root, trigger, list, key, onChange } = setup();
    trigger.click();
    key('Tab');
    expect(list.hidden).toBe(true);
    trigger.click();
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    expect(list.hidden).toBe(true);
    trigger.click();
    const outside = document.createElement('button');
    document.body.append(outside);
    outside.focus();
    expect(list.hidden).toBe(true);
    trigger.click();
    root.remove();
    await new Promise<void>((resolve) => queueMicrotask(resolve));
    expect(list.hidden).toBe(true);
    expect(onChange).not.toHaveBeenCalled();
  });
});
