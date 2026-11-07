export interface GrainSurfaceOptions {
  /** Component is decorative; content retains its own semantics and interaction. */
  content?: Node;
}

/** Optional static texture wrapper for screens and panels, without external image requests. */
export function createGrainSurface(options: GrainSurfaceOptions = {}): HTMLDivElement {
  const surface = document.createElement('div');
  surface.className = 'nl-grain-surface';
  if (options.content) surface.append(options.content);
  return surface;
}
