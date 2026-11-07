/**
 * Generic sample glyphs for the catalog ONLY (chevron, help, close, menu), built with DOM APIs.
 * They stand in for the artwork a consuming app supplies; the library ships no icons.
 */
const NS = 'http://www.w3.org/2000/svg';

export const sampleIcons = {
  back: ['M15 5l-7 7 7 7'],
  help: [
    'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z',
    'M9.6 9.4a2.5 2.5 0 1 1 3.6 2.2c-.7.4-1.2.9-1.2 1.7',
    'M12 17h.01',
  ],
  close: ['M6 6l12 12', 'M18 6L6 18'],
  menu: ['M4 7h16', 'M4 12h16', 'M4 17h16'],
} as const;

export type SampleIconName = keyof typeof sampleIcons;
export const sampleIconNames = Object.keys(sampleIcons) as SampleIconName[];

export function sampleIcon(name: SampleIconName): SVGSVGElement {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  for (const d of sampleIcons[name]) {
    const path = document.createElementNS(NS, 'path');
    path.setAttribute('d', d);
    svg.append(path);
  }
  return svg;
}
