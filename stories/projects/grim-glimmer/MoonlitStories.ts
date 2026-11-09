import moonlitCss from '../../../src/themes/moonlit-oxblood/moonlit-oxblood.css?raw';
import { auditMoonlit } from '../grim-glimmer-v3/moonlit-contrast.js';
import type { StoryObj } from '@storybook/html-vite';
import { compareModes } from '../../lib/stage.js';
import { moonlitComparison, moonlitSpecimen } from '../grim-glimmer-v3/moonlit.js';
export const MoonlitOxblood: StoryObj = {
  name: 'Moonlit Oxblood · Light Dark Comparison',
  parameters: { nlStage: 'self' },
  render: (_, context) =>
    compareModes(context, (mode) => moonlitSpecimen(mode), { theme: 'moonlit-oxblood' }),
};
export const MoonlitOxbloodComparison: StoryObj = {
  name: 'Moonlit Oxblood versus Plum & Cream',
  parameters: { nlStage: 'self' },
  render: moonlitComparison,
};

export const MoonlitContrast: StoryObj = {
  name: 'Moonlit Oxblood · Contrast audit',
  parameters: { nlStage: 'self' },
  render: () => {
    const table = document.createElement('table');
    table.style.cssText = 'border-collapse:collapse;font:14px sans-serif';
    for (const values of [
      ['Mode', 'Role', 'Surface', 'Ratio', 'Required', 'Result', 'Smallest proposal (1% steps)'],
      ...auditMoonlit(moonlitCss).map((r) => [
        r.mode,
        r.role,
        r.background,
        r.ratio.toFixed(2),
        String(r.minimum),
        r.pass ? 'Pass' : 'FAIL',
        r.proposal,
      ]),
    ]) {
      const tr = table.insertRow();
      for (const value of values) {
        const td = tr.insertCell();
        td.textContent = value;
        td.style.cssText = 'padding:8px;border:1px solid #888';
      }
    }
    return table;
  },
};
