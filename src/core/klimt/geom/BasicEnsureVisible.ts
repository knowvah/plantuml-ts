import type { EnsureVisible } from './EnsureVisible.js';

/**
 * BasicEnsureVisible — running min/max bounding box over every point
 * reported via `ensureVisible`; `Url` owns one to accumulate the pixels
 * drawn for its clickable region.
 *
 * Upstream: klimt/geom/BasicEnsureVisible.java — ported in full
 * (`ensureVisible`, `hasData`, `getCoords`, `getSurface`). Pulled into
 * SI1 T3 as part of `url/Url.java`'s two-level import closure (journaled).
 *
 * `Double.MAX_VALUE` maps to `Number.MAX_VALUE` (same magnitude,
 * 1.7976931348623157e308), so the has-data sentinel comparison is exact.
 */
export class BasicEnsureVisible implements EnsureVisible {
  private minX = Number.MAX_VALUE;
  private maxX = -Number.MAX_VALUE;
  private minY = Number.MAX_VALUE;
  private maxY = -Number.MAX_VALUE;

  /** @see net/sourceforge/plantuml/klimt/geom/BasicEnsureVisible.java#ensureVisible */
  ensureVisible(x: number, y: number): void {
    if (x > this.maxX) this.maxX = x;

    if (x < this.minX) this.minX = x;

    if (y > this.maxY) this.maxY = y;

    if (y < this.minY) this.minY = y;
  }

  /** @see net/sourceforge/plantuml/klimt/geom/BasicEnsureVisible.java#hasData */
  hasData(): boolean {
    return this.minX !== Number.MAX_VALUE;
  }

  /**
   * Java's `(int)` cast truncates toward zero — `Math.trunc`, not floor.
   *
   * @see net/sourceforge/plantuml/klimt/geom/BasicEnsureVisible.java#getCoords
   */
  getCoords(scale: number): string {
    if (this.minX === Number.MAX_VALUE) return '0,0,0,0';

    const x1 = Math.trunc(this.minX * scale);
    const y1 = Math.trunc(this.minY * scale);
    const x2 = Math.trunc(this.maxX * scale);
    const y2 = Math.trunc(this.maxY * scale);
    return `${x1},${y1},${x2},${y2}`;
  }

  /** @see net/sourceforge/plantuml/klimt/geom/BasicEnsureVisible.java#getSurface */
  getSurface(): number {
    if (this.minX === Number.MAX_VALUE) return 0;

    return (this.maxX - this.minX) * (this.maxY - this.minY);
  }
}
