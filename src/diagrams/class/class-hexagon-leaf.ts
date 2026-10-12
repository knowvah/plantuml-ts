/**
 * class-hexagon-leaf.ts -- a class-routed `hexagon` leaf's svek polygon
 * (cdd8 T1e, `unknown/xagomi-49-caki729`).
 *
 * Upstream, `EntityImageDescription`'s constructor makes a `USymbols.HEXAGON`
 * leaf a `ShapeType.HEXAGON` node (`svek/image/EntityImageDescription.java
 * :127-128`); `SvekNode#appendShapeInternal` emits it as `shape=hexagon`
 * (`svek/SvekNode.java:337-338`); `DotStringFactory#solve` reads its
 * position as the min of graphviz's `points="..."` and stores those points,
 * translated to the node's own corner, as the node polygon
 * (`svek/DotStringFactory.java:414-420`, `SvekNode#setPolygon`,
 * `svek/SvekNode.java:414-416`); `EntityImageDescription#drawHexagon` draws
 * that polygon before `asSmall` (`EntityImageDescription.java:307-341`).
 *
 * `@knowvah/dot-engine`'s `NodeGeometry` exposes only the node centre and
 * size (`dist/api/geometry.d.ts`), never the polygon, and D5 rules out
 * engine edits. The polygon is therefore derived from the node box by
 * graphviz's own vertex rule, which for `hexagon` produces exactly the
 * jar's points -- see {@link hexagonPolygonPoints}.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/DotStringFactory.java
 * @see ~/git/graphviz/lib/common/shapes.c
 */
import type { Point2D } from '../../core/klimt/UTranslate.js';
import type { StringMeasurer } from '../../core/measurer.js';
import type { SpriteRegistry } from '../../core/sprite-commands.js';
import { KEYWORD_TO_SYMBOL } from '../../core/descriptive-keywords.js';
import { svgDouble } from '../../core/graph-layout-svek-read.js';
import { MeasurerStringBounder } from '../../core/measurer-bounder.js';
import { LimitFinder } from '../../core/klimt/drawing/LimitFinder.js';
import { EntityImageDescription } from '../../core/svek/image/EntityImageDescription.js';
import type { ClassifierKind } from './ast.js';
import type { ClassifierGeo } from './class-geo-types.js';
import type { ScaledTheme } from './class-scale-geo.js';
import { buildUSymbolEntityParams, usesClassUSymbolEntity } from './renderer-usymbol-entity.js';

/**
 * Whether a classifier is a `USymbols.HEXAGON` description leaf -- the
 * `symbol == USymbols.HEXAGON` test of `EntityImageDescription.java:127`.
 * The raw keyword goes through the same `KEYWORD_TO_SYMBOL` normalizer
 * `renderer-usymbol-entity.ts#resolveSymbolKeyword` reads.
 */
export function isHexagonLeaf(c: { readonly kind: ClassifierKind; readonly usymbol?: string }): boolean {
  if (c.kind !== 'descriptive' || c.usymbol === undefined) return false;
  return KEYWORD_TO_SYMBOL.get(c.usymbol) === 'hexagon';
}

/**
 * The node polygon `SvekNode#getPolygon` holds for a `width` x `height`
 * hexagon node, in the node's own frame (top-left at 0,0), closing point
 * included -- graphviz's SVG `points=` repeats the first vertex and
 * `DotStringFactory.java:416` keeps every parsed point.
 *
 * Vertex rule, `~/git/graphviz/lib/common/shapes.c:2221-2272` (`poly_init`,
 * `sides = 6`, no orientation/distortion/skew): the regular-polygon walk
 * starts at `angle = (sectorangle - PI) / 2` and steps `sectorangle =
 * PI / 3`, giving unit vertices `(1/2, 0)`, `(1/4, sqrt3/4)`,
 * `(-1/4, sqrt3/4)`, `(-1/2, 0)`, `(-1/4, -sqrt3/4)`, `(1/4, -sqrt3/4)`;
 * `:2274-2289` then rescales so the extremes are exactly `width/2` and
 * `height/2`. So, about the centre: `(+-w/2, 0)` and `(+-w/4, +-h/2)`, in
 * that order, y-up. Real `dot -Tsvg` on xagomi's cached `svek-1.dot`
 * (graphviz 16.1.0) prints `166.6,-33 124.95,-66 41.65,-66 0,-33 41.65,0
 * 124.95,0 166.6,-33`, the jar's `in.svg` polygon translated by (16, 6).
 *
 * Each coordinate is read at graphviz's printed precision (`svgDouble`,
 * `gvprintdouble`'s `%.02f`), as `DotStringFactory` parses it.
 */
export function hexagonPolygonPoints(width: number, height: number): Point2D[] {
  const pt = (x: number, y: number): Point2D => ({ x: svgDouble(x), y: svgDouble(y) });
  const midY = height / 2;
  return [
    pt(width, midY),
    pt((width * 3) / 4, 0),
    pt(width / 4, 0),
    pt(0, midY),
    pt(width / 4, height),
    pt((width * 3) / 4, height),
    pt(width, midY),
  ];
}

/**
 * Stamp `hexagonPolygon` on every hexagon leaf drawn through
 * `EntityImageDescription`, then its `symbolInk`: the `LimitFinder` walk
 * `SvekResult#calculateDimension` makes over the SAME drawU the renderer
 * runs (`svek/SvekResult.java:130-135`), so `drawHexagon`'s `UPolygon`
 * contributes `LimitFinder#drawUPolygon`'s `HACK_X_FOR_POLYGON` x-pad
 * (`klimt/drawing/LimitFinder.java:169-177`) instead of the box rule.
 * Mutates `leaves` in place, like `class-geo-builders-port.ts
 * #stampEntityPortLeaves`.
 */
export function stampHexagonLeaves(
  leaves: readonly ClassifierGeo[],
  theme: ScaledTheme,
  measurer: StringMeasurer,
  sprites: SpriteRegistry | undefined,
): void {
  for (const leaf of leaves) {
    if (!isHexagonLeaf(leaf) || !usesClassUSymbolEntity(leaf)) continue;
    leaf.hexagonPolygon = hexagonPolygonPoints(leaf.width, leaf.height);
    const finder = LimitFinder.create(new MeasurerStringBounder(measurer), false);
    new EntityImageDescription(buildUSymbolEntityParams(leaf, theme, sprites)).drawU(finder);
    leaf.symbolInk = { minX: finder.getMinX(), minY: finder.getMinY(), maxX: finder.getMaxX(), maxY: finder.getMaxY() };
  }
}
