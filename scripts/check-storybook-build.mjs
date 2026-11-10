// After `npm run build-storybook`: sanity-checks the static catalog (storybook-static/).
//  - every expected story is present (the parity manifest: nothing the old gallery showed is missing)
//  - every theme's CSS reached the bundle, and theme fonts are local files (no network URLs)
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'storybook-static');
const fail = (message) => {
  console.error(`Storybook build check failed: ${message}`);
  process.exit(1);
};

if (!existsSync(join(out, 'index.json'))) fail('storybook-static/index.json is missing');
const index = JSON.parse(readFileSync(join(out, 'index.json'), 'utf8'));
const entries = Object.values(index.entries);
const ids = new Set(entries.map((e) => e.id));
const titles = new Set(entries.map((e) => e.title));

// Parity manifest: the stories the old custom gallery offered, mapped to their Storybook home.
// Keep this list in sync when stories are added; removing an entry needs a reason in review.
const REQUIRED_TITLES = [
  'Introduction',
  'Foundations/Tokens & Typography',
  'Components/Actions/Button',
  'Components/Actions/IconButton',
  'Components/Surfaces/Card',
  'Components/Inputs/SegmentedControl',
  'Components/Navigation/BottomNav',
  'Components/Overlays/Dialog',
  'Components/Feedback/Badge',
  'Projects/Grim & Glimmer/V3/Foundations',
  'Projects/Grim & Glimmer/V3/Collection',
  'Projects/Grim & Glimmer/V3/Gameplay',
  'Projects/Grim & Glimmer/V3/Tutorial',
  'Projects/Grim & Glimmer/V3/Completion',
  'Projects/Grim & Glimmer/V4/Board/Cell',
  'Projects/Grim & Glimmer/V4/Board/Grid',
  'Projects/Grim & Glimmer/V4/Board/Clues',
];
const obsolete = [...titles].filter(
  (title) =>
    title.startsWith('Projects/Grim & Glimmer') &&
    !/^Projects\/Grim & Glimmer\/V[34]\//.test(title),
);
if (obsolete.length) fail(`obsolete project sections: ${obsolete.join(', ')}`);
const missingTitles = REQUIRED_TITLES.filter((t) => !titles.has(t));
if (missingTitles.length > 0) fail(`missing story groups: ${missingTitles.join(', ')}`);

const REQUIRED_STORIES = [
  'projects-grim-glimmer-v4-board-grid--grid-5-x-5',
  'projects-grim-glimmer-v4-board-grid--grid-6-x-6',
  'projects-grim-glimmer-v4-board-grid--grid-8-x-8',
  'projects-grim-glimmer-v4-board-grid--grid-15-x-15',
  'projects-grim-glimmer-v4-board-grid--interaction-demo',
  'projects-grim-glimmer-v4-board-clues--over-including-zero',
  'components-actions-button--playground',
  'components-actions-button--variant-size-state-matrix',
  'components-actions-iconbutton--playground',
  'components-surfaces-card--playground',
  'components-inputs-segmentedcontrol--playground',
  'components-feedback-badge--playground',
  'components-overlays-dialog--playground',
  'components-overlays-dialog--compulsory',
  'projects-grim-glimmer-v3-foundations--playground',
  'projects-grim-glimmer-v3-moonlit-oxblood--home',
  'projects-grim-glimmer-v3-app-settings--settings-screen',
  'projects-grim-glimmer-v3-achievements--navigation-placeholder',
  'components-navigation-bottomnav--playground',
  'projects-grim-glimmer-v3-gameplay--game-screen',
  'projects-grim-glimmer-v3-gameplay--board-glyphs',
  'projects-grim-glimmer-v3-tutorial--guided-tutorial',
  'projects-grim-glimmer-v3-tutorial--new-game-confirmation',
  'projects-grim-glimmer-v3-completion--playground',
];
const missing = REQUIRED_STORIES.filter((id) => !ids.has(id));
if (missing.length > 0) fail(`missing stories: ${missing.join(', ')}`);

// Every shared component must have a light/dark comparison story.
for (const group of REQUIRED_TITLES.filter((t) => t.startsWith('Components/'))) {
  if (group.endsWith('/Dialog')) continue; // modal: switch Mode in the toolbar instead
  const has = entries.some(
    (e) => e.title === group && /lightdarkcomparison/.test(e.id.replace(/-/g, '')),
  );
  if (!has) fail(`${group} has no light/dark comparison story`);
}

// Bundle contents: themes and fonts must be in the static output, with no external font URLs.
const files = [];
(function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path);
    else files.push(path);
  }
})(out);
const css = files
  .filter((f) => f.endsWith('.css'))
  .map((f) => readFileSync(f, 'utf8'))
  .join('\n')
  .replaceAll(/["']/g, '');
const js = files
  .filter((f) => /\/assets\/.*\.js$/.test(f))
  .map((f) => readFileSync(f, 'utf8'))
  .join('\n')
  .replaceAll(/["']/g, '');
const bundled = css + '\n' + js;
const themes = readdirSync(join(root, 'src', 'themes'), { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => e.name);
const missingThemes = themes.filter((t) => !bundled.includes(`[data-nl-theme=${t}]`));
if (missingThemes.length > 0) fail(`no CSS bundled for theme(s): ${missingThemes.join(', ')}`);

const fonts = files.filter((f) => f.endsWith('.woff2'));
// The Grim & Glimmer theme's six faces must be in the build as local files (Vite hashes the names).
const REQUIRED_FONTS = [
  'cormorant-upright-latin-500-normal',
  'cormorant-infant-latin-400-normal',
  'cormorant-infant-latin-600-normal',
  'cormorant-sc-latin-600-normal',
  'inter-latin-400-normal',
  'inter-latin-600-normal',
];
for (const title of ['ControlRow', 'ToolToggle']) {
  if (!entries.some((entry) => entry.title === `Projects/Grim & Glimmer/V4/Controls/${title}`))
    fail(`missing V4 controls section: ${title}`);
}
for (const title of ['DragPaint', 'History', 'ZoomPan']) {
  if (!entries.some((entry) => entry.title === `Projects/Grim & Glimmer/V4/Interaction/${title}`))
    fail(`missing V4 interaction section: ${title}`);
}
for (const title of ['MarkPlacement', 'HintRing', 'Transitions']) {
  if (!entries.some((entry) => entry.title === `Projects/Grim & Glimmer/V4/Motion/${title}`))
    fail(`missing V4 motion section: ${title}`);
}
const missingFonts = REQUIRED_FONTS.filter((stem) => !fonts.some((f) => f.includes(stem)));
if (missingFonts.length > 0) fail(`missing bundled font file(s): ${missingFonts.join(', ')}`);
if (/url\(\s*(https?:)?\/\/[^)]*\.woff2?/i.test(bundled)) fail('a font is loaded from the network');

console.log(
  `Storybook build OK: ${entries.length} entries, ${REQUIRED_TITLES.length} groups, ${themes.length} themes (${themes.join(', ')}), ${REQUIRED_FONTS.length} theme fonts`,
);
