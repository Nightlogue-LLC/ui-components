/** Reads a theme stylesheet's literal custom-property values per color mode. */

export type ModeName = 'light' | 'dark';
export type TokenValues = Record<string, string>;

/**
 * Light = declarations from the theme's base rules. Dark = base rules overlaid with
 * `[data-nl-mode='dark']` rules (that is what the cascade does on a dark element).
 * Values are returned verbatim, so themes should use literal values for contract colors.
 */
export function parseThemeModes(css: string): Record<ModeName, TokenValues> {
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/@import[^;]+;/g, '');
  const light: TokenValues = {};
  const darkOverrides: TokenValues = {};
  for (const [, selector, body] of stripped.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (selector!.trim().startsWith('@')) continue;
    const target = /data-nl-mode=["']?dark/.test(selector!) ? darkOverrides : light;
    for (const [, name, value] of body!.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
      target[name!] = value!.trim();
    }
  }
  const resolve = (values: TokenValues): TokenValues => {
    const result = { ...values };
    for (let pass = 0; pass < 10; pass++) {
      for (const [key, value] of Object.entries(result)) {
        result[key] = value.replace(
          /var\((--[\w-]+)\)/g,
          (match, token: string) => result[token] ?? match,
        );
      }
    }
    return result;
  };
  return { light: resolve(light), dark: resolve({ ...light, ...darkOverrides }) };
}
