// @vitest-environment node
//
// Font rules: fonts are THEME assets (bundled, licensed, local, minimal), and shared code only
// ever speaks in semantic typography tokens, never in font names.
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { parseThemeModes } from '../stories/lib/theme-tokens.js';
import { optionalThemeTokens } from '../src/tokens/contract.js';

const src = fileURLToPath(new URL('../src/', import.meta.url));
const read = (p: string) => readFileSync(join(src, p), 'utf8');
const strip = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '');

interface Face {
  family: string;
  weight: string;
  style: string;
  display: string;
  files: string[];
  formats: string[];
  hasRange: boolean;
}

function faces(css: string): Face[] {
  return [...strip(css).matchAll(/@font-face\s*\{([^}]*)\}/g)].map((m) => {
    const decl = Object.fromEntries(
      [...m[1]!.matchAll(/([\w-]+)\s*:\s*([^;]+);/g)].map((d) => [d[1]!, d[2]!.trim()]),
    );
    const srcValue = decl.src ?? '';
    return {
      family: (decl['font-family'] ?? '').replace(/['"]/g, ''),
      weight: decl['font-weight'] ?? '',
      style: decl['font-style'] ?? '',
      display: decl['font-display'] ?? '',
      files: [...srcValue.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)].map((u) => u[1]!),
      formats: [...srcValue.matchAll(/format\(\s*['"]([^'"]+)['"]\s*\)/g)].map((f) => f[1]!),
      hasRange: 'unicode-range' in decl,
    };
  });
}

const themes = readdirSync(join(src, 'themes')).filter((d) =>
  statSync(join(src, 'themes', d)).isDirectory(),
);
const themesWithFonts = themes.filter((t) => faces(read(`themes/${t}/${t}.css`)).length > 0);

