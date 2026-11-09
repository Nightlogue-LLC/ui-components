// Builds the publishable package into dist/:
//   1. tsc emits unbundled ES modules + .d.ts (preserves per-component entry points, tree-shakeable)
//   2. every .css file under src/ is copied verbatim to the same path under dist/, together with
//      the assets those stylesheets reference (theme font files, .woff2) and their OFL licenses
// CSS is shipped as plain, readable CSS files rather than being bundled into JS.
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, readdirSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'src');
const dist = join(root, 'dist');

rmSync(dist, { recursive: true, force: true });

const tsc = createRequire(import.meta.url).resolve('typescript/bin/tsc');
const result = spawnSync(process.execPath, [tsc, '-p', join(root, 'tsconfig.build.json')], {
  cwd: root,
  stdio: 'inherit',
});
if (result.status !== 0) process.exit(result.status ?? 1);

let copied = 0;
function copyCss(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const from = join(dir, entry.name);
    if (entry.isDirectory()) {
      copyCss(from);
    } else if (/\.(css|woff2|svg)$/.test(entry.name) || /^OFL-.*\.txt$/.test(entry.name)) {
      const to = join(dist, relative(src, from));
      mkdirSync(dirname(to), { recursive: true });
      copyFileSync(from, to);
      copied++;
    }
  }
}
copyCss(src);
const mapFile = join(dist, 'components/icon/icon-map.js');
const assetRequire = createRequire(join(root, 'package.json'));
const embedded = readFileSync(mapFile, 'utf8').replace(
  /import (\w+) from ["'](@phosphor-icons\/core\/assets\/[^"']+\.svg)\?raw["'];/g,
  (_, binding, specifier) =>
    `const ${binding} = ${JSON.stringify(readFileSync(assetRequire.resolve(specifier), 'utf8'))};`,
);
writeFileSync(mapFile, embedded);
copyFileSync(
  join(
    dirname(
      dirname(dirname(assetRequire.resolve('@phosphor-icons/core/assets/light/x-light.svg'))),
    ),
    'LICENSE',
  ),
  join(dist, 'components/icon/LICENSE-phosphor.txt'),
);

console.log(`Built dist/ (copied ${copied} CSS, font and license files)`);
