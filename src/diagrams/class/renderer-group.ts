/**
 * renderer-group.ts — G2 N2 (mechanism 3): the per-element `<g class=
 * "entity"|"cluster"|"link">` wrapper + `<!--...-->` comment every jar
 * class-diagram fixture stamps around each drawn classifier/namespace/
 * edge (verified against `bedogi-86-kala547`, `bajotu-30-soku184`,
 * `befasi-62-vimu310` — see `plans/g2-class-svg/ledger.md` N1 mechanism 3
 * and N2's own entry).
 *
 * A pure-string sibling of `core/svek/DecorateEntityImage.ts
 * #decorateEntityDrawing` / `core/svek/Cluster.ts` / `core/svek/SvekEdge
 * .ts` (the klimt-`UGraphic`-based machinery description already uses for
 * the SAME wrapper shape) — NOT a klimt adoption: `class/renderer.ts`
 * draws every classifier/namespace/edge as a plain SVG string (`core/svg
 * .ts`'s `rect`/`text`/`path`/… helpers), never through a `UGraphic`, so
 * reusing the klimt-based wrapper would mean either migrating the whole
 * classifier-drawing path to klimt (EntityImageClass has no port yet — a
 * much larger, un-scoped iteration) or round-tripping through a throwaway
 * `UGraphicSvg` document per element (extra allocation/extraction
 * overhead for no behavioral gain, since `class="..."`/`id="..."`
 * ordering doesn't matter here — see below). Deliberately duplicates only
 * the OBSERVABLE shape (attribute names/values), not the klimt
 * `UGroup`/`UGroupType` machinery itself.
 *
 * Attribute VALUE correctness matters far less than it looks: `tests/
 * oracle/svg-conformance/normalize.ts` strips every `data-*` attribute
 * before comparison (adaptation #2) and sorts the survivors alphabetically
 * (attribute ORDER is irrelevant), so `data-qualified-name`/
 * `data-entity-1`/`data-entity-2`/`data-link-type` never affect
 * conformance — only `class` and `id` (the uid) do, plus the wrapping
 * `<g>` itself (structural `childCount`). The data-* values are still
 * populated here for genuine upstream fidelity (porting discipline), not
 * because the census requires it.
 *
 * `data-source-line` is OMITTED entirely — this port's class parser has
 * no line-number tracking yet (a separate, un-scoped write-set expansion,
 * comparable in size to description's own I3b `creationIndex` threading;
 * named remainder, `plans/g2-class-svg/ledger.md` N2). Harmless for
 * conformance (also `data-*`, also stripped).
 */
import { group, linkWrap } from '../../core/svg.js';
import type { UrlInfo } from './class-url.js';
import { escapeComment } from '../../core/svg-format.js';
import { getLinkTypeName, looksLikeRevertedForSvg } from '../../core/svek/extremity/link-decor.js';
import type { LinkDecorName } from '../../core/svek/extremity/link-decor.js';
import type { Point2D } from '../../core/klimt/UTranslate.js';
import { UTranslate } from '../../core/klimt/UTranslate.js';
import { UGraphicSvg } from '../../core/klimt/drawing/svg/u-graphic-svg.js';
import type { UGraphic } from '../../core/klimt/UGraphic.js';
import { basicSvgOption } from '../../core/klimt/drawing/svg/svg-graphics.js';
import { extractFlatContent } from '../../core/klimt/document-shell.js';
import { Fore } from '../../core/klimt/Fore.js';
import { Back } from '../../core/klimt/Back.js';
import { UStroke } from '../../core/klimt/UStroke.js';
import { UPolygon } from '../../core/klimt/shape/UPolygon.js';
import { ULine } from '../../core/klimt/shape/ULine.js';
import { rotatePoint } from '../../core/svek/extremity/rotate-point.js';
import { protectedInnerBox } from './class-dot-graph.js';
import type { ClassifierGeo, EdgeGeo } from './layout.js';
import type { Theme } from '../../core/theme.js';

