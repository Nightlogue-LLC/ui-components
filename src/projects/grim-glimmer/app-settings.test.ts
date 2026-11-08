import { describe, expect, it, vi } from 'vitest';
import { createAppSettings, type AppSettingsState } from './app-settings.js';

const defaults: AppSettingsState = {
  appearance: 'system',
  haptics: true,
  sound: false,
  autoFill: false,
  animations: true,
};

describe('createAppSettings', () => {
  it('renders accessible appearance and app-wide preference controls', () => {
    const settings = createAppSettings({ state: defaults });
    const appearance = settings.querySelector<HTMLSelectElement>('select');
    expect(settings.getAttribute('aria-label')).toBe('Application settings');
    expect(settings.querySelector('h1')?.textContent).toBe('Settings');
    expect(settings.querySelectorAll('input[type="checkbox"]')).toHaveLength(4);
    expect(appearance?.value).toBe('system');
  });

  it('reports preference updates without changing the initial state object', () => {
    const onChange = vi.fn();
    const settings = createAppSettings({ state: defaults, onChange });
    const appearance = settings.querySelector<HTMLSelectElement>('select')!;
    appearance.value = 'dark';
    appearance.dispatchEvent(new Event('change', { bubbles: true }));
    expect(onChange).toHaveBeenLastCalledWith({ ...defaults, appearance: 'dark' });
    const sound = [...settings.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')][1]!;
    sound.checked = true;
    sound.dispatchEvent(new Event('change', { bubbles: true }));
    expect(onChange).toHaveBeenLastCalledWith({ ...defaults, appearance: 'dark', sound: true });
    expect(defaults.appearance).toBe('system');
  });
});
