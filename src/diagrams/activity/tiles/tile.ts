import type { GPoint, HookName } from './points.js';

// NOTE: StringBounder here uses getDimension(text, fontSizePt) for
// simplicity. This differs from src/core/measurer.ts StringMeasurer,
// which uses measure(text, FontSpec) where FontSpec carries family,
// size, weight, and style. If you need to bridge to FormulaMeasurer /
// CanvasMeasurer, wrap it: getDimension(t, sz) => measurer.measure(t,
// { family: 'sans-serif', size: sz }).
export interface StringBounder {
  getDimension(text: string, fontSizePt: number): { width: number; height: number };
}

export interface Tile {
  readonly kind: string;
  readonly width: number;
  readonly height: number;
  /**
   * The swimlane this tile's source `ActivityNode` was parsed in, if any.
   * Threaded from `ActivityNode.swimlane` (`ast.ts`) at tile-construction
   * time in `tile-layout.ts`; not yet consumed by layout or rendering.
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/Swimable.java
   *   -- `getSwimlaneIn()`/`getSwimlaneOut()`, the upstream accessor pair
   *   every `Instruction` (the Java AST node) exposes.
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/Swimlanes.java:476
   *   -- `getCurrentSwimlane()`, the parse-time "which lane am I in" the
   *   port's `ctx.currentSwimlane` (`dispatch-support.ts`) mirrors.
   */
  readonly swimlane?: string;
  getCoord(hook: HookName): GPoint;
}

export abstract class TileLeaf implements Tile {
  abstract readonly kind: string;
  abstract readonly width: number;
  abstract readonly height: number;
  abstract getCoord(hook: HookName): GPoint;
  swimlane?: string;
}

export abstract class TileComposite implements Tile {
  abstract readonly kind: string;
  abstract readonly width: number;
  abstract readonly height: number;
  abstract getCoord(hook: HookName): GPoint;
  abstract readonly children: readonly Tile[];
  swimlane?: string;
}
