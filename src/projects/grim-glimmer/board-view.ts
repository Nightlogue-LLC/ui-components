export interface Point {
  x: number;
  y: number;
}
export interface View {
  scale: number;
  x: number;
  y: number;
}
export function clampView(view: View, width: number, height: number): View {
  const scale = Math.max(1, Math.min(1.8, view.scale));
  return {
    scale,
    x: Math.max(-width * (scale - 1), Math.min(0, view.x)),
    y: Math.max(-height * (scale - 1), Math.min(0, view.y)),
  };
}
export function pinchView(
  start: View,
  from: readonly [Point, Point],
  to: readonly [Point, Point],
  width: number,
  height: number,
) {
  const distance = (pair: readonly [Point, Point]) =>
    Math.hypot(pair[1].x - pair[0].x, pair[1].y - pair[0].y);
  const mid = (pair: readonly [Point, Point]) => ({
    x: (pair[0].x + pair[1].x) / 2,
    y: (pair[0].y + pair[1].y) / 2,
  });
  const scale = Math.max(
    1,
    Math.min(1.8, (start.scale * distance(to)) / Math.max(1, distance(from))),
  );
  const a = mid(from);
  const b = mid(to);
  return clampView(
    {
      scale,
      x: b.x - ((a.x - start.x) * scale) / start.scale,
      y: b.y - ((a.y - start.y) * scale) / start.scale,
    },
    width,
    height,
  );
}
/** Sample screen-space segments densely enough to cross every cell, including fast swipes. */
export function interpolate(from: Point, to: Point, step: number): Point[] {
  const count = Math.max(
    1,
    Math.ceil(Math.hypot(to.x - from.x, to.y - from.y) / Math.max(1, step)),
  );
  return Array.from({ length: count }, (_, index) => ({
    x: from.x + ((to.x - from.x) * (index + 1)) / count,
    y: from.y + ((to.y - from.y) * (index + 1)) / count,
  }));
}
