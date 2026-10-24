/**
 * sequence-text.ts — the ONE `<text>` emitter the sequence engine routes
 * through (mission `sequence-text-and-y-convergence`, D3).
 *
 * WHY IT EXISTS. Upstream has no per-component text markup: every label a
 * sequence component draws arrives as a `UText` at
 * `DriverTextSvg#draw`, which resolves ONE shape and emits it —
 *
 * ```java
 * final XDimension2D dim = stringBounder.calculateDimension(font, text);
 * final double width = dim.getWidth();
 * ...
 * svg.text(text, x, y, font.getFamily(text, UFontContext.SVG), font.getSize(),
 *          fontWeight, fontStyle, textDecoration, width,
 *          fontConfiguration.getAttributes(), backColor, shape.getOrientation());
 * ```
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/drawing/svg/DriverTextSvg.java:114-181
 *
 * Three properties of that call are the whole point of this module:
 *
 *   1. `x` is the text's LEFT EDGE and `y` is its BASELINE. There is no
 *      anchor and no `dominant-baseline` — 0 of the jar's 70 622 sequence
 *      `<text>` elements carry either. This port had been emitting a CENTRE
 *      with `text-anchor="middle"`, which renders in the same place and
 *      compares as a coordinate error against every jar oracle.
 *   2. `width` is the MEASURED width, and becomes `textLength`. 97.3% of the
 *      jar's `<text>` elements carry one (the rest are single characters —
 *      upstream's own `text.length() > 1` guard, already implemented by
 *      `svg-shapes.ts#textLengthOf`).
 *   3. The width comes from a `StringBounder`, i.e. from a MEASUREMENT.
 *      D1 forbids recomputing one here: the sequence renderers have no
 *      measurer, layout does, and the metric travels on the geometry. This
 *      emitter therefore takes `width` as a parameter and does no arithmetic
 *      of its own at all.
 *
 * This module deliberately owns no markup. It builds a {@link TextStyle} and
 * hands it to `core/svg.ts#text`, which is the repo's single SVG emission
 * seam (`tests/architecture/svg-emission-seam.test.ts`) and already carries
 * the `textLength` guard, the root-font-family suppression and the NBSP
 * rules. The value it adds over calling `text()` directly is that
 * `text-anchor` and `dominant-baseline` are unreachable by construction:
 * they are not fields of {@link SequenceTextSpec}, so no future sequence
 * feature can reintroduce the divergence by accident.
 */

import { decorationLines, image, linkWrap, text } from '../../core/svg.js';
import type { ExtraLine } from '../../core/klimt/drawing/svg/driver-text-svg-decorations.js';
import { UGraphicSvg } from '../../core/klimt/drawing/svg/u-graphic-svg.js';
import { basicSvgOption } from '../../core/klimt/drawing/svg/svg-graphics.js';
import { extractFlatContent } from '../../core/klimt/document-shell-fragment.js';
import { UTranslate } from '../../core/klimt/UTranslate.js';
import { Fore } from '../../core/klimt/Fore.js';
import { Back } from '../../core/klimt/Back.js';
import { NO_TEXT_BOUNDER, type SequenceRunShape } from './sequence-label-primitives.js';
import type { TextRun } from './text-block-geo.js';

/**
 * The drawable form of a creole `<math>`/`<latex>` atom on a sequence label:
 * `AtomMath` measures an image and draws that same image
 * (`AtomMath.java:64-97`), so one `core/latex.ts#renderLatexAsImage` call in
 * layout answers both halves and they agree by construction. That is why the
 * href travels on the geometry rather than being re-derived here — the same
 * carried-metrics rule (D5) that puts `width` on a text run.
 *
 * `y` is the image's own TOP edge, absolute, because an image has no baseline
 * to hang off: `AtomMath#getStartingAltitude` returns 0
 * (`AtomMath.java:73-75`) and `SheetBlock1#drawU` translates to the atom's own
 * box corner before calling `#drawU` (`SheetBlock1.java:212-217`). `x` is the
 * run's own {@link SequenceTextSpec.leftX}, which the image shares.
 *
 * The image BYTES and the exact `width`/`height` are a PERMANENT divergence:
 * this port renders through KaTeX where the jar renders through JLaTeXMath
 * (`DIVERGENCES.md`, "LaTeX rendering engine — KaTeX, not JLaTeXMath", which
 * names `<math>` as well as `<latex>`).
 */
export interface SequenceRunImage {
  readonly href: string;
  readonly width: number;
  readonly height: number;
  readonly y: number;
}

