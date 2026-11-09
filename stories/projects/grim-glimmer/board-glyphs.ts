/** Compatibility helper: the shipped board now owns its SVG glyphs. */
export function withBoardGlyphs<T extends HTMLElement>(node: T): T {
  return node;
}
