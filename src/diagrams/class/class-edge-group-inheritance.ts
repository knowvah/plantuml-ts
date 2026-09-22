/**
 * cdd-T16/T16b (M7/E11): `skinparam groupInheritance` decor/dashed/
 * stroke-override resolution + the `allButSametails` contact-point
 * computation. Split out of `class-edge-geo.ts` (500-line hook cap) --
 * a pure move, `class-edge-geo.ts` imports every symbol below.
 */
import type { Relationship } from './ast.js';
import type { LinkDecor } from './class-relationship-ast.js';
import { EDGE_DECORATION_MAP, type EdgeDecoration } from './class-dot-edges.js';
import { strokeForStyle } from '../../core/svek/svek-edge-stroke.js';
import type { SametailGeo } from './class-geo-edge-extras.js';
import type { EdgeGeo } from './layout.js';

export { EDGE_DECORATION_MAP };

/**
 * G2 N26: `-[#color]->`/`-[bold]->`/`-[thickness=N]->` bracket-modifier
 * render overrides -- computed ONLY when the relationship actually
 * carried one (`Relationship.lineStyleOverride`/`.thicknessOverride`/
 * `.colorOverride`, all `undefined` for the ~700 fixtures with no
 * bracket), reusing the shared `LinkStyle#getStroke3()` formula
 * (`core/svek/svek-edge-stroke.ts#strokeForStyle`) description's own
 * edge renderer already uses for the identical upstream mechanism (see
 * `Relationship.lineStyleOverride`'s doc comment, ast.ts). Absent when
 * `!hasOverride` -- `renderer.ts#renderEdge` falls back to the
 * pre-existing `dashed`-boolean-driven default in that case, zero
 * behavior change for every other edge.
 */
// B7/M8: the link's `<<tag>>` labels ride along regardless of whether the
// edge carries a bracket override -- resolved against
// `theme.colors.graph.arrowTagCascade` at render time, not here.
function strokeTags(rel: Relationship): Pick<EdgeGeo, 'stereotypeTags'> {
  return rel.stereotypeTags !== undefined && rel.stereotypeTags.length > 0
    ? { stereotypeTags: rel.stereotypeTags }
    : {};
}

function hasStrokeOverride(rel: Relationship, defaultArrowThickness: number | undefined): boolean {
  return (
    rel.lineStyleOverride !== undefined ||
    rel.thicknessOverride !== undefined ||
    rel.colorOverride !== undefined ||
    defaultArrowThickness !== undefined
  );
}

export function buildStrokeOverride(
  rel: Relationship,
  dashed: boolean,
  defaultArrowThickness: number | undefined,
): Pick<EdgeGeo, 'strokeWidth' | 'strokeDasharray' | 'colorOverride' | 'stereotypeTags'> {
  // G2 N51: `skinparam arrowThickness N` -- a theme-level DEFAULT thickness
  // every edge picks up when it carries no bracket override of its own,
  // see `theme.ts#arrowThickness`'s doc comment for the exact upstream
  // `LinkType#getStroke3(UStroke defaultThickness)` formula this reduces
  // to (a per-edge bracket override always wins over this default).
  const tags = strokeTags(rel);
  if (!hasStrokeOverride(rel, defaultArrowThickness)) return tags;
  const style = rel.lineStyleOverride ?? (dashed ? 'dashed' : 'solid');
  const stroke = strokeForStyle(style, rel.thicknessOverride ?? defaultArrowThickness);
  const dasharray = stroke.getDasharraySvg();
  return {
    strokeWidth: stroke.getThickness(),
    ...(dasharray !== undefined ? { strokeDasharray: dasharray } : {}),
    ...(rel.colorOverride !== undefined ? { colorOverride: rel.colorOverride } : {}),
    ...tags,
  };
}

/**
 * cdd-T16 (M7): `Link.java:238-239`'s `getSametail() != null` guard --
 * forces BOTH decors to `LinkDecor.NONE` and the style to
 * `LinkStyle.NORMAL()` (`decoration/LinkType.java:71-72`'s 2-arg ctor,
 * always solid); only `stereotypeTags` survives (a link's `<<tag>>` is a
 * SEPARATE draw upstream, unrelated to `getType()`). `sametail` carries
 * the protected parent's classifier id (`Relationship.idEntity1FullId`,
 * upstream's `link.getEntity1()` -- `dot/DotData.java:126`) and its RAW
 * spline contact point (`normalizedPts[0]`, entity1's end -- mirrors
 * `SvekEdge#getStartContactPoint()`, `dot/Neighborhood.java:74-76`) for
 * `renderer-group.ts#renderGroupInheritanceNeighborhood`. `undefined`
 * when relationship index `i` is not grouped.
 */
export function groupInheritanceOverride(
  rel: Relationship,
  i: number,
  sametailByRelIndex: ReadonlyMap<number, string> | undefined,
  normalizedPts: ReadonlyArray<{ x: number; y: number }>,
): { dashed: false; decor: 'none'; strokeExtra: Pick<EdgeGeo, 'stereotypeTags'>; sametail?: SametailGeo } | undefined {
  if (sametailByRelIndex?.has(i) !== true) return undefined;
  const strokeExtra =
    rel.stereotypeTags !== undefined && rel.stereotypeTags.length > 0 ? { stereotypeTags: rel.stereotypeTags } : {};
  const contact = normalizedPts[0];
  const sametail =
    rel.idEntity1FullId !== undefined && contact !== undefined ? { parentId: rel.idEntity1FullId, contact } : undefined;
  return { dashed: false, decor: 'none', strokeExtra, ...(sametail !== undefined ? { sametail } : {}) };
}

