import { contrastRatio, parseColor } from '../../lib/contrast.js';
import { parseThemeModes } from '../../lib/theme-tokens.js';
const blend = (foreground: string, background: string, alpha: number): string => {
  const fg = parseColor(foreground),
    bg = parseColor(background);
  return (
    '#' +
    fg
      .map((c, i) =>
        Math.round(c * alpha + bg[i]! * (1 - alpha))
          .toString(16)
          .padStart(2, '0'),
      )
      .join('')
  );
};
export interface ContrastResult {
  mode: string;
  role: string;
  background: string;
  ratio: number;
  minimum: number;
  pass: boolean;
  proposal: string;
}
export function auditMoonlit(css: string): ContrastResult[] {
  const modes = parseThemeModes(css);
  return Object.entries(modes).flatMap(([mode, tokens]) => {
    const backgrounds = ['--nl-color-bg', '--nl-color-surface', '--nl-moonlit-surface-high'];
    const roles = [
      ['text', '--nl-color-text', 4.5, 1],
      ['text-muted', '--nl-moonlit-text-muted', 4.5, 1],
      ['label', '--nl-grim-glimmer-v3-label', 4.5, 1],
      ['accent', '--nl-color-accent', 3, 1],
      ['star', '--nl-moonlit-star', 3, 1],
      ['spire', '--nl-moonlit-spire', 3, 1],
      ['error underline', '--nl-grim-glimmer-v3-error', 3, 1],
      ['maybe/exclusion', '--nl-moonlit-star', 3, 0.5],
      [
        'hairline',
        '--nl-color-text',
        3,
        Number(/,\s*([\d.]+)\)/.exec(tokens['--nl-grim-glimmer-v3-hairline']!)![1]),
      ],
    ] as const;
    return backgrounds.flatMap((background) =>
      roles.map(([role, token, minimum, alpha]) => {
        const fg = tokens[token]!,
          bg = tokens[background]!;
        const ratio = contrastRatio(blend(fg, bg, alpha), bg);
        let proposal = '';
        if (ratio < minimum) {
          for (let opacity = Math.ceil(alpha * 100); opacity <= 100; opacity++) {
            if (contrastRatio(blend(fg, bg, opacity / 100), bg) >= minimum) {
              proposal = `Opacity ${opacity}% (same RGB)`;
              break;
            }
          }
          if (!proposal) proposal = 'Color adjustment required';
        }
        return {
          mode,
          role,
          background: background.replace('--nl-color-', '').replace('--nl-moonlit-', ''),
          ratio,
          minimum,
          pass: ratio >= minimum,
          proposal,
        };
      }),
    );
  });
}
