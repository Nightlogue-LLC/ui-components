import type { Meta, StoryObj } from '@storybook/html-vite';
import { el } from '../../lib/dom.js';

type Palette = 'plum' | 'cream' | 'charcoal';
const marks = ['','▲','','','','▲','','','','','','','','▲','','','','','','','','▲','','',''];
const nums = ['4','8','1','2','6','9','7','3','5'];
const tabs = [
  { icon: '⌂', label: 'Collection' },
  { icon: '♜', label: 'Achievements' },
  { icon: '▤', label: 'Journal' },
  { icon: '⚙', label: 'Settings' },
];

function board(compact = false): HTMLElement {
  const grid = el('div', { className: compact ? 'sb-ref-board sb-ref-board--compact' : 'sb-ref-board' });
  grid.setAttribute('role', 'img');
  grid.setAttribute('aria-label', 'Visual-only sample five by five puzzle board with row and column clue numbers');
  grid.append(el('span', { className: 'sb-ref-board__corner' }));
  [1, 0, 2, 1, 1].forEach(n => grid.append(el('span', { className: 'sb-ref-board__clue', text: String(n) })));
  for (let r = 0; r < 5; r++) {
    grid.append(el('span', { className: 'sb-ref-board__clue', text: String([1, 2, 0, 1, 1][r]) }));
    for (let c = 0; c < 5; c++) {
      grid.append(el('span', { className: 'sb-ref-board__square', text: marks[r * 5 + c] ?? '' }));
    }
  }
  return grid;
}

function card(title: string, detail: string, index: number): HTMLElement {
  let preview: HTMLElement;
  if (index === 0) preview = board(true);
  else if (index === 1) preview = el('div', { className: 'sb-ref-number-grid' }, nums.map(n => el('span', { text: n })));
  else preview = el('div', { className: 'sb-ref-bridges', text: '●──●\n│  │\n●──●' });
  return el('article', { className: 'sb-ref-card' }, [
    el('div', { className: 'sb-ref-card__preview' }, [preview]),
    el('div', { className: 'sb-ref-card__copy' }, [
      el('h3', { text: title }),
      el('p', { text: detail }),
    ]),
    el('span', { className: 'sb-ref-card__chevron', text: '›' }),
  ]);
}

function bottomNav(): HTMLElement {
  const nav = el('nav', { className: 'sb-ref-bottom-nav' });
  nav.setAttribute('aria-label', 'Reference navigation preview');
  tabs.forEach((tab, i) => {
    const button = el('button', { className: i === 0 ? 'sb-ref-bottom-nav__tab is-active' : 'sb-ref-bottom-nav__tab' }, [
      el('span', { className: 'sb-ref-bottom-nav__icon', text: tab.icon }),
      el('span', { text: tab.label }),
    ]);
    button.type = 'button';
    if (i === 0) button.setAttribute('aria-current', 'page');
    button.addEventListener('click', () => {
      nav.querySelectorAll('button').forEach(b => {
        b.classList.remove('is-active');
        b.removeAttribute('aria-current');
      });
      button.classList.add('is-active');
      button.setAttribute('aria-current', 'page');
    });
    nav.append(button);
  });
  return nav;
}

function buttons(): HTMLElement {
  const controls = el('div', { className: 'sb-ref-buttons' });
  ['Primary', 'Secondary', 'Tertiary'].forEach((label, i) => {
    const b = el('button', { className: 'sb-ref-action sb-ref-action--' + i, text: label });
    b.type = 'button';
    controls.append(b);
  });
  return controls;
}

function difficulty(): HTMLElement {
  const holder = el('div', { className: 'sb-ref-difficulty' });
  ['Easy', 'Medium', 'Hard'].forEach((name, i) => {
    const b = el('button', { className: i === 1 ? 'is-active' : '', text: name });
    b.type = 'button';
    b.setAttribute('aria-pressed', String(i === 1));
    b.addEventListener('click', () => {
      holder.querySelectorAll('button').forEach(x => {
        x.classList.toggle('is-active', x === b);
        x.setAttribute('aria-pressed', String(x === b));
      });
    });
    holder.append(b);
  });
  return holder;
}

function specimen(palette: Palette): HTMLElement {
  const frame = el('section', { className: 'sb-ref-frame' });
  frame.dataset.palette = palette;
  const heading = el('header', { className: 'sb-ref-masthead' }, [
    el('span', { className: 'sb-ref-ornament', text: '✦　☾　✦' }),
    el('h2', { text: 'Grim & Glimmer' }),
    el('p', { text: 'THE PUZZLE COLLECTION' }),
  ]);
  frame.append(
    heading,
    el('section', { className: 'sb-ref-section' }, [
      el('h3', { text: 'Collection' }),
      card('Tents & Trees', 'A logic puzzle of perfect pairings', 0),
      card('Number Search', 'Find hidden sequences', 1),
      card('Bridges', 'Connect the islands', 2),
    ]),
    el('section', { className: 'sb-ref-section' }, [
      el('h3', { text: 'Buttons & difficulty' }),
      buttons(),
      difficulty(),
    ]),
    el('section', { className: 'sb-ref-section' }, [
      el('h3', { text: 'Puzzle board & controls' }),
      el('div', { className: 'sb-ref-game' }, [
        board(),
        el('div', { className: 'sb-ref-game__tools' }, ['✎ Mark','× Cross','↶ Undo','✧ Hint'].map(t =>
          el('button', { className: 'sb-ref-action sb-ref-action--tool', text: t }),
        )),
      ]),
    ]),
    el('section', { className: 'sb-ref-section' }, [
      el('h3', { text: 'Success dialog' }),
      el('div', { className: 'sb-ref-success' }, [
        el('div', { className: 'sb-ref-success__icon', text: '✧　♕　✧' }),
        el('h4', { text: 'Puzzle Solved!' }),
        el('p', { text: 'You completed Tents & Trees in 4:18.' }),
        buttons(),
      ]),
    ]),
    bottomNav(),
  );
  return frame;
}

const meta = {
  title: 'Projects/Grim & Glimmer/Reference Gallery',
  tags: ['autodocs'],
  parameters: {
    nlStage: 'self',
    docs: {
      description: {
        component: 'Visual exploration of the earlier generated component sheet. Palette, layout, and four-tab bottom navigation are Storybook-only mock data. This does not alter app navigation, puzzle logic, or approved theme tokens.',
      },
    },
  },
  render: () => specimen('plum'),
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const PlumAndCream: Story = { render: () => specimen('plum') };
export const CreamLight: Story = { render: () => specimen('cream') };
export const CurrentCharcoal: Story = { render: () => specimen('charcoal') };
export const PaletteComparison: Story = {
  render: () => el('div', { className: 'sb-ref-comparison' }, [
    specimen('plum'), specimen('cream'), specimen('charcoal'),
  ]),
};
