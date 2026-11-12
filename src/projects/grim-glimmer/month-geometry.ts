import { canonicalDate } from './month-calendar.js';
import { daysInMonth, randomSequence, type Point, type MonthManifest } from './month-calendar.js';
export const ART_SIZE = { width: 500, height: 800 } as const;
export function clipPolygon(poly: readonly Point[], a: number, b: number, c: number): Point[] {
  const out: Point[] = [];
  if (!poly.length) return out;
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i]!,
      q = poly[(i + 1) % poly.length]!,
      d = c - a * p.x - b * p.y,
      e = c - a * q.x - b * q.y;
    const inside = d >= -1e-8,
      next = e >= -1e-8;
    if (inside) out.push(p);
    if (inside !== next) {
      const t = d / (d - e);
      out.push({ x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t });
    }
  }
  return out;
}
export function area(poly: readonly Point[]) {
  return Math.abs(
    poly.reduce((n, p, i) => {
      const q = poly[(i + 1) % poly.length]!;
      return n + p.x * q.y - q.x * p.y;
    }, 0) / 2,
  );
}
export function centroid(poly: readonly Point[]): Point {
  let twice = 0,
    x = 0,
    y = 0;
  poly.forEach((p, i) => {
    const q = poly[(i + 1) % poly.length]!,
      cross = p.x * q.y - q.x * p.y;
    twice += cross;
    x += (p.x + q.x) * cross;
    y += (p.y + q.y) * cross;
  });
  return Math.abs(twice) < 1e-9
    ? (poly[0] ?? { x: 250, y: 400 })
    : { x: x / (3 * twice), y: y / (3 * twice) };
}
export function voronoi(points: readonly Point[]) {
  return points.map((p, i) => {
    let polygon: Point[] = [
      { x: 0, y: 0 },
      { x: 500, y: 0 },
      { x: 500, y: 800 },
      { x: 0, y: 800 },
    ];
    points.forEach((q, j) => {
      if (i !== j)
        polygon = clipPolygon(
          polygon,
          q.x - p.x,
          q.y - p.y,
          (q.x * q.x + q.y * q.y - p.x * p.x - p.y * p.y) / 2,
        );
    });
    return polygon;
  });
}
/** Seeded hard-core dart throwing; deterministic radius relaxation guarantees exactly N sites. */
export function poissonPoints(count: number, seed: string) {
  const random = randomSequence(seed);
  const points: Point[] = [];
  let radius = Math.sqrt(400000 / count) * 0.68,
    attempts = 0;
  while (points.length < count) {
    const p = { x: random() * 500, y: random() * 800 };
    if (points.every((q) => Math.hypot(p.x - q.x, p.y - q.y) >= radius)) points.push(p);
    if (++attempts % 3000 === 0) radius *= 0.92;
    if (attempts > 90000) throw Error('Poisson generator did not converge');
  }
  return points;
}
export function insetPolygon(poly: readonly Point[], distance = 1.5) {
  let result = [...poly];
  poly.forEach((p, i) => {
    const q = poly[(i + 1) % poly.length]!,
      a = q.y - p.y,
      b = p.x - q.x;
    result = clipPolygon(result, a, b, a * p.x + b * p.y - distance * Math.hypot(a, b));
  });
  return result;
}
export function polygonPath(poly: readonly Point[]) {
  return poly.length ? `M${poly.map((p) => `${p.x.toFixed(3)},${p.y.toFixed(3)}`).join('L')}Z` : '';
}
export interface Shard {
  readonly index: number;
  readonly site: Point;
  readonly polygon: readonly Point[];
  readonly inset: readonly Point[];
  readonly path: string;
  readonly edgePath: string;
}
export interface MonthLayout {
  readonly monthKey: string;
  readonly seed: string;
  readonly shards: readonly Shard[];
  readonly revealOrder: readonly number[];
}
export function generateMonthLayout(manifest: MonthManifest): MonthLayout {
  if (
    !Number.isFinite(manifest.focalPoint.x) ||
    !Number.isFinite(manifest.focalPoint.y) ||
    manifest.focalPoint.x < 0 ||
    manifest.focalPoint.x > 1 ||
    manifest.focalPoint.y < 0 ||
    manifest.focalPoint.y > 1
  )
    throw Error('Focal point outside image');
  let points = poissonPoints(
    daysInMonth(manifest.monthKey),
    `${manifest.monthKey}:${manifest.seed}:sites-v1`,
  );
  for (let i = 0; i < 3; i++) points = voronoi(points).map(centroid);
  const polygons = voronoi(points),
    random = randomSequence(`${manifest.monthKey}:${manifest.seed}:order-v1`),
    focal = { x: manifest.focalPoint.x * 500, y: manifest.focalPoint.y * 800 };
  const ranked = points.map((point, index) => ({
    index,
    distance: Math.hypot(point.x - focal.x, point.y - focal.y),
    noise: random(),
  }));
  const near = [...ranked]
    .sort((a, b) => a.distance - b.distance || a.index - b.index)
    .slice(0, Math.ceil(points.length * 0.15));
  const nearIds = new Set(near.map((p) => p.index));
  const closest = near[0]!.index;
  const outer = ranked
    .filter((p) => !nearIds.has(p.index))
    .sort((a, b) => b.distance + b.noise * 170 - (a.distance + a.noise * 170) || a.index - b.index);
  const center = near
    .filter((p) => p.index !== closest)
    .sort((a, b) => b.distance + b.noise * 30 - (a.distance + a.noise * 30) || a.index - b.index);
  const shards = polygons.map((polygon, index) => {
    const inset = insetPolygon(polygon);
    if (inset.length < 3 || area(inset) < 1) throw Error('Degenerate shard');
    return Object.freeze({
      index,
      site: Object.freeze(points[index]!),
      polygon: Object.freeze(polygon.map((p) => Object.freeze(p))),
      inset: Object.freeze(inset.map((p) => Object.freeze(p))),
      path: polygonPath(inset),
      edgePath: polygonPath(polygon),
    });
  });
  return Object.freeze({
    monthKey: manifest.monthKey,
    seed: manifest.seed,
    shards: Object.freeze(shards),
    revealOrder: Object.freeze(
      [...outer, ...center, ...near.filter((p) => p.index === closest)].map((p) => p.index),
    ),
  });
}
const cache = new Map<string, { signature: string; layout: MonthLayout }>();
export function monthLayout(manifest: MonthManifest) {
  const signature = `${manifest.seed}:${manifest.focalPoint.x}:${manifest.focalPoint.y}`,
    old = cache.get(manifest.monthKey);
  if (old?.signature === signature) return old.layout;
  const layout = generateMonthLayout(manifest);
  if (cache.size >= 12 && !cache.has(manifest.monthKey)) cache.delete(cache.keys().next().value!);
  cache.set(manifest.monthKey, { signature, layout });
  return layout;
}
export function shardForDate(layout: MonthLayout, date: string) {
  canonicalDate(date);
  if (date.slice(0, 7) !== layout.monthKey) throw Error('Date outside month');
  const day = Number(date.slice(8));
  if (!Number.isInteger(day) || day < 1 || day > layout.shards.length)
    throw Error('Invalid piece date');
  return layout.revealOrder[day - 1]!;
}
