import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createMonthArt,
  createMonthCollection,
  type MonthManifest,
} from '../src/projects/grim-glimmer/index.js';
const manifest: MonthManifest = {
  monthKey: '2026-11',
  title: 'Supplied artwork',
  imageUrl: '/real-art.webp',
  altText: 'Supplied description',
  focalPoint: { x: 0.5, y: 0.5 },
  seed: 'owner-seed',
};
afterEach(() => document.body.replaceChildren());
describe('supported monthly artwork', () => {
  it('uses supplied artwork and counts unique valid restored pieces', () => {
    const art = createMonthArt(manifest, ['2026-11-01', '2026-11-01', '2026-12-01']);
    expect(art.count()).toBe(1);
    expect(art.element.querySelector('image')?.getAttribute('href')).toBe('/real-art.webp');
    expect(art.element.getAttribute('aria-label')).toBe('1 of 30 pieces restored');
    expect(() => art.prepare('2026-12-01')).toThrow();
    art.update([]);
    expect(art.count()).toBe(0);
  });
  it('renders an honest empty archive without navigation', () => {
    const root = createMonthCollection({ manifests: [manifest], progress: [] });
    expect(root.textContent).toBe('No pieces restored yet');
    expect(root.querySelector('button')).toBeNull();
  });
  it('makes opening optional and forwards only the supplied manifest', () => {
    const progress = [
      {
        version: 1 as const,
        monthKey: manifest.monthKey,
        seed: manifest.seed,
        restoredDates: ['2026-11-01'],
      },
    ];
    expect(
      createMonthCollection({ manifests: [manifest], progress }).querySelector('button'),
    ).toBeNull();
    const onOpen = vi.fn();
    const root = createMonthCollection({ manifests: [manifest], progress, onOpen });
    document.body.append(root);
    root.querySelector<HTMLButtonElement>('button')!.click();
    expect(onOpen).toHaveBeenCalledExactlyOnceWith(manifest);
  });
});