/** Leaf (unqualified) portion of a dotted `Classifier.id`/`Relationship
 *  .from`/`.to` — the jar entity comment (`<!--class NAME-->`) and link
 *  comment (`<!--link X to Y-->`) both use the bare declared/alias name,
 *  never the namespace-qualified id (verified: `besepi-37-rori892`'s
 *  aliased, unnamespaced classifiers; `bajotu-30-soku184`'s namespaced
 *  `p1.cl1` comments as `<!--class cl1-->`). A fixed `.` split (not the
 *  diagram's real, possibly-customized `set separator`) — the comment
 *  text does not affect conformance (see module doc comment), so this is
 *  a documented best-effort approximation, not a precision requirement. */
export function leafPortion(id: string): string {
  const idx = id.lastIndexOf('.');
  return idx === -1 ? id : id.slice(idx + 1);
}

/** Wraps a classifier or note's rendered body in the jar's `<g
 *  class="entity" data-qualified-name="..." id="...">` group, preceded by
 *  `<!--class NAME-->` when `withComment` (upstream: `EntityImageClass
 *  .java:142` always comments; `EntityImageNote.java` never does — see
 *  `core/svek/DecorateEntityImage.ts#decorateEntityDrawing`'s own
 *  `withComment` precedent for the identical description-side split). */
export function wrapEntity(
  name: string,
  uid: string,
  qualifiedName: string,
  withComment: boolean,
  inner: string,
): string {
  // SI-saea T3c/D8: `escapeComment` defangs `--` the way the jar's
  // `XmlWriter.comment` does, closing the `x--><script>...` breakout.
  const comment = withComment ? '<!--class ' + escapeComment(name) + '-->' : '';
  // SI-saea T3a/D2: raw -- `group()`'s `attrsFromRecord` now escapes.
  return comment + group(inner, { class: 'entity', 'data-qualified-name': qualifiedName, id: uid });
}

/** Wraps a namespace's rendered body in the jar's `<g class="cluster"
 *  data-qualified-name="..." id="...">` group, preceded by `<!--cluster
 *  NAME-->` (upstream `Cluster#drawU`, `svek/Cluster.java` — same
 *  synthetic-`##`-name comment skip `core/svek/Cluster.ts#drawU` already
 *  ports, reproduced here for the class-local plain-string path).
 *
 *  cdd-T12 (diagnosis A2b E4): a `package X [[url]] {` header's own url is
 *  opened INSIDE the cluster group and BEFORE the decoration --
 *  `svek/Cluster.java:337-341` (`ug.startGroup(uGroup); final Url url =
 *  group.getUrl99(); if (url != null) ug.startUrl(url);`), closed in the
 *  `finally` at `:379-382` (`if (url != null) ug.closeUrl();
 *  ug.closeGroup();`). So the jar's cluster has exactly ONE child, an
 *  `<a>`, holding the outline/line/title — not the three bare children this
 *  port emitted. Reuses `core/svg.ts#linkWrap`, the same `<a>`-emitter the
 *  classifier path already goes through (`renderer-url.ts
 *  #wrapClassifierBody`). */
export function wrapCluster(name: string, uid: string, qualifiedName: string, inner: string, url?: UrlInfo): string {
  // SI-saea T3c/D8: `escapeComment` defangs `--`, see {@link wrapEntity}.
  const comment = name.startsWith('##') ? '' : '<!--cluster ' + escapeComment(name) + '-->';
  const body = url !== undefined ? linkWrap(inner, url) : inner;
  // SI-saea T3a/D2: raw -- `group()`'s `attrsFromRecord` now escapes.
  return comment + group(body, { class: 'cluster', 'data-qualified-name': qualifiedName, id: uid });
}

/** Parameter bundle for {@link wrapLink} — collapsed from 8 positional
 *  args into one object to stay inside this project's per-function
 *  param-count budget (mirrors `DecorateEntityImageParts`'s own precedent
 *  in `core/svek/DecorateEntityImage.ts`). */