/**
 * One sequence `<text>`, in the jar's own vocabulary.
 *
 * Every field except {@link fontWeight} and {@link textDecoration} is
 * required: a text run with no measured width would silently lose its
 * `textLength`, and a missing metric must not quietly become zero (D1).
 */
export interface SequenceTextSpec {
  /** The text's LEFT edge — `DriverTextSvg`'s `x`, never a centre. Callers
   *  holding a centre derive it as `centerX - width / 2` (D4). */
  readonly leftX: number;
  /** The BASELINE — `DriverTextSvg`'s `y`, never a middle or a top. */
  readonly baselineY: number;
  readonly text: string;
  /**
   * The MEASURED width, from layout's `StringMeasurer` at this element's own
   * font. Reaches `textLength` subject to `svg-shapes.ts#textLengthOf`'s
   * `text.length() > 1` guard, which this module does not re-implement.
   */
  readonly width: number;
  readonly fontFamily: string;
  readonly fontSize: number;
  readonly fill: string;
  /**
   * `'700'` is the form this port emits for a bold sequence label — the jar's
   * deterministic-text SVG writes the numeric CSS weight, never the keyword
   * (`renderer-frame-header.ts#boldFontWeight`, jar-verified on
   * `bepipo-37-fego336`). A face weight (`900` inside a sprite) is whatever
   * `DriverTextSvg` computed (`DriverTextSvg.java:97-103`, carried on
   * `TextRun.fontWeight`).
   */
  readonly fontWeight?: string;
  /**
   * `DriverTextSvg`'s own `fontStyle` local, which is the literal string
   * `"italic"` or nothing at all:
   *
   * ```java
   * String fontStyle = null;
   * if (fontConfiguration.containsStyle(FontStyle.ITALIC) || face.isItalic())
   *     fontStyle = "italic";
   * ```
   * (`DriverTextSvg.java:110-112`) — there is no `'normal'` case upstream, so
   * this union has one member rather than mirroring `TextStyle.fontStyle`'s
   * two. Reach: a participant's stereotype row, which the jar italicises and
   * this port does not (`.agent-notes/A1-sequence-geo-text-metric-fields.md`),
   * and every `<i>`/`//…//` creole run a `TextRun` now carries.
   */
  readonly fontStyle?: 'italic';
  /** Emitted verbatim, as `TextStyle.textDecoration` is. */
  readonly textDecoration?: string;
  /**
   * The run's `[[url]]`, when it has one. `SvgGraphics#openLink`/`closeLink`
   * wrap the drawn shape in an `<a>` rather than putting an attribute on it
   * (`SvgGraphics.java:1105-1150`), so this is a WRAPPER, not a `<text>`
   * attribute — which is why it is emitted through `core/svg.ts#linkWrap`,
   * the repo's single, jar-verified `<a>` emitter, and not rebuilt here.
   */
  readonly url?: { readonly url: string; readonly tooltip: string };
  /** Set ONLY on a `<math>`/`<latex>` run, which draws an image and NO text
   *  at all — `AtomMath#drawU` emits one `UImageSvg`/`UImage` and nothing
   *  else (`AtomMath.java:78-97`). When present, {@link sequenceText} emits
   *  the `<image>` in place of the `<text>`. */
  readonly image?: SequenceRunImage;
  /** `SvgGraphics#text`'s `textBackColor` (`DriverTextSvg.java:159-173`). */
  readonly textBackColor?: string;
  /** `ExtraLines#drawAll` after the text (`DriverTextSvg.java:68-75,180`). */
  readonly extraLines?: readonly ExtraLine[];
  /** `fontConfiguration.getAttributes()` (`DriverTextSvg.java:178-180`),
   *  written on the `<text>` last (`SvgGraphics.java:737-738`). */
  readonly svgAttributes?: ReadonlyMap<string, string>;
  /** A non-text primitive: drawn by core's `UGraphicSvg` at
   *  ({@link leftX}, {@link baselineY}) -- here the shape's own origin. */
  readonly shape?: SequenceRunShape;
}

/** The fields an emitter copies verbatim off a primitive: everything
 *  `DriverTextSvg`/the shape drivers read that has no ambient fallback. */
export function primitiveFields(
  run: TextRun,
): Pick<SequenceTextSpec, 'url' | 'image' | 'shape' | 'textBackColor' | 'extraLines' | 'svgAttributes'> {
  return {
    ...(run.url !== undefined ? { url: run.url } : {}),
    ...(run.image !== undefined ? { image: run.image } : {}),
    ...(run.shape !== undefined ? { shape: run.shape } : {}),
    ...(run.textBackColor !== undefined ? { textBackColor: run.textBackColor } : {}),
    ...(run.extraLines !== undefined ? { extraLines: run.extraLines } : {}),
    ...(run.svgAttributes !== undefined ? { svgAttributes: run.svgAttributes } : {}),
  };
}

