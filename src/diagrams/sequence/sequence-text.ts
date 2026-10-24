/**
 * sequence-text.ts — the carried creole label runs a sequence component draws
 * at the ENGINE's ambient font (mission `sequence-text-and-y-convergence`,
 * D3; sdd3 T8e).
 *
 * Upstream has no per-component text markup: every label a sequence component
 * draws arrives as a `UText` at `DriverTextSvg#draw`, which resolves ONE shape
 * and emits it —
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
 * This port draws each run through core's `DriverTextSvg`
 * (`renderer-text.ts#drawRun`), so `x` is the text's LEFT EDGE and `y` its
 * BASELINE with no anchor and no `dominant-baseline` (0 of the jar's 70 622
 * sequence `<text>` elements carry either), `textLength` is the MEASURED
 * width from the graphic's `StringBounder`, and a run's `[[url]]` WRAPS the
 * drawn shape (`SvgGraphics#openLink`/`closeLink`, `:1105-1150`). The string
 * emitter that used to stand here (`sequenceText`) is gone: no sequence
 * module returns a shape string.
 *
 * What remains is the one thing the components share: the ambient a run
 * falls back to where creole set none.
 */

import type { UGraphic } from '../../core/klimt/UGraphic.js';
import type { PageTheme } from './renderer-ug.js';
import type { TextRun } from './text-block-geo.js';
import { drawRun, type RunAmbient } from './renderer-text.js';

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
 * box corner before calling `#drawU` (`SheetBlock1.java:212-217`).
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
 * The ambient of a component text block that is not a participant or an
 * arrow: the render's font family and text ink, at the component style's
 * `fontSize` (already scaled) and weight. `bold` is the style's own weight,
 * which a run that set its own beats (`renderer-text.ts#stylesOf`).
 */
export function creoleAmbientOf(theme: PageTheme, fontSize: number, bold = false): RunAmbient {
  return { fontFamily: theme.fontFamily, fontSize, color: theme.colors.text, bold };
}

/** Each run of a component's text block through `ug`, at that component's
 *  ambient ({@link creoleAmbientOf}). */
export function drawCreoleRuns(
  ug: UGraphic,
  runs: readonly TextRun[],
  theme: PageTheme,
  fontSize: number,
  bold = false,
): void {
  const ambient = creoleAmbientOf(theme, fontSize, bold);
  for (const run of runs) drawRun(ug, run, ambient);
}
