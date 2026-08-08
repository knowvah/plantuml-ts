/**
 * Pure, stateless helpers for the description diagram layout engine.
 *
 * Reduced for the single-pass cluster layout: grid-based inner layout,
 * InnerLayoutResult, and buildContainerOwnerMap are removed. What remains:
 * container membership/bbox, coordinate shift, spline-clip boundary check,
 * the node-geo index, and the degenerate-single-leaf fast path. Types and
 * sizing constants live in `layout-helpers-types.ts`; link-endpoint and DOT
 * node-shape resolution live in `layout-helpers-shape-endpoint.ts` — both
 * re-exported below so existing importers keep their `layout-helpers`
 * import path.
 */

import type { DescriptionDiagramAST, DescriptiveNode } from './ast.js';
import type { StringMeasurer, FontSpec } from '../../core/measurer.js';
import { CONTAINER_SYMBOLS } from './parse-helpers.js';
import type { USymbol } from '../../core/descriptive-keywords.js';
import { spriteDimsLookupFor } from '../../core/sprite-commands.js';
import { emojiArtworkResolverFor } from '../../core/internal-emoji-store.js';
import { visibleStereotypeLabels, nodeWithVisibleStereotype } from './element-grammar.js';

// ---------------------------------------------------------------------------
// Types + sizing constants (moved to layout-helpers-types.ts — file-size
// limit; re-exported here so existing importers keep this import path)
// ---------------------------------------------------------------------------

import {
  type DescriptionNodeGeo,
  type Bbox,
  type DescriptionGeometry,
  CONTAINER_PADDING,
  CONTAINER_TOP_PAD,
  EMPTY_CONTAINER_WIDTH,
  EMPTY_CONTAINER_HEIGHT,
  LAYOUT_MARGIN,
  LAYOUT_MARGIN_LEADING,
} from './layout-helpers-types.js';
export type {
  DescriptionNodeGeo,
  Bbox,
  EdgeContainerEndpoints,
  ResolvedEndpoint,
  DescriptionEdgeGeo,
  DescriptionGeometry,
} from './layout-helpers-types.js';
export {
  CONTAINER_PADDING,
  CONTAINER_TOP_PAD,
  EMPTY_CONTAINER_WIDTH,
  EMPTY_CONTAINER_HEIGHT,
  LAYOUT_MARGIN,
  LAYOUT_MARGIN_LEADING,
  GROUP_ANCHOR_SIZE,
} from './layout-helpers-types.js';

// ---------------------------------------------------------------------------
// Link endpoint resolution + DOT node shape (moved to
// layout-helpers-shape-endpoint.ts — file-size limit; re-exported here so
// existing importers keep this import path)
// ---------------------------------------------------------------------------

export {
  groupAnchorNodeId,
  resolveEndpoint,
  containerEndpointsInfo,
  symbolBaseShape,
  isInterfaceShielded,
  shapeForNode,
  isPortLabelWide,
  portTablePad,
} from './layout-helpers-shape-endpoint.js';

// ---------------------------------------------------------------------------
// Leaf sizing + title-label sizing (leaf-sizing.js / title-label-sizing.js)
// ---------------------------------------------------------------------------

// Leaf-node box sizing (measureLeafNode + its per-symbol USymbol margin table)
// lives in ./leaf-sizing.js; title-bar sizing (measureTitleLabel) lives in
// ./title-label-sizing.js. Both are used internally here and by layout.ts;
// re-exported so existing importers keep their `layout-helpers` import path.
import { measureLeafNode, type BoxSizingOpts } from './leaf-sizing.js';
export {
  measureLeafNode,
  ACTOR_WIDTH,
  ACTOR_HEIGHT,
  USECASE_HEIGHT,
  PORT_SIZE,
} from './leaf-sizing.js';
export { measureTitleLabel, measureShadowAnchorDims } from './title-label-sizing.js';

// ---------------------------------------------------------------------------
// Container membership
// ---------------------------------------------------------------------------

export function isContainer(symbol: USymbol): boolean {
  return CONTAINER_SYMBOLS.has(symbol);
}

