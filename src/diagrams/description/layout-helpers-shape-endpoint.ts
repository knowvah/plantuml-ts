/**
 * Link endpoint resolution + DOT node shape resolution for the description
 * diagram layout engine.
 *
 * Split out of `layout-helpers.ts` (project 500-line-per-file cap): this is
 * a cohesive cluster — both halves answer "what does an edge/node look like
 * to the DOT emitter" (an edge's endpoint node id vs. a leaf's `shape=`
 * attribute) — and neither half is needed by `layout-helpers-types.ts`, so
 * splitting it out keeps that leaf module a pure, dependency-free type file.
 * Depends on `layout-helpers-types.ts` only (one-way); `layout-helpers.ts`
 * re-exports every symbol below so existing importers keep their
 * `./layout-helpers.js` import path unchanged.
 */

import type { DescriptiveNode, DescriptiveLink } from './ast.js';
import type { StringMeasurer, FontSpec } from '../../core/measurer.js';
import type { USymbol } from '../../core/descriptive-keywords.js';
import type { DotInputNodeShape, DotInputGraph } from '../../core/graph-layout.js';
import type { EdgeContainerEndpoints, ResolvedEndpoint } from './layout-helpers-types.js';

/** SvekNode.appendLabelHtmlSpecialForPort's `width2 > 40` threshold: a port
 *  whose display text renders wider than this switches from the plain
 *  small `shape=rect` square to the `shape=plaintext` PORT="P" HTML table. */
const PORT_LABEL_WIDE_THRESHOLD = 40;
/** SvekNode.appendLabelHtmlSpecialForPortHtml's `fullWidth` floor. */
const PORT_TABLE_PAD_FLOOR = 10;

// ---------------------------------------------------------------------------
// Link endpoint resolution (moved from layout.ts — file-size limit)
// ---------------------------------------------------------------------------

/**
 * Synthetic DOT node id for a group's shared anchor point — Svek's
 * `Cluster.getSpecialPointId` (`"za" + group.getUid()`), one per group,
 * reused by every edge that targets that group directly (never one per
 * edge). Keyed off our own synthetic `clusterId` (never user-controlled)
 * rather than the AST id, so it can never collide with a user identifier.
 */
export function groupAnchorNodeId(clusterId: string): string {
  return `${clusterId}-anchor`;
}

/**
 * Resolve a link endpoint (`DescriptiveLink.from`/`to`) to the DOT node id
 * an edge should attach to.
 *
 * - A leaf id (including an EMPTY container — GraphvizImageBuilder.java:
 *   416-418 demotes every empty `GroupType.PACKAGE` group, which covers all
 *   description-diagram block groups, to a plain leaf entity) resolves to
 *   itself directly.
 * - A non-empty container id (the only remaining case — every empty
 *   container is already in `leafIdSet`) resolves to that group's shared
 *   anchor point (`Bibliotekon.getNodeUid`'s group fallback), never to one
 *   of its descendants — upstream never anchors a group-edge to a
 *   descendant leaf.
 *
 * `qualifiedPathToDotKey` (mission I1b, container-scoped identity —
 * namespace-groups.ts's `dotKeyFor`) is an optional translation table from
 * a node's ALWAYS-fully-qualified path (`command-table.ts`'s
 * `resolveEndpointNamespace`, whenever a link endpoint was resolved via a
 * dotted reference into an existing container) to whatever canonical key
 * `classifyAst` actually assigned that node — its bare id in the common
 * (non-colliding) case, or that same qualified path when disambiguation was
 * needed. A direct `id` lookup is tried FIRST and always wins when it
 * succeeds, so this fallback never changes behavior for any endpoint that
 * isn't a namespace-qualified reference.
 */
