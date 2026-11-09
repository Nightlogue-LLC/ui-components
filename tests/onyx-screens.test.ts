import { expect, it } from 'vitest';
import { screen, variants, type Screen } from '../stories/projects/grim-glimmer-v3/onyx-screens.js';
it('renders all five library screen compositions in each Onyx variant', () => {
  for (const variant of variants)
    for (const kind of [
      'Home',
      'Game Screen',
      'Game Menu',
      'Settings',
      'Puzzle Complete',
    ] as Screen[]) {
      const node = screen(kind, variant.theme, variant.mode);
      expect(node.dataset.nlTheme).toBe(variant.theme);
      if (kind === 'Home')
        expect(node.querySelectorAll('.nl-grim-glimmer-collection-card')).toHaveLength(3);
      if (kind === 'Settings')
        expect(node.querySelector('.nl-grim-glimmer-app-settings')).not.toBeNull();
      if (kind === 'Game Menu')
        expect(node.querySelector<HTMLElement>('.sb-onyx-sheet')!.hidden).toBe(false);
      if (kind === 'Puzzle Complete') expect(node.querySelector('dialog[open]')).not.toBeNull();
      if (kind !== 'Settings')
        expect(node.querySelector('.nl-grim-glimmer-board__cell--placed')).not.toBeNull();
    }
});
