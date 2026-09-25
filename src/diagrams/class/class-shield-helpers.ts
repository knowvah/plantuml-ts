/**
 * Port/qualifier "shield" helpers for the class diagram DOT-graph builder
 * (./class-dot-graph.ts). Split out of ./class-layout-helpers.ts (S2 — pure
 * relocation, no logic change) to keep both files under the repo's
 * 500-line-per-file cap and every function under the CCN/NLOC caps — same
 * split rationale as S1's class-object-sizing.ts. `class-layout-helpers.ts`
 * keeps `LIKE_CLASS_KINDS` (consumed by `memberPortIsP` below, imported back
 * from there) and `MeasuredClassifier`/`formatMemberText` (imported widely
 * elsewhere, not worth churning for this headroom), so every existing
 * `./class-layout-helpers.js` import site for those keeps working unchanged.
 */

import type { Classifier, ClassDiagramAST, ClassifierKind } from './ast.js';
import { LIKE_CLASS_KINDS } from './class-layout-helpers.js';
import { clipSplineStart, clipSplineEnd, type ClipRect as CoreClipRect } from '../../core/spline-clip.js';
import type { MagneticBorder } from '../../core/klimt/geom/MagneticBorder.js';
import type { StringMeasurer } from '../../core/measurer.js';
import type { Theme } from '../../core/theme.js';
import { FOLDER, PACKAGE } from '../../core/decoration/symbol/USymbols.js';
import { SymbolContext } from '../../core/decoration/symbol/SymbolContext.js';
import { HorizontalAlignment } from '../../core/klimt/geom/HorizontalAlignment.js';
import { TextBlockUtils } from '../../core/klimt/shape/TextBlockUtils.js';
import { XDimension2D } from '../../core/klimt/geom/XDimension2D.js';
import type { UTranslate } from '../../core/klimt/UTranslate.js';
import { namespaceTitleHeight, namespaceTitleWidth } from './class-namespace-title-runs.js';
import { movePointsEnd, movePointsStart } from './renderer-arrowhead-move.js';

/**
 * A cluster endpoint's rectangle (`Cluster#getRectangleArea`) plus, cdd2-T12
 * (CLIP-1a), its `Cluster#getMagneticBorder` — absent for
 * `MagneticBorderNone` (see {@link clusterMagneticBorder}).
 */
export interface ClipRect extends CoreClipRect {
  readonly magneticBorder?: MagneticBorder;
}

/**
 * Whether a leaf of this kind anchors a `Class::member` endpoint to that
 * member's own ROW port -- i.e. whether `class-port-rows.ts#classPortRows`
 * produces its bands, and equivalently whether {@link memberPortIsP} answers
 * `false` for it. Upstream has no such set: it asks the leaf itself
 * (`leaf.getEntityPosition().usePortP()`,
 * `~/git/plantuml/.../abel/Link.java:227-231`), and only a `port`/`portin`/
 * `portout` leaf ever answers `true` (`EntityPosition.PORTIN`/`PORTOUT` ->
 * `EntityPort.forPort`, `~/git/plantuml/.../cucadiagram/EntityPort.java
 * :60-62`). Deriving that answer from `ClassifierKind` is sound rather than
 * merely convenient: `LeafType` is a single discriminant upstream
 * (`abel/Entity.java:331-337`) and this engine's `ClassifierKind` mirrors
 * that exclusivity -- `port`/`portin`/`portout` declare a `'descriptive'`
 * leaf (`class-descriptive-leaf-keywords.ts`), disjoint from every member
 * accepted here, so no leaf of these kinds can reach `EntityPosition.PORTIN`/
 * `PORTOUT` in the first place.
 *
 * SI20 ADR-5 adds `object` to SI17's `LIKE_CLASS_KINDS`. An object body is a
 * `BodyEnhanced1` whose single block is a `MethodsOrFieldsArea`
 * (`cucadiagram/BodierLikeClassOrObject.java:225-233` ->
 * `BodyFactory.java:71`), so `EntityImageObject#getPorts`
 * (`svek/image/EntityImageObject.java:264-270`) composes its bands exactly
 * the way `EntityImageClass#getPorts` does (`EntityImageClass.java:247-253`),
 * and `classPortRows` serves both (SI20 ADR-3).
 *
 * `map`/`json` are deliberately NOT accepted (SI20 ADR-4): their bands are
 * `EntityImageMap`/`EntityImageJson`'s own per-row table, produced by
 * `class-map-port-rows.ts#mapPortRows` off the flat sizer's `dividerYs`, and
 * their `:P` marking is separately suppressed by `shouldMarkPort`.
 *
 * A PREDICATE, not a `Set` spread over `LIKE_CLASS_KINDS`: there is a real
 * import cycle here -- `class-layout-helpers.ts` -> `class-map-sizing.ts` ->
 * `class-port-rows.ts` -> this module -> `class-layout-helpers.ts` -- and
 * `LIKE_CLASS_KINDS` is declared near the END of that first module, so a
 * module-level `new Set([...LIKE_CLASS_KINDS, 'object'])` here evaluates
 * while the binding is still in its temporal dead zone and throws
 * `LIKE_CLASS_KINDS is not iterable` at import time (observed, not
 * theorized). Reading the set INSIDE the call defers it past module
 * initialization -- the shape {@link memberPortIsP} always had.
 */