export function resolveEndpoint(
  id: string,
  leafIdSet: Set<string>,
  astNodeById: Map<string, DescriptiveNode>,
  clusterIdByContainerAstId: Map<string, string>,
  qualifiedPathToDotKey?: ReadonlyMap<string, string>,
): ResolvedEndpoint | undefined {
  const key = leafIdSet.has(id) || astNodeById.has(id) ? id : (qualifiedPathToDotKey?.get(id) ?? id);
  if (leafIdSet.has(key)) return { dotNodeId: key, containerAstId: undefined };
  const node = astNodeById.get(key);
  if (node === undefined) return undefined;
  const clusterId = clusterIdByContainerAstId.get(key);
  if (clusterId === undefined) return undefined;
  return { dotNodeId: groupAnchorNodeId(clusterId), containerAstId: key };
}

export function containerEndpointsInfo(
  fromRes: ResolvedEndpoint,
  toRes: ResolvedEndpoint,
): EdgeContainerEndpoints | undefined {
  const info: EdgeContainerEndpoints = {};
  if (fromRes.containerAstId !== undefined) info.fromContainerAstId = fromRes.containerAstId;
  if (toRes.containerAstId !== undefined) info.toContainerAstId = toRes.containerAstId;
  if (info.fromContainerAstId === undefined && info.toContainerAstId === undefined) {
    return undefined;
  }
  return info;
}

// Node shape: EntityImageDescription/SvekNode ShapeType -> Svek DOT shape.
// See plans/dot-oracle-sync/phase-2-description/shape-mechanism.md.

/** shapeType switch: FOLDER/PACKAGE stay `rect` (folder tab is render-only),
 *  HEXAGON->hexagon, USECASE(_BUSINESS)->ellipse. INTERFACE is resolved by
 *  {@link isInterfaceShielded}; everything else (actor included) is `rect`. */
export function symbolBaseShape(symbol: USymbol): DotInputNodeShape | undefined {
  if (symbol === 'hexagon') return 'hexagon';
  if (symbol === 'usecase' || symbol === 'usecase-business') return 'ellipse';
  return undefined;
}

/** getShield (hasKal1/hasKal2 qualifiers never apply to description
 *  diagrams). Gates the suppressions that zero hideText's shield: (a)
 *  isThereADoubleLink; (b) hasSomeHorizontalLinkVisible (non-hidden length-1
 *  link -- fixCircleLabelOverlapping defaults false, always applies); (c)
 *  hasSomeHorizontalLinkDoubleDecorated (length-1, decor both ends, no
 *  `!hidden` guard). */
export function isInterfaceShielded(
  id: string,
  links: readonly DescriptiveLink[],
  fixCircleLabelOverlapping = false,
): boolean {
  const touching = links.filter((l) => l.from === id || l.to === id);
  const others = new Set<string>();
  for (const l of touching) {
    const other = l.from === id ? l.to : l.from;
    if (others.has(other)) return false; // (a) isThereADoubleLink
    others.add(other);
  }
  // (b) hasSomeHorizontalLinkVisible — non-hidden length-1 link; suppresses
  //     only when fixCircleLabelOverlapping is false.
  if (!fixCircleLabelOverlapping && touching.some((l) => l.length === 1 && l.hidden !== true)) {
    return false;
  }
  // (c) hasSomeHorizontalLinkDoubleDecorated — length-1, decor on both ends
  //     (no !hidden guard); always suppresses.
  if (touching.some((l) => l.length === 1 && l.tailDecor !== undefined && l.headDecor !== undefined)) {
    return false;
  }
  return true;
}

/** Svek shape for a leaf: ShapeType map + shield/plaintext for `interface`
 *  (and `circle`, see below). */
