import { createButton } from '../../../src/components/button/index.js';
import {
  createIcon,
  createToggle,
  ICON_NAMES,
} from '../../../src/projects/grim-glimmer-v3/index.js';
import { el } from '../../lib/dom.js';
export const theme = 'moonlit-oxblood';
export function specimen(part = 'all'): HTMLElement {
  const root = el('div', { className: 'nl-grim-glimmer-v3-foundations' });
  root.append(
    el('h2', { text: 'Stars & Spires' }),
    el('p', { text: 'Editorial V3 · Phase 1 foundations' }),
  );
  const section = (title: string, nodes: Node[]) =>
    root.append(
      el('section', { className: 'nl-grim-glimmer-v3-surface' }, [
        el('h3', { text: title }),
        ...nodes,
      ]),
    );
  if (part === 'all' || part === 'buttons')
    section('Actions', [
      el('div', { className: 'nl-grim-glimmer-v3-row' }, [
        createButton({ label: 'New game' }),
        createButton({ label: 'Continue', variant: 'secondary' }),
        createButton({ label: 'View board', variant: 'ghost' }),
        createButton({ label: 'Restart', disabled: true }),
      ]),
    ]);
  if (part === 'all' || part === 'toggles')
    section('Preferences', [
      createToggle({ label: 'Sound', checked: true }),
      createToggle({ label: 'Music', checked: false }),
      createToggle({ label: 'Haptics', checked: true }),
      createToggle({ label: 'Unavailable', checked: false, disabled: true }),
      createToggle({
        label: 'Animations',
        checked: true,
        onChange: (checked) => {
          root.dataset.animations = checked ? 'on' : 'off';
        },
      }),
    ]);
  if (part === 'all' || part === 'icons')
    section('Icon vocabulary', [
      el(
        'div',
        { className: 'nl-grim-glimmer-v3-row' },
        ICON_NAMES.map((name) => el('div', {}, [createIcon(name), el('p', { text: name })])),
      ),
      el(
        'div',
        { className: 'nl-grim-glimmer-v3-row' },
        ['sound', 'music', 'haptics'].map((name) =>
          createIcon(name as 'sound' | 'music' | 'haptics', { off: true, label: name + ' off' }),
        ),
      ),
    ]);
  return root;
}
