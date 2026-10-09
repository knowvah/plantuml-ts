/**
 * class-scale-geo-row.ts — row/atom/chrome-level pure scaling helpers for
 * `class-scale-geo.ts` (cdd-T29, D4). Split out purely to keep the parent
 * module under this project's 500-line cap (same precedent as `class-geo-
 * types.ts`'s own splits) -- every function here multiplies a resolved,
 * already-laid-out numeric field by `k`, mirroring `sequence/scale-geo.ts`'s
 * "scale resolved geometry as pure data at the layout->render boundary"
 * pattern for the class engine's OWN geometry shapes.
 *
 * Upstream applies scale in exactly one place: `SvgGraphics#format`
 * (`klimt/drawing/svg/SvgGraphics.java:466-472`) multiplies EVERY emitted
 * numeric -- coordinates, font sizes (`:695`), stroke widths (`:557`) --
 * on its way to text. This port's class renderer draws through the plain
 * `core/svg.ts` string emitters (not klimt's already-scale-aware
 * `SvgGraphicsCore#format`), so there is no single `format` seam to
 * multiply through -- scaling the INPUTS here is the same operation as
 * scaling upstream's outputs, since every derived value the renderer
 * computes from geometry is linear in its inputs (same argument
 * `sequence/scale-geo.ts`'s own header makes).
 *
 * `row.fontSize`/`atom.font.size` deserve their own note: `renderer-
 * classifier-rows.ts#renderRowText` reads `row.fontSize ?? theme.fontSize`
 * directly -- and `theme` reaches `renderClass(geo, theme)` UNSCALED
 * (`index.ts`'s `render(geo, theme)` call site is outside this task's
 * write-set and needs no change per the task spec). `scaleRow` below
 * therefore MATERIALIZES the fallback -- `row.fontSize = (row.fontSize ??
 * themeFontSize) * k` -- for EVERY row, so the renderer's own `??`
 * fallback is never reached with an unscaled value. This is safe because
 * `scaleClassGeometry` (the parent module) never calls `scaleRow` at all
 * when `k === 1` (the identity short-circuit every scale function in this
 * file family follows), so the common unscaled case is byte-for-byte
 * unchanged: `row.fontSize` stays exactly as absent as it was before this
 * task.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/core/TextBlockExporter.java:205-209
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/drawing/svg/SvgGraphics.java:466-472,557,695
 * @see src/diagrams/sequence/scale-geo.ts
 */
import type { ClassifierGeo } from './class-geo-types.js';
import type { MemberRenderAtom } from './class-member-creole.js';
import type { FontConfiguration } from '../../core/klimt/shape/UText.js';
import type { GenericTagGeo } from './class-stereotype.js';
import type { EmptyPackageLeafDim } from './class-namespace-shape.js';
import type { LeafSymbolInk } from '../../core/svek/image/leaf-sizing.js';
import type { DrawablePrimitive } from '../../core/creole-atoms.js';
import { fmt } from '../../core/svg-format.js';
import { UPath } from '../../core/klimt/shape/UPath.js';
import { UEllipse } from '../../core/klimt/shape/UEllipse.js';
import { UText } from '../../core/klimt/shape/UText.js';
import { UTranslate } from '../../core/klimt/UTranslate.js';
import { XAffineTransform } from '../../core/klimt/UGraphicWithScale.js';

type RowGeo = ClassifierGeo['rows'][number];

function scaleFontConfig(font: FontConfiguration, k: number): FontConfiguration {
  return { ...font, size: font.size * k };
}

/** `'vector'` atom scaling, split out of {@link scaleAtom} to keep that
 *  dispatcher under this project's function-length cap. `factor` feeds
 *  `openiconic-glyphs.ts#buildOpenIconicPathD` DIRECTLY at render time
 *  (every raw glyph coordinate is `coord * factor`, then translated to
 *  origin) -- scaling `factor` itself, not just `width`/`height`, is
 *  required for the drawn glyph SHAPE to scale, since `width`/`height`
 *  (`openIconicDims`) are never read back by the path builder. Unverified
 *  against a jar fixture combining `scale` with an OpenIconic glyph (zero
 *  corpus reach in this task's read-set) -- named, not silently skipped. */
function scaleVectorAtom(atom: Extract<MemberRenderAtom, { kind: 'vector' }>, k: number): MemberRenderAtom {
  return {
    ...atom,
    width: atom.width * k,
    height: atom.height * k,
    factor: atom.factor * k,
    ...(atom.dy !== undefined ? { dy: atom.dy * k } : {}),
  };
}

