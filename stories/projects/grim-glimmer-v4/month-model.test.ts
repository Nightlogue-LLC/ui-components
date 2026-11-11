import { describe, it, expect } from 'vitest';
import {
  MONTHS,
  MOON_NAMES,
  approximateMoon,
  archiveMonth,
  countdown,
  dailyContract,
  daysInMonth,
  localDateKey,
  monthDates,
  nextLocalMidnight,
  storageStub,
} from './month-model.js';
import { area, generateMonthLayout, monthLayout, shardForDate } from './month-geometry.js';
import { deckBudget } from './deck-model.js';
const base = MONTHS[1]!;
describe('monthly calendar and archive contract', () => {
  it.each([
    ['2026-02', 28],
    ['2028-02', 29],
    ['2026-11', 30],
    ['2026-12', 31],
  ] as const)('uses the real length of %s', (key, days) => {
    expect(daysInMonth(key)).toBe(days);
    expect(monthDates(key)).toHaveLength(days);
    expect(monthDates(key).at(-1)).toBe(`${key}-${days}`);
  });
  it('keys puzzle selection to the local date, independent of time that day', () => {
    const a = dailyContract(new Date(2026, 10, 10, 0, 0), base),
      b = dailyContract(new Date(2026, 10, 10, 23, 59), base);
    expect(a).toEqual(b);
    expect(a).toMatchObject({
      date: '2026-11-10',
      title: 'The Emberwood',
      piece: 10,
      total: 30,
      puzzle: null,
    });
    expect(dailyContract(new Date(2026, 10, 11), base).seed).not.toBe(a.seed);
    expect(() => dailyContract(new Date(2026, 11, 1), base)).toThrow();
  });
  it('unlocks only past/current days, keeps restored replays, then expires after three grace days', () => {
    const archive = archiveMonth('2026-11-10', ['2026-11-03'], '2026-11');
    expect(archive[2]).toMatchObject({ state: 'restored', canPlay: true, canRestore: false });
    expect(archive[9]).toMatchObject({ state: 'available', canRestore: true });
    expect(archive[10]).toMatchObject({ state: 'future', canPlay: false });
    for (const date of ['2026-12-01', '2026-12-02', '2026-12-03'])
      expect(archiveMonth(date, [], '2026-11').every((day) => day.canRestore)).toBe(true);
    expect(archiveMonth('2026-12-04', ['2026-11-01'], '2026-11')[0]).toMatchObject({
      state: 'restored',
      canPlay: false,
    });
    expect(archiveMonth('2026-12-04', [], '2026-11').every((day) => day.state === 'expired')).toBe(
      true,
    );
    expect(archiveMonth('2028-03-03', [], '2028-02')[28]?.canRestore).toBe(true);
    expect(archiveMonth('2028-03-04', [], '2028-02')[28]?.canRestore).toBe(false);
  });
  it('rejects malformed calendar values instead of rolling them into another month', () => {
    expect(() => daysInMonth('2026-13')).toThrow();
    expect(() => archiveMonth('2026-02-30', [], '2026-02')).toThrow();
    expect(() => archiveMonth('2026-02-01', ['yesterday'], '2026-02')).toThrow();
    expect(() => localDateKey(new Date('invalid'))).toThrow();
  });
  it('uses calendar midnight and rounds the countdown up to the next minute', () => {
    const now = new Date(2026, 10, 10, 16, 18);
    expect(localDateKey(nextLocalMidnight(now))).toBe('2026-11-11');
    expect(countdown(now)).toEqual({ minutes: 462, hours: 7, remainder: 42 });
    expect(countdown(new Date(2026, 10, 10, 23, 59, 59)).minutes).toBe(1);
  });
  it('uses local calendar midnights across spring and autumn clock changes', () => {
    for (const [month, day] of [
      [2, 14],
      [10, 7],
    ]) {
      const start = new Date(2027, month!, day, 0, 0);
      const next = nextLocalMidnight(start);
      expect(next.getDate()).toBe(day! + 1);
      expect(next.getHours()).toBe(0);
      expect(countdown(start).minutes).toBe((next.getTime() - start.getTime()) / 60000);
    }
  });
  it('uses the supplied lunar epoch and all eight nearest named buckets', () => {
    const epoch = Date.parse('2000-01-06T18:14:00Z'),
      cycle = 29.530588853 * 86400000;
    MOON_NAMES.forEach((name, i) =>
      expect(approximateMoon(new Date(epoch + (cycle * i) / 8)).name).toBe(name),
    );
    expect(approximateMoon(new Date(epoch - cycle / 8)).name).toBe('Waning Crescent');
    expect(() => approximateMoon(new Date('invalid'))).toThrow();
  });
  it('leaves storage as an explicit no-op preview adapter', () => {
    const storage = storageStub();
    storage.write({
      version: 1,
      monthKey: base.monthKey,
      seed: base.seed,
      restoredDates: ['2026-11-01'],
    });
    expect(storage.read(base.monthKey)).toBeUndefined();
  });
  it('reserves 88px plus the 10px pop-out in the Home budget', () => {
    expect(deckBudget(393, 852, { dailyHeight: 98 })).toMatchObject({ width: 280, height: 420 });
    expect(deckBudget(360, 780, { dailyHeight: 98 }).height).toBe(365);
    expect(deckBudget(360, 780, { dailyHeight: 98 }).width).toBeCloseTo(243.333);
  });
});
describe('deterministic clipped monthly Voronoi', () => {
  it.each(['2026-02', '2028-02', '2026-11', '2026-12'])(
    'partitions the whole 5:8 art for %s with nonempty inset pieces',
    (monthKey) => {
      const manifest = { ...base, monthKey },
        layout = generateMonthLayout(manifest);
      expect(layout.shards).toHaveLength(daysInMonth(monthKey));
      expect(layout.shards.reduce((sum, shard) => sum + area(shard.polygon), 0)).toBeCloseTo(
        400000,
        5,
      );
      expect([...layout.revealOrder].sort((a, b) => a - b)).toEqual(
        layout.shards.map((shard) => shard.index),
      );
      for (const shard of layout.shards) {
        expect(area(shard.inset)).toBeGreaterThan(1);
        expect(area(shard.inset)).toBeLessThan(area(shard.polygon));
        expect(shard.path).toMatch(/^M.*Z$/);
        for (const p of shard.polygon) {
          expect(p.x).toBeGreaterThanOrEqual(-1e-7);
          expect(p.x).toBeLessThanOrEqual(500 + 1e-7);
          expect(p.y).toBeGreaterThanOrEqual(-1e-7);
          expect(p.y).toBeLessThanOrEqual(800 + 1e-7);
          const own = Math.hypot(p.x - shard.site.x, p.y - shard.site.y);
          for (const other of layout.shards)
            expect(own).toBeLessThanOrEqual(
              Math.hypot(p.x - other.site.x, p.y - other.site.y) + 1e-6,
            );
        }
      }
      expect(generateMonthLayout(manifest)).toEqual(layout);
    },
  );
  it('caches immutable geometry, changes the seed, and reserves the nearest focal piece for last', () => {
    const layout = monthLayout(base);
    expect(monthLayout(base)).toBe(layout);
    expect(Object.isFrozen(layout.shards[0]!.polygon)).toBe(true);
    expect(generateMonthLayout({ ...base, seed: 'another' })).not.toEqual(layout);
    const ranked = [...layout.shards].sort(
      (a, b) =>
        Math.hypot(a.site.x - 250, a.site.y - 552) - Math.hypot(b.site.x - 250, b.site.y - 552),
    );
    expect(layout.revealOrder.at(-1)).toBe(ranked[0]!.index);
    const near = new Set(
      ranked.slice(0, Math.ceil(ranked.length * 0.15)).map((shard) => shard.index),
    );
    expect(layout.revealOrder.slice(-near.size).every((index) => near.has(index))).toBe(true);
    expect(shardForDate(layout, '2026-11-10')).toBe(layout.revealOrder[9]);
    expect(() => shardForDate(layout, '2026-11-1')).toThrow();
    expect(() => shardForDate(layout, '2026-12-01')).toThrow();
  });
  it('rejects invalid focal points and stays stable across a broader seed sample', () => {
    expect(() => generateMonthLayout({ ...base, focalPoint: { x: 2, y: 0 } })).toThrow();
    for (let i = 0; i < 40; i++) {
      const layout = generateMonthLayout({
        ...base,
        seed: String(i),
        monthKey: i % 2 ? '2028-02' : '2026-12',
      });
      expect(layout.shards.reduce((sum, shard) => sum + area(shard.polygon), 0)).toBeCloseTo(
        400000,
        5,
      );
    }
  });
});
