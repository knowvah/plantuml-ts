/**
 * sequence-label-primitives.ts — what a sequence label's core `TextBlock`
 * DRAWS, recorded as geometry: the primitive half of
 * `sequence-creole-sheet.ts` (split off for the 500-line cap).
 *
 * Upstream a component draws its text block straight onto its `UGraphic`
 * (`AbstractTextualComponent#getTextBlock().drawU(ug)`), and every shape lands
 * at a driver: `DriverTextSvg` for a `UText`, `DriverImageSvg` for a `UImage`,
 * the shape drivers for the `ULine` a `----` rule becomes, a table's grid, a
 * vector sprite's paths. This port's sequence renderers hold no measurer and
 * draw after layout has been scaled (D1), so the block is drawn ONCE, in
 * layout, onto {@link RecordingUGraphic}, which turns each shape into a
 * {@link SequenceTextPrimitive} relative to the block's top-left:
 *
 * - `UText` -> a TEXT run (`TextRun`, baseline `y`), carrying every field
 *   `DriverTextSvg#draw` reads off the run's `FontConfiguration`
 *   (`DriverTextSvg.java:93-180`, via `driver-text-svg-decorations.ts`);
 * - `UImage` -> an IMAGE run (`TextRun.image`), which `scale-geo.ts` scales;
 * - any other shape -> a SHAPE run (`TextRun.shape`): the shape and the
 *   `UParam` ink it was drawn with, drawn later through core's `UGraphicSvg`
 *   (`sequence-text.ts#sequenceText`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/skin/AbstractTextualComponent.java:84-92
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/drawing/svg/DriverTextSvg.java:93-180
 */
import type { FontSpec, StringMeasurer } from '../../core/measurer.js';
import type { FontConfiguration } from '../../core/klimt/shape/UText.js';
import { FontStyle, getFont, UText } from '../../core/klimt/shape/UText.js';
import { UImage } from '../../core/klimt/shape/UImage.js';
import { UEmpty } from '../../core/klimt/shape/UEmpty.js';
import type { UChange } from '../../core/klimt/UChange.js';
import type { UGraphic } from '../../core/klimt/UGraphic.js';
import type { UParam } from '../../core/klimt/UParam.js';
import type { UShape } from '../../core/klimt/UShape.js';
import type { UTranslate } from '../../core/klimt/UTranslate.js';
import type { StringBounder } from '../../core/klimt/font/StringBounder.js';
import type { CreoleAtomUrl } from '../../core/klimt/creole/atom/Atom.js';
import { XDimension2D } from '../../core/klimt/geom/XDimension2D.js';
import { textRenderDecorations } from '../../core/klimt/drawing/svg/driver-text-svg-decorations.js';
import { runDrawMetrics } from './run-draw-metrics.js';
import type { TextRun } from './text-block-geo.js';

/**
 * One drawn element of a sequence label, relative to its block's top-left.
 * The union is discriminated by which optional field is set (see
 * {@link primitiveKind}); it is the `TextRun` the geometry already carries,
 * so every geo field that held a label's runs holds its primitives unchanged.
 */
export type SequenceTextPrimitive = TextRun;

/** {@link SequenceTextPrimitive}'s three kinds. */
export type SequencePrimitiveKind = 'text' | 'image' | 'shape';

/** Which driver draws `p`: a shape run, an image run, or a `<text>`. */
export function primitiveKind(p: SequenceTextPrimitive): SequencePrimitiveKind {
  if (p.shape !== undefined) return 'shape';
  return p.image !== undefined ? 'image' : 'text';
}

/**
 * The `FontSpec` one atom is MEASURED at — its own family and its EFFECTIVE
 * (muted) size, `getFont` applying `FontPosition.mute` at read time
 * (`FontConfiguration.java:98-104`), plus the BOLD/ITALIC a weight-aware
 * measurer reads.
 */
export function atomFontSpec(font: FontConfiguration): FontSpec {
  return {
    family: font.family,
    size: getFont(font).size,
    ...(font.styles.has(FontStyle.BOLD) ? { weight: 'bold' as const } : {}),
    ...(font.styles.has(FontStyle.ITALIC) ? { style: 'italic' as const } : {}),
  };
}

/** A run moved by `(dx, dy)`: an image run's top (`SequenceRunImage.y`) is
 *  absolute, so it moves with the run. */
export function offsetRun(run: TextRun, dx: number, dy: number): TextRun {
  const moved = { ...run, x: run.x + dx, y: run.y + dy };
  return run.image === undefined ? moved : { ...moved, image: { ...run.image, y: run.image.y + dy } };
}

/** A font as a core bounder receives it: a `FontConfiguration` (whose BOLD/
 *  ITALIC live in `styles`) or a bare `{family, size}`. */
