import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { createButton } from '../../../src/components/button/index.js';
import {
  closeDialog,
  createDialog,
  getDialogActions,
  getDialogBody,
  openDialog,
  type DialogCloseReason,
} from '../../../src/components/dialog/index.js';
import { el } from '../../lib/dom.js';

interface Args {
  title: string;
  dismissible: boolean;
  longContent: boolean;
  /** Called with the reason each time the dialog closes; shows up in the Actions panel. */
  onClose: (reason: DialogCloseReason) => void;
}

/** An "Open dialog" button; the dialog is appended inside the themed stage so it inherits the theme. */
function build(args: Args): HTMLElement {
  const host = el('div');
  host.append(
    createButton({
      label: 'Open dialog',
      variant: 'secondary',
      onClick: () => {
        const dialog = createDialog({
          title: args.title,
          dismissible: args.dismissible,
          onClose: (reason) => {
            args.onClose(reason);
            dialog.remove();
          },
        });
        const paragraphs = args.longContent ? 12 : 1;
        getDialogBody(dialog).append(
          ...Array.from({ length: paragraphs }, (_, i) =>
            el('p', {
              text: `Dialog content paragraph ${i + 1}. Content is arbitrary DOM supplied by the app.`,
            }),
          ),
        );
        getDialogActions(dialog).append(
          createButton({ label: 'Done', onClick: () => closeDialog(dialog) }),
        );
        host.append(dialog);
        openDialog(dialog);
      },
    }),
  );
  return host;
}

/** Opens the dialog the way a user would: by clicking the button. */
const openIt: NonNullable<Story['play']> = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  await userEvent.click(await canvas.findByRole('button', { name: 'Open dialog' }));
  await waitFor(() => expect(canvasElement.querySelector('dialog[open]')).not.toBeNull());
};

const meta = {
  title: 'Components/Overlays/Dialog',
  tags: ['autodocs'],
  args: { title: 'Dialog title', dismissible: true, longContent: false, onClose: fn() },
  argTypes: {
    title: { control: 'text' },
    dismissible: {
      control: 'boolean',
      description:
        'false makes a compulsory dialog: no close button, Escape and backdrop do nothing.',
    },
    longContent: { control: 'boolean', description: 'Tests scrolling and large text.' },
    onClose: { action: 'closed', table: { category: 'events' } },
  },
  render: (args) => build(args),
  parameters: {
    docs: {
      description: {
        component: `
Modal built on the native \`<dialog>\` element (\`showModal()\`): browser focus trap, inert background, top layer.
The title is the accessible name (\`aria-labelledby\`) and is set in the theme's **heading** typography role.
\`onClose(reason)\` reports \`'close-button' | 'escape' | 'backdrop' | 'programmatic'\`.

\`\`\`ts
import { createDialog, getDialogBody, getDialogActions, openDialog, closeDialog } from '@nightlogue-llc/ui-components';

const dialog = createDialog({ title: 'Start a new game?', dismissible: false, onClose: (why) => {} });
getDialogBody(dialog).append(message);
getDialogActions(dialog).append(cancelButton, confirmButton);
themedContainer.append(dialog); // inside the themed element so it inherits the theme
openDialog(dialog);
\`\`\`

### Reviewing and testing dialogs on mobile

1. Pick a phone size in the **viewport** toolbar (320, 375 or 430). The preview frame is resized, so \`@media\` rules apply.
2. Open **Dismissible**, **Compulsory** or **Long content**: their interaction step opens the dialog for you (replay with the Interactions panel).
3. Check: focus starts inside, Tab stays inside, **Escape** closes (or does nothing when compulsory), a backdrop tap closes (or not), and focus returns to **Open dialog**. Each close reason appears in the **Actions** panel.
4. Long content must scroll inside the dialog while the dialog stays inside the viewport; also try large text (browser zoom, or a larger default font size).
5. For a real phone, use the LAN preview described in \`docs/storybook.md\`.
`,
      },
    },
  },
} satisfies Meta<Args>;

export default meta;
type Story = StoryObj<Args>;

export const Playground: Story = {};

/** Dismissible: close button, Escape and backdrop all close it. The dialog opens automatically. */
export const Dismissible: Story = { play: openIt };

/** Compulsory: no close button; Escape and the backdrop do nothing. Only "Done" closes it. */
export const Compulsory: Story = {
  args: { dismissible: false, title: 'Compulsory choice' },
  play: openIt,
};

/** Twelve paragraphs: the body scrolls inside the dialog, which stays within the viewport. */
export const LongContent: Story = { args: { longContent: true }, play: openIt };