export function isRowPortKind(kind: ClassifierKind): boolean {
  return LIKE_CLASS_KINDS.has(kind) || kind === 'object';
}

/**
 * Package/namespace ids used as a relationship endpoint OR a `note <pos> of
 * <package>` target. svek routes such an edge to a `zaent` point anchor
 * INSIDE that cluster (ClusterDotString) instead of drawing a separate node
 * for the package. Maps the endpoint id → anchor id. Only populated when a
 * namespace id actually appears as an endpoint/note-target, so the transform
 * is a no-op for every diagram that does not hit this case.
 */
/**
 * cdd-T13: `SvekEdge.java:671-672` -- `dotPath = dotPath.simulateCompound(
 * lhead == null ? null : lhead.getRectangleArea(), ltail == null ? null :
 * ltail.getRectangleArea())` -- trims a routed spline back to the boundary
 * of whichever cluster(s) it is anchored to (`:252-258` sets `ltail`/`lhead`
 * from the SAME `startUid`/`endUid` `Cluster.CENTER_ID` test
 * `packageEndpointAnchors` above already applies). `simulateCompound` runs
 * AFTER upstream's own direction-reversal check (`SvekEdge.java:643-655`),
 * so by the time it runs `dotPath`'s start point is always entity1's end
 * and its end point entity2's -- ported here as the caller passing
 * `startId`/`endId` already re-ordered to match `points[0]`/`points.at(-1)`
 * (`class-edge-geo.ts#normalizeEdgePoints`'s own `matchesFromTo`).
 *
 * `clusterRects` is keyed the SAME way {@link packageEndpointAnchors}'s
 * returned map is (namespace id -> ...), built by the caller from the real
 * graphviz cluster box (`class-geo-builders.ts#buildNamespaceGeos`'s own
 * `NamespaceGeo.x/y/width/height`, `Cluster#setPosition` verbatim -- the
 * SAME pre-shift coordinate frame `points` are in). An id absent from
 * `clusterRects` (not a cluster endpoint) or a rect the endpoint is already
 * outside of is a no-op -- `clipSplineStart`/`clipSplineEnd` carry that
 * guard themselves (`RectangleArea#contains`, `DotPath#simulateCompound`),
 * so passing the SAME id/rect to both ends (a note connector's one
 * possible cluster end, `note-layout-tip.ts#resolveGroupGeos` -- the
 * connector's own note-first/host-first order is not known at this seam,
 * `CommandFactoryNoteOnEntity.java:342-357`) is safe: only the end that is
 * actually inside the rect ever clips.
 */
export function clipClusterEdgeEnds(
  points: Array<{ x: number; y: number }>,
  startId: string | undefined,
  endId: string | undefined,
  clusterRects: ReadonlyMap<string, ClipRect>,
): Array<{ x: number; y: number }> {
  let result = points;
  const tail = startId !== undefined ? clusterRects.get(startId) : undefined;
  if (tail !== undefined) result = clipSplineStart(result, tail);
  const head = endId !== undefined ? clusterRects.get(endId) : undefined;
  if (head !== undefined) result = clipSplineEnd(result, head);
  return result;
}

