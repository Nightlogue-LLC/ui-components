import { canonicalDate, getDailySeed } from './home-model.js';
export interface Point {
  readonly x: number;
  readonly y: number;
}
export interface MonthManifest {
  monthKey: string;
  title: string;
  imageUrl: string;
  altText: string;
  focalPoint: Point;
  seed: string;
}
export interface MonthProgress {
  version: 1;
  monthKey: string;
  seed: string;
  restoredDates: readonly string[];
}
export const MONTH_ARTWORK_ENABLED = false;
export const MONTHS: readonly MonthManifest[] = [
  {
    monthKey: '2026-02',
    title: 'The Quiet Grove',
    imageUrl: new URL('./assets/architect.svg', import.meta.url).href,
    altText: 'Placeholder illustration: The Architect with a woodland maze.',
    focalPoint: { x: 0.5, y: 0.53 },
    seed: 'month-v1-2026-02',
  },
  {
    monthKey: '2026-11',
    title: 'The Emberwood',
    imageUrl: new URL('./assets/camper.svg', import.meta.url).href,
    altText: 'Placeholder illustration: The Camper sheltered beneath a tree.',
    focalPoint: { x: 0.5, y: 0.69 },
    seed: 'month-v1-2026-11',
  },
  {
    monthKey: '2026-12',
    title: 'The Long Night',
    imageUrl: new URL('./assets/arbiter.svg', import.meta.url).href,
    altText: 'Placeholder illustration: The Arbiter holding woodland scales.',
    focalPoint: { x: 0.52, y: 0.52 },
    seed: 'month-v1-2026-12',
  },
];
export function monthStart(monthKey: string) {
  if (!/^\d{4}-\d{2}$/.test(monthKey)) throw Error('Expected YYYY-MM');
  return canonicalDate(monthKey + '-01');
}
export function daysInMonth(monthKey: string) {
  const start = monthStart(monthKey),
    next = new Date(start);
  next.setUTCMonth(next.getUTCMonth() + 1);
  return Math.round((next.getTime() - start.getTime()) / 86400000);
}
export function monthDates(monthKey: string) {
  return Array.from(
    { length: daysInMonth(monthKey) },
    (_, i) => `${monthKey}-${String(i + 1).padStart(2, '0')}`,
  );
}
export function localDateKey(date: Date) {
  if (!Number.isFinite(date.getTime())) throw Error('Invalid clock');
  return `${String(date.getFullYear()).padStart(4, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function hashSeed(seed: string) {
  let n = 2166136261;
  for (const char of seed) n = Math.imul(n ^ char.charCodeAt(0), 16777619);
  return n >>> 0;
}
export function randomSequence(seed: string) {
  let n = hashSeed(seed);
  return () => {
    n += 0x6d2b79f5;
    let t = Math.imul(n ^ (n >>> 15), 1 | n);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const MOON_NAMES = [
  'New Moon',
  'Waxing Crescent',
  'First Quarter',
  'Waxing Gibbous',
  'Full Moon',
  'Waning Gibbous',
  'Last Quarter',
  'Waning Crescent',
] as const;
export function approximateMoon(now: Date) {
  const elapsed = (now.getTime() - Date.parse('2000-01-06T18:14:00Z')) / (29.530588853 * 86400000);
  if (!Number.isFinite(elapsed)) throw Error('Invalid moon clock');
  const phase = ((elapsed % 1) + 1) % 1;
  const bucket = Math.floor(phase * 8 + 0.5) % 8;
  return { phase, bucket, name: MOON_NAMES[bucket]! };
}
export function nextLocalMidnight(now: Date) {
  const next = new Date(now);
  next.setHours(24, 0, 0, 0);
  return next;
}
export function countdown(now: Date) {
  const minutes = Math.max(
    0,
    Math.ceil((nextLocalMidnight(now).getTime() - now.getTime()) / 60000),
  );
  return { minutes, hours: Math.floor(minutes / 60), remainder: minutes % 60 };
}
export type ArchiveState = 'restored' | 'available' | 'future' | 'expired';
export function archiveMonth(
  localDate: string,
  restoredDates: readonly string[],
  monthKey: string,
) {
  canonicalDate(localDate);
  const dates = monthDates(monthKey);
  const restored = new Set(
    restoredDates.map((date) => {
      canonicalDate(date);
      return date;
    }),
  );
  const next = monthStart(monthKey);
  next.setUTCMonth(next.getUTCMonth() + 1);
  const grace = new Date(next);
  grace.setUTCDate(grace.getUTCDate() + 2);
  const graceLast = grace.toISOString().slice(0, 10);
  return dates.map((date) => {
    const isRestored = restored.has(date),
      unlocked = date <= localDate,
      withinGrace = localDate <= graceLast;
    return {
      date,
      restored: isRestored,
      canPlay: unlocked && withinGrace,
      canRestore: !isRestored && unlocked && withinGrace,
      state: isRestored ? 'restored' : !unlocked ? 'future' : withinGrace ? 'available' : 'expired',
    };
  });
}
export function dailyContract(now: Date, manifest: MonthManifest) {
  const date = localDateKey(now);
  if (date.slice(0, 7) !== manifest.monthKey) throw Error('Daily clock must match manifest month');
  return {
    date,
    seed: getDailySeed(date),
    monthKey: manifest.monthKey,
    title: manifest.title,
    piece: Number(date.slice(8)),
    total: daysInMonth(manifest.monthKey),
    puzzle: null,
  };
}
export function storageStub(initial: readonly MonthProgress[] = []) {
  const data = initial.map((row) => ({ ...row, restoredDates: [...row.restoredDates] }));
  return {
    read: (monthKey: string) => data.find((row) => row.monthKey === monthKey),
    write: (progress: MonthProgress) => {
      void progress;
    },
  };
}
