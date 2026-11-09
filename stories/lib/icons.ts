import { createIcon } from '../../src/components/icon/index.js';
export const sampleIcons = { back: 'back', help: 'help', close: 'close', menu: 'more' } as const;
export type SampleIconName = keyof typeof sampleIcons;
export const sampleIconNames = Object.keys(sampleIcons) as SampleIconName[];
export function sampleIcon(name: SampleIconName): SVGSVGElement {
  return createIcon(sampleIcons[name]);
}
