import { createCard } from '../../components/card/index.js';
function el(tag: string, options: { text: string }) {
  const node = document.createElement(tag);
  node.textContent = options.text;
  return node;
}
function homeHost(name: string) {
  const node = document.createElement('section');
  node.className = `nl-grim-glimmer-v4 gg-v4-scope ${name}`;
  return node;
}
import { createMonthArt } from './month-art.js';
import { type MonthManifest, type MonthProgress } from './month-calendar.js';

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
      interactive: options.onOpen !== undefined,
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