function specOf(font: { readonly family: string; readonly size: number }): FontSpec {
  const styles = 'styles' in font ? (font as FontConfiguration).styles : undefined;
  return {
    family: font.family,
    size: font.size,
    ...(styles?.has(FontStyle.BOLD) === true ? { weight: 'bold' as const } : {}),
    ...(styles?.has(FontStyle.ITALIC) === true ? { style: 'italic' as const } : {}),
  };
}

/**
 * The `StringBounder` a sequence block is sized and drawn with. Core's
 * `MeasurerStringBounder` hands the measurer the `FontConfiguration` itself,
 * whose BOLD is not a `FontSpec.weight`, so a weight-aware measurer sizes
 * bold atoms as regular (sdd2 T6a, 137 of 687 pins under `JarMeasurer`);
 * this one maps the styles first. The size is NOT re-muted: core's atom
 * code already passes `getFont`'s muted size (`blocks-creole-atoms.ts
 * #measuringFont`).
 */
export function sequenceStringBounder(measurer: StringMeasurer): StringBounder {
  return {
    calculateDimension(font, text) {
      const dim = measurer.measure(text, specOf(font));
      return new XDimension2D(dim.width, dim.height);
    },
    getDescent(font, text) {
      return measurer.getDescent(specOf(font), text);
    },
  };
}

/**
 * A non-text, non-image shape the block drew, with the `UParam` ink it was
 * drawn under — what `UGraphicSvg#draw` needs to draw it again
 * (`sequence-text.ts`). `scale` is the diagram scale `scale-geo.ts` sets;
 * the run's own `x`/`y` are already scaled, so the emitter draws at
 * `x / scale` under an `SvgOption.scale` of `scale` (`SvgGraphics#format`
 * multiplies every coordinate and stroke width, `SvgGraphics.java:466-468`).
 */
export interface SequenceRunShape {
  readonly shape: UShape;
  readonly fore: ReturnType<UParam['getColor']>;
  readonly back: ReturnType<UParam['getBackcolor']>;
  readonly stroke: ReturnType<UParam['getStroke']>;
  readonly scale: number;
}

/** What the recorder appends to, and the `[[url]]` it is inside. */
interface Sink {
  readonly out: TextRun[];
  readonly measurer: StringMeasurer;
  readonly bounder: StringBounder;
  url: CreoleAtomUrl | undefined;
}

/** The `font-weight` the run's `bold` flag does not already say: the
 *  numeric face weight `DriverTextSvg` writes (`java:97-103`), e.g. a
 *  sprite's `font-weight="900"`. `bold` alone means `700`. */
function extraWeight(fontWeight: string | null, bold: boolean): string | undefined {
  const implied = bold ? '700' : null;
  return fontWeight === implied ? undefined : (fontWeight ?? undefined);
}

/** `DriverTextSvg#draw`'s per-run reads of the `FontConfiguration`
 *  (`java:93-180`) as `TextRun` style fields. */
function styleFieldsOf(font: FontConfiguration, drawnSize: number): Partial<TextRun> {
  const deco = textRenderDecorations(font, drawnSize);
  const bold = font.styles.has(FontStyle.BOLD);
  const weight = extraWeight(deco.fontWeight, bold);
  return {
    ...(bold ? { bold: true } : {}),
    ...(weight !== undefined ? { fontWeight: weight } : {}),
    ...(deco.fontStyle !== null ? { italic: true } : {}),
    ...(font.color !== null ? { color: font.color } : {}),
    ...(deco.textDecoration !== null ? { decoration: deco.textDecoration } : {}),
    ...(deco.backColor !== null ? { textBackColor: deco.backColor } : {}),
    ...(deco.extraLines.length > 0 ? { extraLines: deco.extraLines } : {}),
    // `fontConfiguration.getAttributes()` (`DriverTextSvg.java:178-180`).
    ...(font.svgAttributes !== undefined && font.svgAttributes.attributes().size > 0
      ? { svgAttributes: font.svgAttributes.attributes() }
      : {}),
  };
}

/** A `UText` as a text run at baseline `(x, y)`: the metrics the emitter
 *  needs, measured here (D1). */
function textRunOf(shape: UText, x: number, y: number, sink: Sink): TextRun {
  const font = shape.getFontConfiguration();
  const spec = atomFontSpec(font);
  const text = shape.getText();
  const dim = sink.measurer.measure(text, spec);
  return {
    text,
    x,
    y,
    textWidth: dim.width,
    ...runDrawMetrics(text, spec, sink.measurer),
    textAscent: dim.height - sink.measurer.getDescent(spec, text),
    textLineHeight: dim.height,
    fontFamily: spec.family,
    fontSize: spec.size,
    ...styleFieldsOf(font, spec.size),
    ...(sink.url !== undefined ? { url: sink.url } : {}),
  };
}

