import { parseThemeModes } from '../../lib/theme-tokens.js';
import { contrastRatio, parseColor } from '../../lib/contrast.js';
function composite(color: string, background: string, opacity = 1): string {
  const alpha =
    (color.startsWith('rgba') ? Number(/,\s*([\d.]+)\)/.exec(color)?.[1] ?? 1) : 1) * opacity;
  const fg = parseColor(color),
    bg = parseColor(background);
  return (
    '#' +
    fg
      .map((x, i) =>
        Math.round(x * alpha + bg[i]! * (1 - alpha))
          .toString(16)
          .padStart(2, '0'),
      )
      .join('')
  );
}
export function auditOnyx(css: string, blueCss: string) {
  const a = parseThemeModes(css),
    b = parseThemeModes(blueCss);
  return (
    [
      ['Light', a.light],
      ['Dark A', a.dark],
      ['Dark B', b.dark],
    ] as const
  ).flatMap(([variant, t]) =>
    ['--nl-color-bg', '--nl-color-surface'].flatMap((bg) =>
      (
        [
          ['text', '--nl-color-text', 4.5, 1],
          ['muted / exclusion', '--nl-onyx-muted', 4.5, 1],
          ['star / error / accent', '--nl-onyx-star', 3, 1],
          ['spire', '--nl-onyx-spire', 3, 1],
          ['maybe', '--nl-onyx-star', 3, 0.45],
          ['hairline', '--nl-onyx-hairline', 3, 1],
          ['selected border', '--nl-color-text', 3, 1],
        ] as const
      ).map(([role, token, minimum, opacity]) => {
        const ratio = contrastRatio(composite(t[token]!, t[bg]!, opacity), t[bg]!);
        return {
          variant,
          role,
          surface: bg.replace('--nl-color-', ''),
          ratio,
          minimum,
          pass: ratio >= minimum,
        };
      }),
    ),
  );
}
