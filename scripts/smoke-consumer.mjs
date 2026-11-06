// Proves the built package is usable from ANOTHER project, the way a real consumer would use it:
//   1. `npm pack` the package (exactly what would be published)
//   2. install the tarball into a throwaway project
//   3. type-check a TypeScript file that imports every kind of entry point
//   4. resolve JS + CSS entry points with Node's resolver
//   5. bundle a tiny app with Vite that imports the CSS (checks @import chains inside node_modules)
// Run `npm run build` first. Needs no network (the package has no runtime dependencies).
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
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
  const packOut = run('npm', ['pack', '--json', '--pack-destination', work], root);
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
  '${name}/themes/neutral.css',
];
for (const s of specs) import.meta.resolve(s);
const lib = await import('${name}');
if (typeof lib.createButton !== 'function') throw new Error('createButton missing');
`,
  );
  run(process.execPath, ['resolve.mjs'], app);

  // 5. A real bundler pass over the CSS entry points.
  step('vite build of a consumer app');
  writeFileSync(
    join(app, 'index.html'),
    '<!doctype html><html><body><script type="module" src="./app.ts"></script></body></html>',
  );
  writeFileSync(
    join(app, 'app.ts'),
    `
import '${name}/styles.css';
import '${name}/themes/neutral.css';
import { createButton, applyTheme } from '${name}';
applyTheme(document.body, 'neutral');
document.body.append(createButton({ label: 'Smoke' }));
`,
  );
  const vite = join(dirname(require.resolve('vite/package.json')), 'bin', 'vite.js');
  run(process.execPath, [vite, 'build', '--logLevel', 'error'], app);
  const assets = join(app, 'dist', 'assets');
  const cssFile = readdirSync(assets).find((f) => f.endsWith('.css'));
  if (!cssFile) throw new Error('vite build produced no CSS');
  // Normalise quote style: the minifier may drop quotes in attribute selectors.
  const css = readFileSync(join(assets, cssFile), 'utf8').replaceAll(/["']/g, '');
  for (const needle of ['.nl-button', '--nl-space-1', '[data-nl-theme=neutral]']) {
    if (!css.includes(needle)) throw new Error(`bundled consumer CSS is missing ${needle}`);
  }

  console.log('Consumer smoke test passed.');
} finally {
  rmSync(work, { recursive: true, force: true });
}
