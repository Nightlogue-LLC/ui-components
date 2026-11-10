import type { Meta, StoryObj } from '@storybook/html-vite';
import { fn, userEvent, within } from 'storybook/test';
import { createButton } from '../../../src/components/button/index.js';
import { openDialog } from '../../../src/components/dialog/index.js';
import {
  createGuidedTutorialDialog,
  createDiscardConfirmDialog,
} from '../../../src/projects/grim-glimmer/index.js';
import { TUTORIAL_LESSONS } from './tutorial-lessons.js';

const meta = {
  title: 'Projects/Grim & Glimmer/V3/Tutorial',
  parameters: { nlTheme: 'moonlit-oxblood' },
  args: { initialLesson: 0, onDone: fn() },
  argTypes: { initialLesson: { control: 'select', options: TUTORIAL_LESSONS.map((_, i) => i) } },
  render: (args) => {
    const host = document.createElement('div');
    host.append(
      createButton({
        label: 'Open guided tutorial',
        onClick: () => {
          const dialog = createGuidedTutorialDialog({
            title: 'How to play',
            lessons: TUTORIAL_LESSONS,
            glowDelay: 0,
            initialLesson: args.initialLesson,
            onDone: args.onDone,
          });
          host.append(dialog);
          dialog.addEventListener('close', () => dialog.remove(), { once: true });
          openDialog(dialog);
        },
      }),
    );
    return host;
  },
} satisfies Meta<{ initialLesson: number; onDone: (outcome: 'skip' | 'finish') => void }>;
export default meta;
type Story = StoryObj<typeof meta>;
export const GuidedTutorial: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole('button', { name: 'Open guided tutorial' }),
    );
  },
};
export const NewGameConfirmation: Story = {
  render: () => {
    const host = document.createElement('div');
    host.append(
      createButton({
        label: 'Open confirmation',
        onClick: () => {
          const dialog = createDiscardConfirmDialog({
            title: 'Start a New Game?',
            message:
              'Your current puzzle is saved. Starting a new Easy board may replace saved marks on the next puzzle.',
            confirmLabel: 'Start Game',
            onConfirm: fn(),
            onCancel: fn(),
          });
          host.append(dialog);
          dialog.addEventListener('close', () => dialog.remove(), { once: true });
          openDialog(dialog);
        },
      }),
    );
    return host;
  },
};
