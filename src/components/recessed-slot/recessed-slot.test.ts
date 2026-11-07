import { describe, expect, it } from 'vitest';
import { createRecessedSlot } from './recessed-slot.js';

describe('RecessedSlot', () => {
  it('keeps supplied content without making the container interactive', () => {
    const child = document.createElement('button');
    const slot = createRecessedSlot({ content: child });
    expect(slot.tagName).toBe('DIV');
    expect(slot.firstChild).toBe(child);
    expect(slot.hasAttribute('tabindex')).toBe(false);
  });

  it('can label a group if needed', () => {
    const slot = createRecessedSlot({ label: 'Top left slot' });
    expect(slot.getAttribute('role')).toBe('group');
    expect(slot.getAttribute('aria-label')).toBe('Top left slot');
  });
});
