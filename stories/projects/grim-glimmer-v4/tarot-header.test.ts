import { describe, it, expect, vi } from 'vitest';
import { createTarotGameplayHeader, PUZZLE_IDENTITIES } from './tarot-header.js';
import { createTarotHeaderPreview, createGlyphSpecimens } from './tarot-header-fixtures.js';
describe('tarot gameplay header proposal', () => {
  it.each(Object.values(PUZZLE_IDENTITIES))(
    'renders $puzzleName as the only primary heading, with separate archetype and dimensions',
    (identity) => {
      const header = createTarotGameplayHeader({
        ...identity,
        difficulty: 'Medium',
        columns: 8,
        rows: 6,
      });
      expect(header.querySelectorAll('h1')).toHaveLength(1);
      expect(header.querySelector('h1')!.textContent).toBe(identity.puzzleName);
      expect(header.querySelector('.gg-v4-tarot-identity')!.textContent).toBe(
        `${identity.tarotNumeral} · ${identity.archetypeTitle.toUpperCase()}`,
      );
      expect(header.querySelector('.nl-grim-glimmer-game-header__status')!.textContent).toBe(
        'Medium · 8×6',
      );
      expect(header.textContent).not.toContain('Stars & Spires');
    },
  );
  it('keeps the native hint and menu controls and accepts unrelated future identities', () => {
    const onHint = vi.fn(),
      onMenu = vi.fn();
    const header = createTarotGameplayHeader({
      tarotNumeral: 'IV',
      archetypeTitle: 'The Lantern',
      puzzleName: 'Future Puzzle',
      difficulty: 'Hard',
      columns: 10,
      rows: 12,
      onHint,
      onMenu,
    });
    header.querySelector<HTMLButtonElement>('[aria-label="Hint"]')!.click();
    header.querySelector<HTMLButtonElement>('[aria-label="Game menu"]')!.click();
    expect(onHint).toHaveBeenCalledOnce();
    expect(onMenu).toHaveBeenCalledOnce();
    expect(header.querySelector('h1')!.textContent).toBe('Future Puzzle');
    expect(() =>
      createTarotGameplayHeader({
        tarotNumeral: 'I',
        archetypeTitle: 'X',
        puzzleName: 'X',
        difficulty: 'Easy',
        columns: 0,
        rows: 6,
      }),
    ).toThrow();
  });
  it('keeps identical board/controls/app-nav markup in the two-line and three-line layout comparison', () => {
    const before = createTarotHeaderPreview({ showIdentity: false }),
      after = createTarotHeaderPreview();
    for (const slot of ['board', 'controls', 'appHeader'])
      expect(after.querySelector(`[data-slot="${slot}"]`)!.outerHTML).toBe(
        before.querySelector(`[data-slot="${slot}"]`)!.outerHTML,
      );
    expect(before.querySelector<HTMLElement>('.gg-v4-tarot-identity')!.hidden).toBe(true);
    expect(after.querySelector<HTMLElement>('.gg-v4-tarot-identity')!.hidden).toBe(false);
    expect(after.querySelectorAll('.nl-grim-glimmer-board__cell')).toHaveLength(36);
    expect(after.querySelector('[aria-label="Back to collection"]')).not.toBeNull();
    expect(after.querySelector('[aria-label="App settings"]')).not.toBeNull();
  });
  it('opts new glyphs into isolated specimens without replacing other board stories or state names', () => {
    const supplied = createTarotHeaderPreview(),
      existing = createTarotHeaderPreview({ glyphs: 'existing' });
    expect(supplied.classList.contains('gg-v4-camper-glyphs')).toBe(true);
    expect(existing.classList.contains('gg-v4-camper-glyphs')).toBe(false);
    expect(supplied.querySelector('[aria-label="Place tent"]')).not.toBeNull();
    expect(supplied.querySelector('.nl-grim-glimmer-board__cell--tentative')).toBeNull();
    expect(existing.querySelector('.nl-grim-glimmer-board__cell--tentative')).not.toBeNull();
    expect(createGlyphSpecimens().querySelectorAll('.gg-v4-camper-glyph')).toHaveLength(8);
  });
});
