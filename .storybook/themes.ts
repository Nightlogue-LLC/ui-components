/**
 * Theme and project discovery for the catalog.
 *
 * Importing the CSS registers it. Themes are attribute-scoped ([data-nl-theme]), so every theme
 * can be loaded at once and only the stage that opts in (via applyTheme) is affected. Adding
 * src/themes/<x>/<x>.css or src/projects/<x>/<x>.css makes it available here with no other edit.
 *
 * Keep the glob results in variables: Vite rewrites a bare Object.keys(import.meta.glob(...))
 * into keys only and would skip importing (injecting) the CSS.
 */
import '../src/styles.css';

const themeModules = import.meta.glob('../src/themes/*/*.css', { eager: true });
const projectModules = import.meta.glob('../src/projects/*/*.css', { eager: true });

/** Theme names: folders in src/themes whose entry file is <name>/<name>.css. */
export const themeNames: string[] = Object.keys(themeModules)
  .map((path) => /themes\/([^/]+)\/([^/]+)\.css$/.exec(path))
  .filter((m): m is RegExpExecArray => m !== null && m[1] === m[2])
  .map((m) => m[1]!)
  .sort();

/** Project stylesheet names (src/projects/<name>/<name>.css), loaded for project stories. */
export const projectNames: string[] = Object.keys(projectModules)
  .map((path) => /projects\/([^/]+)\/([^/]+)\.css$/.exec(path))
  .filter((m): m is RegExpExecArray => m !== null && m[1] === m[2])
  .map((m) => m[1]!)
  .sort();

export const modes = ['light', 'dark'] as const;
export type Mode = (typeof modes)[number];
