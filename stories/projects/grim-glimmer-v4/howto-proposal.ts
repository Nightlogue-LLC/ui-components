import {
  createGuidedTutorialDialog,
  type TutorialLesson,
} from '../../../src/projects/grim-glimmer/index.js';
import { createMotionSystem } from './motion.js';
import { TUTORIAL_LESSONS } from '../grim-glimmer/tutorial-lessons.js';
import { fixture } from './board.js';
import { el } from '../../lib/dom.js';
export const V4_LESSONS: readonly TutorialLesson[] = [
  ...TUTORIAL_LESSONS.slice(0, -1),
  {
    title: 'Zoom with two fingers',
    instruction:
      'On a 15×15 board, use two fingers to zoom and pan. One finger places marks. Zoom is optional; Reset view returns to the full board.',
    boardLabel: 'Gesture illustration only; zoom is supported on 15 by 15 boards',
    size: 5,
    cells: fixture(5),
  },
  TUTORIAL_LESSONS.at(-1)!,
];
export function createHowTo(
  options: {
    reducedMotion?: boolean;
    initialLesson?: number;
    onDone?: (outcome: 'skip' | 'finish') => void;
  } = {},
) {
  const dialog = createGuidedTutorialDialog({
    title: 'How to Play',
    lessons: V4_LESSONS,
    initialLesson: options.initialLesson,
    onDone: (outcome) => {
      destroy();
      options.onDone?.(outcome);
    },
  });
  dialog.classList.add('gg-v4-howto');
  if (options.reducedMotion) dialog.dataset.reducedMotion = 'true';
  const counter = dialog.querySelector<HTMLElement>('.nl-grim-glimmer-tutorial__step')!;
  counter.hidden = true;
  counter.setAttribute('aria-hidden', 'true');
  const dots = el('div', { className: 'gg-v4-step-dots' });
  dots.setAttribute('role', 'status');
  dots.setAttribute('aria-live', 'polite');
  dots.setAttribute('aria-atomic', 'true');
  counter.after(dots);
  let pulse: ReturnType<typeof createMotionSystem> | undefined;
  function sync() {
    const match = /Step (\d+) of (\d+)/.exec(counter.textContent ?? '');
    const step = Number(match?.[1] ?? 1);
    dots.replaceChildren(
      el('span', {
        className: 'nl-grim-glimmer-visually-hidden',
        text: `Step ${step} of ${V4_LESSONS.length}`,
      }),
    );
    V4_LESSONS.forEach((_, index) => {
      const dot = el('span', { className: 'gg-v4-step-dot' });
      dot.setAttribute('aria-hidden', 'true');
      if (index === step - 1) dot.dataset.current = 'true';
      dots.append(dot);
    });
    pulse?.dispose();
    const target = dialog.querySelector<HTMLElement>(
      '.nl-grim-glimmer-board__cell.nl-grim-glimmer-guided-tutorial__highlight',
    );
    if (target) {
      const ring = el('span', { className: 'gg-v4-hint' });
      ring.setAttribute('aria-hidden', 'true');
      target.append(ring);
      pulse = createMotionSystem({ hint: ring, reducedMotion: options.reducedMotion });
      pulse.mount();
    }
    if (step === V4_LESSONS.length - 1) {
      const visual = dialog.querySelector<HTMLElement>('.nl-grim-glimmer-guided-tutorial__visual')!;
      const guide = el('div', { className: 'gg-v4-zoom-guide', text: '○  ↔  ○' });
      guide.setAttribute('aria-hidden', 'true');
      visual.append(guide);
    }
  }
  const observer = new MutationObserver(sync);
  observer.observe(counter, { childList: true, characterData: true, subtree: true });
  sync();
  function destroy() {
    observer.disconnect();
    pulse?.dispose();
  }
  return { dialog, destroy };
}