describe('theme font assets', () => {
  it('the grim-glimmer theme bundles fonts; the neutral theme stays on system fonts', () => {
    expect(themesWithFonts).toContain('grim-glimmer');
    expect(faces(read('themes/neutral/neutral.css'))).toEqual([]);
    const neutralDeclared = parseThemeModes(read('themes/neutral/neutral.css'));
    const typographyTokens = optionalThemeTokens.filter((t) =>
      /font|line-height|letter-spacing/.test(t),
    );
    expect(typographyTokens.filter((t) => t in neutralDeclared.light)).toEqual([]);
  });

  describe.each(themesWithFonts)('%s', (theme) => {
    const css = read(`themes/${theme}/${theme}.css`);
    const declared = faces(css);
    const fontsDir = join(src, 'themes', theme, 'fonts');

    it('loads only local files: relative URLs, WOFF2, nothing from the network', () => {
      for (const face of declared) {
        expect(face.files, face.family).toHaveLength(1);
        expect(face.files[0], face.family).toMatch(/^\.\/fonts\/[\w-]+\.woff2$/);
        expect(face.formats, face.family).toEqual(['woff2']);
      }
      expect(strip(css)).not.toMatch(/url\(\s*['"]?(https?:)?\/\//i);
      expect(strip(css)).not.toMatch(/@import/);
    });

    it('every face is normal style, uses font-display and a unicode-range, and its file is real WOFF2', () => {
      for (const face of declared) {
        expect(face.style, face.family).toBe('normal');
        expect(face.display, face.family).toBe('swap');
        expect(face.hasRange, face.family).toBe(true);
        const file = join(src, 'themes', theme, face.files[0]!);
        expect(existsSync(file), file).toBe(true);
        expect(readFileSync(file).subarray(0, 4).toString('latin1'), file).toBe('wOF2');
      }
    });

    it('has no duplicate (family, weight) faces and no orphan font files', () => {
      const keys = declared.map((f) => `${f.family}@${f.weight}`);
      expect(new Set(keys).size).toBe(keys.length);
      const referenced = new Set(declared.map((f) => f.files[0]!.replace('./fonts/', '')));
      const onDisk = readdirSync(fontsDir).filter((f) => f.endsWith('.woff2'));
      expect(onDisk.sort()).toEqual([...referenced].sort());
    });

    it('ships an OFL license with a copyright notice for every family', () => {
      for (const family of new Set(declared.map((f) => f.family))) {
        const slug = family.replace(/^GG /, '').toLowerCase().replace(/ /g, '-');
        const license = join(fontsDir, `OFL-${slug}.txt`);
        expect(existsSync(license), license).toBe(true);
        const text = readFileSync(license, 'utf8');
        expect(text).toMatch(/SIL OPEN FONT LICENSE Version 1\.1/);
        expect(text).toMatch(/^Copyright /m);
      }
    });

    it('records provenance: every font file hash matches fonts/README.md', () => {
      const readme = readFileSync(join(fontsDir, 'README.md'), 'utf8');
      const recorded = Object.fromEntries(
        [...readme.matchAll(/^([0-9a-f]{64})\s+(\S+\.woff2)$/gm)].map((m) => [m[2]!, m[1]!]),
      );
      for (const file of readdirSync(fontsDir).filter((f) => f.endsWith('.woff2'))) {
        const actual = createHash('sha256')
          .update(readFileSync(join(fontsDir, file)))
          .digest('hex');
        expect(recorded[file], file).toBe(actual);
      }
    });
  });
});

describe('grim-glimmer typography roles', () => {
  const css = read('themes/grim-glimmer/grim-glimmer.css');
  const { light, dark } = parseThemeModes(css);
  const declared = faces(css);
  const foundation = read('tokens/tokens.css');

  // role -> the family token it maps to and the weight tokens that role uses
  const roles = {
    'GG Inter': { family: '--nl-font-family', weights: ['--nl-font-weight-medium'] },
    'GG Cormorant Upright': {
      family: '--nl-font-family-display',
      weights: ['--nl-font-weight-display'],
    },
    'GG Cormorant Infant': {
      family: '--nl-font-family-heading',
      weights: ['--nl-font-weight-heading', '--nl-font-weight-heading-soft'],
    },
    'GG Cormorant SC': { family: '--nl-font-family-label', weights: ['--nl-font-weight-label'] },
  } as const;

  const weightOf = (token: string) =>
    light[token] ?? new RegExp(`${token}:\\s*(\\d+)`).exec(foundation)?.[1];

  it.each(Object.entries(roles))(
    '%s: mapped to its semantic role with a generic fallback',
    (family, role) => {
      const stack = light[role.family];
      expect(stack, role.family).toBeDefined();
      expect(stack!.replace(/['"]/g, '')).toMatch(new RegExp(`^${family},`));
      expect(stack).toMatch(/(sans-serif|serif)$/);
    },
  );

  it('loads exactly the weights the role tokens use (Inter body 400 plus its emphasis weight)', () => {
    const expected = new Set<string>();
    for (const [family, role] of Object.entries(roles)) {
      for (const token of role.weights) expected.add(`${family}@${weightOf(token)}`);
    }
    expected.add('GG Inter@400'); // regular body text
    expect(new Set(declared.map((f) => `${f.family}@${f.weight}`))).toEqual(expected);
  });

  it('defines the whole semantic scale in both modes (dark inherits the base)', () => {
    const scale = optionalThemeTokens.filter((t) => /font|line-height|letter-spacing/.test(t));
    expect(scale.filter((t) => !(t in light))).toEqual([]);
    expect(scale.filter((t) => !(t in dark))).toEqual([]);
  });
});

describe('shared code never names a font', () => {
  const files = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
      e.isDirectory() ? files(join(dir, e.name)) : [join(dir, e.name)],
    );
  const shared = [
    ...files(join(src, 'components')),
    ...files(join(src, 'tokens')),
    ...files(join(src, 'core')),
    join(src, 'styles.css'),
  ].filter((f) => /\.(css|ts)$/.test(f) && !f.endsWith('.test.ts'));

  it('has no @font-face, font files, or family names in shared CSS/TS', () => {
    for (const file of shared) {
      const text = strip(readFileSync(file, 'utf8')).replace(/\/\/.*$/gm, '');
      expect(text, file).not.toMatch(
        /@font-face|\.woff2?\b|cormorant|georgia|times new roman|\bInter\b|GG /i,
      );
    }
  });

  it('every font-family declaration in a shared component reads a token', () => {
    for (const file of shared.filter((f) => f.endsWith('.css'))) {
      for (const m of strip(readFileSync(file, 'utf8')).matchAll(
        /(?<![\w-])font-family:\s*([^;]+);/g,
      )) {
        expect(m[1]!.trim(), file).toMatch(/^var\(--nl-font-family[\w-]*/);
      }
    }
  });
});
