import type { Meta, StoryObj } from '@storybook/html-vite';
import { fn, userEvent, within } from 'storybook/test';
import {
  createSuccessSheet,
  createSuccessMessagePicker,
} from '../../../src/projects/grim-glimmer/index.js';
import { openDialog } from '../../../src/components/dialog/index.js';
import { createButton } from '../../../src/components/button/index.js';
import { screen } from '../grim-glimmer-v3/screen-fixtures.js';
import { compareModes } from '../../lib/stage.js';
import { el } from '../../lib/dom.js';
interface Args {
  animations: boolean;
  onNewGame: () => void;
  onReturnHome: () => void;
  onClose: () => void;
}
function build(args: Args): HTMLElement {
  const pickMessage = createSuccessMessagePicker([
    'Every star is in place. Beautifully done.',
    'The sky is set. Nicely done.',
    'A little order in the night.',
    'One more constellation complete.',
  ]);
  const host = screen('Game Screen', 'moonlit-oxblood', 'light');
  // Inherit the Storybook mode; the screen helper's explicit scope is for comparison fixtures.
  host.removeAttribute('data-nl-theme');
  host.removeAttribute('data-nl-mode');
  host.append(
    createButton({
      label: 'Preview completion',
      onClick: () => {
        const sheet = createSuccessSheet({
          ...args,
          title: 'Puzzle Complete',
          message: pickMessage,
          onNewGame: () => {
            args.onNewGame();
            sheet.remove();
          },
          onReturnHome: () => {
            args.onReturnHome();
            sheet.remove();
          },
          onClose: () => {
            args.onClose();
            sheet.remove();
          },
        });
        host.append(sheet);
        openDialog(sheet);
      },
    }),
  );
  return host;
}
const meta = {
  title: 'Projects/Grim & Glimmer/Dialogs/Success Sheet',
  parameters: {
    nlTheme: 'moonlit-oxblood',
    nlStage: 'bleed',
    docs: {
      description: {
        component:
          'Issue #19 review. Mobile bottom sheet; desktop centered dialog. New Game and Return Home are distinct outcomes. X, Escape, backdrop and handle swipe report dismissal only. Story callbacks are demonstrations; production navigation and saved game integration follow visual approval. Replay by dismissing and tapping Preview completion. Each new sheet picks from a sample message bank without repeating the previous message.',
      },
    },
  },
  args: { animations: true, onNewGame: fn(), onReturnHome: fn(), onClose: fn() },
  argTypes: {
    animations: { control: 'boolean' },
    onNewGame: { action: 'new game' },
    onReturnHome: { action: 'return home' },
    onClose: { action: 'solved board' },
  },
  render: build,
} satisfies Meta<Args>;
export default meta;
type Story = StoryObj<Args>;
export const Playground: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole('button', { name: 'Preview completion' }),
    );
  },
};
export const MotionOff: Story = { ...Playground, args: { animations: false } };
export const LightDarkComparison: Story = {
  parameters: { nlStage: 'self' },
  render: (_, context) =>
    compareModes(
      context,
      (mode) => el('div', {}, [screen('Puzzle Complete', 'moonlit-oxblood', mode)]),
      { theme: 'moonlit-oxblood', bleed: true },
    ),
};
