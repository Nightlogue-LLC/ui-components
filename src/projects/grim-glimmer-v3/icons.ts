/** Replace this map to change icon providers. No consumer imports a provider. */
const paths = {
  star: 'M12 2 14 8 20 4 16 10 22 12 16 14 20 20 14 16 12 22 10 16 4 20 8 14 2 12 8 10 4 4 10 8Z',
  spire: 'M8 21V11H6L12 2 18 11H16V21ZM6 21H18M10 16H14',
  hint: 'M9 18H15M10 21H14M8 14C2 8 7 2 12 2S22 8 16 14L15 16H9Z',
  restart: 'M4 9A8 8 0 1 1 4 16M4 3V9H10',
  menu: 'M4 6H20M4 12H20M4 18H20',
  close: 'M5 5 19 19M19 5 5 19',
  back: 'M14 5 7 12 14 19M7 12H21',
  settings:
    'M9 3H15L16 6 19 7 21 12 19 17 16 18 15 21H9L8 18 5 17 3 12 5 7 8 6ZM9 12A3 3 0 1 0 15 12 3 3 0 1 0 9 12',
  undo: 'M8 5 3 10 8 15M3 10H14A6 6 0 0 1 14 22',
  redo: 'M16 5 21 10 16 15M21 10H10A6 6 0 0 0 10 22',
  sound: 'M3 9H7L12 5V19L7 15H3ZM16 8Q21 12 16 16',
  music: 'M9 18V5L20 3V16M9 8 20 6M9 18A3 3 0 1 1 6 15H9M20 16A3 3 0 1 1 17 13H20',
  haptics: 'M8 3H16V21H8ZM4 7 2 10 4 13 2 16M20 7 22 10 20 13 22 16',
  home: 'M3 11 12 3 21 11M5 9V21H10V15H14V21H19V9',
  stats: 'M4 21V14H8V21ZM10 21V9H14V21ZM16 21V3H20V21Z',
} as const;
export type IconName = keyof typeof paths;
export const ICON_NAMES = Object.keys(paths) as IconName[];
/** Decorative by default: name the containing button, or supply a standalone label. */
export function createIcon(
  name: IconName,
  options: { label?: string; off?: boolean } = {},
): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.classList.add('nl-grim-glimmer-v3-icon');
  svg.setAttribute('focusable', 'false');
  if (options.label) {
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', options.label);
  } else svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS(svg.namespaceURI, 'path');
  path.setAttribute('d', paths[name]);
  svg.append(path);
  if (options.off) {
    const slash = document.createElementNS(svg.namespaceURI, 'path');
    slash.setAttribute('d', 'M3 3 21 21');
    svg.append(slash);
  }
  return svg;
}
