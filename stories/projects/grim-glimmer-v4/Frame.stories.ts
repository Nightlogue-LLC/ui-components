import type { Meta, StoryObj } from '@storybook/html-vite';
import { createV4Board } from './board.js';
import { el } from '../../lib/dom.js';
import { compareModes } from '../../lib/stage.js';
import './frame-review.css';

const meta = {
  title: 'Projects/Grim & Glimmer/V4/Board/Frame review',
  parameters: { nlTheme: 'moonlit-oxblood', nlStage: 'self' },
} satisfies Meta;
export default meta;
type Story = StoryObj;

function beforeFrame() {
  // Archival schematic, not another board implementation or current ornament API.
  const host = el('div', { className: 'gg-v4-before-frame' });
  host.innerHTML = `<svg viewBox="0 0 369 369" role="img" aria-label="Before: frame schematic with competing corner strokes, not a device screenshot"><rect x="1" y="1" width="367" height="367" rx="24"/><rect x="5" y="5" width="359" height="359" rx="20"/><rect x="49" y="49" width="303" height="303" rx="14"/>${[0, 90, 180, 270].map((rotation) => `<path transform="rotate(${rotation} 184.5 184.5)" d="M6 16 A10 10 0 0 1 16 6 M16 12 L17 15 L20 16 L17 17 L16 20 L15 17 L12 16 L15 15 Z"/>`).join('')}</svg>`;
  return host;
}
export const BeforeAfter: Story = {
  render: (_, context) =>
    compareModes(
      context,
      () =>
        el('div', { className: 'gg-v4-frame-review' }, [
          el('figure', {}, [
            el('figcaption', { text: 'Before · archival frame schematic' }),
            beforeFrame(),
          ]),
          el('figure', {}, [
            el('figcaption', { text: 'After · revised 6×6 board' }),
            createV4Board({ size: 6, interactive: false }),
          ]),
        ]),
      { theme: 'moonlit-oxblood' },
    ),
};
export const CornerCrops: Story = {
  render: (_, context) =>
    compareModes(
      context,
      () => {
        const host = el('div', { className: 'gg-v4-corner-review' });
        for (const size of [6, 15] as const) {
          for (const corner of ['top-left', 'top-right', 'bottom-left', 'bottom-right']) {
            const viewport = el('div', { className: 'gg-v4-corner-crop' });
            viewport.dataset.corner = corner;
            const board = createV4Board({ size, interactive: false, conflict: false, hint: false });
            // Four occupied corner cells expose fill clipping at every grid corner.
            const grid = board.querySelector('.nl-grim-glimmer-board')!;
            for (const index of [0, size - 1, size * (size - 1), size * size - 1]) {
              grid.children[index]!.className =
                'nl-grim-glimmer-board__cell nl-grim-glimmer-board__cell--placed';
            }
            viewport.append(board);
            host.append(
              el('figure', {}, [
                el('figcaption', { text: `${size}×${size} · ${corner} · 3× crop` }),
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
