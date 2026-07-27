/**
 * Pure type/const declarations for the description diagram layout engine.
 *
 * Split out of `layout-helpers.ts` (project 500-line-per-file cap) as a leaf
 * module: nothing here is a function, so nothing here can trip a complexity
 * limit. Both `layout-helpers.ts` and `layout-helpers-shape-endpoint.ts`
 * import from this file; this file imports from neither of them (one-way
 * dependency). `layout-helpers.ts` re-exports everything below so existing
 * importers keep their `./layout-helpers.js` import path unchanged.
 */

import type { DescriptiveLinkStyle } from './ast.js';
import type { USymbol } from '../../core/descriptive-keywords.js';
import type { SpriteRegistry } from '../../core/sprite-commands.js';
import type { ScaleSpec } from '../../core/scale-command.js';

// ---------------------------------------------------------------------------
// Public output node type
// ---------------------------------------------------------------------------

export interface DescriptionNodeGeo {
  id: string;
  /** Upstream USymbol shape — drives render dispatch in T6. */
  symbol: USymbol;
  display: string;
  x: number;
  y: number;
  width: number;
  height: number;
  children: DescriptionNodeGeo[];
  /** G1 I5b: ALL stereotype tags, in source order (see
   *  `DescriptiveNode.stereotype`'s doc comment). */
  stereotype?: readonly string[];
  /** Raw inline color/style override string (`#orange;line:blue`,
   *  `#line.dashed`), verbatim from `DescriptiveNode.color` — parsed at
   *  render time by `renderer-entity.ts#parseColorOverride` (mirrors
   *  upstream `Colors`, klimt/color/Colors.java — see that parser's own
   *  doc comment for the token grammar and what is/isn't ported). */
  color?: string;
  /** I3b write-set expansion (journaled) -- copied straight through from
   *  `DescriptiveNode.creationIndex` by `layout.ts#buildGeoNode` (and
   *  `degenerateSingleLeaf`'s own single-node geo) -- see that field's doc
   *  comment for the shared parse-time counter mechanism. Consumed only by
   *  `renderer-uid.ts#buildUidPlan`; no layout math reads it. */
  creationIndex?: number;
  /** I3b write-set expansion (journaled) -- copied straight through from
   *  `DescriptiveNode.declaredAsGroup`. An EXPLICITLY-braced container
   *  (`component X { }`) keeps this flag even when EMPTY (`children.length
   *  === 0`) -- `GraphvizImageBuilder.printGroups` (java:408-423) demotes
   *  an empty `GroupType.PACKAGE` to a leaf-drawn `EMPTY_PACKAGE` entity
   *  but still registers it in ITS OWN group-sibling iteration (drawn
   *  before/interleaved with real subgroups, never with true top-level
   *  leaves) -- consumed only by `renderer.ts#collectByKind`'s draw-order
   *  walk; no layout math reads it. */
  declaredAsGroup?: true;
  /** G1 I5 write-set expansion (journaled) -- set ONLY on a `symbol ===
   *  'port'` child, by `layout.ts#buildGeoNode`'s container branch (the
   *  one place a port's parent cluster bbox AND the port's own resolved
   *  x/y are both in scope at once). Mirrors upstream `EntityImagePort
   *  .upPosition()` (svek/image/EntityImagePort.java:76-80): `true` when
   *  the port's top edge (`y`) sits above its parent cluster's vertical
   *  CENTER (`node.getMinY() < clusterCenter.getY()`) -- drives which side
   *  of the port's small box `renderer-entity.ts#drawPortFallback` draws
   *  its label text on. Consumed only there; no other layout math reads
   *  it. Absent on every non-port node (upstream's own check is only ever
   *  reached from `EntityImagePort`). */
  portLabelAbove?: boolean;
  /** G1 I-hideshow: `true` when this node (or an ancestor container) is
   *  hidden by a `hide`/`show` entity-visibility rule
   *  (`element-grammar.ts#effectiveHiddenIds`) -- draw-time-only, computed
   *  AFTER layout (position/size are unaffected, jar-verified: hidden
   *  entities still fully participate in the DOT graph, only their drawing
   *  is suppressed). Consumed by `renderer.ts#drawClusters`/
   *  `#drawEntities` to skip the node entirely; absent means visible
   *  (every non-hide fixture never sets it). */
  hidden?: true;
}