/**
 * cdd-T16b (E11, `Neighborhood.java:97-113`'s `allButSametails` loop):
 * for every OTHER link touching a protected leaf, upstream draws a plain
 * (non-triangle) stub from `rect ∩ (center, contact)` to `contact`, where
 * `contact = link.getEntity1() == leaf ? line.getStartContactPoint() :
 * line.getEndContactPoint()`. `normalizedPts[0]`/`.at(-1)` ARE those two
 * upstream contact points (`normalizeEdgePoints` runs entity1 -> entity2
 * unconditionally, see that function's own doc comment). entity1's own
 * leaf is skipped when it's ALSO this edge's `grouped` parent -- Java's
 * `allButSametails.removeAll(sametailLinks)` already excludes that exact
 * pairing (drawn as the shared triangle instead); entity2's leaf carries
 * no such exclusion (a DIFFERENT leaf's own sametail set, if any).
 */
/** One end of {@link computeLeafContacts} -- `skip` is the "already
 *  consumed by this edge's OWN sametail group" exclusion, true only for
 *  the entity1 end (see the caller's own doc comment). */
function leafContactAt(
  leafId: string | undefined,
  point: { x: number; y: number } | undefined,
  protectedIds: ReadonlySet<string>,
  skip: boolean,
): SametailGeo | undefined {
  if (skip || leafId === undefined || point === undefined || !protectedIds.has(leafId)) return undefined;
  return { parentId: leafId, contact: point };
}

export function computeLeafContacts(
  rel: Relationship,
  protectedIds: ReadonlySet<string> | undefined,
  grouped: ReturnType<typeof groupInheritanceOverride>,
  normalizedPts: ReadonlyArray<{ x: number; y: number }>,
): SametailGeo[] | undefined {
  if (protectedIds === undefined || protectedIds.size === 0) return undefined;
  const start = leafContactAt(rel.idEntity1FullId, normalizedPts[0], protectedIds, grouped !== undefined);
  const end = leafContactAt(rel.idEntity2FullId, normalizedPts[normalizedPts.length - 1], protectedIds, false);
  const out = [start, end].filter((c): c is SametailGeo => c !== undefined);
  return out.length > 0 ? out : undefined;
}

/**
 * The decor/dashed/stroke-override resolution `buildEdgeGeos` needs per
 * relationship, folded into one call so that function's own NLOC/CCN does
 * not grow with each new override this port adds. G2 N8/cdd-T6 A2a/M4's
 * dashed formula and G2 N30's decor swap (paired with `points[0]`/
 * `points[last]`, flipped together with `pts` when `normalizeEdgePoints`
 * reversed the array) move here verbatim; cdd-T16 (M7) adds the `grouped`
 * branch -- see {@link groupInheritanceOverride}.
 */
export interface ResolvedEdgeDecor {
  sourceDecor: LinkDecor;
  targetDecor: LinkDecor;
  dashed: boolean;
  strokeExtra: Pick<EdgeGeo, 'stereotypeTags' | 'strokeWidth' | 'strokeDasharray' | 'colorOverride'>;
}

/** G2 N8/cdd-T6 A2a/M4's dashed formula, split to its own one-liner --
 *  see {@link resolveEdgeDecor}'s own doc comment for the jar citation. */
function resolveDashed(rel: Relationship, decor: EdgeDecoration): boolean {
  return rel.dashed ?? rel.dashedBody ?? decor.dashed;
}

/** The pre-existing (pre-cdd-T16) resolution, unchanged -- split out so
 *  {@link resolveEdgeDecor}'s own `grouped` branch stays cheap to read. */
function resolveNormalEdgeDecor(
  rel: Relationship,
  decor: EdgeDecoration,
  matchesFromTo: boolean,
  defaultArrowThickness: number | undefined,
): ResolvedEdgeDecor {
  const dashed = resolveDashed(rel, decor);
  const fromDecor = rel.sourceDecor ?? decor.sourceDecor;
  const toDecor = rel.targetDecor ?? decor.targetDecor;
  return {
    sourceDecor: matchesFromTo ? fromDecor : toDecor,
    targetDecor: matchesFromTo ? toDecor : fromDecor,
    dashed,
    strokeExtra: buildStrokeOverride(rel, dashed, defaultArrowThickness),
  };
}

export function resolveEdgeDecor(
  rel: Relationship,
  decor: EdgeDecoration,
  matchesFromTo: boolean,
  grouped: ReturnType<typeof groupInheritanceOverride>,
  defaultArrowThickness: number | undefined,
): ResolvedEdgeDecor {
  if (grouped !== undefined) {
    return { sourceDecor: 'none', targetDecor: 'none', dashed: false, strokeExtra: grouped.strokeExtra };
  }
  return resolveNormalEdgeDecor(rel, decor, matchesFromTo, defaultArrowThickness);
}
