import { createCard } from '../../../src/components/card/index.js';
import { el } from '../../lib/dom.js';
import { homeHost } from './home.js';
import { createMonthArt } from './month-art.js';
import { type MonthManifest, type MonthProgress } from './month-model.js';
import './monthly.css';
export function createMonthCollection(options: {
  manifests: readonly MonthManifest[];
  progress: readonly MonthProgress[];
  onOpen?: (month: MonthManifest) => void;
}) {
  if (!options.progress.some((entry) => entry.restoredDates.length)) {
    const empty = homeHost('gg-v4-month-empty');
    empty.append(el('p', { text: 'No pieces restored yet' }));
    return empty;
  }
  const root = homeHost('gg-v4-month-collection');
  root.setAttribute('aria-label', 'Past monthly artworks');
  options.manifests.forEach((manifest) => {
    const restored =
      options.progress.find((entry) => entry.monthKey === manifest.monthKey)?.restoredDates ?? [];
    const art = createMonthArt(manifest, restored);
    const card = createCard({
      interactive: true,
      label: `${manifest.title}. ${art.count()} of ${art.layout.shards.length} pieces restored.`,
      onClick: () => options.onOpen?.(manifest),
    });
    card.classList.add('gg-v4-month-thumb');
    art.element.setAttribute('aria-hidden', 'true');
    card.append(
      art.element,
      el('span', { text: manifest.title }),
      el('span', { text: `${art.count()} of ${art.layout.shards.length} pieces restored` }),
    );
    root.append(card);
  });
  return root;
}
