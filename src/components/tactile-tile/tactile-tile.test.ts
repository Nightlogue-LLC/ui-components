import { describe, expect, it, vi } from 'vitest';
import { createTactileTile, updateTactileTile } from './tactile-tile.js';

describe('TactileTile', () => {
  it('uses native button semantics and announces selection', () => {
    const tile = createTactileTile({ label: 'Air', glyph: 'A', caption: 'I. AIR', selected: true });
    expect(tile.type).toBe('button');
    expect(tile.getAttribute('aria-label')).toBe('Air');
    expect(tile.getAttribute('aria-pressed')).toBe('true');
    expect(tile.classList.contains('nl-tactile-tile--selected')).toBe(true);
    expect(tile.querySelector('.nl-tactile-tile__glyph')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('updates in place and keeps its event listener', () => {
    const onClick = vi.fn();
    const tile = createTactileTile({ label: 'Fire', glyph: 'F', onClick });
    updateTactileTile(tile, { label: 'Water', glyph: 'W', selected: true });
    tile.click();
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(tile.textContent).toBe('W');
    expect(tile.getAttribute('aria-label')).toBe('Water');
    expect(tile.getAttribute('aria-pressed')).toBe('true');
  });

  it('does not click when disabled', () => {
    const onClick = vi.fn();
    const tile = createTactileTile({ label: 'Earth', glyph: 'E', disabled: true, onClick });
    tile.click();
    expect(onClick).not.toHaveBeenCalled();
  });

  it('writes user text as text nodes, never HTML', () => {
    const tile = createTactileTile({ label: 'X', glyph: '<img>', caption: '<b>Text</b>' });
    expect(tile.querySelector('img, b')).toBeNull();
    expect(tile.textContent).toBe('<img><b>Text</b>');
  });
});
