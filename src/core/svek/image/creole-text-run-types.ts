/**
 * creole-text-run-types — the public run/line shape `creole-text-lines.ts`
 * reports (`FontStyleFlags`, `CreoleRunImage`, `CreoleTextRun`,
 * `CreoleTextLine`).
 *
 * Split out of `creole-text-lines.ts` as a pure move (declarations and doc
 * comments unchanged, re-exported there so every importer is untouched) to
 * keep that file under the 500-line cap once its atom-kind dispatch gained
 * the `'vertical'` arm.
 */
import type { SpriteTint } from '../../klimt/sprite/sprite-tint.js';

/** Bold/italic/underline/strike — the four style flags a `CreoleTextRun`
 *  reports for the RENDERER to draw with (`FontConfiguration.styles` also
 *  carries WAVE/BACKCOLOR/PLAIN, klimt/font/FontStyle.java's full 7-value
 *  enum; this seam's contract narrows to the four the locked interface
 *  names). */
export interface FontStyleFlags {
  readonly bold: boolean;
  readonly italic: boolean;
  readonly underline: boolean;
  readonly strike: boolean;
}

/**
 * The drawable form of a creole `<latex>`/`<math>` atom: `AtomMath` measures
 * an image and draws that same image (`AtomMath.java:64-97`), so one call to
 * `core/latex.ts#renderLatexAsImage` answers both halves and they agree by
 * construction — which is the whole reason the href travels on the run rather
 * than being re-derived at draw time.
 *
 * `top` is the atom's own box top within its line (`SeaLineLayout.top`), i.e.
 * what `SheetBlock1#drawU` translates to before calling `AtomMath#drawU`
 * (`SheetBlock1.java:212-217`); a renderer draws the image at
 * `lineTop + top`, never off a text baseline, because an image has none.
 *
 * The IMAGE BYTES and the exact `width`/`height` are a PERMANENT divergence:
 * this port renders through KaTeX where the jar renders through JLaTeXMath
 * (`DIVERGENCES.md`, "LaTeX rendering engine — KaTeX, not JLaTeXMath", which
 * names `<math>` as well as `<latex>`). The STRUCTURE — an image atom in the
 * text flow, at its own box — is the conformance target; the numbers are not.
 */
export interface CreoleRunImage {
  readonly href: string;
  readonly width: number;
  readonly height: number;
  readonly top: number;
  /** unwind2-S11: a monochrome `<$sprite>`'s deferred tint
   *  (`creole-run-sprite.ts#creoleRunImageHref` completes it at draw). */
  readonly tint?: SpriteTint;
  /** unwind2-S11: a sprite's raster box, drawn as the `<image>` size while
   *  `width`/`height` advance the line (`creole-run-sprite.ts`). */
  readonly rasterWidth?: number;
  readonly rasterHeight?: number;
}

export interface CreoleTextRun {
  readonly text: string;
  /** add4-T3b: the atom's OWN `FontConfiguration` family -- `monospaced`
   *  for a `""x""` run (`CommandCreoleMonospaced.java`, `SkinParam.java:
   *  1068-1070`), mapped to `monospace` at draw time (`SvgGraphics.java:
   *  720-722`). Set on every text run; absent on table-row/latex runs. */
  readonly family?: string;
  readonly style: FontStyleFlags;
  readonly color?: string;
  readonly url?: string;
  /** T2c: the `[[url{tooltip}label]]` tooltip half of {@link url} -- was
   *  previously dropped at the single call site that builds this field
   *  (`textAtomMeasured`, `atom.url.url` only), so every renderer reading
   *  it fell back to the url itself for `title`/`xlink:title`
   *  (`core/svg.ts#linkWrap`'s `tooltip` param). `CreoleAtomUrl` (`klimt
   *  /creole/atom/Atom.ts`) already carries both halves correctly --
   *  `CommandCreoleUrl.ts#resolveUrlAndTooltip` parses `{tooltip}` and
   *  defaults it to the url when absent, matching upstream's
   *  `resolveLabel` exactly. Consumed by `activity-renderer-text.ts
   *  #drawCreoleUrlLine` (T2c); `state/renderer-box.ts#renderStateRuns`
   *  (a different engine, outside this task's write-set) still passes
   *  `run.url` as its own `tooltip` arg and is therefore UNCHANGED by
   *  this field's mere existence. */
  readonly tooltip?: string;
  /** The run's EFFECTIVE font size — `getFont(atom.font).size`
   *  (`FontConfiguration.java:98-104`), i.e. already muted by 3 for a
   *  `<sup>`/`<sub>` run (`FontPosition.java:51-60`) and equal to the
   *  cascaded size for every NORMAL run (SI30 `decisions.md#D1/#D3`). The
   *  size this seam MEASURED with, so a renderer must draw with it too. */
  readonly size: number;
  /** Baseline offset from the line's NORMAL baseline, from `Sea`
   *  (`decisions.md#D2`): a renderer draws this run at
   *  `lineTop + line.height - atom-unmuted-size/4.5 + dy`. 0 for every run
   *  of an all-NORMAL line — see `creole-sea-line.ts`'s doc comment for the
   *  two cases where a NORMAL run's `dy` is legitimately non-zero. */
  readonly dy: number;
  /** Set ONLY on a `'latex'` atom's run, which carries an image and no text
   *  at all (`AtomMath#drawU` draws one `UImage`/`UImageSvg` and nothing
   *  else, `AtomMath.java:78-97`). Absent on every text run. */
  readonly image?: CreoleRunImage;
}

export interface CreoleTextLine {
  readonly runs: readonly CreoleTextRun[];
  readonly width: number;
  readonly height: number;
  readonly kind: 'text' | 'hr' | 'table-row';
}