export interface WrapLinkInfo {
  readonly from: string;
  readonly to: string;
  readonly uid: string;
  readonly fromUid: string;
  readonly toUid: string;
  /** HEAD-side resolved decor name — see `SvekEdge.ts`'s class doc
   *  comment for the upstream `LinkType(d2, d1)` swap this mirrors. */
  readonly decor1: LinkDecorName | undefined;
  /** TAIL-side resolved decor name. */
  readonly decor2: LinkDecorName | undefined;
}

/** Wraps an edge's rendered body in the jar's `<g class="link"
 *  data-entity-1="..." data-entity-2="..." id="..." data-link-type="...">`
 *  group, preceded by `<!--link X to Y-->`/`<!--reverse link X to Y-->`
 *  (upstream `Link#commentForSvg`/`idCommentForSvg`, `core/svek/SvekEdge
 *  .ts`'s own identical decor-pair-driven logic, reused directly rather
 *  than duplicated). */
export function wrapLink(info: WrapLinkInfo, inner: string): string {
  const { from, to, uid, fromUid, toUid, decor1, decor2 } = info;
  const reversed = looksLikeRevertedForSvg(decor1, decor2);
  // SI-saea T3c/D8: `escapeComment` defangs `--`, see {@link wrapEntity}.
  const efrom = escapeComment(from);
  const eto = escapeComment(to);
  const comment = reversed
    ? '<!--reverse link ' + efrom + ' to ' + eto + '-->'
    : '<!--link ' + efrom + ' to ' + eto + '-->';
  const linkType = getLinkTypeName(decor1, decor2);
  return (
    comment +
    group(inner, {
      class: 'link',
      'data-entity-1': fromUid,
      'data-entity-2': toUid,
      id: uid,
      ...(linkType !== undefined ? { 'data-link-type': linkType } : {}),
    })
  );
}

// ---------------------------------------------------------------------------
// cdd-T16 (M7/E11): the shared inheritance triangle + stub line(s) a
// `skinparam groupInheritance`-protected parent draws for its grouped
// children's merged tail (`dot/Neighborhood.java:69-96`, `drawU`'s
// `sametailLinks` loop only -- the `allButSametails` loop at `:97-113`,
// for the parent's OTHER non-grouped links, is a NAMED, deliberately
// unported gap: no acceptance criterion in this task's reach needs it
// (lazeju's two protected parents carry no other link), left for a
// follow-on). Drawn at the SAME point jar draws it: immediately after the
// parent's own `<g class="entity">`, as ROOT-level SIBLING elements --
// `svek/SvekResult.java:82-89`'s node loop calls `image.drawU(...)` then,
// for an `Untranslated` image, `drawUntranslated(...)` right after, on
// the SAME `ug` the node loop itself holds (never nested inside the
// entity's own group, never inside a `<g class="link">` -- E11's explicit
// distinction). `renderer.ts`'s node loop calls this right after its own
// `wrapEntity` push (flagged write-set extension, named in the task
// report: the loop that owns both the entity string and `geo.edges`
// lives there, not in this module).
// ---------------------------------------------------------------------------

const EPSILON = 0.001;

/**
 * `dot/Neighborhood.java:155-179`'s private `intersection(x1..y4)` --
 * classic two-segment intersection via Cramer's rule, then a same-segment
 * bound check on BOTH segments (the `epsilon`-widened min/max clamps).
 * `undefined` where Java returns `null` (parallel segments, or the
 * intersection point lies outside either segment's own extent).
 */
function segmentIntersection(a: Point2D, b: Point2D, c: Point2D, d: Point2D): Point2D | undefined {
  const denom = (a.x - b.x) * (c.y - d.y) - (a.y - b.y) * (c.x - d.x);
  if (denom === 0) return undefined;
  const cross1 = a.x * b.y - a.y * b.x;
  const cross2 = c.x * d.y - c.y * d.x;
  const xi = ((c.x - d.x) * cross1 - (a.x - b.x) * cross2) / denom;
  const yi = ((c.y - d.y) * cross1 - (a.y - b.y) * cross2) / denom;
  if (xi + EPSILON < Math.min(a.x, b.x) || xi - EPSILON > Math.max(a.x, b.x)) return undefined;
  if (xi + EPSILON < Math.min(c.x, d.x) || xi - EPSILON > Math.max(c.x, d.x)) return undefined;
  if (yi + EPSILON < Math.min(a.y, b.y) || yi - EPSILON > Math.max(a.y, b.y)) return undefined;
  if (yi + EPSILON < Math.min(c.y, d.y) || yi - EPSILON > Math.max(c.y, d.y)) return undefined;
  return { x: xi, y: yi };
}

