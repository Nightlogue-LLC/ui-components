// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { mockBoard } from '../stories/lib/mock-board.js';

const given = (cells: readonly string[]) => cells.filter((c) => c === 'fixed').length;

describe('mockBoard (gallery-only)', () => {
  it('is deterministic for the same difficulty and generation', () => {
    expect(mockBoard('easy', 3)).toEqual(mockBoard('easy', 3));
  });

  it('produces a different board for a new generation', () => {
    expect(mockBoard('easy', 1)).not.toEqual(mockBoard('easy', 2));
  });

  it('has a 5x5 board whose given-piece count grows with difficulty', () => {
    expect(mockBoard('easy', 1)).toHaveLength(25);
    expect([
      given(mockBoard('easy', 1)),
      given(mockBoard('medium', 1)),
      given(mockBoard('hard', 1)),
    ]).toEqual([5, 6, 7]);
  });

  it('starts untouched: only given pieces, nothing placed or marked', () => {
    expect(mockBoard('hard', 9).every((c) => c === 'fixed' || c === 'empty')).toBe(true);
  });
});
