import type { Meta, StoryObj } from '@storybook/html-vite';
import { createIcon, ICON_MAP, ICON_NAMES } from '../../src/components/icon/index.js';
import { compareModes } from '../lib/stage.js';
import { el } from '../lib/dom.js';
function catalog(): HTMLElement {
  const list = el('div', { className: 'sb-row' });
  for (const name of ICON_NAMES)
    list.append(
      el('div', {}, [
        el('p', { text: `${name} · ${ICON_MAP[name].name}` }),
        createIcon(name, { weight: 'light', label: `${name} Light` }),
        createIcon(name, { weight: 'fill', label: `${name} Fill` }),
      ]),
    );
  for (const name of ['sound', 'music', 'haptics'] as const)
    list.append(createIcon(name, { off: true, label: `${name} off` }));
  return list;
}
const meta = { title: 'Components/Icons', render: catalog } satisfies Meta;
export default meta;
export const Icons: StoryObj = {};
export const LightDarkComparison: StoryObj = {
  parameters: { nlStage: 'self' },
  render: (_, context) => compareModes(context, catalog, { theme: 'moonlit-oxblood' }),
};
