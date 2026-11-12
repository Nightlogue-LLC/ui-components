import { createSuccessSheet, type SuccessSheetOptions } from './success-sheet.js';
import { createButton } from '../../components/button/index.js';
import { closeDialog, getDialogBody } from '../../components/dialog/index.js';

export interface CompletionStatistic {
  label: string;
  value: string | number;
}
export interface CompletionSheetOptions extends SuccessSheetOptions {
  /** Only supplied, real values are rendered. No sample statistics are generated. */
  statistics?: readonly CompletionStatistic[];
  extraAction?: { label: string; onSelect: () => void };
}

/** Accepted editorial completion composition, retaining the shared Dialog lifecycle. */
export function createCompletionSheet(options: CompletionSheetOptions): HTMLDialogElement {
  let extra = false;
  const sheet = createSuccessSheet({
    ...options,
    labels: { close: 'Close completion', ...options.labels },
    onNewGame: () => {
      extra = false;
      options.onNewGame();
    },
    onReturnHome: () => {
      extra = false;
      options.onReturnHome();
    },
    onClose: () => {
      const selected = extra;
      extra = false;
      if (selected) options.extraAction?.onSelect();
      else options.onClose();
    },
  });
  sheet.classList.add('gg-v4-victory-sheet');
  sheet.querySelector('.nl-bottom-sheet__handle')?.remove();
  sheet.querySelector('.nl-grim-glimmer-success-sheet__star')?.remove();
  const body = getDialogBody(sheet);
  const rule = document.createElement('div');
  rule.className = 'gg-v4-victory-rule';
  rule.setAttribute('aria-hidden', 'true');
  const star = document.createElement('span');
  star.textContent = '✦';
  rule.append(star);
  body.prepend(rule);
  if (options.statistics?.length) {
    const stats = document.createElement('p');
    stats.className = 'gg-v4-victory-stats';
    stats.setAttribute(
      'aria-label',
      options.statistics.map(({ label, value }) => `${label} ${value}`).join(', '),
    );
    options.statistics.forEach(({ label, value }, index) => {
      if (index) {
        const dot = document.createElement('span');
        dot.className = 'gg-v4-stat-separator';
        dot.textContent = '·';
        dot.setAttribute('aria-hidden', 'true');
        stats.append(dot);
      }
      const stat = document.createElement('span');
      stat.className = 'gg-v4-stat';
      stat.textContent = `${label} ${value}`;
      stat.setAttribute('aria-hidden', 'true');
      stats.append(stat);
    });
    rule.after(stats);
  }
  if (options.extraAction)
    body.append(
      createButton({
        label: options.extraAction.label,
        variant: 'ghost',
        size: 'sm',
        onClick: () => {
          extra = true;
          closeDialog(sheet);
        },
      }),
    );
  return sheet;
}
