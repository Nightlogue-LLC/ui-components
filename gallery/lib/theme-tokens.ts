/** Reads a theme stylesheet's literal custom-property values per color mode. */

export type ModeName = 'light' | 'dark';
export type TokenValues = Record<string, string>;

/**
 * Light = declarations from the theme's base rules. Dark = base rules overlaid with
 * `[data-nl-mode='dark']` rules (that is what the cascade does on a dark element).
 * Values are returned verbatim, so themes should use literal values for contract colors.
 */
export function parseThemeModes(css: string): Record<ModeName, TokenValues> {
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const light: TokenValues = {};
  const darkOverrides: TokenValues = {};
  for (const [, selector, body] of stripped.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (selector!.trim().startsWith('@')) continue;
    const target = selector!.includes('data-nl-mode') ? darkOverrides : light;
    for (const [, name, value] of body!.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
      target[name!] = value!.trim();
    }
  }
  return { light, dark: { ...light, ...darkOverrides } };
}
