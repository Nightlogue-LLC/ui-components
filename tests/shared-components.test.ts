// @vitest-environment node
//
// Source-level guarantees for shared components that jsdom cannot observe through layout:
// touch-target sizing, visible focus, reduced motion, and brand neutrality.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const src = fileURLToPath(new URL('../src/', import.meta.url));
const componentsDir = join(src, 'components');
const components = readdirSync(componentsDir).filter((d) =>
  statSync(join(componentsDir, d)).isDirectory(),
);
const css = (name: string) =>
  readFileSync(join(componentsDir, name, `${name}.css`), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const px = (rem: string) => parseFloat(rem) * 16;

describe('touch targets', () => {
  const tokens = readFileSync(join(src, 'tokens/tokens.css'), 'utf8');
  const token = (name: string) => new RegExp(`${name}:\\s*([\\d.]+rem)`).exec(tokens)![1]!;

  it('control size tokens: md is at least 44px and lg at least 52px', () => {
    expect(px(token('--nl-size-control-md'))).toBeGreaterThanOrEqual(44);
    expect(px(token('--nl-size-control-lg'))).toBeGreaterThanOrEqual(52);
  });

  it('button md/lg use those tokens for their minimum height', () => {
    const button = css('button');
    expect(button).toMatch(/\.nl-button--md\s*\{[^}]*min-height:\s*var\(--nl-size-control-md\)/);
    expect(button).toMatch(/\.nl-button--lg\s*\{[^}]*min-height:\s*var\(--nl-size-control-lg\)/);
  });

  it('icon button cannot be smaller than the md control size, even when its size hook is lowered', () => {
    const icon = css('icon-button');
    expect(icon).toMatch(/min-width:\s*var\(--nl-size-control-md\)/);
    expect(icon).toMatch(/min-height:\s*var\(--nl-size-control-md\)/);
  });

  it('segmented options, interactive cards and the dialog close button meet the md size', () => {
    expect(css('segmented-control')).toMatch(/min-height:\s*var\(--nl-size-control-md\)/);
    expect(css('card')).toMatch(
      /\.nl-card--interactive\s*\{[^}]*min-height:\s*var\(--nl-size-control-md\)/,
    );
    expect(css('dialog')).toMatch(
      /\.nl-dialog__close\s*\{[^}]*width:\s*var\(--nl-size-control-md\)/,
    );
  });
});

describe.each(components)('%s', (name) => {
  const source = css(name);

  it('clickable components have a visible keyboard focus style', () => {
    if (/cursor:\s*pointer/.test(source)) expect(source).toContain(':focus-visible');
  });

  it('animated components honor prefers-reduced-motion', () => {
    if (/\b(transition|animation):/.test(source)) {
      expect(source).toContain('@media (prefers-reduced-motion: reduce)');
    }
  });

  it('hover styles are gated behind (hover: hover)', () => {
    const ungated = source
      .replace(/@media \(hover: hover\)\s*\{[\s\S]*?\n\}/g, '')
      .match(/:hover\b/g);
    expect(ungated).toBeNull();
  });

  it('contains no brand colors or project names', () => {
    expect(source).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    // Only pure black/white translucent scrims may use literal rgb().
    const literals = [...source.matchAll(/rgba?\(([^)]*)\)/g)].map((m) => m[1]!.replace(/\s/g, ''));
    for (const l of literals) expect(l).toMatch(/^(0,0,0|255,255,255)(,|$)/);
    const ts = readdirSync(join(componentsDir, name))
      .filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts'))
      .map((f) => readFileSync(join(componentsDir, name, f), 'utf8'))
      .join('\n');
    expect(source + ts).not.toMatch(/grim|glimmer/i);
  });
});

describe('text safety', () => {
  it('no shared component writes HTML from strings', () => {
    for (const name of components) {
      for (const file of readdirSync(join(componentsDir, name)).filter(
        (f) => f.endsWith('.ts') && !f.endsWith('.test.ts'),
      )) {
        const code = readFileSync(join(componentsDir, name, file), 'utf8')
          .replace(/\/\*[\s\S]*?\*\//g, '')
          .replace(/\/\/.*$/gm, '');
        expect(code, `${name}/${file}`).not.toMatch(
          /innerHTML|outerHTML|insertAdjacentHTML|document\.write/,
        );
      }
    }
  });
});
