import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const src = join(process.cwd(), 'src');
const buttonCss = readFileSync(join(src, 'components/button/button.css'), 'utf8');
const projectTheme = readFileSync(join(src, 'themes/grim-glimmer/grim-glimmer.css'), 'utf8');
const neutralTheme = readFileSync(join(src, 'themes/neutral/neutral.css'), 'utf8');

describe('tactile Button theme', () => {
  it('keeps all gradients and shadows in the consuming theme', () => {
    expect(buttonCss).not.toContain('linear-gradient(');
    expect(neutralTheme).not.toContain('--nl-button-primary-background');
    expect(projectTheme).not.toContain('undefined');
  });

  it.each(['primary', 'secondary', 'ghost'])(
    '%s variant has themed backgrounds and shadows in both modes',
    (variant) => {
      const background = `--nl-button-${variant}-background:`;
      const shadow = `--nl-button-${variant}-shadow:`;
      expect(projectTheme.split(background)).toHaveLength(3);
      expect(projectTheme.split(shadow)).toHaveLength(3);
      expect(buttonCss).toContain(`var(--nl-button-${variant}-background, var(--_bg))`);
      expect(buttonCss).toContain(`var(--nl-button-${variant}-shadow, none)`);
    },
  );

  it('has a reduced-motion fallback for tactile press', () => {
    expect(buttonCss).toContain('prefers-reduced-motion: reduce');
    expect(buttonCss).toContain('transform: var(--nl-button-press-transform, none)');
    expect(buttonCss).toContain('transform: none;');
  });
});