/** A `UImage` as an image run whose top-left is `(x, y)`. `DriverImageSvg`
 *  emits a raster-backed image at its `Math.round`ed size, the declared one
 *  otherwise (`driver-image-svg.ts`, jar-verified); the run advances by the
 *  raw box. */
function imageRunOf(shape: UImage, x: number, y: number, sink: Sink): TextRun {
  const raster = shape.getRasterWidth() !== undefined && shape.getRasterHeight() !== undefined;
  const width = raster ? Math.round(shape.getWidth()) : shape.getWidth();
  const height = raster ? Math.round(shape.getHeight()) : shape.getHeight();
  return {
    text: '',
    x,
    y,
    textWidth: shape.getWidth(),
    textAscent: shape.getHeight(),
    textLineHeight: shape.getHeight(),
    ...(sink.url !== undefined ? { url: sink.url } : {}),
    image: { href: shape.getHref(), width, height, y },
  };
}

/** Any other shape as a shape run at `(x, y)`, with the ink in force. */
function shapeRunOf(shape: UShape, x: number, y: number, param: UParam, sink: Sink): TextRun {
  return {
    text: '',
    x,
    y,
    textWidth: 0,
    textAscent: 0,
    textLineHeight: 0,
    ...(sink.url !== undefined ? { url: sink.url } : {}),
    shape: { shape, fore: param.getColor(), back: param.getBackcolor(), stroke: param.getStroke(), scale: 1 },
  };
}

/**
 * A `UGraphic` that records instead of drawing. `inner` is a real core
 * graphic (`UGraphicSvg`) that only tracks state: every `apply` goes through
 * it, so translate and ink follow upstream's `UParam` rules exactly; nothing
 * is drawn on it. `startUrl`/`closeUrl` bracket the runs of a `[[url]]` atom
 * (`AtomText#drawU`), as `SvgGraphics#openLink`/`closeLink` do.
 */
class RecordingUGraphic implements UGraphic {
  constructor(
    private readonly inner: UGraphic,
    private readonly sink: Sink,
  ) {}

  apply(change: UChange): UGraphic {
    return new RecordingUGraphic(this.inner.apply(change), this.sink);
  }

  draw(shape: UShape): void {
    const t = this.inner.getTranslate();
    const x = t.getDx();
    const y = t.getDy();
    if (shape instanceof UText) this.sink.out.push(textRunOf(shape, x, y, this.sink));
    else if (shape instanceof UImage) this.sink.out.push(imageRunOf(shape, x, y, this.sink));
    else if (!(shape instanceof UEmpty)) this.sink.out.push(shapeRunOf(shape, x, y, this.inner.getParam(), this.sink));
  }

  getParam(): UParam {
    return this.inner.getParam();
  }

  getTranslate(): UTranslate {
    return this.inner.getTranslate();
  }

  getStringBounder(): StringBounder {
    return this.sink.bounder;
  }

  startUrl(url: CreoleAtomUrl): void {
    this.sink.url = url;
  }

  closeUrl(): void {
    this.sink.url = undefined;
  }

  startGroup(): void {
    /* a label block opens no `<g>` of its own */
  }

  closeGroup(): void {
    /* see startGroup */
  }
}

/** What {@link recordDrawing} draws with: the measurer the block was sized
 *  with and the bounder built from it. */
export interface RecordingEnv {
  readonly measurer: StringMeasurer;
  readonly bounder: StringBounder;
}

/**
 * Every primitive `draw` emits onto `inner` (a state-tracking graphic with
 * the component's `ug.apply` chain already applied), in emission order.
 */
export function recordDrawing(
  inner: UGraphic,
  env: RecordingEnv,
  draw: (ug: UGraphic) => void,
): readonly SequenceTextPrimitive[] {
  const sink: Sink = { out: [], measurer: env.measurer, bounder: env.bounder, url: undefined };
  draw(new RecordingUGraphic(inner, sink));
  return sink.out;
}

/** The driver bounder of a core graphic that draws no `UText` -- the
 *  recorder's state graphic and a one-shape emission document. */
export const NO_TEXT_BOUNDER = {
  calculateDimension: (
    _font: { readonly family: string; readonly size: number },
    _text: string,
  ): { width: number } => ({
    width: 0,
  }),
};

/** {@link XDimension2D} as the plain pair a `LabelBlock` carries. */
export function plainDimension(dim: XDimension2D): { readonly width: number; readonly height: number } {
  return { width: dim.getWidth(), height: dim.getHeight() };
}
