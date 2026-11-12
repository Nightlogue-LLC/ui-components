import {
  createRitualDraw as supported,
  type RitualDrawOptions as SupportedOptions,
} from '../../../src/projects/grim-glimmer/ritual-draw.js';
import { MONTHS, dailyContract } from './month-model.js';
import { createButton } from '../../../src/components/button/index.js';
import { homeHost } from './home.js';
import './monthly.css';
export { DRAW_STATES } from '../../../src/projects/grim-glimmer/ritual-draw.js';
export type { DrawState } from '../../../src/projects/grim-glimmer/ritual-draw.js';
export type RitualDrawOptions = Omit<SupportedOptions, 'manifest' | 'onReveal' | 'onBegin'> & {
  manifest?: SupportedOptions['manifest'];
  now?: string;
  onReveal?: (daily: ReturnType<typeof dailyContract>) => void;
  onBegin?: (daily: ReturnType<typeof dailyContract>) => void;
};
export function createRitualDraw(options: RitualDrawOptions = {}) {
  const manifest = options.manifest ?? MONTHS[1]!;
  const clock = options.clock ?? (() => new Date(options.now ?? '2026-11-10T16:18:00'));
  return supported({
    ...options,
    manifest,
    clock,
    onReveal: (daily) => options.onReveal?.({ ...daily, ...dailyContract(clock(), manifest) }),
    onBegin: (daily) => options.onBegin?.({ ...daily, ...dailyContract(clock(), manifest) }),
  });
}
export function createDrawReplay(options: RitualDrawOptions = {}) {
  const root = homeHost('gg-v4-ritual-review');
  let draw = createRitualDraw({ ...options, enabled: true, state: 'unplayed' });
  const replay = createButton({
    label: 'Replay draw',
    variant: 'secondary',
    onClick: () => {
      draw.remove();
      draw = createRitualDraw({ ...options, enabled: true, state: 'unplayed' });
      root.append(draw);
      draw.querySelector<HTMLButtonElement>('button')!.click();
    },
  });
  root.append(replay, draw);
  return root;
}
