/**
 * renderer-assoc-lollipop.ts — the association-class-couple "point" entity
 * (`(A,B) .. C`) and the interface lollipop, split out of `renderer.ts`
 * when cdd-T29 round 2's `scaleK` threading pushed that file back over the
 * 500-line hook cap (pre-authorised split, same precedent as `renderer-
 * classifier-map-dividers.ts`'s sibling split this same round) -- a pure
 * move, re-imported back unchanged.
 */
import { ellipse, polygon } from '../../core/svg.js';
import type { ClassifierGeo } from './layout.js';
import type { ScaledTheme } from './class-scale-geo.js';
import { ASSOC_POINT_SIZE, LOLLIPOP_SIZE } from './class-lollipop.js';
import { renderRow } from './renderer-classifier-box.js';
import { classifierFill, classBorderLine, classBorderStrokeWidth } from './renderer-classifier-colors.js';

/**
 * `(A,B) .. C`'s tiny circle connector — G2 N8, `EntityImageAssociationPoint
 * .java#drawU`: a bare `<ellipse>` (radius {@link ASSOC_POINT_SIZE}`/2`),
 * fill AND stroke both the SAME `LineColor` value (`CopyForegroundColorTo
 * BackgroundColor`, upstream's own instruction to duplicate the foreground
 * color into the background/fill slot) — never wrapped in a `<g class=
 * "entity">`, never assigned an `id`, never preceded by a `<!--class ...-->`
 * comment (`GeneralImageBuilder`'s dispatch draws this leaf kind directly,
 * bypassing the normal per-entity wrapping every other classifier kind gets
 * — see `renderClass`'s own classifier loop, which special-cases
 * `kind === 'assoc-circle'` to call this instead of `wrapEntity`).
 */
export function renderAssocPoint(geo: ClassifierGeo, theme: ScaledTheme): string {
  const r = (ASSOC_POINT_SIZE / 2) * theme.scaleK;
  return ellipse(geo.x + geo.width / 2, geo.y + geo.height / 2, r, r, {
    fill: theme.colors.arrow,
    stroke: theme.colors.arrow,
    'stroke-width': theme.scaleK,
  });
}

/**
 * cdd-T34 (E14, `<> name` n-ary association diamond, `cukaze-78-zija070`):
 * `EntityImageAssociation#drawU` (`svek/image/EntityImageAssociation.java:
 * 68-84`) -- a bare `UPolygon` diamond, no fill/border/badge of its own
 * kind, sharing the SAME `root,element,class_,diamond` style-signature
 * defaults every OTHER classifier box already resolves through {@link
 * classifierFill}/{@link classBorderLine}/{@link classBorderStrokeWidth}
 * (jar-verified: cukaze's diamond `fill="#F1F1F1"`/`stroke="#181818"`/
 * `stroke-width="0.5"` are byte-identical to its own two classifier boxes'
 * -- this port has no separate `diamond` StyleSignature, so the shared
 * classifier-box resolution is the faithful approximation).
 *
 * UNWRAPPED like {@link renderAssocPoint} above -- `EntityImageAssociation`
 * (an `AbstractEntityImage`, no name/badge/body) is one of the leaf kinds
 * `GeneralImageBuilder` draws directly, bypassing the normal `<g class=
 * "entity" id="…">` + `<!--class …-->` wrap every named classifier gets
 * (jar-verified: no `<g>`, no `id`, no comment around cukaze's `<polygon>`)
 * -- `renderClass`'s classifier loop special-cases `kind === 'association'`
 * to call this instead of `wrapEntity`/`renderClassifier`.
 *
 * `geo.width`/`geo.height` are already the resolved `SIZE*2` square
 * (`class-layout-leaf-shapes.ts#measureAssociationDiamond`, already scaled
 * by `scaleClassGeometry` like every other `ClassifierGeo` field) -- the
 * four points are derived from them rather than a re-declared `SIZE`
 * constant, so this stays correct under `scale ...` with no extra
 * multiplication (`classBorderStrokeWidth` scales the stroke width itself).
 *
 * @see ~/git/plantuml/.../svek/image/EntityImageAssociation.java:68-84
 */
export function renderAssociationDiamond(geo: ClassifierGeo, theme: ScaledTheme): string {
  const hw = geo.width / 2;
  const hh = geo.height / 2;
  const points = [
    { x: geo.x + hw, y: geo.y },
    { x: geo.x + geo.width, y: geo.y + hh },
    { x: geo.x + hw, y: geo.y + geo.height },
    { x: geo.x, y: geo.y + hh },
    { x: geo.x + hw, y: geo.y },
  ];
  return polygon(points, {
    fill: classifierFill(geo, theme),
    stroke: classBorderLine(geo, theme),
    strokeWidth: classBorderStrokeWidth(geo, theme),
  });
}

/**
 * `Name ()-- Existing` interface lollipop -- G2 N8 established the DOT
 * sizing (`class-dot-graph.ts#buildOneDotNode`'s fixed {@link LOLLIPOP_SIZE}
 * node); G2 N20 lands the render half (`EntityImageLollipopInterface
 * .java:94-133`). UNLIKE {@link renderAssocPoint} above, jar DOES wrap the
 * circle in a real `<g class="entity" id="ent%04d">` (no `<!--class ...-->`
 * comment though -- `drawU` never calls `ug.draw(new UComment(...))`,
 * matching `wrapEntity`'s own `withComment=false` path) -- but the
 * display-label `<text>` is drawn AFTER `closeGroup()`, entirely OUTSIDE
 * that group, as a plain sibling (see `measureLollipop`'s own doc comment
 * in `class-layout-helpers.ts` for the byte-verified position formula).
 * `renderClass`'s classifier loop pushes the two pieces as separate
 * `children[]` entries to reproduce this exact sibling (not nested)
 * structure.
 *
 * The required-interface "half circle" socket shape (`LeafType
 * .LOLLIPOP_HALF`, `classifier.lollipopKind === 'half'`) needs the
 * connecting edge's own impact angle (`EntityImageLollipopInterface
 * #addImpact`, `UEllipse(SIZE, SIZE, angle - 90, 180)` -- an open 180deg
 * arc oriented away from the edge) -- ZERO reach across the entire
 * 708-fixture class corpus (grepped every `((--`/`--((`/`))--`/`--))`
 * spelling), so this draws the SAME full ellipse for both kinds rather
 * than adding unverified arc math; named divergence,
 * `plans/g2-class-svg/ledger.md` N20.
 */
export function renderLollipop(geo: ClassifierGeo, theme: ScaledTheme): { circle: string; label: string } {
  const r = (LOLLIPOP_SIZE / 2) * theme.scaleK;
  const circle = ellipse(geo.x + geo.width / 2, geo.y + geo.height / 2, r, r, {
    fill: theme.colors.graph.classBackground,
    stroke: theme.colors.border,
    'stroke-width': 1.5 * theme.scaleK,
  });
  const label = geo.rows[0] !== undefined ? renderRow(geo, geo.rows[0], theme) : '';
  return { circle, label };
}