/**
 * True when an AST node becomes a graphviz cluster:
 * has a container symbol AND has at least one child.
 */
export function isClusterNode(node: DescriptiveNode): boolean {
  return isContainer(node.symbol) && node.children.length > 0;
}

// ---------------------------------------------------------------------------
// Container bounding box
// ---------------------------------------------------------------------------

/**
 * Compute a container's bbox as the padded union of its direct children's
 * bboxes (each child may be a leaf geo or a container geo already padded).
 * Returns EMPTY_CONTAINER dimensions when directChildren is empty.
 */
export function computeContainerBbox(directChildren: DescriptionNodeGeo[]): Bbox {
  if (directChildren.length === 0) {
    return { x: 0, y: 0, width: EMPTY_CONTAINER_WIDTH, height: EMPTY_CONTAINER_HEIGHT };
  }
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const c of directChildren) {
    if (c.x < minX) minX = c.x;
    if (c.y < minY) minY = c.y;
    if (c.x + c.width > maxX) maxX = c.x + c.width;
    if (c.y + c.height > maxY) maxY = c.y + c.height;
  }
  return {
    x: minX - CONTAINER_PADDING,
    y: minY - CONTAINER_TOP_PAD,
    width: (maxX - minX) + 2 * CONTAINER_PADDING,
    height: (maxY - minY) + CONTAINER_TOP_PAD + CONTAINER_PADDING,
  };
}

// ---------------------------------------------------------------------------
// Coordinate shift
// ---------------------------------------------------------------------------

/** Recursively shift a DescriptionNodeGeo and all its descendants by (dx, dy). */
export function shiftGeo(geo: DescriptionNodeGeo, dx: number, dy: number): DescriptionNodeGeo {
  return {
    ...geo,
    x: geo.x + dx,
    y: geo.y + dy,
    children: geo.children.map((c) => shiftGeo(c, dx, dy)),
  };
}

// ---------------------------------------------------------------------------
// Spline clipping at bbox boundary
// ---------------------------------------------------------------------------

export function insideBbox(p: { x: number; y: number }, b: Bbox): boolean {
  return p.x >= b.x && p.x <= b.x + b.width && p.y >= b.y && p.y <= b.y + b.height;
}

// Spline↔container-bbox clipping (`clipSplineStart`/`clipSplineEnd`) lives in
// `spline-clip.ts`: it needs `insideBbox`/`Bbox` from here, and was split out
// both to stay under the 500-line cap and because the bezier-aware rewrite
// (de Casteljau boundary split, follow-up F1) grew past a one-liner.

// ---------------------------------------------------------------------------
// Node-geo index (flat id → geo, including descendants)
// ---------------------------------------------------------------------------

export function buildNodeGeoIndex(
  geos: readonly DescriptionNodeGeo[],
): Map<string, DescriptionNodeGeo> {
  const map = new Map<string, DescriptionNodeGeo>();
  function index(list: readonly DescriptionNodeGeo[]): void {
    for (const g of list) {
      map.set(g.id, g);
      if (g.children.length > 0) index(g.children);
    }
  }
  index(geos);
  return map;
}

/**
 * GraphvizImageBuilder.buildImage:211-222: a diagram with zero groups, zero
 * links, and exactly one root leaf (DotData.isDegeneratedWithFewEntities —
 * checked BEFORE empty-group demotion, so a lone empty braced container does
 * NOT qualify) is drawn directly as EntityImageDegenerated; PlantUML never
 * invokes graphviz. We must not either, or the DOT graph counts diverge.
 * Hexagon leaves are excluded upstream and take the normal svek path.
 */
