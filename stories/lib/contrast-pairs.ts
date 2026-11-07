/**
 * The contrast policy for project themes (WCAG 2.x AA), as data. The Foundations palette story
 * renders these live and tests/contrast.test.ts enforces them.
 *
 *  - 4.5:1 for normal text.
 *  - 3:1 for control boundaries (borders, filled-control edges) and the focus ring.
 *  - Disabled text is reported but exempt (WCAG exempts inactive components).
 */
export interface ContrastPair {
  label: string;
  fg: string;
  bg: string;
  min: number;
  /** false = shown for information only. */
  enforced: boolean;
}

const text = (label: string, fg: string, bg: string): ContrastPair => ({
  label,
  fg: `--nl-color-${fg}`,
  bg: `--nl-color-${bg}`,
  min: 4.5,
  enforced: true,
});
const boundary = (label: string, fg: string, bg: string): ContrastPair => ({
  label,
  fg: `--nl-color-${fg}`,
  bg: `--nl-color-${bg}`,
  min: 3,
  enforced: true,
});

export const contrastPairs: readonly ContrastPair[] = [
  text('Text on background', 'text', 'bg'),
  text('Text on surface', 'text', 'surface'),
  text('Text on surface hover', 'text', 'surface-hover'),
  text('Label on accent', 'on-accent', 'accent'),
  text('Label on accent hover', 'on-accent', 'accent-hover'),
  text('Label on accent pressed', 'on-accent', 'accent-active'),
  boundary('Border on background', 'border', 'bg'),
  boundary('Border on surface', 'border', 'surface'),
  boundary('Border on surface hover', 'border', 'surface-hover'),
  boundary('Accent fill on background', 'accent', 'bg'),
  boundary('Accent fill on surface', 'accent', 'surface'),
  boundary('Focus ring on background', 'focus-ring', 'bg'),
  boundary('Focus ring on surface', 'focus-ring', 'surface'),
  boundary('Focus ring on surface hover', 'focus-ring', 'surface-hover'),
  {
    label: 'Disabled text (exempt)',
    fg: '--nl-color-disabled-text',
    bg: '--nl-color-disabled-bg',
    min: 4.5,
    enforced: false,
  },
];
