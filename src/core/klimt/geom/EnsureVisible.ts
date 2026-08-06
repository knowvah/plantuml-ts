/**
 * EnsureVisible — the callback surface a clickable region (`Url`) exposes
 * so drivers can report every point they actually painted for it; the
 * accumulated bounding box becomes the image-map/SVG link geometry.
 *
 * Upstream: klimt/geom/EnsureVisible.java — ported in full (one method).
 * Pulled into SI1 T3 as part of `url/Url.java`'s two-level import closure
 * (journaled; `BasicEnsureVisible.ts` is the sole implementor ported).
 */
export interface EnsureVisible {
  /** @see net/sourceforge/plantuml/klimt/geom/EnsureVisible.java#ensureVisible */
  ensureVisible(x: number, y: number): void;
}
