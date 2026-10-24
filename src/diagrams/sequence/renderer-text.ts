/**
 * renderer-text.ts -- one carried label run, drawn through a `UGraphic`
 * (sdd3 batch 8, T8c; `plans/sequence-divergence-drive-3/diagnosis/
 * handwritten.md`, "The seam design", the Text paragraph).
 *
 * Upstream a component draws its text block straight onto its `UGraphic`;
 * every atom lands at a driver (`AtomText#drawU`, `AtomText.java:197-236`):
 * `DriverTextSvg` for a `UText`, `DriverImageSvg` for a `UImage`, the shape
 * drivers for anything else, with `ug.startUrl`/`closeUrl` around a linked
 * atom. This port records a label's atoms in layout as `TextRun`s
 * (`sequence-label-primitives.ts`) and used to re-emit them as strings
 * (`sequence-text.ts#sequenceText`); {@link drawRun} is the draw half that
 * puts them back on a `UGraphic`.
 *
 * ## The text is drawn UNTRIMMED, at the layout x
 *
 * `DriverTextSvg#draw` shifts `x` right by one space width per leading space,
 * then `StringUtils.trin`s the text and measures what is left
 * (`DriverTextSvg.java:113-126`). Layout resolved the same two numbers into
 * `drawDx`/`drawWidth` (`run-draw-metrics.ts`) for the string emitter; here the
 * driver does its own, so the run is drawn as `UText.build(run.text, fc)` at
 * `(run.x, run.y + dy)` and those two fields are never read.
 *
 * ## The `FontConfiguration` is rebuilt from the run's flat fields
 *
 * A run is geometry (layout measures it), so it carries
 * what `DriverTextSvg` READ off the configuration rather than the
 * configuration: the decoration string, the back colour, the extra lines.
 * {@link fontConfigurationOf} inverts `driver-text-svg-decorations.ts#
 * accumulateDecorations`: `underline` / `line-through` / `wavy underline` are
 * the UNDERLINE / STRIKE / WAVE flags; an extra line below the baseline is an
 * UNDERLINE and one above it a STRIKE, both coloured by the one
 * `extendedColor` field; a back colour is BACKCOLOR with that same field
 * (`FontConfiguration.java:144`, one field -- so a run that carries both has
 * the same colour in each).
 */

import type { UGraphic } from '../../core/klimt/UGraphic.js';
import { Back } from '../../core/klimt/Back.js';
import { Fore } from '../../core/klimt/Fore.js';
import { SvgAttributes } from '../../core/klimt/SvgAttributes.js';
import { UTranslate } from '../../core/klimt/UTranslate.js';
import { UImage } from '../../core/klimt/shape/UImage.js';
import { FontStyle, UText, type FontConfiguration } from '../../core/klimt/shape/UText.js';
import type { TextRun } from './text-block-geo.js';

/** What a run falls back to where creole set nothing: the block's font and
 *  ink (`DriverTextSvg#draw` reads one `FontConfiguration` per `UText`,
 *  `:104-160,177-180`). `bold` is the component STYLE's own weight, which a
 *  run that set its own beats (`sequence-text.ts#runFontWeight`). */
export interface RunAmbient {
  readonly fontFamily: string;
  readonly fontSize: number;
  readonly color: string;
  readonly bold?: boolean;
}

/** A `[[url]]`'s href and tooltip: `UGraphic#startUrl`'s argument. */
export interface RunUrl {
  readonly url: string;
  readonly tooltip: string;
}

/** The pair `UGraphic#startUrl` / `#closeUrl` (`UGraphic.java:68-70`), duck
 *  typed as `UGraphicDelegator` forwards them: only the SVG graphic (and a
 *  delegator over it) opens an `<a>`. */
interface UrlCapable {
  startUrl(url: RunUrl): void;
  closeUrl(): void;
}

const WAVY_UNDERLINE = 'wavy underline';
const UNDERLINE_CSS = 'underline';
const LINE_THROUGH_CSS = 'line-through';

/** The decoration flags `accumulateDecorations` turns into the run's CSS
 *  `text-decoration` string (`DriverTextSvg.java:129-157`). */
function decorationStyles(decoration: string | undefined): FontStyle[] {
  if (decoration === undefined) return [];
  const wavy = decoration.includes(WAVY_UNDERLINE);
  const rest = decoration.replace(WAVY_UNDERLINE, '');
  return [
    ...(rest.includes(UNDERLINE_CSS) ? [FontStyle.UNDERLINE] : []),
    ...(rest.includes(LINE_THROUGH_CSS) ? [FontStyle.STRIKE] : []),
    ...(wavy ? [FontStyle.WAVE] : []),
  ];
}

/** An extra line below the baseline is an extended-colour UNDERLINE, one above
 *  it an extended-colour STRIKE (`DriverTextSvg.java:135-148`). */
