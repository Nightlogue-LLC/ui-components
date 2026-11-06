// After `npm run gallery:build`: every theme in src/themes/ must have reached the gallery bundle.
// Guards against a bundler quietly dropping a theme's CSS (which would make the gallery's theme
// switcher list a theme that renders unstyled).
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const assets = join(root, 'gallery-dist', 'assets');

const css = readdirSync(assets)
  .filter((f) => f.endsWith('.css'))
  .map((f) => readFileSync(join(assets, f), 'utf8'))
  .join('\n')
  .replaceAll(/["']/g, '');

const themes = readdirSync(join(root, 'src', 'themes'), { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => e.name);

const missing = themes.filter((t) => !css.includes(`[data-nl-theme=${t}]`));
if (missing.length > 0) {
  console.error(`Gallery bundle is missing CSS for theme(s): ${missing.join(', ')}`);
  process.exit(1);
}
console.log(`Gallery bundle includes ${themes.length} theme(s): ${themes.join(', ')}`);
