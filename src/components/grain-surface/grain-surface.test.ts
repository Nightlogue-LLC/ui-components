import { describe, expect, it } from 'vitest';
import { createGrainSurface } from './grain-surface.js';

describe('GrainSurface', () => {
  it('keeps child content and introduces no interactive semantics', () => {
    const child = document.createElement('button');
    const surface = createGrainSurface({ content: child });
    expect(surface.firstChild).toBe(child);
    expect(surface.getAttribute('role')).toBeNull();
  });
});
