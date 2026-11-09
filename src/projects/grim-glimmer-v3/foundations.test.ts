import { describe, expect, it, vi } from 'vitest';
import { createIcon, createToggle, ICON_NAMES } from './index.js';
describe('editorial foundations', () => {
  it('switch toggles with an accessible name and reports the new state', () => {
    const onChange = vi.fn();
    const toggle = createToggle({ label: 'Music', checked: false, onChange });
    expect(toggle.textContent).toBe('Music');
    expect(toggle.getAttribute('role')).toBe('switch');
    toggle.click();
    expect(toggle.getAttribute('aria-checked')).toBe('true');
    expect(onChange).toHaveBeenLastCalledWith(true);
    toggle.click();
    expect(onChange).toHaveBeenLastCalledWith(false);
  });
  it('disabled switches do not change state', () => {
    const onChange = vi.fn();
    const toggle = createToggle({ label: 'Sound', checked: true, disabled: true, onChange });
    toggle.click();
    expect(toggle.getAttribute('aria-checked')).toBe('true');
    expect(onChange).not.toHaveBeenCalled();
  });
  it('creates every mapped icon and marks decorative instances hidden', () => {
    for (const name of ICON_NAMES) {
      expect(createIcon(name).getAttribute('aria-hidden')).toBe('true');
      expect(createIcon(name).querySelector('path')?.getAttribute('d')).toBeTruthy();
    }
    const off = createIcon('sound', { off: true, label: 'Sound off' });
    expect(off.getAttribute('aria-label')).toBe('Sound off');
    expect(off.querySelectorAll('path')).toHaveLength(2);
  });
});