export function shapeForNode(
  node: DescriptiveNode,
  links: readonly DescriptiveLink[],
  fixCircleLabelOverlapping = false,
): DotInputNodeShape | undefined {
  // `Entity.getUSymbol` (abel/Entity.java:415-416) overrides the leaf's
  // stored USymbol unconditionally for LeafType.CIRCLE: `if (getLeafType()
  // == LeafType.CIRCLE) return USymbols.INTERFACE;` -- a bare `circle X`
  // element is INTERFACE for every consumer (EntityImageDescription's
  // shapeType/hideText included), not the "default component" symbol the
  // local `usymbol = null` in CommandCreateElementFull might suggest at a
  // glance (that variable is validation-only, never stored). Confirmed
  // against the oracle (kizobu-64-rozo458, tacixe-99-gesi489): a lone
  // `circle` leaf renders shape=plaintext, not rect. `circle` shares the
  // interface shield mechanism byte-for-byte.
  if (node.symbol === 'interface' || node.symbol === 'circle') {
    return isInterfaceShielded(node.id, links, fixCircleLabelOverlapping) ? 'plaintext' : undefined;
  }
  return symbolBaseShape(node.symbol);
}

// ---------------------------------------------------------------------------
// Port entity shape (EntityPosition PORTIN/PORTOUT — abel/EntityPosition
// .java, SvekNode.appendLabelHtmlSpecialForPort)
// ---------------------------------------------------------------------------

/** `SvekNode#appendLabelHtmlSpecialForPort`'s `width2`: `final int width2 =
 *  (int) getMaxWidthFromLabelForEntryExit(stringBounder)`
 *  (svek/SvekNode.java:181-186) -- the port label's own width
 *  (`EntityImagePort.java:90-94`), TRUNCATED to int before either use below.
 *  cdd3-T28 (E3-23): the untruncated width made `sokevu-87-toce485`'s pad
 *  41.55 where the jar writes `WIDTH="41"`.
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekNode.java:181-186 */
function portLabelWidth2(node: DescriptiveNode, fontSpec: FontSpec, measurer: StringMeasurer): number {
  return Math.trunc(measurer.measure(node.display, fontSpec).width);
}

/** SvekNode.appendLabelHtmlSpecialForPort: `width2 > 40` switches a port
 *  leaf from the plain small `shape=rect` square to the `shape=plaintext`
 *  PORT="P" HTML table. */
export function isPortLabelWide(node: DescriptiveNode, fontSpec: FontSpec, measurer: StringMeasurer): boolean {
  return portLabelWidth2(node, fontSpec, measurer) > PORT_LABEL_WIDE_THRESHOLD;
}

/** appendLabelHtmlSpecialForPortHtml's `fullWidth` (`width2 - 40`, floored
 *  at 10, SvekNode.java:189-190) — the blank cell width flanking the
 *  PORT="P" cell. Only called once {@link isPortLabelWide} is true. */
export function portTablePad(node: DescriptiveNode, fontSpec: FontSpec, measurer: StringMeasurer): number {
  return Math.max(PORT_TABLE_PAD_FLOOR, portLabelWidth2(node, fontSpec, measurer) - PORT_LABEL_WIDE_THRESHOLD);
}

/** cdd3-T28 (E3-22): `Bibliotekon#getNodeUid` (svek/Bibliotekon.java:124-138)
 *  appends `:h` to a SHIELDED node's uid (`SvekNode#isShielded`,
 *  SvekNode.java:383-395: `shield().isZero() == false`), so every edge
 *  touching it leaves/enters the shield table's centre `PORT="h"` cell, not
 *  the margin-inflated table. Stamps that port onto the LAYOUT edges (the
 *  text emitter's `svek-dot-emit.ts#edgeRef` already writes the suffix) --
 *  the description counterpart of `class-dot-graph.ts#applyKalEdgePorts`.
 *  Mutates `input.edges` in place (the graph is freshly built by the caller). */
export function applyShieldEdgePorts(input: DotInputGraph): void {
  const shielded = new Set(
    input.nodes
      .filter((n) => n.shieldMargins !== undefined && Object.values(n.shieldMargins).some((v) => v !== 0))
      .map((n) => n.id),
  );
  if (shielded.size === 0) return;
  for (const edge of input.edges) {
    if (!shielded.has(edge.from) && !shielded.has(edge.to)) continue;
    const attrs = (edge.attributes ??= {});
    if (shielded.has(edge.from)) attrs.tailport = 'h';
    if (shielded.has(edge.to)) attrs.headport = 'h';
  }
}