/** The run's `font-weight`: its own face weight, else `700` when it -- or,
 *  for a run that set none, the block's style (`fallbackBold`) -- is bold. */
export function runFontWeight(run: TextRun, fallbackBold = false): string | undefined {
  if (run.fontWeight !== undefined) return run.fontWeight;
  return (run.bold ?? fallbackBold) ? '700' : undefined;
}

/** `{ fontWeight }` when the run has one ({@link runFontWeight}), for an
 *  emitter's spec spread. */
export function weightOf(run: TextRun, fallbackBold = false): { fontWeight?: string } {
  const weight = runFontWeight(run, fallbackBold);
  return weight === undefined ? {} : { fontWeight: weight };
}

/** `THROWAWAY_VERSION` of the one-shape `UGraphicSvg` documents below. */
const THROWAWAY_VERSION = '$version$';

/**
 * One shape primitive through core's drivers: `ug.apply(translate).apply(
 * fore).apply(back).apply(stroke).draw(shape)` on a one-shape `UGraphicSvg`
 * at the diagram scale (`SvgGraphics#format`, `SvgGraphics.java:466-468`),
 * its inline defs (a gradient) left for `svgRoot` to lift
 * (`svg-defs.ts#collectDocumentDefs`).
 */
function shapeSvg(x: number, y: number, s: SequenceRunShape): string {
  const ug = UGraphicSvg.build(0, basicSvgOption({ scale: s.scale }), THROWAWAY_VERSION, NO_TEXT_BOUNDER);
  ug.apply(new UTranslate(x / s.scale, y / s.scale))
    .apply(new Fore(s.fore))
    .apply(new Back(s.back))
    .apply(s.stroke)
    .draw(s.shape);
  const flat = extractFlatContent(ug.getSvgString());
  return flat.extraDefs + flat.body;
}

/**
 * Emit one sequence `<text>`, wrapped in its `<a>` when the run carries a url.
 *
 * The output carries neither `text-anchor` nor `dominant-baseline` — not by
 * assertion, but because {@link SequenceTextSpec} cannot express them.
 */
export function sequenceText(spec: SequenceTextSpec): string {
  if (spec.shape !== undefined) {
    const drawnShape = shapeSvg(spec.leftX, spec.baselineY, spec.shape);
    return spec.url === undefined ? drawnShape : linkWrap(drawnShape, spec.url);
  }
  // `AtomMath#drawU` draws an image INSTEAD of text, never beside it
  // (`AtomMath.java:78-97`). `svg-shapes.ts#image` is the repo's one `<image>`
  // emitter and already writes `SvgGraphics#svgImageDataUri`'s attribute
  // order, so the link wrap below is all this branch adds.
  if (spec.image !== undefined) {
    const img = spec.image;
    const drawnImage = image(spec.leftX, img.y, img.width, img.height, img.href);
    return spec.url === undefined ? drawnImage : linkWrap(drawnImage, spec.url);
  }
  // Spread-conditionals rather than plain assignment: this project compiles
  // with `exactOptionalPropertyTypes`, under which an explicit `undefined` is
  // not assignable to an optional `TextStyle` field.
  const drawn = text(spec.leftX, spec.baselineY, spec.text, {
    fontFamily: spec.fontFamily,
    fontSize: spec.fontSize,
    fill: spec.fill,
    ...(spec.fontWeight !== undefined ? { fontWeight: spec.fontWeight as '700' } : {}),
    ...(spec.fontStyle !== undefined ? { fontStyle: spec.fontStyle } : {}),
    ...(spec.textDecoration !== undefined ? { textDecoration: spec.textDecoration } : {}),
    ...(spec.textBackColor !== undefined ? { textBackColor: spec.textBackColor } : {}),
    ...(spec.svgAttributes !== undefined ? { svgAttributes: spec.svgAttributes } : {}),
    textLength: spec.width,
  });
  // `linkWrap` is `core/svg.ts`'s existing emitter, whose eight attributes and
  // their order are jar-verified; the same one `renderer-participant-shapes
  // .ts` already wraps a participant head with. There is deliberately no
  // second `<a>` builder in this engine.
  const linked = spec.url === undefined ? drawn : linkWrap(drawn, spec.url);
  // `extraLines.drawAll(x, y, width, font, mapper, svg)` AFTER the `<text>`
  // (`DriverTextSvg.java:180`).
  if (spec.extraLines === undefined) return linked;
  return linked + decorationLines(spec.extraLines, spec.leftX, spec.baselineY, spec.width, spec.fontSize);
}
