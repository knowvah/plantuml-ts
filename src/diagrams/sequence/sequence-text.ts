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

import { linkWrap, text } from '../../core/svg.js';

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
   * `bepipo-37-fego336`, and `core/svg.ts#TextStyle.fontWeight` for the
   * class-engine precedent). `'bold'` is accepted because the interface
   * contract this module was specified against names it, and because
   * `TextStyle` still allows it. `'normal'` completes the set so a caller
   * holding a resolved skin weight — `renderer-frame-header.ts
   * #boldFontWeight` returns `'normal' | '700'` — can pass it straight
   * through rather than narrowing at every call site.
   */
  readonly fontWeight?: 'normal' | 'bold' | '700';
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
}

/**
 * Emit one sequence `<text>`, wrapped in its `<a>` when the run carries a url.
 *
 * The output carries neither `text-anchor` nor `dominant-baseline` — not by
 * assertion, but because {@link SequenceTextSpec} cannot express them.
 */
export function sequenceText(spec: SequenceTextSpec): string {
  // Spread-conditionals rather than plain assignment: this project compiles
  // with `exactOptionalPropertyTypes`, under which an explicit `undefined` is
  // not assignable to an optional `TextStyle` field.
  const drawn = text(spec.leftX, spec.baselineY, spec.text, {
    fontFamily: spec.fontFamily,
    fontSize: spec.fontSize,
    fill: spec.fill,
    ...(spec.fontWeight !== undefined ? { fontWeight: spec.fontWeight } : {}),
    ...(spec.fontStyle !== undefined ? { fontStyle: spec.fontStyle } : {}),
    ...(spec.textDecoration !== undefined ? { textDecoration: spec.textDecoration } : {}),
    textLength: spec.width,
  });
  // `linkWrap` is `core/svg.ts`'s existing emitter, whose eight attributes and
  // their order are jar-verified; the same one `renderer-participant-shapes
  // .ts` already wraps a participant head with. There is deliberately no
  // second `<a>` builder in this engine.
  return spec.url === undefined ? drawn : linkWrap(drawn, spec.url);
}