/** C-4 (cdd3-T23): scales one `'drawable'` (SVG-sprite) primitive's own
 *  geometry -- `translate` always (every primitive carries a position
 *  there or bakes it into `UPath`'s own segments, `creole-atoms.ts
 *  #DrawablePrimitive`'s own doc comment), plus the shape itself: a
 *  `UPath`'s segment coordinates via `UPath#affine` with a pure
 *  scale-by-`k` transform (angle 0 -- no rotation involved, `scale: k` so
 *  an ARCTO segment's radii scale too); a `UEllipse` via its own
 *  `.scale(k)`; a `UText`'s font size (its drawn `<text font-size>`).
 *  Unverified against a jar fixture combining `skinparam scale` with an
 *  SVG sprite (zero corpus reach) -- the same linear-scaling argument this
 *  module's own header makes for every OTHER atom kind, generalized here
 *  rather than left as a type-exhaustiveness gap. */
function scaleDrawablePrimitive(primitive: DrawablePrimitive, k: number): DrawablePrimitive {
  const translate = new UTranslate(primitive.translate.getDx() * k, primitive.translate.getDy() * k);
  if (primitive.shape instanceof UPath) {
    return { ...primitive, translate, shape: primitive.shape.affine(XAffineTransform.getScaleInstance(k, k), 0, k) };
  }
  if (primitive.shape instanceof UEllipse) {
    return { ...primitive, translate, shape: primitive.shape.scale(k) };
  }
  if (primitive.shape instanceof UText) {
    const fc = primitive.shape.getFontConfiguration();
    return { ...primitive, translate, shape: UText.build(primitive.shape.getText(), { ...fc, size: fc.size * k }) };
  }
  return { ...primitive, translate };
}

function scaleDrawableAtom(atom: Extract<MemberRenderAtom, { kind: 'drawable' }>, k: number): MemberRenderAtom {
  return {
    ...atom,
    width: atom.width * k,
    height: atom.height * k,
    primitives: atom.primitives.map((p) => scaleDrawablePrimitive(p, k)),
    ...(atom.dy !== undefined ? { dy: atom.dy * k } : {}),
  };
}

/** `'listNumber'` atom scaling, split out of {@link scaleAtom} for the same
 *  reason as {@link scaleVectorAtom}. C-2: `dx`/`textWidth`/`width` are all
 *  render-time pixel geometry (`AtomTextUtils.java:145-159`'s margins +
 *  measured text width) -- scale every one of them, mirroring `'bullet'`'s
 *  own `width`-only scale (this kind additionally carries `dx`/`textWidth`,
 *  which `'bullet'` has no equivalent of). */
function scaleListNumberAtom(atom: Extract<MemberRenderAtom, { kind: 'listNumber' }>, k: number): MemberRenderAtom {
  return {
    ...atom,
    font: scaleFontConfig(atom.font, k),
    dx: atom.dx * k,
    textWidth: atom.textWidth * k,
    width: atom.width * k,
  };
}

/**
 * One member row's per-atom creole content, scaled. `atom.font.size` feeds
 * `renderer-classifier-rows.ts#renderRowAtoms`'s own `<text font-size>`
 * DIRECTLY (never the ambient `theme.fontSize`), so scaling the atom's own
 * font is sufficient -- no theme-fallback materialization needed here,
 * unlike {@link scaleRow}'s header-row case.
 */
export function scaleAtom(atom: MemberRenderAtom, k: number): MemberRenderAtom {
  switch (atom.kind) {
    case 'text':
      return {
        ...atom,
        font: scaleFontConfig(atom.font, k),
        width: atom.width * k,
        ...(atom.renderWidth !== undefined ? { renderWidth: atom.renderWidth * k } : {}),
        ...(atom.renderDx !== undefined ? { renderDx: atom.renderDx * k } : {}),
        ...(atom.dy !== undefined ? { dy: atom.dy * k } : {}),
      };
    case 'image':
      return { ...atom, width: atom.width * k, height: atom.height * k };
    case 'bullet':
      return { ...atom, width: atom.width * k };
    case 'vector':
      return scaleVectorAtom(atom, k);
    case 'listNumber':
      return scaleListNumberAtom(atom, k);
    case 'drawable':
      return scaleDrawableAtom(atom, k);
  }
}

