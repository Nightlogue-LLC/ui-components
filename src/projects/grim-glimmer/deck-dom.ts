/** Private safe DOM helper shared by the deck compositions. */
export function deckElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  options: { className?: string; text?: string } = {},
  children: Node[] = [],
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (options.className) node.className = options.className;
  if (options.text !== undefined) node.textContent = options.text;
  node.append(...children);
  return node;
}
/** Existing four-point indicator geometry; no additional artwork dependency. */
export function deckStar(): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 32 32');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  const polygon = document.createElementNS(svg.namespaceURI, 'polygon');
  polygon.setAttribute(
    'points',
    Array.from({ length: 8 }, (_, i) => {
      const angle = (i * Math.PI) / 4 - Math.PI / 2,
        r = i % 2 ? 5 : 15;
      return `${16 + Math.cos(angle) * r},${16 + Math.sin(angle) * r}`;
    }).join(' '),
  );
  svg.append(polygon);
  return svg;
}
