/**
 * class-scale-geo.ts — the `scale ...` directive for the class engine,
 * applied at the layout->render boundary (cdd-T29, D4 --
 * `plans/class-divergence-drive/decisions.md`). Mirrors `sequence/scale-
 * geo.ts` exactly (same rationale, same "why scaling inputs equals scaling
 * outputs" argument); see that file's header for the full derivation. This
 * header states only what is specific to the class engine.
 *
 * Upstream applies scale in exactly one place: `SvgGraphics#format`
 * (`klimt/drawing/svg/SvgGraphics.java:466-472`) multiplies EVERY emitted
 * numeric on its way to text -- coordinates, font sizes (`:695`), stroke
 * widths (`:557`) -- resolved from `TextBlockExporter#computeScaleFactor`
 * (`core/TextBlockExporter.java:205-209`: `scale.getScale(width, height) *
 * dpi/96.0`; `dpi` is always 96 in this port, `core/scale-command.ts`'s own
 * header). `layoutClass` (`layout.ts`) resolves the factor via
 * `resolveScaleFactor` against the FINAL unscaled document dimension --
 * never a partial/intermediate one, the same contract that function's own
 * doc comment states -- and this module multiplies the resulting
 * `ClassGeometry` by it, leaving `core/svg.ts` (the shared string emitter
 * ten engines share) untouched.
 *
 * This module is split across FOUR files purely to keep each one under this
 * project's 500-line cap (pre-authorised split, same precedent as `class-
 * geo-types.ts`'s own splits): `class-scale-geo-row.ts` (row/atom/chrome
 * primitives -- read its header for the `row.fontSize` theme-fallback
 * materialization this task's fidelity depends on),
 * `class-scale-geo-body.ts` (enhanced/json body content),
 * `class-scale-geo-edge.ts` (`EdgeGeo` and its label/box variants), and
 * `class-scale-geo-note.ts` (`NoteGeo`). This file is the one public import
 * site (`scaleClassGeometry`) `layout.ts` calls.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/core/TextBlockExporter.java:205-209
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/drawing/svg/SvgGraphics.java:466-472,557,695
 * @see src/diagrams/sequence/scale-geo.ts
 * @see src/core/scale-command.ts
 */
import type { ClassGeometry, ClassifierGeo, NamespaceGeo } from './class-geo-types.js';
import { isNoteGeo } from './class-geo-types.js';
import { scaleRow, scaleGenericTag, scaleFolderTab, scaleSymbolInk, scaleBadgeSpriteImage } from './class-scale-geo-row.js';
import { scaleEnhancedBody, scaleJsonBody } from './class-scale-geo-body.js';
import { scaleEdgeGeo } from './class-scale-geo-edge.js';
import { scaleNoteGeo } from './class-scale-geo-note.js';

export type { ScaleSpec } from '../../core/scale-command.js';

/** A scale of exactly 1 must be a no-op, not a rebuild -- see
 *  {@link scaleClassGeometry}. */
const IDENTITY = 1;

/** One classifier leaf's full drawn geometry, scaled. */
function scaleClassifierGeo(c: ClassifierGeo, k: number, themeFontSize: number): ClassifierGeo {
  return {
    ...c,
    x: c.x * k,
    y: c.y * k,
    width: c.width * k,
    height: c.height * k,
    dividerYs: c.dividerYs.map((y) => y * k),
    rows: c.rows.map((r) => scaleRow(r, k, themeFontSize)),
    ...(c.symbolInk !== undefined ? { symbolInk: scaleSymbolInk(c.symbolInk, k) } : {}),
    ...(c.badgeSpriteImage !== undefined ? { badgeSpriteImage: scaleBadgeSpriteImage(c.badgeSpriteImage, k) } : {}),
    ...(c.genericTag !== undefined ? { genericTag: scaleGenericTag(c.genericTag, k) } : {}),
    ...(c.folderTab !== undefined ? { folderTab: scaleFolderTab(c.folderTab, k) } : {}),
    ...(c.enhancedBody !== undefined ? { enhancedBody: scaleEnhancedBody(c.enhancedBody, k, themeFontSize) } : {}),
    ...(c.jsonBody !== undefined ? { jsonBody: scaleJsonBody(c.jsonBody, k, themeFontSize) } : {}),
    ...(c.bodyInkWidth !== undefined ? { bodyInkWidth: c.bodyInkWidth * k } : {}),
  };
}

/** A package/namespace cluster's own outline geometry, scaled. */
function scaleNamespaceGeo(ns: NamespaceGeo, k: number): NamespaceGeo {
  return {
    ...ns,
    x: ns.x * k,
    y: ns.y * k,
    width: ns.width * k,
    height: ns.height * k,
    wtitle: ns.wtitle * k,
    htitle: ns.htitle * k,
    baselineOffset: ns.baselineOffset * k,
  };
}

/**
 * Every geometric number in the diagram, multiplied by `k`. `themeFontSize`
 * is the UNSCALED `Theme.fontSize` `layoutClass` already has in scope --
 * threaded through so {@link scaleRow} can materialize the header-row
 * `theme.fontSize` fallback (see `class-scale-geo-row.ts`'s header).
 *
 * Returns the input unchanged when `k` is 1 so the overwhelmingly common
 * unscaled case allocates nothing and cannot be perturbed by a rounding
 * artefact of multiplying by one -- mirrors `scaleSequenceGeometry`'s
 * identical identity short-circuit.
 */
export function scaleClassGeometry(geo: ClassGeometry, k: number, themeFontSize: number): ClassGeometry {
  if (k === IDENTITY) return geo;
  return {
    ...geo,
    totalWidth: geo.totalWidth * k,
    totalHeight: geo.totalHeight * k,
    ...(geo.rawWidth !== undefined ? { rawWidth: geo.rawWidth * k } : {}),
    ...(geo.rawHeight !== undefined ? { rawHeight: geo.rawHeight * k } : {}),
    leaves: geo.leaves.map((leaf) =>
      isNoteGeo(leaf) ? scaleNoteGeo(leaf, k) : scaleClassifierGeo(leaf, k, themeFontSize),
    ),
    edges: geo.edges.map((e) => scaleEdgeGeo(e, k)),
    namespaces: geo.namespaces.map((n) => scaleNamespaceGeo(n, k)),
  };
}