/** One classifier row, scaled -- see this module's header for why
 *  `fontSize` is unconditionally materialized (never left to the
 *  renderer's own `row.fontSize ?? theme.fontSize` fallback). */
export function scaleRow(row: RowGeo, k: number, themeFontSize: number): RowGeo {
  return {
    ...row,
    y: row.y * k,
    indent: row.indent * k,
    fontSize: (row.fontSize ?? themeFontSize) * k,
    ...(row.width !== undefined ? { width: row.width * k } : {}),
    ...(row.badgeIndent !== undefined ? { badgeIndent: row.badgeIndent * k } : {}),
    ...(row.visibilityBlockHeight !== undefined ? { visibilityBlockHeight: row.visibilityBlockHeight * k } : {}),
    ...(row.visibilityBlockTopDy !== undefined ? { visibilityBlockTopDy: row.visibilityBlockTopDy * k } : {}),
    ...(row.atoms !== undefined ? { atoms: row.atoms.map((a) => scaleAtom(a, k)) } : {}),
    ...(row.memberWrap !== undefined
      ? { memberWrap: { ...row.memberWrap, height: row.memberWrap.height * k, width: row.memberWrap.width * k } }
      : {}),
  };
}

/** G2 N23: a classifier's stereotype/generic-tag box, scaled. */
export function scaleGenericTag(tag: GenericTagGeo, k: number): GenericTagGeo {
  return {
    ...tag,
    lines: tag.lines.map((l) => ({ ...l, x: l.x * k, y: l.y * k, width: l.width * k })),
    rectX: tag.rectX * k,
    rectY: tag.rectY * k,
    rectWidth: tag.rectWidth * k,
    rectHeight: tag.rectHeight * k,
    textX: tag.textX * k,
    textY: tag.textY * k,
    textWidth: tag.textWidth * k,
    fontSize: tag.fontSize * k,
  };
}

/** G2 N33: a collapsed-empty `package`/`namespace` leaf's folder-tab
 *  dimensions, scaled. */
export function scaleFolderTab(tab: EmptyPackageLeafDim, k: number): EmptyPackageLeafDim {
  return {
    width: tab.width * k,
    height: tab.height * k,
    wtitle: tab.wtitle * k,
    htitle: tab.htitle * k,
    baselineOffset: tab.baselineOffset * k,
    // cdd3-T21 (E3-6): the leaf's stereo block, same uniform k.
    ...(tab.stereo !== undefined
      ? {
          stereo: {
            width: tab.stereo.width * k,
            height: tab.stereo.height * k,
            lines: tab.stereo.lines.map((l) => ({ ...l, x: l.x * k, baseline: l.baseline * k, width: l.width * k })),
          },
        }
      : {}),
    ...(tab.rect === true ? { rect: true as const } : {}),
    // cdd3-T31: the leaf title's `UText` ink, same uniform k.
    ...(tab.titleInk !== undefined ? { titleInk: scaleSymbolInk(tab.titleInk, k) } : {}),
  };
}

/** An `actor` leaf's own drawn ink extent, scaled. */
export function scaleSymbolInk(ink: LeafSymbolInk, k: number): LeafSymbolInk {
  return { minX: ink.minX * k, minY: ink.minY * k, maxX: ink.maxX * k, maxY: ink.maxY * k };
}

/** CDD B7FU-R2: a sprite badge's resolved `<image>` dimensions, scaled. */
export function scaleBadgeSpriteImage(
  badge: NonNullable<ClassifierGeo['badgeSpriteImage']>,
  k: number,
): NonNullable<ClassifierGeo['badgeSpriteImage']> {
  return { ...badge, width: badge.width * k, height: badge.height * k };
}

/**
 * A fixed `"N,M"` dash-pattern string (`EnhancedDividerPart.strokeDasharray`/
 * `NoteDividerDraw.strokeDasharray`, both built by `separatorStrokeDasharray`
 * as the literal `'1,2'` for a `.` separator) -- scaled and reformatted
 * TOGETHER, mirroring `sequence/scale-geo.ts#scaledDashPattern`'s identical
 * "build and format as one string" rationale (upstream builds the dash-array
 * attribute value as one string, from `format()`, at `setStrokeWidth` time).
 */
export function scaleDashArrayString(pattern: string, k: number): string {
  return pattern
    .split(',')
    .map((n) => fmt(Number(n) * k))
    .join(',');
}