/** `USymbolFolder.getForceAt` never measures text itself (its title block
 *  is pre-measured below); `folderMagneticBorder` only requires a bounder
 *  to be present. */
const UNUSED_BOUNDER = { calculateDimension: (): XDimension2D => new XDimension2D(0, 0) };

/** The cluster fields {@link clusterMagneticBorder} reads. */
export interface MagneticClusterBox {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly label: string;
}

/**
 * cdd2-T12 (CLIP-1a): `Cluster#getMagneticBorder` (`svek/Cluster.java:
 * 726-757`) for a class-diagram group. Every class group is
 * `GroupType.PACKAGE`, so upstream always builds the `ClusterDecoration`
 * (`ClusterDecoration.java:66-71 guess`: the group's own USymbol, else the
 * `packageStyle`'s) and asks its `asBig` block for the force; only
 * `USymbolFolder` (`package`/`folder`, `USymbols.java`) implements one
 * (`USymbolFolder.java:242-266`) — every other symbol inherits
 * `TextBlock#getMagneticBorder`'s `MagneticBorderNone`, returned here as
 * `undefined`. The force reads the rect's own width (`getWTitle`, `:127-134`,
 * matters for an empty title) and is expressed relative to the rect's
 * top-left (`position.move(-minX, -minY)`, `:752-754`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/Cluster.java
 */
export function clusterMagneticBorder(
  box: MagneticClusterBox,
  usymbol: string | undefined,
  theme: Theme,
  measurer: StringMeasurer,
): MagneticBorder | undefined {
  const folder = usymbol === 'folder' ? FOLDER : usymbol === 'package' ? PACKAGE : undefined;
  if (usymbol !== undefined && folder === undefined) return undefined;
  // `PackageStyle.toUSymbol`: FOLDER -> USymbols.PACKAGE, RECTANGLE -> USymbolRectangle.
  if (usymbol === undefined && theme.packageStyle === 'rect') return undefined;
  const title = TextBlockUtils.empty(
    namespaceTitleWidth(measurer, theme, box.label),
    namespaceTitleHeight(measurer, theme, box.label),
  );
  const asBig = (folder ?? PACKAGE).asBig(
    title,
    HorizontalAlignment.LEFT,
    TextBlockUtils.EMPTY_TEXT_BLOCK,
    box.width,
    box.height,
    new SymbolContext(null, null),
    HorizontalAlignment.CENTER,
  );
  const orig = asBig.getMagneticBorder!();
  return {
    getForceAt: (position): UTranslate =>
      orig.getForceAt({ x: position.x - box.x, y: position.y - box.y }, UNUSED_BOUNDER),
  };
}

/** cdd2-T12: a namespace's clip rect (`NamespaceGeo.x/y/width/height`,
 *  `Cluster#setPosition` verbatim) plus its {@link clusterMagneticBorder}. */
export function clusterClipRect(
  ns: MagneticClusterBox & { readonly usymbol?: string },
  theme: Theme,
  measurer: StringMeasurer,
): ClipRect {
  const rect = { x: ns.x, y: ns.y, width: ns.width, height: ns.height };
  const border = clusterMagneticBorder(ns, ns.usymbol, theme, measurer);
  return border !== undefined ? { ...rect, magneticBorder: border } : rect;
}

/**
 * cdd2-T12 (CLIP-1a): `SvekEdge#drawU`'s cluster arm (`SvekEdge.java:
 * 927-931,938-941`) — for an end whose entity is a cluster, `todraw
 * .moveStartPoint/moveEndPoint(getMagneticBorder().getForceAt(end))`
 * (`DotPath.java:206-216,229-234`). The extremity is drawn translated by the
 * same force (`:1124,1138`); this port draws it at the moved end point, so
 * it follows. A `MagneticBorderNone` cluster still moves by `(0, 0)`, as
 * upstream does (observable only through the removal branch on a zero-chord
 * first bezier).
 */
export function applyClusterMagneticBorders(
  points: Array<{ x: number; y: number }>,
  startId: string | undefined,
  endId: string | undefined,
  clusterRects: ReadonlyMap<string, ClipRect>,
): Array<{ x: number; y: number }> {
  let result = points;
  const tail = startId !== undefined ? clusterRects.get(startId) : undefined;
  if (tail !== undefined) {
    const f = forceAt(tail, result[0]!);
    result = movePointsStart(result, f.dx, f.dy);
  }
  const head = endId !== undefined ? clusterRects.get(endId) : undefined;
  if (head !== undefined) {
    const f = forceAt(head, result[result.length - 1]!);
    result = movePointsEnd(result, f.dx, f.dy);
  }
  return result;
}

