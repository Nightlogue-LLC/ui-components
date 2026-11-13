import { createButton } from '../../../src/components/button/index.js';
import { createGameplayMenuHeader } from '../../../src/projects/grim-glimmer/gameplay-menu-header.js';
import { createGameMenuSheet } from '../../../src/projects/grim-glimmer/menu-sheet.js';
import { openDialog, closeDialog } from '../../../src/components/dialog/index.js';
import {
  createGameMenuContent,
  type GameMenuSelection,
  type GameMenuAvailability,
} from '../../../src/projects/grim-glimmer/game-menu-content.js';
import { createV4Board } from '../grim-glimmer-v4/board.js';
import { createControlRow } from '../grim-glimmer-v4/controls.js';
import { overlayHost, type SheetProposal } from '../grim-glimmer-v4/overlay-primitives.js';
import { DEFAULT_PREFERENCES, type OverlayOptions } from '../grim-glimmer-v4/settings-proposal.js';
import { createHowTo } from '../grim-glimmer-v4/howto-proposal.js';
import { el } from '../../lib/dom.js';
export interface FlowOptions extends OverlayOptions {
  difficulty?: 'easy' | 'medium' | 'hard';
  size?: GameMenuSelection['size'];
  availability?: GameMenuAvailability['status'];
  surpriseAvailability?: GameMenuAvailability['status'];
  initiallyOpen?: boolean;
  gameSettingsUnavailable?: boolean;
  onSurprise?: () => void;
  initialLesson?: number;
  longContent?: boolean;
  onNewGame?: (selection: GameMenuSelection) => void;
  onTutorial?: (outcome: string) => void;
}
export function createOverlayPreview(
  options: FlowOptions = {},
  entry: 'menu' | 'difficulty' | 'howto' = 'menu',
) {
  const root = overlayHost();
  root.classList.add('gg-v4-game-overlay-preview');
  root.dataset.reducedMotion = String(options.reducedMotion ?? false);
  let disposed = false;
  const state = { ...DEFAULT_PREFERENCES, ...options.state };
  let committed: GameMenuSelection = {
    size: options.size ?? 6,
    difficulty: options.difficulty ?? 'easy',
  };
  const reduced = () =>
    options.reducedMotion === true ||
    !state.animations ||
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
  const tick = () => {
    if (state.haptics) options.tick?.();
  };
  const status = el('p', {
    className: 'gg-v4-overlay-note',
    text: 'Overlay preview · local state only',
  });
  status.setAttribute('role', 'status');
  const { element: header, menuTrigger: trigger } = createGameplayMenuHeader({
    title: 'Stars & Spires',
    onBack: () => navigate(() => options.onNavigate?.('home')),
  });
  const board = el('div', {}, [
    createV4Board({ size: 6, interactive: false, conflict: false, hint: false }),
  ]);
  board.dataset.slot = 'board';
  const controls = createControlRow({ disabled: true });
  controls.dataset.slot = 'controls';
  const pending = new Set<() => void>();
  function manage(make: (done: () => void) => SheetProposal) {
    let finished = false;
    const done = () => {
      if (finished) return;
      finished = true;
      part.destroy();
      pending.delete(done);
      part.dialog.remove();
    };
    const part = make(done);
    pending.add(done);
    root.append(part.dialog);
    openDialog(part.dialog);
  }
  function tutorial(after?: () => void) {
    if (disposed) return;
    manage((done) => {
      const part = createHowTo({
        reducedMotion: reduced(),
        initialLesson: options.initialLesson,
        onDone: (outcome) => {
          done();
          if (!disposed) {
            options.onTutorial?.(outcome);
            after?.();
          }
        },
      });
      return {
        dialog: part.dialog,
        destroy: () => {
          part.destroy();
          closeDialog(part.dialog);
          part.dialog.getAnimations?.().forEach((animation) => animation.cancel());
        },
      };
    });
  }
  const content = createGameMenuContent({
    selection: committed,
    getAvailability: () => ({ status: options.availability ?? 'ready' }),
    animations: () => !reduced(),
    getSurpriseAvailability: () => ({
      status: options.surpriseAvailability ?? options.availability ?? 'ready',
    }),
    onSurprise: () =>
      navigate(() => {
        options.onSurprise?.();
        status.textContent = 'Surprise Me requested · random size and difficulty';
      }),
    onSelectionChange: () => tick(),
    onStart: (selection) => {
      committed = selection;
      content.reset(committed);
      navigate(() => {
        options.onNewGame?.(selection);
        status.textContent = `New game requested: ${selection.size} · ${selection.difficulty}`;
      });
    },
    onHowToPlay: () => navigate(() => tutorial()),
    onGameSettings: options.gameSettingsUnavailable
      ? undefined
      : () =>
          navigate(() => {
            status.textContent =
              'Game Settings requested · app supplies supported puzzle-specific settings';
            options.onNavigate?.('game-settings');
          }),
    gameSettingsUnavailableMessage: options.gameSettingsUnavailable
      ? 'Not available yet'
      : undefined,
  });
  if (options.longContent) {
    for (let i = 0; i < 8; i++)
      content.element.append(
        el('p', {
          text: 'Story-only tall-content fixture. Puzzle-specific options are supplied by the application.',
        }),
      );
  }
  const menu = createGameMenuSheet({
    trigger,
    content: content.element,
    history: false,
    presentation: 'popover',
    animations: () => !reduced(),
  });
  menu.element.classList.add('gg-v4-popover');
  function navigate(action: () => void) {
    tick();
    menu.close(() => {
      if (!disposed) action();
    });
  }
  const opener = createButton({
    label:
      entry === 'difficulty'
        ? 'Open New Game menu'
        : entry === 'howto'
          ? 'Open guided tutorial'
          : 'Open game menu',
    variant: 'secondary',
    onClick: () => {
      opener.focus({ preventScroll: true });
      if (entry === 'howto') tutorial();
      else menu.open();
    },
  });
  const review = el('div', { className: 'gg-v4-overlay-review-actions' }, [
    opener,
    createButton({
      label: 'Simulate Back',
      variant: 'ghost',
      onClick: () => {
        const modal = root.querySelector<HTMLDialogElement>('dialog[open]');
        if (modal) modal.dispatchEvent(new Event('cancel', { cancelable: true }));
        else if (menu.isOpen) menu.close();
      },
    }),
  ]);
  review.setAttribute('aria-label', 'Story review controls');
  root.append(header, board, status, review, controls, menu.element);
  if (options.initiallyOpen)
    queueMicrotask(() => {
      if (!disposed && root.isConnected) menu.open();
    });
  root.cleanup = () => {
    disposed = true;
    menu.destroy();
    [...pending].forEach((destroy) => destroy());
  };
  return root;
}