function extraLineStyles(run: TextRun): FontStyle[] {
  return (run.extraLines ?? []).map((line) => (line.deltaY > 0 ? FontStyle.UNDERLINE : FontStyle.STRIKE));
}

/** The one `extendedColor` the run's extra lines or back colour were drawn
 *  with (`FontConfiguration.java:144`). */
function extendedColorOf(run: TextRun): string | undefined {
  return run.textBackColor ?? run.extraLines?.[0]?.color;
}

/** The style flags of the run (module header). */
function stylesOf(run: TextRun, ambient: RunAmbient): ReadonlySet<FontStyle> {
  const styles = new Set<FontStyle>([...decorationStyles(run.decoration), ...extraLineStyles(run)]);
  if (run.bold ?? ambient.bold === true) styles.add(FontStyle.BOLD);
  if (run.italic === true) styles.add(FontStyle.ITALIC);
  if (run.textBackColor !== undefined) styles.add(FontStyle.BACKCOLOR);
  return styles;
}

/** The run's `<text name=value>` pairs as the configuration's attributes
 *  (`FontConfiguration.java:147`), put one by one (`SvgAttributes.java:79-83`)
 *  into the sorted map the creole tag built them in. */
function svgAttributesOf(run: TextRun): SvgAttributes | undefined {
  if (run.svgAttributes === undefined) return undefined;
  return [...run.svgAttributes].reduce((all, [name, value]) => all.add(name, value), SvgAttributes.empty());
}

/**
 * The `FontConfiguration` `DriverTextSvg#draw` read the run's fields off, as
 * far as the draw depends on it (module header, "The `FontConfiguration` is
 * rebuilt"). A face weight rides on `fontFace` (`DriverTextSvg.java:97-103`).
 */
export function fontConfigurationOf(run: TextRun, ambient: RunAmbient): FontConfiguration {
  const extendedColor = extendedColorOf(run);
  const svgAttributes = svgAttributesOf(run);
  return {
    family: run.fontFamily ?? ambient.fontFamily,
    size: run.fontSize ?? ambient.fontSize,
    color: run.color ?? ambient.color,
    styles: stylesOf(run, ambient),
    ...(run.fontWeight === undefined ? {} : { fontFace: { cssWeight: Number(run.fontWeight), italic: false } }),
    ...(extendedColor === undefined ? {} : { extendedColor }),
    ...(svgAttributes === undefined ? {} : { svgAttributes }),
  };
}

/** `ug.startUrl(url); draw(); ug.closeUrl()` when `url` is set, else just
 *  `draw()` -- `AtomText#drawU:197-198,235-236`, `LivingSpace.java:209-211`. */
export function withUrl(ug: UGraphic, url: RunUrl | undefined, draw: () => void): void {
  const capable = ug as Partial<UrlCapable>;
  if (url === undefined) return draw();
  capable.startUrl?.(url);
  draw();
  capable.closeUrl?.();
}

/**
 * One run, drawn through `ug`, shifted down by `dy`:
 *
 * - a `shape` run: its recorded `apply` chain (`translate`, `Fore`, `Back`,
 *   stroke) then `draw(shape)`;
 * - an `image` run: `UImage` at the run's `x` and the image's own top
 *   (`AtomMath.java:78-97`; the image's `y` is absolute, so `dy` moves it as it
 *   moves the baseline beside it);
 * - otherwise a `UText` at `(run.x, run.y + dy)`, untrimmed (module header);
 *
 * each inside the run's `[[url]]` when it has one.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/legacy/AtomText.java:190-240
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/drawing/svg/DriverTextSvg.java:93-180
 */
export function drawRun(ug: UGraphic, run: TextRun, ambient: RunAmbient, dy = 0): void {
  withUrl(ug, run.url, () => {
    if (run.shape !== undefined) return drawShapeRun(ug, run, dy);
    if (run.image !== undefined) return drawImageRun(ug, run, dy);
    ug.apply(new UTranslate(run.x, run.y + dy)).draw(UText.build(run.text, fontConfigurationOf(run, ambient)));
  });
}

/** A `shape` run: `apply(translate).apply(fore).apply(back).apply(stroke)
 *  .draw(shape)` -- fresh per shape, as the creole sheet recorded it. */
function drawShapeRun(ug: UGraphic, run: TextRun, dy: number): void {
  const s = run.shape!;
  ug.apply(new UTranslate(run.x, run.y + dy))
    .apply(new Fore(s.fore))
    .apply(new Back(s.back))
    .apply(s.stroke)
    .draw(s.shape);
}

/** An `image` run: already at its drawn (raster-rounded) size, so no raster
 *  dims ride on the `UImage` and `DriverImageSvg` emits it as is. */
function drawImageRun(ug: UGraphic, run: TextRun, dy: number): void {
  const img = run.image!;
  ug.apply(new UTranslate(run.x, img.y + dy)).draw(UImage.build(img.width, img.height, img.href));
}
