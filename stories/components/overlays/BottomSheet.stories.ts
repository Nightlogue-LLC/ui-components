import type { Meta, StoryObj } from '@storybook/html-vite';
import { fn } from 'storybook/test';
import { createBottomSheet } from '../../../src/components/bottom-sheet/index.js';
import {
  closeDialog,
  openDialog,
  getDialogBody,
  getDialogActions,
} from '../../../src/components/dialog/index.js';
import { createButton } from '../../../src/components/button/index.js';
import { compareModes } from '../../lib/stage.js';
import { el } from '../../lib/dom.js';
interface Args {
  title: string;
  dismissible: boolean;
  animations: boolean;
  onClose: () => void;
}
function build(args: Args): HTMLElement {
  const host = el('div');
  host.append(
    createButton({
      label: 'Open sheet',
      onClick: () => {
        const sheet = createBottomSheet({
          ...args,
          onClose: () => {
            args.onClose();
            sheet.remove();
          },
        });
        getDialogBody(sheet).append(
          el('p', {
            text: 'Reusable NL sheet. Swipe down on the handle, tap X, or press Escape to dismiss.',
          }),
        );
        getDialogActions(sheet).append(
          createButton({ label: 'Done', onClick: () => closeDialog(sheet) }),
        );
        host.append(sheet);
        openDialog(sheet);
      },
    }),
  );
  return host;
}
const meta = {
  title: 'Components/Overlays/Bottom Sheet',
  args: { title: 'Bottom sheet', dismissible: true, animations: true, onClose: fn() },
  argTypes: {
    title: { control: 'text' },
    dismissible: { control: 'boolean' },
    animations: { control: 'boolean' },
    onClose: { action: 'closed' },
  },
  render: build,
  parameters: {
    docs: {
      description: {
        component:
          'createBottomSheet composes the native NL Dialog. Use openDialog, closeDialog, getDialogBody and getDialogActions. Mobile (<48rem): bottom anchored with a 280ms slide-up entrance and handle swipe dismissal. Desktop: centered dialog with a small fade/translation. Reduced motion and animations:false disable motion. Compulsory sheets disable X, Escape, backdrop and swipe dismissal. Other sheets have not migrated yet.',
      },
    },
  },
} satisfies Meta<Args>;
export default meta;
type Story = StoryObj<Args>;
export const Playground: Story = {};
export const ReducedMotion: Story = { args: { animations: false } };
export const Compulsory: Story = { args: { dismissible: false } };
export const LightDarkComparison: Story = {
  parameters: { nlStage: 'self' },
  render: (args, context) => compareModes(context, () => build(args)),
};
