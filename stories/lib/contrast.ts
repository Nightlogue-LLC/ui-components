/** WCAG 2.x relative luminance / contrast math. Pure functions, shared by the stories and tests. */

export type Rgb = readonly [number, number, number];

/** Parses `#rgb`, `#rrggbb`, `rgb(r, g, b)` / `rgb(r g b)` (alpha ignored). */
export function parseColor(input: string): Rgb {
  const value = input.trim().toLowerCase();
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/.exec(value);
  if (hex) {
    const h = hex[1]!;
    const full = h.length === 3 ? [...h].map((c) => c + c).join('') : h;
    const n = parseInt(full, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const rgb = /^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/.exec(value);
  if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
  throw new Error(`Unsupported color: ${input}`);
}

function channel(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

export function luminance([r, g, b]: Rgb): number {
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** Contrast ratio between two colors, 1 (identical) to 21 (black on white). */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(parseColor(a)), luminance(parseColor(b))].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}
