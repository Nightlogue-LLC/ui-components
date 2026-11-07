import { describe, expect, it } from 'vitest';
import { createBadge, updateBadge } from './badge.js';

describe('badge', () => {
  it('renders a neutral, non-interactive span carrying the label as text', () => {
    const badge = createBadge({ label: 'Coming Soon' });
    expect(badge.tagName).toBe('SPAN');
    expect(badge.textContent).toBe('Coming Soon');
    expect(badge.classList.contains('nl-badge--neutral')).toBe(true);
    expect(badge.querySelector('button, a, input')).toBeNull();
  });

  it.each(['neutral', 'accent', 'muted'] as const)('applies the %s tone exclusively', (tone) => {
    const badge = createBadge({ label: 'x', tone });
    for (const t of ['neutral', 'accent', 'muted']) {
      expect(badge.classList.contains(`nl-badge--${t}`)).toBe(t === tone);
    }
  });

  it('keeps meaning in text for every tone (label is never empty because of tone)', () => {
    expect(createBadge({ label: 'Play', tone: 'accent' }).textContent).toBe('Play');
  });

  it('sets text, never HTML', () => {
    const badge = createBadge({ label: '<b>hi</b>' });
    expect(badge.querySelector('b')).toBeNull();
    expect(badge.textContent).toBe('<b>hi</b>');
  });

  it('updates label and tone', () => {
    const badge = createBadge({ label: 'Play', tone: 'accent' });
    updateBadge(badge, { label: 'Continue', tone: 'muted' });
    expect(badge.textContent).toBe('Continue');
    expect(badge.classList.contains('nl-badge--muted')).toBe(true);
    expect(badge.classList.contains('nl-badge--accent')).toBe(false);
  });
});
