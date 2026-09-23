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
import type { Theme } from '../../core/theme.js';

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
    // cdd-T34 (E14 `newpage`): scale each page boundary's `y`/`width`/
    // `height` by the SAME `k` as every other geometric field -- `scale
    // ...` resolves from the STACKED document's own final dimension
    // (`resolveScaleFactor`, D4), so a page's stacked position must scale
    // with it or `sliceClassGeometryPage`'s band filter would compare
    // scaled leaf `y`s against unscaled boundaries.
    ...(geo.pageBoundaries !== undefined
      ? { pageBoundaries: geo.pageBoundaries.map((b) => ({ y: b.y * k, width: b.width * k, height: b.height * k })) }
      : {}),
    // cdd-T29 round 2 (D4): carried so `renderer.ts#renderClass` can derive
    // a `ScaledTheme` for the render-time pixel-literal constants this
    // module cannot reach (see `ClassGeometry.scaleK`'s own doc comment).
    scaleK: k,
  };
}

// ---------------------------------------------------------------------------
// ScaledTheme -- render-time constants with no geo-side field to scale
// ---------------------------------------------------------------------------

/**
 * `Theme` plus the resolved render-time scale factor -- mirrors `sequence/
 * scale-geo.ts#ScaledTheme` exactly (same rationale: reusing the existing
 * `theme` parameter slot keeps every downstream function at its
 * pre-existing parameter count). `renderer.ts` and its sibling `renderer-
 * *.ts` files thread this in place of a bare `Theme` wherever a function
 * needs to scale a LOCAL pixel-literal constant of its own — box/divider
 * border `stroke-width` (`renderer-classifier-colors.ts
 * #classBorderStrokeWidth`), the badge circle's radius (`class-badge.ts
 * #BADGE_RADIUS`), a classifier's `roundCorner`
 * (`renderer-classifier-box.ts`), arrowhead geometry
 * (`renderer-arrowhead.ts`), and every other render-time-only numeral this
 * task's round-2 audit found (see `.agent-notes/cdd-T29.md`).
 */
export interface ScaledTheme extends Theme {
  readonly scaleK: number;
}

/**
 * `theme.fontSize` is scaled for the SAME reason `sequence/scale-
 * geo.ts#scaleSequenceTheme` scales it: a handful of class-render call
 * sites (`renderer-classifier-rows.ts`'s bullet/image atom Y-offset
 * formulas, `renderer-openiconic.ts`) read `theme.fontSize` DIRECTLY,
 * bypassing `ClassifierGeo.rows[].fontSize`'s own already-materialized
 * fallback (`class-scale-geo-row.ts#scaleRow`'s doc comment) — those reads
 * are for Y-COORDINATE math (a descent/altitude offset), not a `<text
 * font-size>` attribute, so they need the SAME scaled value every other
 * already-scaled `y` coordinate in the geometry carries.
 */
export function scaleClassTheme(theme: Theme, k: number): ScaledTheme {
  return { ...theme, fontSize: theme.fontSize * k, scaleK: k };
}
