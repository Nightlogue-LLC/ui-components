/**
 * Story-only board glyph artwork for Grim & Glimmer.
 *
 * The library's own board still draws its generic placeholder shapes (see `board.ts`); these
 * images are applied purely by Storybook CSS (`.sb-grim-glyphs`, in stories/story-styles.css) so
 * the catalog can show what the board looks like with real artwork. Production artwork belongs
 * to the game app.
 *
 *  - spire (`fixed`):                  the given piece
 *  - four-point star (`placed`):       the player's confirmed piece (`tentative` is the same star, faded)
 *  - `marked` dot and `excluded` X:    unchanged
 */
const spire = new URL('./assets/glyph-spire.png', import.meta.url).href;
const star = new URL('./assets/glyph-star.png', import.meta.url).href;

/** Opts a story subtree into the artwork glyphs. Returns the same node for chaining. */
export function withBoardGlyphs<T extends HTMLElement>(node: T): T {
  node.classList.add('sb-grim-glyphs');
  node.style.setProperty('--sb-glyph-fixed', `url("${spire}")`);
  node.style.setProperty('--sb-glyph-placed', `url("${star}")`);
  return node;
}
