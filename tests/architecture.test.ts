// @vitest-environment node
//
// Guards the repository's architecture rules so they hold as themes and components are added.
// These read source files directly; no build is required.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { optionalThemeTokens, requiredThemeTokens } from '../src/tokens/contract.js';

const src = fileURLToPath(new URL('../src/', import.meta.url));
const read = (p: string) => readFileSync(join(src, p), 'utf8');
const dirs = (p: string) =>
  existsSync(join(src, p))
    ? readdirSync(join(src, p)).filter((d) => statSync(join(src, p, d)).isDirectory())
    : [];

/** Custom properties declared (`--x: ...;`) in a CSS string. */
// The lookarounds skip BEM modifiers such as `.cell--fixed::before` (not preceded by a word char,
// not followed by a second colon), so only real `--prop: value` declarations match.
const declared = (css: string) =>
  new Set([...css.matchAll(/(?<![\w-])(--[\w-]+)\s*:(?!:)/g)].map((m) => m[1]!));
/** Custom properties read via var(--x ...). */
const used = (css: string) => new Set([...css.matchAll(/var\(\s*(--[\w-]+)/g)].map((m) => m[1]!));
/** Strips comments so documentation never trips the checks. */
const stripComments = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '');
/** Style rules as {selector, body}, ignoring @-rules like @keyframes/@media wrappers. */
const rules = (css: string) =>
  [...stripComments(css).matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({
    selector: m[1]!.trim(),
    body: m[2]!,
  }));

