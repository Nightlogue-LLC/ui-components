import type { Meta, StoryObj } from '@storybook/html-vite';
import { createV4Board } from './board.js';
import { el } from '../../lib/dom.js';
import { compareModes } from '../../lib/stage.js';
import './frame-review.css';

interface Args {
  specimen: 'placed' | 'tentative' | 'hint';
}
const meta = {
  title: 'Projects/Grim & Glimmer/V4/Board/Frame review',
  parameters: { nlTheme: 'moonlit-oxblood', nlStage: 'self' },
  args: { specimen: 'placed' },
  argTypes: { specimen: { control: 'select', options: ['placed', 'tentative', 'hint'] } },
} satisfies Meta<Args>;
export default meta;
type Story = StoryObj<Args>;

export const BeforeAfter: Story = {
  render: (_, context) =>
    compareModes(
      context,
      () => {
        const host = el('div', { className: 'gg-v4-frame-review' });
        for (const size of [6, 15] as const) {
          const before = createV4Board({ size, framed: true, interactive: false });
          // Explicit historical dense-card reference; not an exposed dense option.
          before.dataset.framed = 'true';
          before.dataset.historical = 'true';
          host.append(
            el('figure', {}, [
              el('figcaption', { text: `Before · ${size}×${size} framed reference` }),
              before,
            ]),
            el('figure', {}, [
              el('figcaption', { text: `After · ${size}×${size} frameless` }),
              createV4Board({ size, interactive: false }),
            ]),
          );
        }
        return host;
      },
      { theme: 'moonlit-oxblood' },
    ),
};
export const CornerCrops: Story = {
  render: (args, context) =>
    compareModes(
      context,
      () => {
        const host = el('div', { className: 'gg-v4-corner-review' });
        for (const size of [6, 15] as const) {
          for (const corner of ['top-left', 'top-right', 'bottom-left', 'bottom-right']) {
            const viewport = el('div', { className: 'gg-v4-corner-crop' });
            viewport.dataset.corner = corner;
            const cells = Array(size * size).fill('empty') as ('empty' | 'placed' | 'tentative')[];
            for (const index of [0, size - 1, size * (size - 1), size * size - 1])
              cells[index] = args.specimen === 'hint' ? 'empty' : args.specimen;
            const board = createV4Board({
              size,
              cells,
              interactive: false,
              conflict: false,
              hint: false,
            });
            const frame = board.querySelector<HTMLElement>('.gg-v4-grid-frame')!;
            if (args.specimen === 'hint') {
              const grid = frame.querySelector('.nl-grim-glimmer-board')!;
              for (const index of [0, size - 1, size * (size - 1), size * size - 1]) {
                const ring = el('span', { className: 'gg-v4-hint' });
                ring.setAttribute('aria-hidden', 'true');
                grid.children[index]!.append(ring);
              }
            }
            // Crop the grid itself, not the clue gutter or the former card edge.
            board.replaceChildren(frame);
            board.classList.add('gg-v4-crop-board');
            viewport.append(board);
            host.append(
              el('figure', {}, [
                el('figcaption', { text: `${size}×${size} · ${corner} · ${args.specimen} · 3×` }),
                viewport,
              ]),
            );
          }
        }
        return host;
      },
      { theme: 'moonlit-oxblood' },
    ),
};
export const TentativeCorners: Story = { ...CornerCrops, args: { specimen: 'tentative' } };
export const HintCorners: Story = { ...CornerCrops, args: { specimen: 'hint' } };