function forceAt(rect: ClipRect, at: { x: number; y: number }): { dx: number; dy: number } {
  if (rect.magneticBorder === undefined) return { dx: 0, dy: 0 };
  const f = rect.magneticBorder.getForceAt(at);
  return { dx: f.getDx(), dy: f.getDy() };
}

export function packageEndpointAnchors(ast: ClassDiagramAST, clusterNsIds: ReadonlySet<string>): Map<string, string> {
  // Only a NON-EMPTY package (an actual cluster) gets an anchor; an empty
  // package used as an endpoint stays a plain rect node (oracle: mujopi p1/p3).
  const anchors = new Map<string, string>();
  for (const rel of ast.relationships) {
    if (clusterNsIds.has(rel.from)) anchors.set(rel.from, `zaent-${rel.from}`);
    if (clusterNsIds.has(rel.to)) anchors.set(rel.to, `zaent-${rel.to}`);
  }
  for (const note of ast.notes) {
    if (note.target !== undefined && clusterNsIds.has(note.target)) {
      anchors.set(note.target, `zaent-${note.target}`);
    }
  }
  return anchors;
}

/**
 * T2/ADR-2 (SI17, `.agent-notes/T8-member-ports-wrong-mechanism.md`): whether
 * a `::member` relationship TARGET still takes the PORTIN/PORTOUT ":P"
 * compass shield (`isPort`), per upstream's own discriminator --
 * `leaf.getEntityPosition().usePortP()` (`abel/Link.java:227-231`, ported at
 * `core/abel/EntityBase.ts:332`). Scoped to a {@link isRowPortKind} target
 * ONLY -- see that predicate's own doc comment for why the kind test is a
 * sound DERIVATION of `usePortP()` rather than an invented predicate.
 *
 * SI20 ADR-5 is the only change since: SI17 scoped the retirement to
 * `LIKE_CLASS_KINDS` because every other kind -- `object` in particular --
 * still lacked a row-port producer, and flipping one without its producer
 * anchors edges to ports the node never declares. SI20's T1 publishes the
 * object bands and `classPortShortNamesById` now elects them, so `object`'s
 * `:P` retires together with its producer landing, in one commit.
 * `map`/`json`/`descriptive` marking is untouched.
 */
function memberPortIsP(target: Classifier | undefined): boolean {
  return target === undefined || !isRowPortKind(target.kind);
}

/** B1 (SI17): `hasQualifier` is `SvekNode#isShielded`'s `hasKal1`/`hasKal2`
 *  half (svek/SvekNode.java:390-393) — set ONLY by `fromQualifier`/
 *  `toQualifier` below, never by a `::member` port relationship. Kept
 *  separate from `isPort` because a class-family port target ALSO lands in
 *  this map with `isPort: false` (`memberPortIsP`) yet is not shielded. */
export function shieldedClassifierIds(ast: ClassDiagramAST): Map<string, { isPort: boolean; hasQualifier: boolean }> {
  const shielded = new Map<string, { isPort: boolean; hasQualifier: boolean }>();
  const byId = new Map(ast.classifiers.map((c) => [c.id, c] as const));
  const mark = (id: string, isPort: boolean, hasQualifier: boolean): void => {
    const existing = shielded.get(id);
    if (existing === undefined) shielded.set(id, { isPort, hasQualifier });
    else {
      if (isPort) existing.isPort = true;
      if (hasQualifier) existing.hasQualifier = true;
    }
  };
  for (const rel of ast.relationships) {
    if (rel.fromPort !== undefined) mark(rel.from, memberPortIsP(byId.get(rel.from)), false);
    if (rel.toPort !== undefined) mark(rel.to, memberPortIsP(byId.get(rel.to)), false);
    if (rel.fromQualifier !== undefined) mark(rel.from, false, true);
    if (rel.toQualifier !== undefined) mark(rel.to, false, true);
  }
  return shielded;
}
