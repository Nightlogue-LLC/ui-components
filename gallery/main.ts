import '../src/styles.css';
import { applyTheme, type ColorMode } from '../src/core/index.js';
import { el } from './lib/dom.js';
import './gallery.css';
import type { Args, Control, Story } from './stories/types.js';

// --- Discovery -------------------------------------------------------------------------------
// Adding gallery/stories/<x>.story.ts or src/themes/<x>/<x>.css makes it appear here automatically.

const stories = Object.values(
  import.meta.glob<{ default: Story }>('./stories/*.story.ts', { eager: true }),
)
  .map((m) => m.default)
  .filter((s) => s !== undefined)
  .sort((a, b) => a.title.localeCompare(b.title));

// Importing the theme CSS registers it. Themes are attribute-scoped, so all can be loaded at once.
// Keep the glob result in a variable: Vite rewrites a bare `Object.keys(import.meta.glob(...))`
// into keys only and would skip importing (injecting) the CSS.
const themeModules = import.meta.glob('../src/themes/*/*.css', { eager: true });
const themes = Object.keys(themeModules)
  .map((path) => /themes\/([^/]+)\/([^/]+)\.css$/.exec(path))
  .filter((m): m is RegExpExecArray => m !== null && m[1] === m[2])
  .map((m) => m[1]!)
  .sort();

// Project stylesheets (src/projects/<name>/<name>.css) register the same way. Like the themes
// above, they are only imported because the glob result is kept in a variable and used.
const projectModules = import.meta.glob('../src/projects/*/*.css', { eager: true });
document.documentElement.dataset.projects = Object.keys(projectModules).join(',');

const MODES = ['light', 'dark'] as const;
const VIEWPORTS = {
  full: 'Full width',
  tablet: 'Tablet · 768px',
  mobile: 'Mobile · 375px',
} as const;
type ViewportKey = keyof typeof VIEWPORTS;

// --- State (kept in the URL hash so a view can be shared / reloaded) ---------------------------

interface State {
  story: string;
  theme: string;
  mode: ColorMode;
  viewport: ViewportKey;
}

function readState(): State {
  const p = new URLSearchParams(location.hash.slice(1));
  const pick = <T extends string>(value: string | null, allowed: readonly T[], fallback: T): T =>
    allowed.find((a) => a === value) ?? fallback;
  return {
    story: pick(
      p.get('story'),
      stories.map((s) => s.id),
      stories[0]?.id ?? '',
    ),
    theme: pick(p.get('theme'), themes, themes[0] ?? ''),
    mode: pick(p.get('mode'), MODES, 'light'),
    viewport: pick(p.get('viewport'), Object.keys(VIEWPORTS) as ViewportKey[], 'full'),
  };
}

let state = readState();
const argsByStory = new Map<string, Args>();
const logLines: string[] = [];

function setState(patch: Partial<State>): void {
  state = { ...state, ...patch };
  history.replaceState(null, '', `#${new URLSearchParams({ ...state }).toString()}`);
  render();
}

// --- DOM helpers -----------------------------------------------------------------------------

function selectField(
  label: string,
  options: readonly { value: string; label: string }[],
  value: string,
  onChange: (value: string) => void,
): HTMLElement {
  const select = el('select');
  for (const o of options) {
    const opt = el('option', { text: o.label });
    opt.value = o.value;
    opt.selected = o.value === value;
    select.append(opt);
  }
  select.addEventListener('change', () => onChange(select.value));
  return el('label', { className: 'gal-field' }, [el('span', { text: label }), select]);
}

/** A themed, width-constrained container; this is what actually previews a component. */
function createStage(themed = true, bleed = false): HTMLElement {
  const stage = el('div', {
    className: `gal-stage gal-stage--${state.viewport}${bleed ? ' gal-stage--bleed' : ''}`,
  });
  if (themed) applyTheme(stage, state.theme, state.mode);
  return stage;
}

function controlField(control: Control, args: Args, onChange: () => void): HTMLElement {
  const label = el('label', { className: 'gal-field' }, [el('span', { text: control.name })]);
  if (control.type === 'select') {
    const select = el('select');
    for (const o of control.options) {
      const opt = el('option', { text: o });
      opt.value = o;
      opt.selected = args[control.name] === o;
      select.append(opt);
    }
    select.addEventListener('change', () => {
      args[control.name] = select.value;
      onChange();
    });
    label.append(select);
  } else if (control.type === 'boolean') {
    const input = el('input');
    input.type = 'checkbox';
    input.checked = args[control.name] === true;
    input.addEventListener('change', () => {
      args[control.name] = input.checked;
      onChange();
    });
    label.classList.add('gal-field--check');
    label.append(input);
  } else {
    const input = el('input');
    input.type = 'text';
    input.value = String(args[control.name] ?? '');
    input.addEventListener('input', () => {
      args[control.name] = input.value;
      onChange();
    });
    label.append(input);
  }
  return label;
}

