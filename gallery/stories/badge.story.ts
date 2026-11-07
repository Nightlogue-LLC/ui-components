import { BADGE_TONES, createBadge, type BadgeTone } from '../../src/components/badge/index.js';
import { defineStory } from './types.js';

interface BadgeArgs {
  [key: string]: string | boolean;
  label: string;
  tone: BadgeTone;
}

export default defineStory<BadgeArgs>({
  id: 'badge',
  title: 'Badge',
  description:
    'Compact, non-interactive status label. The text carries the meaning; tone only adds emphasis.',
  controls: [
    { name: 'label', type: 'text' },
    { name: 'tone', type: 'select', options: BADGE_TONES },
  ],
  defaults: { label: 'Continue', tone: 'accent' },
  render: (args) => createBadge(args),
  states: [
    ...BADGE_TONES.map((tone) => ({ label: tone, args: { tone, label: 'Play' } })),
    { label: 'neutral · Coming Soon', args: { tone: 'neutral', label: 'Coming Soon' } },
    { label: 'muted · Coming Soon', args: { tone: 'muted', label: 'Coming Soon' } },
  ],
});
