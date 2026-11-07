import { createCard } from '../../src/components/card/index.js';
import { el } from '../lib/dom.js';
import { defineStory } from './types.js';

interface CardArgs {
  [key: string]: string | boolean;
  interactive: boolean;
  title: string;
  body: string;
}

export default defineStory<CardArgs>({
  id: 'card',
  title: 'Card',
  description:
    'Neutral surface container. Interactive cards are native buttons (keyboard and screen-reader ready) and have hover/pressed/focus states; static cards have none. Content is composed by the app; interactive cards take phrasing content (spans).',
  controls: [
    { name: 'interactive', type: 'boolean' },
    { name: 'title', type: 'text' },
    { name: 'body', type: 'text' },
  ],
  defaults: {
    interactive: false,
    title: 'Card title',
    body: 'Cards carry no art, titles or status of their own.',
  },
  render: (args, { log }) => {
    const card = createCard({
      interactive: args.interactive,
      onClick: () => log(`open: ${args.title}`),
    });
    card.append(
      el('span', { className: 'gal-card-title', text: args.title }),
      el('span', { className: 'gal-card-body', text: args.body }),
    );
    return card;
  },
  states: [
    { label: 'static', args: { interactive: false } },
    { label: 'interactive', args: { interactive: true } },
    {
      label: 'long text wraps',
      args: {
        interactive: true,
        title: 'A considerably longer card title that has to wrap onto several lines',
        body: 'Supporting copy that is long enough to wrap as well, to check padding and overflow at narrow widths.',
      },
    },
  ],
});
