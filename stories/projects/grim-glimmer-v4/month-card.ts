import { createButton } from '../../../src/components/button/index.js';
import {
  getDialogBody,
  getDialogActions,
  openDialog,
} from '../../../src/components/dialog/index.js';
import { createProposalSheet } from './overlay-primitives.js';
import { homeHost } from './home.js';
import { createMonthArt } from './month-art.js';
import { archiveMonth, monthDates, type MonthManifest, type MonthProgress } from './month-model.js';
import { ritualMotion } from './ritual-motion.js';
import { el } from '../../lib/dom.js';
import './monthly.css';
export interface MonthCardOptions {
  manifest: MonthManifest;
  localDate: string;
  restoredDates?: readonly string[];
  restoreDate?: string;
  showGrid?: boolean;
  reducedMotion?: boolean;
  haptics?: boolean;
  light?: () => void;
  medium?: () => void;
  success?: () => void;
  onPlayDate?: (date: string) => void;
  onStorage?: (progress: MonthProgress) => void;
  onSave?: () => void;
  onShare?: () => void;
}
export function createMonthCard(options: MonthCardOptions) {
  const root = homeHost('gg-v4-month-card'),
    allDates = monthDates(options.manifest.monthKey);
  const initial = [...new Set(options.restoredDates ?? [])].filter((date) =>
    allDates.includes(date),
  );
  let restored = [...initial],
    busy = false,
    disposed = false,
    sheet: ReturnType<typeof createProposalSheet> | undefined;
  const art = createMonthArt(options.manifest, restored, options.restoreDate),
    live = el('span', { className: 'nl-grim-glimmer-visually-hidden' });
  live.setAttribute('role', 'status');
  live.setAttribute('aria-live', 'polite');
  live.setAttribute('aria-atomic', 'true');
  const caption = el('p', { className: 'gg-v4-month-count' }),
    sheen = el('span', { className: 'gg-v4-month-sheen' }),
    frame = el('div', { className: 'gg-v4-month-picture' }, [art.element, sheen]);
  sheen.setAttribute('aria-hidden', 'true');
  const motion = ritualMotion(options.reducedMotion, () => {
    busy = false;
    art.update(restored);
    replay.disabled = false;
  });
  const tick = (kind: 'light' | 'medium' | 'success') => {
    if (options.haptics) options[kind]?.();
  };
  const grid = el('div', { className: 'gg-v4-shard-grid' });
  grid.setAttribute('role', 'grid');
  grid.setAttribute('aria-label', 'Monthly pieces by calendar day');
  grid.hidden = !options.showGrid;
  const cells: HTMLButtonElement[] = [];
  const pip: HTMLElement[] = [];
  allDates.forEach((date, index) => {
    if (index % 6 === 0) {
      const row = el('div');
      row.setAttribute('role', 'row');
      grid.append(row);
    }
    const cell = el('div');
    cell.setAttribute('role', 'gridcell');
    const button = createButton({
      label: String(index + 1),
      variant: 'ghost',
      onClick: () => {
        const state = archiveMonth(options.localDate, restored, options.manifest.monthKey)[index]!;
        if (state.canPlay) options.onPlayDate?.(date);
      },
    });
    button.tabIndex = index === 0 ? 0 : -1;
    const dot = el('span', { className: 'gg-v4-shard-pip' });
    dot.setAttribute('aria-hidden', 'true');
    button.append(dot);
    pip.push(dot);
    button.addEventListener('keydown', (event) => {
      const target =
        event.key === 'ArrowRight'
          ? index + 1
          : event.key === 'ArrowLeft'
            ? index - 1
            : event.key === 'ArrowDown'
              ? index + 6
              : event.key === 'ArrowUp'
                ? index - 6
                : event.key === 'Home'
                  ? 0
                  : event.key === 'End'
                    ? allDates.length - 1
                    : -1;
      if (target < 0 || target >= cells.length) return;
      event.preventDefault();
      cells.forEach((node, i) => (node.tabIndex = i === target ? 0 : -1));
      cells[target]!.focus();
    });
    cells.push(button);
    cell.append(button);
    grid.lastElementChild!.append(cell);
  });
  function paint() {
    art.update(restored);
    caption.textContent = `${restored.length} of ${allDates.length} pieces restored`;
    archiveMonth(options.localDate, restored, options.manifest.monthKey).forEach((state, index) => {
      const button = cells[index]!;
      button.setAttribute(
        'aria-label',
        `Day ${index + 1}, ${state.state}, ${state.canPlay ? 'playable' : 'not playable'}`,
      );
      button.setAttribute('aria-disabled', String(!state.canPlay));
      pip[index]!.textContent = state.restored ? '●' : '○';
    });
  }
  const toggle = createButton({
    label: 'Show piece grid',
    variant: 'secondary',
    onClick: () => {
      grid.hidden = !grid.hidden;
      toggle.setAttribute('aria-expanded', String(!grid.hidden));
    },
  });
  toggle.setAttribute('aria-expanded', String(!grid.hidden));
  async function complete() {
    if (disposed) return;
    if (!motion.reduced()) {
      void motion.run(
        art.leads as unknown as HTMLElement,
        [{ opacity: 0.35 }, { opacity: 1 }, { opacity: 0.35 }],
        900,
      );
      const pulsed = await motion.run(
        art.pulse as unknown as HTMLElement,
        [
          { opacity: 0, transform: 'translateX(-500px)' },
          { opacity: 0.24, transform: 'translateX(0)' },
          { opacity: 0, transform: 'translateX(500px)' },
        ],
        900,
      );
      if (!pulsed || disposed || document.hidden) return;
      void motion.run(
        sheen,
        [
          { transform: 'translateX(-100%)', opacity: 0 },
          { transform: 'translateX(0)', opacity: 0.5 },
          { transform: 'translateX(100%)', opacity: 0 },
        ],
        350,
      );
      const tilted = await motion.run(
        frame,
        [
          { transform: 'perspective(800px) rotateX(0deg)' },
          { transform: 'perspective(800px) rotateX(-4deg)' },
          { transform: 'perspective(800px) rotateX(0deg)' },
        ],
        350,
      );
      if (!tilted) return;
    }
    if (disposed || document.hidden) return;
    tick('success');
    const currentSheet = createProposalSheet({
      title: 'Month complete',
      animations: !motion.reduced(),
      onClose: () => {
        currentSheet.destroy();
        currentSheet.dialog.remove();
        if (sheet === currentSheet) sheet = undefined;
      },
    });
    sheet = currentSheet;
    getDialogBody(sheet.dialog).append(
      el('p', { text: options.manifest.title }),
      el('p', {
        text: `${allDates.length} of ${allDates.length} pieces restored. Save and Share are preview actions.`,
      }),
    );
    getDialogActions(sheet.dialog).append(
      createButton({ label: 'Save', variant: 'secondary', onClick: options.onSave }),
      createButton({ label: 'Share', onClick: options.onShare }),
    );
    root.append(sheet.dialog);
    openDialog(sheet.dialog);
  }
  async function restore() {
    const date = options.restoreDate;
    if (
      !date ||
      busy ||
      disposed ||
      restored.includes(date) ||
      !archiveMonth(options.localDate, restored, options.manifest.monthKey).find(
        (row) => row.date === date,
      )?.canRestore
    )
      return;
    busy = true;
    replay.disabled = true;
    tick('light');
    const path = art.prepare(date);
    const pending = [...restored, date];
    art.update(pending);
    path.style.opacity = '1';
    if (!motion.reduced())
      void motion.run(
        art.flash as unknown as HTMLElement,
        [{ opacity: 0.9 }, { opacity: 0.3 }, { opacity: 0 }],
        700,
      );
    const finished = await motion.run(
      path as unknown as HTMLElement,
      [{ opacity: 0 }, { opacity: 1 }],
      motion.reduced() ? 150 : 700,
    );
    if (!finished || disposed) {
      busy = false;
      replay.disabled = false;
      art.update(restored);
      return;
    }
    restored = pending;
    paint();
    tick('medium');
    live.textContent = `Piece ${Number(date.slice(8))} restored. ${restored.length} of ${allDates.length} pieces restored.`;
    options.onStorage?.({
      version: 1,
      monthKey: options.manifest.monthKey,
      seed: options.manifest.seed,
      restoredDates: [...restored],
    });
    if (restored.length === allDates.length) await complete();
    busy = false;
    replay.disabled = false;
  }
  const replay = createButton({
    label: 'Replay restoration',
    variant: 'secondary',
    onClick: () => {
      if (busy) return;
      motion.cancel();
      sheet?.destroy();
      sheet?.dialog.remove();
      sheet = undefined;
      restored = [...initial].filter((date) => date !== options.restoreDate);
      paint();
      void restore();
    },
  });
  replay.hidden = !options.restoreDate;
  root.append(
    el('h2', { text: options.manifest.title }),
    frame,
    caption,
    toggle,
    grid,
    replay,
    live,
  );
  paint();
  root.start = () => {
    disposed = false;
    motion.mount();
  };
  root.cleanup = () => {
    disposed = true;
    motion.dispose();
    sheet?.destroy();
    sheet?.dialog.remove();
  };
  return root;
}
