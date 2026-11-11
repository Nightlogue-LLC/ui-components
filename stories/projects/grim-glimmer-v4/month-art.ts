import { uniqueId } from '../../../src/core/id.js';
import { monthLayout, shardForDate } from './month-geometry.js';
import { monthDates, type MonthManifest } from './month-model.js';
const NS = 'http://www.w3.org/2000/svg';
export function svgNode<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Record<string, string>,
) {
  const node = document.createElementNS(NS, tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  return node;
}
/** One image definition + one restoration mask, reused by two <use> layers. */
export function createMonthArt(
  manifest: MonthManifest,
  initialDates: readonly string[] = [],
  highlightDate?: string,
) {
  const layout = monthLayout(manifest),
    dates = monthDates(manifest.monthKey),
    id = uniqueId('month-art');
  const root = svgNode('svg', {
    viewBox: '0 0 500 800',
    class: 'gg-v4-month-art',
    role: 'img',
    'aria-label': `0 of ${dates.length} pieces restored`,
  });
  const defs = svgNode('defs', {}),
    image = svgNode('image', {
      id: id + '-image',
      href: manifest.imageUrl,
      width: '500',
      height: '800',
      preserveAspectRatio: 'xMidYMid slice',
    });
  const filter = svgNode('filter', {
    id: id + '-glass',
    x: '0',
    y: '0',
    width: '100%',
    height: '100%',
  });
  filter.append(svgNode('feColorMatrix', { type: 'saturate', values: '0' }));
  const mask = svgNode('mask', {
    id: id + '-mask',
    x: '0',
    y: '0',
    width: '500',
    height: '800',
    maskUnits: 'userSpaceOnUse',
    'mask-type': 'alpha',
  });
  const maskPaths = layout.shards.map((shard) =>
    svgNode('path', { d: shard.path, fill: 'white', opacity: '0' }),
  );
  mask.append(...maskPaths);
  const glow = svgNode('linearGradient', { id: id + '-pulse' });
  for (const [offset, opacity] of [
    ['0', '0'],
    ['.5', '1'],
    ['1', '0'],
  ])
    glow.append(
      svgNode('stop', {
        offset: offset!,
        'stop-color': 'var(--gg-v4-lantern)',
        'stop-opacity': opacity!,
      }),
    );
  defs.append(image, filter, mask, glow);
  const ghost = svgNode('use', {
    href: '#' + id + '-image',
    opacity: '.08',
    filter: `url(#${id}-glass)`,
  });
  const restored = svgNode('use', { href: '#' + id + '-image', mask: `url(#${id}-mask)` });
  const leads = svgNode('g', { class: 'gg-v4-month-leads', 'aria-hidden': 'true' });
  const leadPaths = layout.shards.map((shard) =>
    svgNode('path', {
      d: shard.edgePath,
      fill: 'none',
      'stroke-width': '1',
      'vector-effect': 'non-scaling-stroke',
    }),
  );
  leads.append(...leadPaths);
  const highlight = svgNode('path', {
    class: 'gg-v4-month-today',
    fill: 'none',
    'stroke-width': '2',
    'vector-effect': 'non-scaling-stroke',
  });
  if (highlightDate)
    highlight.setAttribute('d', layout.shards[shardForDate(layout, highlightDate)]!.path);
  const flash = svgNode('path', {
    class: 'gg-v4-month-flash',
    fill: 'none',
    'stroke-width': '5',
    'vector-effect': 'non-scaling-stroke',
    opacity: '0',
  });
  const pulse = svgNode('rect', {
    class: 'gg-v4-month-pulse',
    fill: `url(#${id}-pulse)`,
    width: '500',
    height: '800',
    opacity: '0',
  });
  root.append(defs, ghost, restored, leads, highlight, flash, pulse);
  let restoredDates = new Set<string>();
  function update(next: readonly string[]) {
    restoredDates = new Set(next.filter((date) => dates.includes(date)));
    maskPaths.forEach((path) => (path.style.opacity = '0'));
    for (const date of restoredDates) maskPaths[shardForDate(layout, date)]!.style.opacity = '1';
    root.setAttribute(
      'aria-label',
      restoredDates.size === dates.length
        ? manifest.altText
        : `${restoredDates.size} of ${dates.length} pieces restored`,
    );
  }
  update(initialDates);
  return {
    element: root,
    layout,
    maskPaths,
    leadPaths,
    leads,
    flash,
    pulse,
    update,
    count: () => restoredDates.size,
    prepare(date: string) {
      const index = shardForDate(layout, date);
      flash.setAttribute('d', layout.shards[index]!.path);
      return maskPaths[index]!;
    },
  };
}
