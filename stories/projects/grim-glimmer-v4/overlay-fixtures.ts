import { createButton } from '../../../src/components/button/index.js';
import { createGameplayMenuHeader } from '../../../src/projects/grim-glimmer/gameplay-menu-header.js';
import { createGameMenuSheet } from '../../../src/projects/grim-glimmer/menu-sheet.js';
import {
  getDialogBody,
  getDialogActions,
  openDialog,
  closeDialog,
} from '../../../src/components/dialog/index.js';
import {
  createSegmentedControl,
  updateSegmentedControl,
} from '../../../src/components/segmented-control/index.js';
import { createV4Board } from './board.js';
import { createControlRow } from './controls.js';
import {
  createSwitch,
  createProposalSheet,
  overlayHost,
  type SheetProposal,
} from './overlay-primitives.js';
import { DEFAULT_PREFERENCES, type OverlayOptions } from './settings-proposal.js';
import { createHowTo } from './howto-proposal.js';
import { el } from '../../lib/dom.js';
export interface FlowOptions extends OverlayOptions {
  difficulty?: 'easy' | 'medium' | 'hard';
  initialLesson?: number;
  longContent?: boolean;
  onNewGame?: (difficulty: string) => void;
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
  let state = { ...DEFAULT_PREFERENCES, ...options.state };
  let difficulty = options.difficulty ?? 'easy';
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
  const content = el('div');
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
  function difficultySheet() {
    if (disposed) return;
    let action: 'help' | 'new' | undefined;
    manage((done) => {
      const part = createProposalSheet({
        title: 'New Game',
        animations: !reduced(),
        onClose: () => {
          done();
          if (disposed) return;
          if (action === 'help') tutorial(difficultySheet);
          else if (action === 'new') {
            tick();
            options.onNewGame?.(difficulty);
            status.textContent = `New ${difficulty} game requested`;
          }
        },
      });
      const choices = [
        { value: 'easy', label: 'Easy' },
        { value: 'medium', label: 'Medium' },
        { value: 'hard', label: 'Hard' },
      ];
      const selector = createSegmentedControl({
        label: 'Difficulty',
        options: choices,
        value: difficulty,
        onChange: (value) => {
          difficulty = value as typeof difficulty;
          updateSegmentedControl(selector, { label: 'Difficulty', options: choices, value });
          tick();
        },
      });
      getDialogBody(part.dialog).append(
        el('p', { text: 'Choose the challenge for your next puzzle.' }),
        selector,
      );
      if (options.longContent)
        for (let i = 0; i < 10; i++)
          getDialogBody(part.dialog).append(
            el('p', {
              text: 'Every spire pairs with one neighboring star. Stars cannot touch, including at corners. Row and column clues count confirmed stars.',
            }),
          );
      const start = createButton({
        label: 'New Game',
        onClick: () => {
          action = 'new';
          closeDialog(part.dialog);
        },
      });
      start.autofocus = true;
      getDialogActions(part.dialog).append(
        createButton({
          label: 'How to Play',
          variant: 'secondary',
          onClick: () => {
            action = 'help';
            closeDialog(part.dialog);
          },
        }),
        start,
      );
      return part;
    });
  }
  for (const [key, label] of [
    ['sound', 'Sound effects'],
    ['music', 'Music'],
    ['haptics', 'Haptic feedback'],
  ] as const)
    content.append(
      createSwitch(label, state[key], (value) => {
        state = { ...state, [key]: value };
        tick();
        options.onChange?.({ ...state });
      }),
    );
  content.append(
    createButton({ label: 'New Game', variant: 'ghost', onClick: () => navigate(difficultySheet) }),
    createButton({
      label: 'How to Play',
      variant: 'ghost',
      onClick: () => navigate(() => tutorial()),
    }),
    createButton({
      label: 'Settings',
      variant: 'ghost',
      onClick: () =>
        navigate(() => {
          status.textContent = 'Settings requested';
          options.onNavigate?.('settings');
        }),
    }),
  );
  const menu = createGameMenuSheet({
    trigger,
    content,
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
        ? 'Open difficulty sheet'
        : entry === 'howto'
          ? 'Open guided tutorial'
          : 'Open game menu',
    variant: 'secondary',
    onClick: () => {
      opener.focus({ preventScroll: true });
      if (entry === 'difficulty') difficultySheet();
      else if (entry === 'howto') tutorial();
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
  root.cleanup = () => {
    disposed = true;
    menu.destroy();
    [...pending].forEach((destroy) => destroy());
  };
  return root;
}
