import {
  createGuidedTutorialDialog,
  destroyGuidedTutorialDialog,
  type TutorialLesson,
} from '../../../src/projects/grim-glimmer/index.js';
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
    illustration: el('div', { className: 'gg-v4-zoom-guide', text: '○  ↔  ○' }),
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
    presentation: 'editorial',
    reducedMotion: options.reducedMotion,
    initialLesson: options.initialLesson,
    onDone: (outcome) => {
      destroyGuidedTutorialDialog(dialog);
      options.onDone?.(outcome);
    },
  });
  dialog.classList.add('gg-v4-howto');
  return { dialog, destroy: () => destroyGuidedTutorialDialog(dialog) };
}
