import { describe, expect, it } from 'vitest';
import { createIcon, ICON_MAP, updateIconWeight } from './index.js';
import { createBottomNav, updateBottomNav } from '../bottom-nav/index.js';
describe('shared Phosphor icon map', () => {
  it('uses Light at 24px with explicit SVG imports and currentColor', () => {
    const icon = createIcon('back');
    expect(icon.getAttribute('width')).toBe('24');
    expect(icon.dataset.weight).toBe('light');
    expect(icon.getAttribute('viewBox')).toBe('0 0 256 256');
    expect(icon.getAttribute('aria-hidden')).toBe('true');
    expect(icon.style.fill.toLowerCase()).toBe('currentcolor');
    expect(ICON_MAP.back.name).toBe('arrow-left');
    updateIconWeight(icon, 'fill');
    expect(icon.dataset.weight).toBe('fill');
  });
  it('uses the true speaker-slash asset and central overlays for music/haptics', () => {
    expect(createIcon('sound', { off: true }).dataset.nlIcon).toBe('soundOff');
    for (const name of ['music', 'haptics'] as const)
      expect(createIcon(name, { off: true }).querySelector('[data-slash]')).not.toBeNull();
    expect(createIcon('more', { label: 'Menu' }).getAttribute('aria-label')).toBe('Menu');
  });
  it('switches only the active nav destination to Fill without recreating buttons', () => {
    const nav = createBottomNav({
      label: 'Navigation',
      value: 'home',
      items: [
        { value: 'home', label: 'Home', icon: createIcon('home') },
        { value: 'settings', label: 'Settings', icon: createIcon('settings') },
      ],
      onNavigate: () => undefined,
    });
    const buttons = [...nav.querySelectorAll('button')];
    expect(nav.querySelector('svg')?.dataset.weight).toBe('fill');
    updateBottomNav(nav, 'settings');
    expect([...nav.querySelectorAll('svg')].map((icon) => icon.dataset.weight)).toEqual([
      'light',
      'fill',
    ]);
    expect([...nav.querySelectorAll('button')]).toEqual(buttons);
  });
});
