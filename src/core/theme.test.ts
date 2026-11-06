import { describe, expect, it } from 'vitest';
import { applyTheme } from './theme.js';

describe('applyTheme', () => {
  it('scopes the theme to the element it is applied to', () => {
    const a = document.createElement('div');
    const b = document.createElement('div');

    applyTheme(a, 'neutral', 'dark');

    expect(a.getAttribute('data-nl-theme')).toBe('neutral');
    expect(a.getAttribute('data-nl-mode')).toBe('dark');
    expect(b.hasAttribute('data-nl-theme')).toBe(false);
  });

  it('removes the mode when none is given', () => {
    const el = document.createElement('div');
    applyTheme(el, 'neutral', 'dark');
    applyTheme(el, 'neutral');
    expect(el.hasAttribute('data-nl-mode')).toBe(false);
  });
});
