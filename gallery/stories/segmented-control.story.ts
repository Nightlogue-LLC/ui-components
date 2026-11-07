import {
  createSegmentedControl,
  updateSegmentedControl,
} from '../../src/components/segmented-control/index.js';
import { defineStory } from './types.js';

// Sample values for the gallery only; the component itself has no built-in options.
const OPTIONS = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
] as const;

interface SegmentedArgs {
  [key: string]: string | boolean;
  value: string;
  rejectChange: boolean;
}

export default defineStory<SegmentedArgs>({
  id: 'segmented-control',
  title: 'Segmented control',
  description:
    'Single select on native radios: Tab enters on the selected option, arrow keys move and select. The control reports the requested option and the app decides: tick "rejectChange" to simulate an app that declines (e.g. while a discard confirmation is open) and watch it stay put.',
  controls: [
    { name: 'value', type: 'select', options: OPTIONS.map((o) => o.value) },
    { name: 'rejectChange', type: 'boolean' },
  ],
  defaults: { value: 'easy', rejectChange: false },
  render: (args, { log }) => {
    let value = args.value;
    const props = () => ({ label: 'Difficulty', options: OPTIONS, value });
    const control = createSegmentedControl({
      ...props(),
      onChange: (next) => {
        log(`requested: ${next}`);
        if (args.rejectChange) {
          log('app declined: selection unchanged');
          return;
        }
        value = next;
        updateSegmentedControl(control, props());
        log(`applied: ${next}`);
      },
    });
    return control;
  },
  states: OPTIONS.map((o) => ({ label: `selected: ${o.label}`, args: { value: o.value } })),
});
