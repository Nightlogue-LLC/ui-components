import { createBottomNav, updateBottomNav } from '../../components/bottom-nav/index.js';

export type MainPage = 'collection' | 'achievements' | 'settings';

export interface MainScreenOptions {
  pages: Record<MainPage, Node>;
  icons: Record<MainPage, Node>;
  value?: MainPage;
  labels?: Partial<Record<MainPage, string>>;
  navigationLabel?: string;
  /** The app owns routing. Accept a request with updateMainScreen(). */
  onNavigate: (page: MainPage) => void;
}

const order: readonly MainPage[] = ['collection', 'achievements', 'settings'];
const defaults: Record<MainPage, string> = {
  collection: 'Collection',
  achievements: 'Achievements',
  settings: 'Settings',
};
const screens = new WeakMap<
  HTMLElement,
  { nav: HTMLElement; panels: Map<MainPage, HTMLElement> }
>();

/** Main app shell only; gameplay uses its separate app frame and never includes this bar. */
export function createMainScreen(options: MainScreenOptions): HTMLElement {
  const value = options.value ?? 'collection';
  const labels = { ...defaults, ...options.labels };
  const root = document.createElement('section');
  root.className = 'nl-grim-glimmer-main-screen';
  const panels = new Map<MainPage, HTMLElement>();
  for (const page of order) {
    const panel = document.createElement('section');
    panel.className = 'nl-grim-glimmer-main-screen__page';
    panel.setAttribute('aria-label', labels[page]);
    panel.dataset.page = page;
    panel.append(options.pages[page]);
    panels.set(page, panel);
    root.append(panel);
  }
  const nav = createBottomNav({
    label: options.navigationLabel ?? 'Main navigation',
    value,
    iconOnly: true,
    items: order.map((page) => ({ value: page, label: labels[page], icon: options.icons[page] })),
    onNavigate: (page) => options.onNavigate(page as MainPage),
  });
  screens.set(root, { nav, panels });
  root.append(nav);
  updateMainScreen(root, value);
  return root;
}

/** Keeps each page mounted, including preference controls and its scroll position. */
export function updateMainScreen(root: HTMLElement, page: MainPage): void {
  const config = screens.get(root);
  if (!config?.panels.has(page)) throw new Error('updateMainScreen: unknown screen or page');
  for (const [key, panel] of config.panels) panel.hidden = key !== page;
  updateBottomNav(config.nav, page);
}