/**
 * `dot/Neighborhood.java:132-152`'s `intersection(XRectangle2D, pt1,
 * pt2)` -- tries all four rect edges (top, bottom, left, right, in that
 * exact order) against the `center -> contact` segment, returning the
 * first hit.
 */
function rectSegmentIntersect(
  rect: { x: number; y: number; width: number; height: number },
  pt1: Point2D,
  pt2: Point2D,
): Point2D | undefined {
  const minX = rect.x;
  const minY = rect.y;
  const maxX = rect.x + rect.width;
  const maxY = rect.y + rect.height;
  const rectEdges: ReadonlyArray<readonly [Point2D, Point2D]> = [
    [
      { x: minX, y: minY },
      { x: maxX, y: minY },
    ],
    [
      { x: minX, y: maxY },
      { x: maxX, y: maxY },
    ],
    [
      { x: minX, y: minY },
      { x: minX, y: maxY },
    ],
    [
      { x: maxX, y: minY },
      { x: maxX, y: maxY },
    ],
  ];
  for (const [a, b] of rectEdges) {
    const p = segmentIntersection(a, b, pt1, pt2);
    if (p !== undefined) return p;
  }
  return undefined;
}

/** One entry in `dot/Neighborhood.java:71-75`'s `contactPoints` --a Java
 *  `HashSet<XPoint2D>`, i.e. dedup by EXACT value equality, ported the
 *  same way (string key, no tolerance) since the points being compared
 *  are the SAME upstream `SvekEdge#getStartContactPoint()` value read
 *  twice, never independently re-computed. */
function uniqueSametailContacts(parentId: string, edges: readonly EdgeGeo[]): Point2D[] {
  const seen = new Set<string>();
  const points: Point2D[] = [];
  for (const edge of edges) {
    const st = edge.sametail;
    if (st === undefined || st.parentId !== parentId) continue;
    const key = `${st.contact.x},${st.contact.y}`;
    if (seen.has(key)) continue;
    seen.add(key);
    points.push(st.contact);
  }
  return points;
}

/** Draws through the SAME throwaway-`UGraphicSvg` + `extractFlatContent`
 *  technique `renderer-arrowhead.ts#drawExtremityMarkup` uses for the
 *  per-edge triangle -- reused for byte-identical `fill="none"`/
 *  `stroke-linejoin`/`stroke-miterlimit` formatting, NOT for its shape
 *  (`ExtremityExtendsLike` is a different upstream class with a different
 *  rotation formula -- see this module's own header note). */
function svgFromShapes(draw: (ug: UGraphic) => void, color: string): string {
  const ug = UGraphicSvg.build(0, basicSvgOption(), '$version$', { calculateDimension: () => ({ width: 0 }) });
  const context = ug.apply(new Fore(color)).apply(UStroke.withThickness(1)).apply(new Back('none'));
  draw(context);
  return extractFlatContent(ug.getSvgString()).body;
}

/**
 * `dot/Neighborhood.java:106-116`'s `drawExtends` -- a `UPolygon`
 * `(0,0),(7,20),(-7,20)` rotated by `theta` (`UPolygon#rotate`, ported
 * here per-point via `rotatePoint` since `UPolygon.rotate()` itself is
 * not, see `rotate-point.ts`'s own doc comment) then translated to
 * `contact` by the SAME `ug.apply(translate).draw(poly)` sequencing
 * (rotate at the origin, translate via the graphic, not pre-baked
 * absolute points). Returns the triangle's own SVG plus `middle`, the
 * midpoint of its rotated base edge (`p1`/`p2`) translated to `contact`
 * -- upstream's own return value, consumed as the stub line's near end.
 */