// --- Rendering -------------------------------------------------------------------------------

const app = document.getElementById('app')!;

function render(): void {
  const story = stories.find((s) => s.id === state.story);
  app.replaceChildren(
    renderHeader(),
    el('div', { className: 'gal-body' }, [renderNav(), renderMain(story)]),
  );
}

function renderHeader(): HTMLElement {
  const toolbar = el('div', { className: 'gal-toolbar' }, [
    selectField(
      'Theme',
      themes.map((t) => ({ value: t, label: t })),
      state.theme,
      (theme) => setState({ theme }),
    ),
    selectField(
      'Mode',
      MODES.map((m) => ({ value: m, label: m })),
      state.mode,
      (mode) => setState({ mode: mode as ColorMode }),
    ),
    selectField(
      'Viewport',
      Object.entries(VIEWPORTS).map(([value, label]) => ({ value, label })),
      state.viewport,
      (viewport) => setState({ viewport: viewport as ViewportKey }),
    ),
  ]);
  return el('header', { className: 'gal-header' }, [el('h1', { text: 'Nightlogue UI' }), toolbar]);
}

function renderNav(): HTMLElement {
  const nav = el('nav', { className: 'gal-nav' });
  nav.setAttribute('aria-label', 'Components');
  for (const s of stories) {
    const link = el('a', { text: s.title });
    link.href = `#${new URLSearchParams({ ...state, story: s.id }).toString()}`;
    if (s.id === state.story) link.setAttribute('aria-current', 'page');
    link.addEventListener('click', (e) => {
      e.preventDefault();
      setState({ story: s.id });
    });
    nav.append(link);
  }
  return nav;
}

function renderMain(story: Story | undefined): HTMLElement {
  const main = el('main', { className: 'gal-main' });
  if (!story) {
    main.append(el('p', { text: 'No stories found in gallery/stories/.' }));
    return main;
  }
  const args = argsByStory.get(story.id) ?? { ...story.defaults };
  argsByStory.set(story.id, args);

  // Playground: live preview + controls + event log. Only the preview re-renders on change.
  const log = el('ol', { className: 'gal-log' });
  const paintLog = () => {
    log.replaceChildren(
      ...(logLines.length ? logLines : ['(interact with the component to see events)']).map((l) =>
        el('li', { text: l }),
      ),
    );
  };
  const ctx = {
    log: (message: string) => {
      logLines.unshift(`${new Date().toLocaleTimeString()}  ${message}`);
      logLines.length = Math.min(logLines.length, 8);
      paintLog();
    },
  };
  paintLog();

  const themed = story.scope !== 'self';
  const showLog = story.showLog !== false;
  const preview = createStage(themed, story.bleed);
  const paintPreview = () =>
    preview.replaceChildren(el('div', { className: 'gal-cell' }, [story.render(args, ctx)]));
  paintPreview();

  const controls = el(
    'div',
    { className: 'gal-controls' },
    story.controls.map((c) => controlField(c, args, paintPreview)),
  );

  main.append(
    el('h2', { text: story.title }),
    el('p', { className: 'gal-desc', text: story.description ?? '' }),
    el('h3', { text: story.controls.length > 0 ? 'Playground' : 'Preview' }),
    preview,
  );
  if (story.controls.length > 0) main.append(controls);
  if (showLog) main.append(el('h3', { text: 'Event log' }), log);

  if (story.states?.length) {
    const grid = createStage(themed, story.bleed);
    const cells = story.states.map(({ label, args: overrides }) =>
      el('div', { className: 'gal-cell gal-cell--state' }, [
        el('span', { className: 'gal-cell__label', text: label }),
        story.render({ ...story.defaults, ...overrides } as Args, ctx),
      ]),
    );
    grid.append(el('div', { className: 'gal-grid' }, cells));
    main.append(el('h3', { text: 'States' }), grid);
  }
  for (const section of story.sections ?? []) {
    const stage = createStage(themed, story.bleed);
    stage.append(section.render(ctx));
    main.append(el('h3', { text: section.title }), stage);
  }
  return main;
}

window.addEventListener('hashchange', () => {
  state = readState();
  render();
});
render();
