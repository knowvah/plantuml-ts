/**
 * class-geo-builders-degenerate-ink.ts — the `symbolInk` -> `ensureVisible`
 * translation for the degenerate-single-classifier canvas, split out of
 * `class-geo-builders.ts` purely to keep that file under the project's
 * 500-line cap (cdd6-T2c, mirrors the existing `class-geo-builders-
 * degenerate-note.ts` split precedent -- see that file's own doc comment).
 * A pure move; no behavior change to anything this file does not itself
 * introduce.
 *
 * @see degenerateClassifierDims in ./class-geo-builders.ts
 */
import type { MeasuredClassifier } from './class-layout-helpers.js';

/**
 * cdd6-T2c (D4): the DEGENERATE canvas's own `ensureVisible` extent for a
 * leaf's `symbolInk`-bearing drawn shapes -- `LimitFinder` (which
 * `symbolInk` walks, `LimitFinder.java:217-225`) and `SvgGraphics#ensureVisible`
 * (which sizes the REAL degenerate canvas, `SvgGraphics.java:129-133`) do
 * NOT record the same corner for every shape kind, so `symbolInk` cannot be
 * folded into `degenerateClassifierDims` directly -- see
 * `MeasuredClassifier.ensureVisibleInk`'s own doc comment.
 *
 * Two producers:
 * 1. `measured.ensureVisibleInk`, when present -- a leaf whose producer
 *    computes the correction itself at measurement time (today: only
 *    `class-layout-leaf-shapes.ts#measureCircleInterface`'s TEXT-drawn
 *    label ink).
 * 2. Otherwise, a `+1`-on-both-axes correction over `measured.symbolInk`,
 *    undoing `LimitFinder`'s `drawImage`/`drawImageSvg`/`drawImageTikz`
 *    rule (`LimitFinder.java:198-201`: `addPoint(x, y); addPoint(x +
 *    shape.getWidth() - 1, y + shape.getHeight() - 1);`) against
 *    `SvgGraphics`'s un-shrunk `ensureVisible(x + width, y + height)`
 *    (`SvgGraphics.java:1033-1034`/`987-999`). Every OTHER `symbolInk`
 *    producer this port has (`descriptionLeafSymbolInk` -- `frame`/`queue`/
 *    `rectangle`/etc) sizes its returned box TO its own label ink
 *    (`measureEntityLeaf`), so this fallback correction only ever changes
 *    the `Math.max` outcome in `degenerateClassifierDims` when the DRAWN
 *    content overflows that box -- structurally only an embedded-image
 *    leaf (jar-verified `unknown/josebu-55-seje426` (b): `diagnosis/
 *    verify.md`'s "nested renders — josebu" section; a synthetic
 *    `frame X [ {{ class Foo }} ]` reproduces the SAME `+1` channel with no
 *    dependency on that row's own unrelated (a) defect --
 *    `class-degenerate.test.ts`). A plain TEXT-only leaf's own `symbolInk`
 *    never wins the `Math.max` against `totalDims`, so this fallback is a
 *    no-op for it regardless of the `+1`.
 */
export function degenerateEnsureVisibleInk(
  measured: MeasuredClassifier,
): { maxX: number; maxY: number } | undefined {
  if (measured.ensureVisibleInk !== undefined) return measured.ensureVisibleInk;
  if (measured.symbolInk === undefined) return undefined;
  return { maxX: measured.symbolInk.maxX + 1, maxY: measured.symbolInk.maxY + 1 };
}
