/** Approved silhouettes, colored by the active theme and shared with board CSS. */
export function createPuzzleGlyph(kind: 'star' | 'spire'): HTMLElement {
  const glyph = document.createElement('span');
  glyph.className = `nl-grim-glimmer-glyph nl-grim-glimmer-glyph--${kind}`;
  glyph.setAttribute('aria-hidden', 'true');
  return glyph;
}
