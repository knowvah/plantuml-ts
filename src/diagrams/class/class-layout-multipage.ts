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
import { isNoteGeo, type ClassGeometry, type ClassLeafGeo, type EdgeGeo, type NamespaceGeo } from './class-geo-types.js';
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
  let maxWidth = 0;
  let yOffset = 0;

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i]!;
    const geo = layoutSinglePage(page, theme, measurer);
    const dy = yOffset;

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

  return { totalWidth: maxWidth, totalHeight: yOffset, leaves, edges, namespaces };
}
