import type { Meta, StoryObj } from '@storybook/html-vite';
import { fn } from 'storybook/test';
import { createButton } from '../../../src/components/button/index.js';
import { createRestartToast } from './controls.js';
import { compareModes } from '../../lib/stage.js';
import { el } from '../../lib/dom.js';
interface Args {
  onUndo: () => void;
  onExpire: () => void;
}
function build(args: Args) {
  const toast = createRestartToast(args.onUndo, args.onExpire);
  const root = el('div', { className: 'gg-v4-scope' }, [
    el('p', {
      text: 'Five seconds. Focus, hover and hidden-document time pause expiry. Replay restarts the timer.',
    }),
    createButton({ label: 'Show restart toast', onClick: toast.show }),
    toast.root,
  ]);
  return root;
}
const meta = {
  title: 'Projects/Grim & Glimmer/V4/Controls/RestartToast',
  parameters: { nlTheme: 'moonlit-oxblood' },
  args: { onUndo: fn(), onExpire: fn() },
  render: build,
} satisfies Meta<Args>;
export default meta;
type Story = StoryObj<Args>;
export const Replayable: Story = {};
export const LightDarkComparison: Story = {
  parameters: { nlStage: 'self' },
  render: (args, context) => compareModes(context, () => build(args), { theme: 'moonlit-oxblood' }),
};
