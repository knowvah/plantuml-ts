/**
 * class-layout-multipage.ts — `newpage` page-stacking combinator (T7),
 * split out of `layout.ts` (already at the project's 500-line hook cap
 * before cdd-T29 added its scale-wiring lines) -- a pure move, exported
 * `layoutSinglePage` is the only new surface this split requires
 * (`layout.ts` re-exports `layoutMultiPage` below so `layoutClass`'s own
 * call site is a one-line import change, same precedent as `class-layout-
 * shift.ts`/`class-geo-builders.ts`'s earlier splits from this same file).
 */
import type { ClassDiagramAST } from './ast.js';
import type { Theme } from '../../core/theme.js';
import type { StringMeasurer } from '../../core/measurer.js';
import {
  isNoteGeo,
  type ClassGeometry,
  type ClassLeafGeo,
  type ClassPageBoundary,
  type EdgeGeo,
  type NamespaceGeo,
} from './class-geo-types.js';
import { shiftClassifierGeo, shiftEdgeGeo, shiftNamespaceGeo, shiftNoteGeo } from './class-layout-shift.js';
import { layoutSinglePage } from './layout.js';

/**
 * Vertical gap (px) inserted between stacked pages. This offset is OURS, not
 * upstream's: upstream's `NewpagedDiagram` lays out each page as an
 * independent svek graph and (per `NewpagedDiagram.java`, which never
 * overrides `AbstractDiagram.getNbImages()`) the reference CLI only ever
 * exports page 1 as a separate file per source — there is no upstream
 * "stacked" rendering to match pixel-for-pixel. Since this library returns a
 * single SVG string rather than one file per page, we stack pages vertically
 * ourselves; see CHANGELOG.md.
 */
const NEWPAGE_GAP = 20;

/**
 * Lay out every page independently (each page is a complete, standalone
 * diagram per upstream `NewpagedDiagram` semantics — see T6/ast.ts), then
 * stack the resulting geometries vertically with `NEWPAGE_GAP` between them.
 * One dot-layout pass per non-degenerate page, in page order (a degenerate
 * page still contributes its own geometry via `layoutSinglePage`'s internal
 * skip — it just never reaches the graphviz call). Each page's own G2/N11
 * ink shift is already baked in by `layoutSinglePage` before this function
 * ever sees it; this is a SEPARATE, purely additive y-only offset (`dx=0`)
 * stacked on top.
 */
export function layoutMultiPage(pages: ClassDiagramAST[], theme: Theme, measurer: StringMeasurer): ClassGeometry {
  const leaves: ClassLeafGeo[] = [];
  const edges: EdgeGeo[] = [];
  const namespaces: NamespaceGeo[] = [];
  // cdd-T34 (E14 `newpage`): one boundary per page, in page order -- see
  // `ClassGeometry.pageBoundaries`'s own doc comment for the mechanism and
  // `sliceClassGeometryPage` below for the sole reader.
  const pageBoundaries: ClassPageBoundary[] = [];
  let maxWidth = 0;
  let yOffset = 0;

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i]!;
    const geo = layoutSinglePage(page, theme, measurer);
    const dy = yOffset;
    pageBoundaries.push({ y: dy, width: geo.totalWidth, height: geo.totalHeight });

    // T4: each page's own `leaves` is already jar's real draw order (D3,
    // `layoutSinglePage`'s own `orderLeaves` call); shifting per-kind and
    // re-pushing in the same relative order preserves that order, and pages
    // concatenate in page order (the outer `for` loop) -- no re-sort needed
    // here, each page IS its own upstream `NewpagedDiagram` page.
    for (const leaf of geo.leaves) {
      leaves.push(isNoteGeo(leaf) ? shiftNoteGeo(leaf, 0, dy) : shiftClassifierGeo(leaf, 0, dy));
    }
    for (const e of geo.edges) edges.push(shiftEdgeGeo(e, 0, dy));
    for (const n of geo.namespaces) namespaces.push(shiftNamespaceGeo(n, 0, dy));

    maxWidth = Math.max(maxWidth, geo.totalWidth);
    yOffset += geo.totalHeight;
    if (i < pages.length - 1) yOffset += NEWPAGE_GAP;
  }

  return { totalWidth: maxWidth, totalHeight: yOffset, leaves, edges, namespaces, pageBoundaries };
}

