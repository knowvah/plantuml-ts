/**
 * `JsonBodyItem` -- split out of `class-geo-types.ts` (500-line hook cap,
 * cdd-T6). A pure move: the type below is unchanged, and
 * `class-geo-types.ts` re-exports it so no consumer's import path changed.
 */
import type { ClassifierGeo } from './class-geo-types.js';

/**
 * One drawing operation of a `json` leaf's entries area, in
 * `TextBlockCucaJSon#drawU`'s OWN order (see
 * `class-json-sizing.ts#buildJsonItems`). Every coordinate is
 * box-relative, the same frame `rows[].y`/`indent` and `dividerYs` use.
 *
 * A separate, ordered list rather than more `dividerYs` entries because
 * upstream's order is a pre-order traversal, not a Y-order: a nested
 * table's `vline` is drawn between its parent's key text and its own first
 * `hline`, and both share the parent row's Y. Same "this body owns its own
 * draw order" dispatch `enhancedBody` established.
 *
 * @see ~/git/plantuml/.../cucadiagram/TextBlockCucaJSon.java:162-180 (object),
 *      :213-224 (array)
 */
export type JsonBodyItem =
  /** `ULine.hline(jsonTotalWidth)` — scoped to the emitting table's OWN
   *  width, which is the parent's minus the parent's key column. */
  | { readonly kind: 'hline'; readonly x: number; readonly y: number; readonly width: number }
  /** `ULine.vline(height)` at `dx = width1` — ONE per OBJECT table (never
   *  per row, unlike `TextBlockMap`; never at all for an array). */
  | { readonly kind: 'vline'; readonly x: number; readonly y: number; readonly height: number }
  /** A key or scalar-value cell. `row` is the SAME object that appears in
   *  `ClassifierGeo.rows`, not a copy. */
  | { readonly kind: 'text'; readonly row: ClassifierGeo['rows'][number] };
