import { describe, expect, it, vi } from 'vitest';
import { createBottomNav, updateBottomNav } from './bottom-nav.js';

const items = () =>
  ['collection', 'achievements', 'settings'].map((value) => ({
    value,
    label: value,
    icon: document.createElement('span'),
  }));

describe('bottom navigation', () => {
  it('requests navigation without changing the current page until accepted', () => {
    const onNavigate = vi.fn();
    const options = items();
    const nav = createBottomNav({
      label: 'Main navigation',
      items: options,
      value: 'collection',
      onNavigate,
    });
    document.body.append(nav);
    const buttons = [...nav.querySelectorAll('button')];
    expect(nav.getAttribute('aria-label')).toBe('Main navigation');
    expect(buttons[0]!.getAttribute('aria-current')).toBe('page');
    buttons[0]!.click();
    expect(onNavigate).not.toHaveBeenCalled();
    buttons[2]!.focus();
    buttons[2]!.click();
    expect(onNavigate).toHaveBeenCalledExactlyOnceWith('settings');
    expect(buttons[0]!.getAttribute('aria-current')).toBe('page');
    updateBottomNav(nav, 'settings');
    expect(nav.querySelectorAll('[aria-current="page"]')).toHaveLength(1);
    expect(buttons[2]!.getAttribute('aria-current')).toBe('page');
    expect(document.activeElement).toBe(buttons[2]);
    expect(nav.querySelector('.nl-bottom-nav__icon')?.getAttribute('aria-hidden')).toBe('true');
    expect(nav.contains(options[0]!.icon)).toBe(false);
    nav.remove();
  });

  it('keeps accessible destination names in icon-only mode', () => {
    const nav = createBottomNav({
      label: 'Main',
      items: items(),
      value: 'collection',
      iconOnly: true,
      onNavigate: vi.fn(),
    });
    expect(nav.classList.contains('nl-bottom-nav--icon-only')).toBe(true);
    expect(
      [...nav.querySelectorAll('button')].map((button) => button.getAttribute('aria-label')),
    ).toEqual(['collection', 'achievements', 'settings']);
  });

  it('rejects invalid destinations without losing the current page', () => {
    const nav = createBottomNav({
      label: 'Main',
      items: items(),
      value: 'collection',
      onNavigate: vi.fn(),
    });
    expect(() => updateBottomNav(nav, 'missing')).toThrow();
    expect(nav.querySelector('[aria-current="page"]')?.textContent).toBe('collection');
    expect(() =>
      createBottomNav({ label: 'Main', items: [], value: 'collection', onNavigate: vi.fn() }),
    ).toThrow();
  });
});