/**
 * One page of `geo`, 0-based — the render-time inverse of the stacking loop
 * above. Returns `geo` UNCHANGED (`===`) when it carries no
 * `pageBoundaries` (every non-`newpage` document, decisions.md D5-style
 * byte-stability for the unaffected common case) or when `pageIndex` names
 * exactly one boundary (a single-page `pages` array, which cannot occur
 * from a real parse but is defensive against a hand-built geometry).
 *
 * `pageIndex` is clamped into range rather than throwing, mirroring
 * `paginateSequence`'s identical contract (`sequence-page.ts`) —
 * `PlayingSpaceWithParticipants#getYMax`'s "answer for an index past the
 * end" precedent.
 *
 * Filters each collection by whether its own `y` (a leaf's/namespace's
 * top, an edge's first point) falls inside the target boundary's
 * `[y, y + height)` band, then shifts every retained item back by `-y` --
 * safe because `layoutMultiPage` never overlaps two pages' bands (each
 * page is a fully independent `NewpagedDiagram` page, separated by
 * `NEWPAGE_GAP`), so no leaf/edge/namespace can straddle two boundaries.
 */
export function sliceClassGeometryPage(geo: ClassGeometry, pageIndex: number): ClassGeometry {
  const boundaries = geo.pageBoundaries;
  if (boundaries === undefined || boundaries.length <= 1) return geo;

  const index = Math.min(Math.max(pageIndex, 0), boundaries.length - 1);
  const boundary = boundaries[index]!;
  const top = boundary.y;
  const bottom = boundary.y + boundary.height;
  const inBand = (y: number) => y >= top - 0.5 && y < bottom + 0.5;

  // `exactOptionalPropertyTypes`: drop `pageBoundaries` (a sliced page has
  // no boundaries of its own -- calling `getNbPages` on it would wrongly
  // report >1) via destructure rather than an explicit `undefined` assign.
  const { pageBoundaries: _pageBoundaries, ...rest } = geo;
  return {
    ...rest,
    totalWidth: boundary.width,
    totalHeight: boundary.height,
    rawWidth: boundary.width,
    rawHeight: boundary.height,
    leaves: geo.leaves
      .filter((leaf) => inBand(leaf.y))
      .map((leaf) => (isNoteGeo(leaf) ? shiftNoteGeo(leaf, 0, -top) : shiftClassifierGeo(leaf, 0, -top))),
    edges: geo.edges.filter((e) => inBand(e.points[0]?.y ?? top)).map((e) => shiftEdgeGeo(e, 0, -top)),
    namespaces: geo.namespaces.filter((n) => inBand(n.y)).map((n) => shiftNamespaceGeo(n, 0, -top)),
  };
}

/**
 * `PaginatedPlugin.getNbPages` for the class engine — the number of
 * standalone pages `layoutMultiPage` stacked, or 1 for every ordinary
 * (non-`newpage`) diagram. Mirrors `sequencePageCount`'s identical "always
 * >= 1" contract (`sequence-page.ts`).
 */
export function classPageCount(geo: ClassGeometry): number {
  return geo.pageBoundaries?.length ?? 1;
}

/**
 * `PaginatedPlugin.pageAst` for the class engine.
 *
 * `parser.ts#parseClass` mints `pages` such that `pages[0]` IS the
 * top-level AST itself (`state.pages[0]!.pages = state.pages`, `parser.ts:
 * 427`) — each entry, page 0 included, is already a fully independent
 * `ClassDiagramAST` carrying its OWN `annotations` (title/legend/caption/
 * header/footer), unlike sequence's single shared-timeline AST + per-
 * `newpage` title substitution (`sequencePageAst`). So this is a plain
 * index into `pages`, not a chrome-substitution step: page N's chrome is
 * whatever page N's own source declared, upstream's `NewpagedDiagram`
 * semantics (each page a complete, standalone diagram, `NewpagedDiagram
 * .java:87-162`).
 */
export function classPageAst(ast: ClassDiagramAST, pageIndex: number): ClassDiagramAST {
  return ast.pages?.[pageIndex] ?? ast;
}
