import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createMonthCard,
  type MonthProgress,
  type MonthManifest,
} from '../src/projects/grim-glimmer/index.js';
const manifest: MonthManifest = {
  monthKey: '2026-11',
  title: 'Caller supplied',
  imageUrl: '/month.webp',
  altText: 'Artwork',
  focalPoint: { x: 0.5, y: 0.5 },
  seed: 'real-seed',
};
afterEach(() => document.body.replaceChildren());
describe('supported monthly card boundary', () => {
  it('keeps replay hidden by default and unavailable dates readable without navigation', () => {
    const root = createMonthCard({
      manifest,
      localDate: '2026-11-01',
      restoreDate: '2026-11-01',
      showGrid: true,
      reducedMotion: true,
    });
    document.body.append(root);
    const replay = [...root.querySelectorAll('button')].find(
      (n) => n.textContent === 'Replay restoration',
    )!;
    expect(replay.hidden).toBe(true);
    const days = root.querySelectorAll<HTMLButtonElement>('[role="gridcell"] button');
    expect(days).toHaveLength(30);
    expect(days[0]!.getAttribute('aria-disabled')).toBe('true');
    days[0]!.focus();
    days[0]!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }),
    );
    expect(document.activeElement).toBe(days[6]);
  });
  it('restores only once through the explicit method and suppresses work after teardown', async () => {
    const onStorage = vi.fn<(progress: MonthProgress) => void>();
    const root = createMonthCard({
      manifest,
      localDate: '2026-11-01',
      restoreDate: '2026-11-01',
      reducedMotion: true,
      onStorage,
    });
    document.body.append(root);
    await root.restore?.();
    await root.restore?.();
    expect(onStorage).toHaveBeenCalledOnce();
    expect(onStorage.mock.calls[0]![0].restoredDates).toEqual(['2026-11-01']);
    root.remove();
    await root.restore?.();
    expect(onStorage).toHaveBeenCalledOnce();
  });
});
