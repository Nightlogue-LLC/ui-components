import { canonicalDate } from '../../../src/projects/grim-glimmer/month-calendar.js';
export { canonicalDate } from '../../../src/projects/grim-glimmer/month-calendar.js';
/** UI-only daily contract. Calendar/timezone selection belongs to the future host. */
export const DAILY_DRAW_ENABLED = false;
export type DailyState = 'hidden' | 'unplayed' | 'in-progress' | 'solved';
export interface DailyPlaceholder {
  date: string;
  seed: string;
  puzzle: null;
  status: 'placeholder';
}
export function getDailySeed(date: string): string {
  canonicalDate(date);
  let hash = 2166136261;
  for (const char of `grim-glimmer:daily:v1:${date}`)
    hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return `gg-daily-v1-${(hash >>> 0).toString(16).padStart(8, '0')}`;
}
export function dailyPlaceholder(date: string): DailyPlaceholder {
  return { date, seed: getDailySeed(date), puzzle: null, status: 'placeholder' };
}
/** Decorative eight-phase approximation, not an astronomical ephemeris. */
export function moonPhase(date: string) {
  const days = (canonicalDate(date).getTime() - Date.UTC(2000, 0, 6)) / 86400000;
  return ((Math.round((days / 29.53059) * 8) % 8) + 8) % 8;
}
export const HOME_TIMING = {
  logo: 400,
  dailyDelay: 200,
  cardDelay: 250,
  cardStagger: 70,
  cardDuration: 210,
  sheenDelay: 700,
  sheen: 900,
  reduced: 150,
} as const;

/** Arithmetic review budget at the default 16px root font, zero UA margin. Not a browser measurement. */
export function homeBudget(
  width: number,
  height: number,
  options: { daily?: boolean; status?: boolean; safeTop?: number; safeBottom?: number } = {},
) {
  const gap = height <= 740 ? 8 : 16,
    daily = options.daily !== false,
    status = options.status !== false;
  const blocks = 3 + Number(daily) + Number(status),
    nav = 53 + Math.max(4, options.safeBottom ?? 0);
  const fixed =
    Math.max(16, options.safeTop ?? 0) +
    96 +
    nav +
    (blocks - 1) * gap +
    (status ? 18 : 0) +
    (daily ? (height <= 740 ? 56 : 64) : 0) +
    60;
  const cardHeight = Math.min(420, Math.max(0, height - fixed)),
    cardWidth = Math.min(264, (cardHeight * 5) / 8);
  return {
    cardHeight,
    cardWidth,
    sidePeek: (width - cardWidth) / 2 - (width <= 375 ? 20 : 28),
    fixed,
    logo: 96,
  };
}
