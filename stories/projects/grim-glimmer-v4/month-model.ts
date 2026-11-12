import { getDailySeed } from './home-model.js';
import {
  localDateKey,
  daysInMonth,
  type MonthManifest,
  type MonthProgress,
} from '../../../src/projects/grim-glimmer/month-calendar.js';
export * from '../../../src/projects/grim-glimmer/month-calendar.js';
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