describe('themes', () => {
  const themes = dirs('themes');

  it('has at least the neutral example theme', () => {
    expect(themes).toContain('neutral');
  });

  it.each(themes)('%s: folder contains <name>.css (the exported entry point)', (theme) => {
    expect(existsSync(join(src, 'themes', theme, `${theme}.css`))).toBe(true);
  });

  it.each(themes)('%s: base (no-mode) rules define every token in the theme contract', (theme) => {
    // Checked on the base rules alone, so a dark-mode block can't mask a missing base token.
    const base = rules(read(`themes/${theme}/${theme}.css`))
      .filter((r) => !r.selector.startsWith('@') && !r.selector.includes('data-nl-mode'))
      .map((r) => r.body)
      .join('\n');
    const missing = requiredThemeTokens.filter((t) => !declared(base).has(t));
    expect(missing).toEqual([]);
  });

  it.each(themes)('%s: every selector is scoped to its own [data-nl-theme]', (theme) => {
    const scope = new RegExp(`^\\[data-nl-theme=["']?${theme}["']?\\]`);
    const css = read(`themes/${theme}/${theme}.css`);
    const unscoped = rules(css)
      .filter((r) => !r.selector.startsWith('@'))
      .flatMap((r) => r.selector.split(','))
      .map((s) => s.trim())
      .filter((s) => !scope.test(s));
    expect(unscoped).toEqual([]);
  });

  it.each(themes)('%s: every dark-mode block also defines the full contract', (theme) => {
    const css = read(`themes/${theme}/${theme}.css`);
    const dark = rules(css).filter((r) => /data-nl-mode=["']?dark/.test(r.selector));
    for (const block of dark) {
      const missing = requiredThemeTokens.filter((t) => !declared(block.body).has(t));
      expect(missing).toEqual([]);
    }
  });
});

describe('shared components', () => {
  const components = dirs('components');
  const foundation = declared(read('tokens/tokens.css'));
  const known = new Set<string>([...foundation, ...requiredThemeTokens, ...optionalThemeTokens]);
  const stylesCss = read('styles.css');
  const componentsIndex = read('components/index.ts');

  it.each(components)('%s: has index.ts and <name>.css', (name) => {
    expect(existsSync(join(src, 'components', name, 'index.ts'))).toBe(true);
    expect(existsSync(join(src, 'components', name, `${name}.css`))).toBe(true);
  });

  it.each(components)('%s: is wired into styles.css and components/index.ts', (name) => {
    expect(stylesCss).toContain(`./components/${name}/${name}.css`);
    expect(componentsIndex).toContain(`./${name}/index.js`);
  });

  it.each(components)(
    '%s: reads only contract/foundation tokens or its own --nl-<name>-* hooks',
    (name) => {
      const css = stripComments(read(`components/${name}/${name}.css`));
      const unknown = [...used(css)].filter(
        (t) => !t.startsWith('--_') && !t.startsWith(`--nl-${name}-`) && !known.has(t),
      );
      expect(unknown).toEqual([]);
    },
  );

  it.each(components)('%s: reads optional theme hooks only with a fallback', (name) => {
    const css = stripComments(read(`components/${name}/${name}.css`));
    // var(--hook) with no comma means "no fallback": would break themes that don't define it.
    const bare = optionalThemeTokens.filter((t) => new RegExp(`var\\(\\s*${t}\\s*\\)`).test(css));
    expect(bare).toEqual([]);
  });

  it.each(components)('%s: only styles classes in its own nl-<name> namespace', (name) => {
    const css = read(`components/${name}/${name}.css`);
    const classes = [...stripComments(css).matchAll(/\.([a-z][\w-]*)/g)].map((m) => m[1]!);
    const outside = classes.filter(
      (c) => c !== `nl-${name}` && !c.startsWith(`nl-${name}-`) && !c.startsWith(`nl-${name}_`),
    );
    expect(outside).toEqual([]);
  });

  it('foundation does not define optional hooks (their fallbacks live at the point of use)', () => {
    expect(optionalThemeTokens.filter((t) => foundation.has(t))).toEqual([]);
  });

  it('foundation tokens do not define theme-contract (color) tokens', () => {
    expect(requiredThemeTokens.filter((t) => foundation.has(t))).toEqual([]);
  });
});

describe('project folders', () => {
  const projects = dirs('projects');
  const foundation = declared(read('tokens/tokens.css'));
  const known = new Set<string>([...foundation, ...requiredThemeTokens, ...optionalThemeTokens]);
  // Documented hooks of shared components that a project may set to tune them.
  const sharedHook = /^--nl-(button|icon-button|card|segmented-control|dialog|badge|streak-glow)-/;

  it.each(projects)('%s: has index.ts and <name>.css (the exported entry points)', (project) => {
    expect(existsSync(join(src, 'projects', project, 'index.ts'))).toBe(true);
    expect(existsSync(join(src, 'projects', project, `${project}.css`))).toBe(true);
  });

  it.each(projects)('%s: every selector contains one of its own nl-<name>- classes', (project) => {
    const css = read(`projects/${project}/${project}.css`);
    const own = new RegExp(`\\.nl-${project}-`);
    const offenders = rules(css)
      .filter((r) => !r.selector.startsWith('@'))
      .flatMap((r) => r.selector.split(','))
      .map((sel) => sel.trim())
      .filter((sel) => !own.test(sel));
    expect(offenders).toEqual([]);
  });

  it.each(projects)('%s: reads only known tokens or its own hooks', (project) => {
    const css = stripComments(read(`projects/${project}/${project}.css`));
    const unknown = [...used(css)].filter(
      (t) =>
        !t.startsWith('--_') &&
        !t.startsWith(`--nl-${project}-`) &&
        !known.has(t) &&
        !sharedHook.test(t),
    );
    expect(unknown).toEqual([]);
  });

  it.each(projects)('%s: declares only its own hooks or documented shared hooks', (project) => {
    const css = stripComments(read(`projects/${project}/${project}.css`));
    const offenders = [...declared(css)].filter(
      (t) => !t.startsWith(`--nl-${project}-`) && !sharedHook.test(t),
    );
    expect(offenders).toEqual([]);
  });

  it.each(projects)('%s: uses no literal colors (colors come from the theme)', (project) => {
    const css = stripComments(read(`projects/${project}/${project}.css`));
    expect(css).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/i);
  });
});

describe('import boundaries', () => {
  const tsFiles = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
      e.isDirectory()
        ? tsFiles(join(dir, e.name))
        : e.name.endsWith('.ts') && !e.name.endsWith('.test.ts')
          ? [join(dir, e.name)]
          : [],
    );
  const importsOf = (file: string) =>
    [...readFileSync(file, 'utf8').matchAll(/from\s+['"]([^'"]+)['"]/g)].map((m) => m[1]!);

  it('shared code never imports from projects/', () => {
    const offenders = tsFiles(src)
      .filter((f) => !relative(src, f).startsWith('projects'))
      .filter((f) => importsOf(f).some((i) => /(^|\/)projects(\/|$)/.test(i)))
      .map((f) => relative(src, f));
    expect(offenders).toEqual([]);
  });

  it('a project never imports another project', () => {
    const offenders: string[] = [];
    for (const project of dirs('projects')) {
      for (const f of tsFiles(join(src, 'projects', project))) {
        for (const i of importsOf(f)) {
          const m = /projects\/([^/]+)/.exec(i);
          if (m && m[1] !== project) offenders.push(`${relative(src, f)} -> ${i}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('library code does not reference Node-only APIs', () => {
    const offenders = tsFiles(src).filter((f) =>
      importsOf(f).some((i) => i.startsWith('node:') || i === 'fs' || i === 'path'),
    );
    expect(offenders.map((f) => relative(src, f))).toEqual([]);
  });
});
