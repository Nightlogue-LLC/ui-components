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

  it('lets the host trigger tactile feedback on activation', () => {
    const feedback = vi.fn();
    const tile = createTactileTile({ label: 'Star', glyph: '✦', onPressFeedback: feedback });
    tile.click();
    expect(feedback).toHaveBeenCalledTimes(1);
    tile.disabled = true;
    tile.click();
    expect(feedback).toHaveBeenCalledTimes(1);
  });

  it('accepts optional drag hooks without managing puzzle placement', () => {
    const moved = vi.fn();
    const ended = vi.fn();
    const tile = createTactileTile({
      label: 'Star',
      glyph: '✦',
      onDragMove: moved,
      onDragEnd: ended,
    });
    expect(tile.classList.contains('nl-tactile-tile--draggable')).toBe(true);
    expect(tile.hasAttribute('draggable')).toBe(false);
  });


  it('releases temporary press without changing persistent selected state', () => {
    const tile = createTactileTile({ label: 'Sol', glyph: '☉', selected: true });
    tile.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0 }));
    expect(tile.classList.contains('nl-tactile-tile--pressing')).toBe(true);
    tile.dispatchEvent(new MouseEvent('pointerup', { bubbles: true }));
    expect(tile.classList.contains('nl-tactile-tile--pressing')).toBe(false);
    expect(tile.getAttribute('aria-pressed')).toBe('true');
    expect(tile.classList.contains('nl-tactile-tile--selected')).toBe(true);
  });

  it.each(['pointercancel', 'pointerleave', 'lostpointercapture', 'blur'])(
    'clears physical press on %s',
    (eventName) => {
      const tile = createTactileTile({ label: 'Air', glyph: 'A' });
      tile.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0 }));
      expect(tile.classList.contains('nl-tactile-tile--pressing')).toBe(true);
      tile.dispatchEvent(new Event(eventName));
      expect(tile.classList.contains('nl-tactile-tile--pressing')).toBe(false);
    },
  );

  it('handles keyboard press/release and clears on disable', () => {
    const tile = createTactileTile({ label: 'Moon', glyph: '☽' });
    tile.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    expect(tile.classList.contains('nl-tactile-tile--pressing')).toBe(true);
    tile.dispatchEvent(new KeyboardEvent('keyup', { key: ' ', bubbles: true }));
    expect(tile.classList.contains('nl-tactile-tile--pressing')).toBe(false);
    tile.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    updateTactileTile(tile, { label: 'Moon', glyph: '☽', disabled: true });
    expect(tile.classList.contains('nl-tactile-tile--pressing')).toBe(false);
  });

  it('writes user text as text nodes, never HTML', () => {
    const tile = createTactileTile({ label: 'X', glyph: '<img>', caption: '<b>Text</b>' });
    expect(tile.querySelector('img, b')).toBeNull();
    expect(tile.textContent).toBe('<img><b>Text</b>');
  });
});
