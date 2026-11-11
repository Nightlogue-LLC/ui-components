import { updateBottomNav } from '../../../src/components/bottom-nav/index.js';
import { createButton } from '../../../src/components/button/index.js';
import { createMonthCard, type MonthCardOptions } from './month-card.js';
import { createMonthCollection } from './month-collection.js';
import { MONTHS, monthDates } from './month-model.js';
import { homeHost } from './home.js';
import { createHomeNav } from './home-parts.js';
import { el } from '../../lib/dom.js';
export function createMonthlyTrophy(options: MonthCardOptions) {
  const root = homeHost('gg-v4-support-screen gg-v4-month-trophy');
  const heading = el('h1', { text: 'Monthly artwork' });
  const content = el('div');
  let archive = false;
  const toggle = createButton({
    label: 'Past months',
    variant: 'secondary',
    onClick: () => {
      archive = !archive;
      toggle.querySelector('.nl-button__label')!.textContent = archive
        ? 'Current month'
        : 'Past months';
      paint();
    },
  });
  function paint() {
    content.replaceChildren(
      archive
        ? createMonthCollection({
            manifests: MONTHS.filter((month) => month.monthKey < options.manifest.monthKey),
            progress: MONTHS.map((month) => ({
              version: 1,
              monthKey: month.monthKey,
              seed: month.seed,
              restoredDates: monthDates(month.monthKey).filter((_, i) => i % 3 === 0),
            })),
            onOpen: (manifest) =>
              content.replaceChildren(
                createMonthCard({
                  ...options,
                  manifest,
                  restoredDates: monthDates(manifest.monthKey).filter((_, i) => i % 3 === 0),
                  restoreDate: undefined,
                }),
              ),
          })
        : createMonthCard(options),
    );
  }
  const nav = createHomeNav();
  updateBottomNav(nav, 'achievements');
  root.append(heading, toggle, content, nav);
  paint();
  return root;
}