export function degenerateSingleLeaf(
  ast: DescriptionDiagramAST,
  containersCount: number,
  fontSpec: FontSpec,
  measurer: StringMeasurer,
  boxOpts: BoxSizingOpts | undefined,
): DescriptionGeometry | undefined {
  // #lizard forgives — pre-existing: CCN is a flat chain of early-return
  // guards (the upstream "does this qualify as a degenerate single leaf?"
  // predicate), and the 5 params are the cohesive leaf-measurement context
  // threaded from the caller. Surfaced by a full-file rescan, not new here.
  if (ast.links.length !== 0 || containersCount !== 0) return undefined;
  if (ast.nodes.length !== 1) return undefined;
  const node = ast.nodes[0]!;
  if (node.declaredAsGroup === true || node.symbol === 'hexagon') return undefined;
  // SI5b+E2r T7 write-set expansion (journaled, seam (c) completeness): the
  // degenerate single-leaf path bypasses `runLayout`'s normal DOT pipeline
  // entirely, so it needs its OWN sprite-dims bridge for D9 measurement —
  // same one-liner `layout.ts#layoutDescription` builds for the normal path.
  const sprites = ast.sprites !== undefined ? spriteDimsLookupFor(ast.sprites) : undefined;
  const emojiArtwork = emojiArtworkResolverFor(ast.sprites?.emoji);
  // G1 I-hideshow: a single-root-leaf diagram can still carry `hide
  // stereotype`/`hide <<label>> stereotype` -- filter BEFORE sizing so a
  // hidden guillemet block reserves no footprint (EntityImageUseCase.java
  // :96-109/EntityImageDescription.java:190-201 both size from the
  // ALREADY-filtered `portionShower.getVisibleStereotypeLabels` result,
  // not the raw stereotype list). No corpus fixture in this iteration's
  // 13-fixture reach exercises this path (all have links/containers) --
  // included for structural consistency with the two other assignment
  // points (`layout.ts#buildGeoNode`, `layout.ts#buildDotNodes`), which
  // both filter the identical way.
  const stereotypeRules = ast.stereotypeVisibilityRules ?? [];
  const visibleStereotype = visibleStereotypeLabels(node.stereotype, stereotypeRules);
  const visibleNode = nodeWithVisibleStereotype(node, stereotypeRules);
  // Emoji artwork rides into the sizer on `BoxSizingOpts` so the ellipse fit
  // draws the real glyph — the RENDERER resolves the same store off the same
  // registry (`renderer-entity.ts`), keeping the two in lock-step.
  const sizingOpts =
    emojiArtwork === undefined ? boxOpts : { ...(boxOpts ?? {}), emojiArtwork };
  const dims = measureLeafNode(visibleNode, fontSpec, measurer, sizingOpts, sprites);
  const geo: DescriptionNodeGeo = {
    id: node.id,
    symbol: node.symbol,
    display: node.display,
    x: LAYOUT_MARGIN_LEADING,
    y: LAYOUT_MARGIN_LEADING,
    width: dims.width,
    height: dims.height,
    children: [],
  };
  if (visibleStereotype !== undefined && visibleStereotype.length > 0) geo.stereotype = visibleStereotype;
  // The `<<$name>>` half of the same stereotype run. Threaded so the RENDERER
  // resolves the same sprite the sizer just measured — without it the sizer
  // reserves the sprite box while the renderer draws `«name»` as text, the
  // exact sizer/renderer split `planning/sizer-renderer-parity.md` exists to
  // prevent.
  if (node.stereotypeSprite !== undefined) geo.stereotypeSprite = node.stereotypeSprite;
  if (node.color !== undefined) geo.color = node.color;
  if (node.creationIndex !== undefined) geo.creationIndex = node.creationIndex;
  // Hoisted out of the `return` (was an inline `...(cond ? {…} : {})`
  // spread): identical spread semantics, but the inline ternary-object
  // literal there desyncs lizard's TS brace-tracking, which silently drops
  // this function's `#lizard forgives` marker (confirmed empirically —
  // same class of TS-reader misparse as USymbolRectangle.ts's
  // `computeStereoPos` extraction note).
  const spritesField = ast.sprites !== undefined ? { sprites: ast.sprites } : {};
  return {
    totalWidth: dims.width + LAYOUT_MARGIN_LEADING + LAYOUT_MARGIN,
    totalHeight: dims.height + LAYOUT_MARGIN_LEADING + LAYOUT_MARGIN,
    nodes: [geo],
    edges: [],
    ...spritesField,
  };
}
