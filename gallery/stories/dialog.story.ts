import { createButton } from '../../src/components/button/index.js';
import {
  closeDialog,
  createDialog,
  getDialogActions,
  getDialogBody,
  openDialog,
} from '../../src/components/dialog/index.js';
import { el } from '../lib/dom.js';
import { defineStory } from './types.js';

interface DialogArgs {
  [key: string]: string | boolean;
  title: string;
  dismissible: boolean;
  longContent: boolean;
}

export default defineStory<DialogArgs>({
  id: 'dialog',
  title: 'Dialog',
  description:
    'Native <dialog> modal. Open it, then try Escape, the close button and a backdrop click (each reports its reason in the log). With dismissible off, only the action button closes it. "longContent" checks scrolling and large text.',
  controls: [
    { name: 'title', type: 'text' },
    { name: 'dismissible', type: 'boolean' },
    { name: 'longContent', type: 'boolean' },
  ],
  defaults: { title: 'Dialog title', dismissible: true, longContent: false },
  render: (args, { log }) => {
    const host = el('div');
    const open = createButton({
      label: 'Open dialog',
      variant: 'secondary',
      onClick: () => {
        const dialog = createDialog({
          title: args.title,
          dismissible: args.dismissible,
          onClose: (reason) => {
            log(`closed: ${reason}`);
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
        host.append(dialog); // inside the themed stage, so it inherits the theme
        openDialog(dialog);
        log('opened');
      },
    });
    host.append(open);
    return host;
  },
});
