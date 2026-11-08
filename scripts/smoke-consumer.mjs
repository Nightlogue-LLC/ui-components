// Proves the built package is usable from ANOTHER project, the way a real consumer would use it:
//   1. `npm pack` the package (exactly what would be published)
//   2. install the tarball into a throwaway project
//   3. type-check a TypeScript file that imports every kind of entry point
//   4. resolve JS + CSS entry points with Node's resolver
//   5. bundle a tiny app with Vite that imports the CSS (checks @import chains inside node_modules)
// Run `npm run build` first. Needs no network (the package has no runtime dependencies).
import { execFileSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const name = pkg.name;

const work = mkdtempSync(join(tmpdir(), 'nl-consumer-'));
const run = (cmd, args, cwd) => {
  try {
    return execFileSync(cmd, args, { cwd, stdio: 'pipe', encoding: 'utf8' });
  } catch (error) {
    // Surface the child's own output; execFileSync's default message hides the useful part.
    throw new Error(
      `${cmd} ${args.join(' ')} failed:\n${error.stdout ?? ''}${error.stderr ?? ''}`,
      {
        cause: error,
      },
    );
  }
};
const step = (msg) => console.log(`- ${msg}`);

try {
  step('npm pack');
  const packOut = run(
    'npm',
    ['pack', '--json', '--ignore-scripts', '--pack-destination', work],
    root,
  );
  const tarball = join(work, JSON.parse(packOut)[0].filename);

  const app = join(work, 'app');
  mkdirSync(app);
  writeFileSync(
    join(app, 'package.json'),
    JSON.stringify({ name: 'consumer-smoke', private: true, type: 'module' }),
  );
  step('install tarball into a throwaway consumer');
  run('npm', ['install', tarball, '--no-audit', '--no-fund', '--offline'], app);

  // 3. Types: the same file must type-check under both modern resolution modes.
  writeFileSync(
    join(app, 'main.ts'),
    `
import { createButton, applyTheme, requiredThemeTokens, type ButtonProps } from '${name}';
import { createButton as createButton2 } from '${name}/components/button';
import { requiredThemeTokens as tokens } from '${name}/tokens';
import { applyTheme as applyTheme2 } from '${name}/core';
import { createIconButton } from '${name}/components/icon-button';
import { createCard } from '${name}/components/card';
import { createSegmentedControl, updateSegmentedControl } from '${name}/components/segmented-control';
import { createDialog, openDialog, closeDialog, getDialogBody, type DialogCloseReason } from '${name}/components/dialog';
import { createBadge } from '${name}/components/badge';
import { createSelect } from '${name}/components/select';
import { createBottomNav, updateBottomNav } from '${name}/components/bottom-nav';
void [createBottomNav, updateBottomNav];
const picker: HTMLElement = createSelect({ label: 'Mode', value: 'a', options: [{ value: 'a', label: 'A' }] });
void picker;
import {
  createMainScreen,
  updateMainScreen,
  createBoard,
  createPuzzleCollectionCard,
  createTutorialDialog,
  type BoardCellState,
  type TutorialOutcome,
} from '${name}/projects/grim-glimmer';

const cellState: BoardCellState = 'fixed';
const outcome: TutorialOutcome = 'skip';
void [createMainScreen, updateMainScreen, createBoard, createPuzzleCollectionCard, createTutorialDialog, cellState, outcome];

const reason: DialogCloseReason = 'escape';
const dialog: HTMLDialogElement = createDialog({ title: 't', onClose: (r) => void r });
const seg: HTMLElement = createSegmentedControl({ label: 'x', options: [{ value: 'a', label: 'A' }], value: 'a', onChange: (n) => void n });
updateSegmentedControl(seg, { label: 'x', options: [], value: '' });
void [reason, dialog, openDialog, closeDialog, getDialogBody, createBadge, createCard, createIconButton];

const props: ButtonProps = { label: 'Hello', variant: 'secondary' };
const el: HTMLButtonElement = createButton({ ...props, onClick: () => {} });
applyTheme(document.body, 'neutral', 'dark');
void [createButton2, tokens, applyTheme2, requiredThemeTokens, el];
// @ts-expect-error unknown variant must be rejected by the published types
createButton({ label: 'x', variant: 'nope' });
`,
  );
  const tsc = require.resolve('typescript/bin/tsc');
  const resolutions = {
    NodeNext: { module: 'NodeNext', moduleResolution: 'NodeNext' },
    Bundler: { module: 'ESNext', moduleResolution: 'Bundler' },
  };
  for (const [label, options] of Object.entries(resolutions)) {
    step(`tsc (moduleResolution ${label})`);
    writeFileSync(
      join(app, `tsconfig.${label}.json`),
      JSON.stringify({
        compilerOptions: {
          ...options,
          target: 'ES2020',
          lib: ['ES2020', 'DOM'],
          types: [],
          strict: true,
          noEmit: true,
          skipLibCheck: false,
        },
        files: ['main.ts'],
      }),
    );
    run(process.execPath, [tsc, '-p', `tsconfig.${label}.json`], app);
  }

  // 4. Runtime resolution of JS and CSS entry points.
  step('node resolution of JS and CSS entry points');
  writeFileSync(
    join(app, 'resolve.mjs'),
    `
const specs = [
  '${name}',
  '${name}/core',
  '${name}/tokens',
  '${name}/components',
  '${name}/components/button',
  '${name}/styles.css',
  '${name}/tokens.css',
  '${name}/components/button.css',
  '${name}/components/icon-button.css',
  '${name}/components/card.css',
  '${name}/components/segmented-control.css',
  '${name}/components/dialog.css',
  '${name}/components/badge.css',
  '${name}/components/select',
  '${name}/components/select.css',
  '${name}/components/bottom-nav',
  '${name}/components/bottom-nav.css',
  '${name}/components/dialog',
  '${name}/themes/grim-glimmer.css',
  '${name}/projects/grim-glimmer',
  '${name}/projects/grim-glimmer.css',
  '${name}/themes/neutral.css',
  '${name}/themes/grim-glimmer.css',
  '${name}/theme-assets/grim-glimmer/fonts/inter-latin-400-normal.woff2',
];
for (const s of specs) import.meta.resolve(s);
const lib = await import('${name}');
for (const fn of ['createButton','createIconButton','createCard','createSegmentedControl','createDialog','createBadge','createSelect','createBottomNav','updateBottomNav']) {
  if (typeof lib[fn] !== 'function') throw new Error(fn + ' missing');
}
`,
  );
  run(process.execPath, ['resolve.mjs'], app);

  // 5. Real bundler passes over the CSS entry points. A consumer that imports the grim-glimmer
  //    theme must receive its fonts as local assets; a neutral-only consumer must receive none.
  const vite = join(dirname(require.resolve('vite/package.json')), 'bin', 'vite.js');
  const bundle = (dir, imports, themeName) => {
    const root = join(work, dir);
    mkdirSync(root);
    writeFileSync(
      join(root, 'index.html'),
      '<!doctype html><html><body><script type="module" src="./app.ts"></script></body></html>',
    );
    writeFileSync(
      join(root, 'app.ts'),
      `${imports.map((i) => `import '${name}/${i}';`).join('\n')}
import { createButton, applyTheme } from '${name}';
applyTheme(document.body, '${themeName}');
document.body.append(createButton({ label: 'Smoke' }));
`,
    );
    // Reuse the installed package from the first consumer.
    symlinkSync(join(app, 'node_modules'), join(root, 'node_modules'));
    run(process.execPath, [vite, 'build', '--logLevel', 'error'], root);
    const assets = join(root, 'dist', 'assets');
    const cssFile = readdirSync(assets).find((f) => f.endsWith('.css'));
    if (!cssFile) throw new Error('vite build produced no CSS');
    // Normalise quote style: the minifier may drop quotes in attribute selectors.
    const css = readFileSync(join(assets, cssFile), 'utf8').replaceAll(/["']/g, '');
    return { css, fonts: readdirSync(assets).filter((f) => f.endsWith('.woff2')) };
  };

  step('vite build of a consumer using both themes');
  const both = bundle(
    'app-themes',
    ['styles.css', 'themes/neutral.css', 'themes/grim-glimmer.css', 'projects/grim-glimmer.css'],
    'grim-glimmer',
  );
  for (const needle of [
    '.nl-button',
    '--nl-space-1',
    '[data-nl-theme=neutral]',
    '[data-nl-theme=grim-glimmer]',
    '.nl-grim-glimmer-board',
  ]) {
    if (!both.css.includes(needle)) throw new Error(`bundled consumer CSS is missing ${needle}`);
  }
  if (both.fonts.length !== 6)
    throw new Error(`expected 6 bundled .woff2 files, got ${both.fonts.length}`);
  if (/url\(\s*(https?:)?\/\//.test(both.css))
    throw new Error('bundled CSS references a network URL');

  step('vite build of a neutral-only consumer (no fonts expected)');
  const neutralOnly = bundle('app-neutral', ['styles.css', 'themes/neutral.css'], 'neutral');
  if (neutralOnly.fonts.length !== 0) throw new Error('neutral-only consumer received font files');

  console.log('Consumer smoke test passed.');
} finally {
  rmSync(work, { recursive: true, force: true });
}