// ---------------------------------------------------------------------------
// Axis-aligned bounding box (internal utility)
// ---------------------------------------------------------------------------

export interface Bbox {
  x: number;
  y: number;
  width: number;
  height: number;
}

// ---------------------------------------------------------------------------
// Link endpoint resolution types (the functions that produce/consume these
// live in `layout-helpers-shape-endpoint.ts`; re-exported from
// `layout-helpers.ts`)
// ---------------------------------------------------------------------------

export interface EdgeContainerEndpoints {
  fromContainerAstId?: string;
  toContainerAstId?: string;
}

/**
 * DOT node id an edge endpoint resolves to (`dotNodeId`), plus the AST
 * container id when the endpoint targeted a group directly (`containerAstId`
 * — used for spline-clipping to the container's rendered bbox, unchanged by
 * the group-anchor mechanism below).
 */
export interface ResolvedEndpoint {
  dotNodeId: string;
  containerAstId: string | undefined;
}

// ---------------------------------------------------------------------------
// Edge geo + top-level layout result
// ---------------------------------------------------------------------------

export interface DescriptionEdgeGeo {
  id: string;
  from: string;
  to: string;
  points: Array<{ x: number; y: number }>;
  label?: { text: string; x: number; y: number };
  stereotype?: string;
  /** G1 I5e: true ONLY for the post-colon-embedded stereotype form (the
   *  one shape upstream actually draws as a visible edge label) -- see
   *  `DescriptiveLink.stereotypeIsLinkLabel`'s doc comment for the full
   *  mechanism. Absent means the pre-colon/style-selector-only form,
   *  never drawn. */
  stereotypeIsLinkLabel?: true;
  /** Final resolved style category (queue char + bracket override) -- see
   *  `DescriptiveLink.style`'s doc comment. Copied straight through by
   *  `layout-geo-post.ts#assembleEdgeGeo`. */
  style: DescriptiveLinkStyle;
  /** Bracket `thickness=N` override -- see `DescriptiveLink
   *  .thicknessOverride`'s doc comment. */
  styleThickness?: number;
  /** Bracket `#color` override (primary segment only, leading `#`
   *  stripped) -- see `DescriptiveLink.colorOverride`'s doc comment. Feeds
   *  BOTH the line stroke and the (same-color) filled extremity, matching
   *  upstream `svek/SvekEdge.java:884-893`. */
  styleColor?: string;
  arrowHead?: 'open' | 'filled' | 'none';
  /**
   * T17 write-set expansion (journaled — see the mission decision journal):
   * the raw `DescriptiveLink.tailDecor`/`.headDecor` tokens, carried through
   * unchanged from the AST so `renderDescription` can feed `SvekEdge`'s full
   * `LinkDecorName` vocabulary (composition/aggregation/extends/crowfoot/…)
   * instead of only the lossy `arrowHead` open/filled/none classification.
   * No layout math reads these — passthrough only.
   */
  tailDecor?: string;
  headDecor?: string;
  /** I3b write-set expansion (journaled) -- copied straight through from
   *  `DescriptiveLink.creationIndex` by `layout-geo-post.ts#assembleEdgeGeo`
   *  -- see that field's doc comment. Consumed only by
   *  `renderer-uid.ts#buildUidPlan`; no layout math reads it. */
  creationIndex?: number;
  /** `true` when EITHER endpoint entity is hidden by a `hide`/`show`
   *  rule (`Link#isHidden()`, abel/Link.java:458-459's `cl1.isHidden() ||
   *  cl2.isHidden()` disjunct ONLY). Computed by `layout-geo-post.ts
   *  #assembleEdgeGeo` from the SAME `hidden` id set `buildGeoNode` uses;
   *  consumed by `renderer.ts#drawEdges` to skip the edge entirely
   *  (jar-verified: comp1--comp2 with comp2 hidden draws neither entity
   *  NOR the connecting edge, component/ciboso-93-romi495).
   *
   *  G1 I-linkstyle: the THIRD upstream disjunct, `Link#isHidden()`'s own
   *  `this.hidden` field (the `-[hidden]-` bracket keyword,
   *  `DescriptiveLink.hidden`) is DELIBERATELY still not folded in here --
   *  attempted and reverted. Wiring it (OR-ing `link.hidden` into this
   *  field) correctly elides the edge's `<path>`/`<polygon>` (jar-verified
   *  component/balopu-66-jagu236: `-[hidden]->` draws nothing, matching
   *  the jar) but REGRESSES the diagram's overall canvas size on fixtures
   *  where that edge's un-drawn geometry would otherwise have extended the
   *  ink-extent bounding box (component/dujodu-23-viba393: 5->159 diffs,
   *  component/tujica-34-tire129: 1->62 diffs -- both `svg/@width
   *  @height @viewBox` shrink below the jar's value). This is the SAME
   *  class of gap I-hideshow already root-caused and partially fixed for
   *  hidden ENTITIES ("hidden entities must still reserve canvas space" --
   *  upstream's `UHidden` wraps the `UGraphic` so draw calls still run
   *  (and still register ink-extent) but paint nothing; this port's
   *  coarse "skip the draw call entirely" approximation loses that
   *  ink-extent registration) -- not yet extended to hidden EDGES. Fixing
   *  it requires the edge to still contribute its spline's ink extent to
   *  the canvas-size computation while suppressing only the visible paint,
   *  a LimitFinder-adjacent mechanism out of a bracket-modifier-parsing
   *  iteration's scope. */
  hidden?: true;
}