function drawExtendsTriangle(contact: Point2D, theta: number, color: string): { svg: string; middle: Point2D } {
  const p0 = rotatePoint({ x: 0, y: 0 }, theta);
  const p1 = rotatePoint({ x: 7, y: 20 }, theta);
  const p2 = rotatePoint({ x: -7, y: 20 }, theta);
  const svg = svgFromShapes((ug) => {
    ug.apply(new UTranslate(contact.x, contact.y)).draw(new UPolygon([p0, p1, p2]));
  }, color);
  const middle = { x: (p1.x + p2.x) / 2 + contact.x, y: (p1.y + p2.y) / 2 + contact.y };
  return { svg, middle };
}

/** `dot/Neighborhood.java:182-188`'s private `drawLine(ug, pt1, pt2)`. */
function drawStubLine(a: Point2D, b: Point2D, color: string): string {
  return svgFromShapes((ug) => {
    ug.apply(new UTranslate(a.x, a.y)).draw(ULine.create(a, b));
  }, color);
}

/** `dot/Neighborhood.java:97-113`'s `allButSametails` loop -- every OTHER
 *  link's own contact at this leaf, already resolved (and excluded from
 *  the leaf's own sametail set) by `class-edge-group-inheritance.ts
 *  #computeLeafContacts`. Unlike {@link uniqueSametailContacts} this is a
 *  plain list, not deduplicated -- upstream's `allButSametails` is a
 *  `List`, one stub per link, never merged. */
function otherLeafContacts(parentId: string, edges: readonly EdgeGeo[]): Point2D[] {
  const points: Point2D[] = [];
  for (const edge of edges) {
    for (const lc of edge.leafContacts ?? []) {
      if (lc.parentId === parentId) points.push(lc.contact);
    }
  }
  return points;
}

/** `dot/Neighborhood.java:97-113`: one plain (non-triangle) stub per
 *  entry -- from `rect ∩ (center, contact)` to `contact`, exactly the
 *  sametail loop's own `inter` projection, no triangle. */
function renderOtherLeafStubs(
  points: readonly Point2D[],
  rect: { x: number; y: number; width: number; height: number },
  center: Point2D,
  color: string,
): string[] {
  const out: string[] = [];
  for (const pt of points) {
    const inter = rectSegmentIntersect(rect, center, pt);
    if (inter !== undefined) out.push(drawStubLine(inter, pt, color));
  }
  return out;
}

/**
 * `dot/Neighborhood.java:69-121`'s `drawU` in full: the sametail loop
 * (`:69-96`, one shared triangle + stub per unique contact) then the
 * `allButSametails` loop (`:97-113`, one plain stub per other link).
 * `theme.colors.arrow` is upstream's bare `SName.arrow` style default
 * (`SvekResult.java:76-80`'s `getDefaultStyleDefinition`/`LineColor`) --
 * the same base an UNSTYLED edge falls back to, never a specific grouped
 * child's own resolved color (the triangle is drawn once, off the
 * PARENT, not per child).
 */
export function renderGroupInheritanceNeighborhood(
  geo: ClassifierGeo,
  edges: readonly EdgeGeo[],
  theme: Theme,
): string[] {
  const contacts = uniqueSametailContacts(geo.id, edges);
  const others = otherLeafContacts(geo.id, edges);
  if (contacts.length === 0 && others.length === 0) return [];
  const rect = protectedInnerBox(geo);
  const center = { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
  const color = theme.colors.arrow;
  const out: string[] = [];
  for (const pt of contacts) {
    const inter = rectSegmentIntersect(rect, center, pt);
    if (inter === undefined) continue;
    const theta = Math.atan2(center.x - pt.x, -(center.y - pt.y));
    const { svg, middle } = drawExtendsTriangle(inter, theta, color);
    out.push(svg, drawStubLine(middle, pt, color));
  }
  out.push(...renderOtherLeafStubs(others, rect, center, color));
  return out;
}
