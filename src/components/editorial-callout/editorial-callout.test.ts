import { describe, expect, it } from 'vitest';
import { createEditorialCallout } from './editorial-callout.js';

describe('EditorialCallout', () => {
  it('renders semantic headings and safe text without interactive behavior', () => {
    const box = createEditorialCallout({ title: 'Occult Insight', description: '<strong>Hint</strong>' });
    expect(box.tagName).toBe('ASIDE');
    expect(box.querySelector('h3')?.textContent).toBe('Occult Insight');
    expect(box.querySelector('strong')).toBeNull();
    expect(box.querySelector('p')?.textContent).toBe('<strong>Hint</strong>');
  });
});