export interface DescriptionGeometry {
  totalWidth: number;
  totalHeight: number;
  nodes: DescriptionNodeGeo[];
  edges: DescriptionEdgeGeo[];
  /** T17 seed thread — see `DescriptionDiagramAST.seed`'s doc comment.
   *  Copied straight through from the AST by `layout.ts`; no layout math
   *  reads it. Consumed by `renderDescription`'s `UGraphicSvg.build` call. */
  seed?: bigint;
  /**
   * SI5b+E2r T7 write-set expansion (journaled, additive-only, same
   * pattern as `seed` above): the diagram's `sprite $name {...}` registry
   * (T4, `ast.sprites`), copied straight through by `layout.ts` — no
   * layout math reads it (D9 measurement already resolved sprite DIMS via
   * `leaf-sizing.ts`'s `SpriteDimsLookup` param, seam (b)). Consumed only
   * at render time (`renderer.ts` -> `renderer-entity.ts#drawEntity` ->
   * `render-atoms.ts`) to resolve `<$name>` atoms to actual tinted PNGs.
   * `SyncPlugin#render(geo, theme)`'s two-arg contract has no `ast`
   * param — this mirrors `seed`'s own established precedent for getting
   * AST-only data to the render phase through `geo` instead.
   */
  sprites?: SpriteRegistry;
  /**
   * Mission G1 I-scale write-set expansion (journaled, additive-only,
   * same pattern as `seed`/`sprites` above): the diagram's `scale ...`
   * directive (`DescriptiveNode`'s sibling field, `ast.ts`'s `scale` doc
   * comment), copied straight through by `layout.ts` -- no layout math
   * reads it (scale is an SVG-emission-time concern only). Consumed only
   * by `renderer.ts#renderDescription`, which resolves it to a clamped
   * numeric factor (`scale-command.ts#resolveScaleFactor`) against the
   * diagram's own unscaled document dimension.
   */
  scale?: ScaleSpec;
}

// ---------------------------------------------------------------------------
// Sizing constants (exported so layout.ts and siblings can use them)
// ---------------------------------------------------------------------------

/** Padding on left / right / bottom inside a container box. */
export const CONTAINER_PADDING = 16;
/** Extra space at the top of a container box for its label. */
export const CONTAINER_TOP_PAD = 28;

/** Width of an empty container (container symbol with no children). */
export const EMPTY_CONTAINER_WIDTH = 160;
/** Height of an empty container. */
export const EMPTY_CONTAINER_HEIGHT = 80;
/** Trailing (right/bottom) diagram margin (jar-verified 12px on `[A]`). */
export const LAYOUT_MARGIN = 12;
/** Leading (left/top) margin where content starts — jar-verified 7px
 *  (`[A]`: outermost rect at 7,7). Asymmetric with the trailing margin;
 *  total = LAYOUT_MARGIN_LEADING + content + LAYOUT_MARGIN. */
export const LAYOUT_MARGIN_LEADING = 7;
/** Svek group-anchor point size — `width=.01` (inches) in ClusterDotString
 *  .java:149/183, converted to px (0.01in * 72px/in). Height matches width;
 *  our layout engine (unlike real graphviz's `point` shape) always requires
 *  an explicit height. */
export const GROUP_ANCHOR_SIZE = 0.72;
