/**
 * `layoutClass`'s `scale ...` factor resolution (cdd3-T34, C-10) -- split
 * out of `layout.ts` (already at the project's 500-line hook cap) so the
 * mechanism below has room for its own doc comment; a pure move of the
 * one call site's arithmetic, same split rationale as this file's
 * siblings (`class-layout-multipage.ts`, `class-layout-shift.ts`).
 */
import { resolveScaleFactor } from '../../core/scale-command.js';
import {
  CUCA_DOCUMENT_MARGIN_TOP,
  CUCA_DOCUMENT_MARGIN_RIGHT,
  CUCA_DOCUMENT_MARGIN_BOTTOM,
  CUCA_DOCUMENT_MARGIN_LEFT,
} from '../../core/atmp/CucaDiagram.js';
import type { ClassDiagramAST } from './ast.js';
import type { ClassGeometry } from './class-geo-types.js';

/**
 * `Scale#getScale` reads the FRACTIONAL, pre-`SvgGraphics#ensureVisible`
 * dimension `TextBlockExporter#calculateFinalDimension` computes
 * (`core/TextBlockExporter.java:199-201`: `dim.getWidth() +
 * margin.getLeft() + margin.getRight()`, never truncated) -- NOT
 * `geo.totalWidth`/`totalHeight`, which is ALREADY `SvgGraphics
 * #ensureVisible`-truncated (`applyCucaDocumentMargin`'s `Math.floor(dim
 * + 1)`, `core/TextBlockExporter.ts`'s own doc comment). `geo.rawWidth`/
 * `rawHeight` (`layout-ink-extent.ts#computeClassRawInkDims`, the
 * PRE-margin ink dimension) plus the SAME `CucaDiagram` margins
 * `computeClassDocumentDims` applies -- before ITS OWN truncation --
 * reproduces the exact fractional value `Scale#getScale` receives
 * upstream. Falls back to `totalWidth`/`totalHeight` when `rawWidth` is
 * absent (the empty-diagram sentinel and `layoutMultiPage`'s stacked
 * geometry, `ClassGeometry.rawWidth`'s own doc comment) -- unchanged,
 * pre-T34 behavior for those two cases; `layoutMultiPage`'s own stacked
 * fractional dimension is a separate, not-yet-ported mechanism (no
 * `newpage` + `scale` fixture in this mission's corpus).
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/core/TextBlockExporter.java:199-208
 */
export function resolveClassScaleFactor(
  geo: Pick<ClassGeometry, 'totalWidth' | 'totalHeight' | 'rawWidth' | 'rawHeight'>,
  scale: ClassDiagramAST['scale'],
  dpi: number | undefined,
): number {
  const preWidth =
    geo.rawWidth !== undefined ? geo.rawWidth + CUCA_DOCUMENT_MARGIN_LEFT + CUCA_DOCUMENT_MARGIN_RIGHT : geo.totalWidth;
  const preHeight =
    geo.rawHeight !== undefined
      ? geo.rawHeight + CUCA_DOCUMENT_MARGIN_TOP + CUCA_DOCUMENT_MARGIN_BOTTOM
      : geo.totalHeight;
  return resolveScaleFactor(scale, preWidth, preHeight, dpi);
}
