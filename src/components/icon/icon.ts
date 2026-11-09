import { ICON_MAP, type IconName } from './icon-map.js';
export type IconWeight = 'light' | 'fill';
export interface IconOptions {
  label?: string;
  off?: boolean;
  weight?: IconWeight;
  size?: number;
}
const NS = 'http://www.w3.org/2000/svg';
/** Trusted SVG assets from the pinned MIT package; never user-provided markup. */
export function createIcon(name: IconName, options: IconOptions = {}): SVGSVGElement {
  const key = options.off && name === 'sound' ? 'soundOff' : name === 'menu' ? 'more' : name;
  const asset = ICON_MAP[key];
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 256 256');
  svg.setAttribute('width', String(options.size ?? 24));
  svg.setAttribute('height', String(options.size ?? 24));
  svg.classList.add('nl-icon');
  svg.dataset.nlIcon = key;
  svg.dataset.weight = options.weight ?? 'light';
  svg.style.fill = 'currentColor';
  svg.style.stroke = 'none';
  svg.setAttribute('focusable', 'false');
  if (options.label) {
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', options.label);
  } else svg.setAttribute('aria-hidden', 'true');
  for (const weight of ['light', 'fill'] as const) {
    const source = new DOMParser().parseFromString(asset[weight], 'image/svg+xml').documentElement;
    const group = document.createElementNS(NS, 'g');
    group.classList.add(`nl-icon__${weight}`);
    for (const child of [...source.childNodes]) group.append(document.importNode(child, true));
    svg.append(group);
  }
  if (options.off && (name === 'music' || name === 'haptics')) {
    const slash = document.createElementNS(NS, 'path');
    slash.setAttribute('d', 'M40 40 216 216');
    slash.setAttribute('fill', 'none');
    slash.setAttribute('stroke', 'currentColor');
    slash.setAttribute('stroke-width', '12');
    slash.setAttribute('stroke-linecap', 'round');
    slash.dataset.slash = 'true';
    svg.append(slash);
  }
  return svg;
}
export function updateIconWeight(icon: SVGSVGElement, weight: IconWeight): void {
  icon.dataset.weight = weight;
}
