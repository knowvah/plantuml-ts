/**
 * EntityImageDescriptionTextMeasure -- the measuring half of `EntityImageDescriptionTextBlock.ts`
 * (`measureLine`, the per-line atom build, `LineMetrics`, the wrap), split out by a pure move only to keep
 * both files under this project's 500-line ceiling once `AtomText.java:179-181`'s 10-px run floor landed.
 * `EntityImageDescriptionTextBlock.ts` re-exports `measureLine`, so every import path is unchanged.
 */
import type { StringBounder } from '../../klimt/font/StringBounder.js';
import type { FontConfiguration } from '../../klimt/shape/UText.js';
import type { AtomImageResolver } from '../../creole-atoms.js';
import type { CreoleAtom } from '../../klimt/creole/atom/Atom.js';
import { SPACE_ATOM_HEIGHT } from '../../klimt/creole/atom/AtomSpace.js';
import { verticalAtomBox } from './creole-sea-line.js';
import { buildLineAtoms, type LineBuildAtoms } from '../../klimt/creole/legacy/StripeSimple.js';
import { getSplitted } from '../../klimt/creole/Fission.js';
import { atomTextWidth } from '../../klimt/creole/legacy/AtomText.js';
import { renderLatexAsImage } from '../../latex.js';
import { EMOJI_BOX_FACTOR, emojiBoxDim, emojiLineHeightFactor } from '../../klimt/creole/atom/AtomEmoji.js';

/**
 * SI15 T1 (ADR-1): widens `AtomImageResolver`'s `image` variant with the
 * optional raster-pixel fields `render-atoms.ts`'s producers
 * (`resolveSpriteAtom`/`resolveImgAtom`) now populate. Declared locally
 * rather than widening `AtomImageResolver` itself in `creole-atoms.ts` —
 * that module sits at this project's 500-line file cap; the resolver's
 * runtime shape already carries these fields (`render-atoms.ts`'s own
 * `ResolvedAtomImage`), only the shared static type doesn't expose them.
 */
export type ResolvedAtomImageWithRaster =
  | (Extract<ReturnType<AtomImageResolver>, { readonly kind: 'image' }> & {
      readonly rasterWidth?: number;
      readonly rasterHeight?: number;
    })
  | Exclude<ReturnType<AtomImageResolver>, { readonly kind: 'image' }>;

// ---------------------------------------------------------------------------
// Text construction seam — see EntityImageDescription.ts's doc comment
// ("Text-construction seam")
// ---------------------------------------------------------------------------

/** `AtomText.java:179-181`: the smallest height a text run measures. */
export const MIN_TEXT_RUN_HEIGHT = 10;

/** One measured text line: width/height/descent, read off the ACTIVE
 *  `StringBounder` (maintainer course-correction, 2026-07-10: no
 *  prop-drilled `measurer` parameter — the render-phase seam is
 *  `UGraphicSvg.build`'s own `measurer` param, which `getStringBounder()`
 *  already turns into real width/height/descent; see that method's doc
 *  comment). `getDescent` is optional on `StringBounder` (not every
 *  implementation carries it — e.g. hand-rolled test doubles); falling
 *  back to the same `size/4.5` approximation every measurer in this
 *  codebase already uses as its own descent formula
 *  (`FormulaMeasurer`/`WidthTableMeasurer`/`CanvasMeasurer`/
 *  `FixedMeasurer`, `measurer.ts`) keeps behavior sane for any caller not
 *  wired through the updated `UGraphicSvg`. */
export function measureLine(
  stringBounder: StringBounder,
  line: string,
  font: FontConfiguration,
): { width: number; height: number; rawHeight: number; descent: number } {
  const dim = stringBounder.calculateDimension(font, line);
  // Upstream AtomText.java:183-184: a run containing a tabulation takes
  // #getWidth's tab-stop tokenizer instead of the plain StringBounder width.
  // Tab-free runs short-circuit to the identical single measurement, so this
  // is a zero-diff change for every display without a tab.
  const width = atomTextWidth(line, font.size, (t) => stringBounder.calculateDimension(font, t).getWidth());
  const descent = stringBounder.getDescent?.(font, line) ?? font.size / 4.5;
  // `AtomText#calculateDimensionSlow` (AtomText.java:179-181): `if (h < 10) h = 10` -- the run's MEASURED height is
  // floored, but `drawU` (:215) places the baseline from the raw `rect.getHeight() - descent`, so both are returned.
  return { width, height: Math.max(dim.getHeight(), MIN_TEXT_RUN_HEIGHT), rawHeight: dim.getHeight(), descent };
}

export interface LineMetrics {
  width: number;
  height: number;
  /** The tallest atom's UNCLAMPED height: the baseline is `rawHeight - descent` (`AtomText.java:215`). */
  rawHeight: number;
  descent: number;
}

/**
 * Empirically-calibrated separator-atom footprint (jar-verified against
 * component/butebe-90-dozo380's queue3 -- `queue "queue1\n----\ntoto"`,
 * cross-checked structurally, not numerically, against component/
 * babafi-51-dixi026's actor `a` -- `"a\n====\ncan use b"`). Upstream's real
 * stacking is `SheetBlock1`/`StripeSimple`'s Atom-altitude system
 * (`CreoleHorizontalLine#getStartingAltitude() === 0`, TeX-box-style
 * ascent/descent placement) -- a substantially larger, unported creole
 * layout subsystem (G1 I4c's deferred "full char-atom subsystem" family,
 * now partially landed as of E2r/L1 — see `klimt/creole/`). `buildTextBlock`
 * here is a documented SCOPED SUBSTITUTE (naive top-down height-summing,
 * not the real Sheet algorithm), so reproducing the jar's exact box height
 * under this simpler model requires two DIFFERENT numbers, reverse-derived
 * from queue3's own box geometry (content height 36 = line1 14 + SEP +
 * line3 14 -> SEP contributes 8 to total block height) and its separator
 * `<line>`'s own drawn y (exactly at the cursor position BEFORE the
 * separator, no offset -- so only 4, half of the 8 total, is consumed
 * before the NEXT line's cursor starts; the other half is trailing space
 * after the last line, absorbed into the block's overall height by
 * `calculateDimension` alone). Width is not independently verified (no
 * sampled fixture has the bare separator as the WIDEST line); kept equal
 * to the draw-advance value as the least-surprising default. */
export const SEPARATOR_SIZE_HEIGHT = 8;
export const SEPARATOR_DRAW_ADVANCE = SEPARATOR_SIZE_HEIGHT / 2;
export const SEPARATOR_WIDTH_CONTRIBUTION = SEPARATOR_DRAW_ADVANCE;
export const SEPARATOR_DEFAULT_THICKNESS = 1;

/** One display line's classification plus its built atom sequence (E2r/L1,
 *  unified onto the shared lexer per creole-lexer-unification ADR-1) —
 *  `atoms` is empty for a `HORIZONTAL_LINE` line (nothing to measure/draw as
 *  text; `drawSeparatorLine` handles it directly), `lineFont` is the BASE
 *  font for `NORMAL`, or the heading-cascaded font
 *  (`fontConfigurationForHeading`) for `HEADING` — the font every atom on
 *  this line's OWN style flags/color start from before any nested
 *  `<b>`/`**`/etc. run adds more. Alias of `StripeSimple.ts`'s
 *  `LineBuildAtoms`, the shared shape both this renderer and
 *  `leaf-sizing.ts#creoleVisibleText` (the sizer) now consume. */
export type LineBuild = LineBuildAtoms;

/** Delegates to the shared lexer (`buildLineAtoms`, ADR-1). No font is
 *  threaded for the `<img>` cannot-decode fallback — that fallback is
 *  hardcoded inside `buildLineAtoms` itself (`StripeSimple.ts`'s
 *  `IMG_FALLBACK_FONT`, `sizer-footprint-parity` ADR-1); a PREVIOUS
 *  mission's `defaultFont` seam here is deleted. */
export function buildLine(line: string, font: FontConfiguration): LineBuild {
  return buildLineAtoms(line, font);
}

/** Sums each atom's own width (text run measured under ITS own
 *  `FontConfiguration`; a resolved `<img>`/`<$sprite>` atom under its
 *  resolved dims) and takes the MAX height across atoms — the same
 *  width-ADD/height-MAX composition `creole-atoms.ts#measureLineWithAtoms`
 *  already established for the img/sprite-only case (D9), now generalized
 *  to every styled text run too. An unresolved inline atom (`resolveAtomImage`
 *  returns `undefined`, or no resolver supplied at all) contributes
 *  nothing, matching `StripeSimple.addSprite`'s "never added" behavior. */
/**
 * F4-b: whether any atom on this line sits at starting altitude 0 — every
 * `CreoleAtom` kind EXCEPT `emoji` (`AtomImg`/`AtomSprite`/`AtomMath` all
 * `return 0` upstream; `AtomText` returns `getSpace()`, 0 for `NORMAL`,
 * this port's only reachable position — see `descAtomOps`'s doc comment in
 * `EntityImageDescriptionDelegates.ts`). Such an atom pins the line's
 * `maxY` at 0 under `Sea#doAlign`, which is what makes a shared line
 * `39*factor` tall and an emoji-only line `36*factor`
 * ({@link emojiLineHeightFactor}).
 *
 * Named for the RULE (altitude), not for the common case (a text sibling),
 * because a line of `<:rocket:><$sprite>` takes the shared-line height too
 * — the sprite's altitude is 0 exactly like text's.
 */
export function hasZeroAltitudeAtom(atoms: readonly CreoleAtom[]): boolean {
  return atoms.some((atom) => atom.kind !== 'emoji');
}

export function measureAtomsWidthHeight(
  stringBounder: StringBounder,
  atoms: readonly CreoleAtom[],
  resolveAtomImage: AtomImageResolver | undefined,
): LineMetrics {
  // #lizard forgives(cyclomatic_complexity, nloc) -- one flat per-atom-kind
  // dispatch loop (R2i adds the emoji width/height branch to a pre-existing
  // at-cap shape).
  let width = 0;
  let height = 0;
  let rawHeight = 0;
  const grow = (h: number): void => {
    if (h > height) height = h;
    if (h > rawHeight) rawHeight = h;
  };
  // cdd3-T8 (`daxeno-00-kasu166`): MAX across TEXT atoms' own per-atom
  // descent (`measureLine`'s `stringBounder.getDescent(atom.font,
  // atom.text)`, already computed there, previously discarded) -- the SAME
  // width-ADD/height-MAX-per-atom composition this loop already applies,
  // one term further. The prior single `built.lineFont`-wide descent used
  // the LINE's BASE font unconditionally, ignoring a per-run `<size:N>`
  // override baked into `atom.font` -- wrong for a `<size:18>styled</size>`
  // run inside a 14px-base title: descent 14/4.5=3.111 instead of the run's
  // OWN 18/4.5=4.0, an 0.889px baseline error on `daxeno-00-kasu166`'s
  // package cluster title (`text/@y` Δ0.889). A line whose only run keeps
  // the base font (the common case) is unaffected: its one atom's own font
  // IS the base font. Non-text atoms contribute 0 (unread by `drawAtoms`'s
  // `baselineDy`, which only text atoms consume).
  let descent = 0;
  const sharedLine = hasZeroAltitudeAtom(atoms);
  for (const atom of atoms) {
    if (atom.kind === 'text') {
      const m = measureLine(stringBounder, atom.text, atom.font);
      width += m.width;
      if (m.height > height) height = m.height;
      if (m.rawHeight > rawHeight) rawHeight = m.rawHeight;
      if (m.descent > descent) descent = m.descent;
      continue;
    }
    if (atom.kind === 'latex') {
      const resolved = renderLatexAsImage(atom.expr, atom.color ?? '#000000');
      width += resolved.width;
      grow(resolved.height);
      continue;
    }
    // A2s R2i: a `<:name:>` emoji sizes as `AtomEmoji`'s exact contract --
    // 36*factor box width (`klimt/creole/atom/AtomEmoji.ts`;
    // murava-69-tago286). F4-b: the LINE height is 39*factor only when a
    // zero-altitude atom shares the line, 36*factor when the emoji is alone
    // -- `emojiLineHeightFactor`, this file's `hasZeroAltitudeAtom`.
    if (atom.kind === 'emoji') {
      width += EMOJI_BOX_FACTOR * atom.factor;
      const lineHeight = emojiLineHeightFactor(sharedLine) * atom.factor;
      grow(lineHeight);
      continue;
    }
    // `AtomSpace#calculateDimensionSlow`: (width, 1).
    if (atom.kind === 'space') {
      width += atom.width;
      grow(SPACE_ATOM_HEIGHT);
      continue;
    }
    // `AtomVerticalTexts#calculateDimensionSlow` (`AtomVerticalTexts.java:54-64`).
    if (atom.kind === 'vertical') {
      const box = verticalAtomBox(atom.lines, (sub) => measureAtomsWidthHeight(stringBounder, [sub], resolveAtomImage));
      width += box.width;
      grow(box.height);
      continue;
    }
    const resolved = resolveAtomImage?.(atom.atom);
    if (resolved === undefined) continue;
    width += resolved.width;
    grow(resolved.height);
  }
  return { width, height, rawHeight, descent };
}

export function measureBuiltLine(
  stringBounder: StringBounder,
  built: LineBuild,
  resolveAtomImage: AtomImageResolver | undefined,
): LineMetrics {
  if (built.classification.type === 'HORIZONTAL_LINE') {
    return {
      width: SEPARATOR_WIDTH_CONTRIBUTION,
      height: SEPARATOR_SIZE_HEIGHT,
      rawHeight: SEPARATOR_SIZE_HEIGHT,
      descent: 0,
    };
  }
  return measureAtomsWidthHeight(stringBounder, built.atoms, resolveAtomImage);
}

/** Per-atom width only — upstream: `Neutron#getWidth(StringBounder)`,
 *  `Fission.ts#getSplitted`'s `measureAtomWidth` callback (E2r/L3,
 *  word-wrap). Mirrors `measureAtomsWidthHeight`'s per-atom width branch
 *  (kept separate rather than merged: that function also needs each
 *  atom's HEIGHT in the same pass, a different accumulation shape). */
export function measureSingleAtomWidth(
  stringBounder: StringBounder,
  atom: CreoleAtom,
  resolveAtomImage: AtomImageResolver | undefined,
): number {
  if (atom.kind === 'text') return measureLine(stringBounder, atom.text, atom.font).width;
  if (atom.kind === 'latex') return renderLatexAsImage(atom.expr, atom.color ?? '#000000').width;
  // A2s R2i: emoji x-advance is the 36*factor box (see measureAtomsWidthHeight).
  if (atom.kind === 'emoji') return emojiBoxDim(atom.factor).width;
  if (atom.kind === 'space') return atom.width;
  if (atom.kind === 'vertical') return measureAtomsWidthHeight(stringBounder, [atom], resolveAtomImage).width;
  const resolved = resolveAtomImage?.(atom.atom);
  return resolved === undefined ? 0 : resolved.width;
}

/**
 * Builds every `\n`-split raw line's `LineBuild` (E2r/L1, `buildLine`),
 * then word-wraps it (E2r/L3, `Fission.ts#getSplitted`) when `maxWidth > 0`
 * — one raw line may expand into MULTIPLE physical `LineBuild`s, each
 * reusing the raw line's own classification/heading-cascaded font (already
 * baked into every atom by `buildLine`; re-attaching it to each wrapped
 * sub-line is bookkeeping only, not a second application). A
 * `HORIZONTAL_LINE` line is never wrapped (upstream's `CreoleHorizontalLine`
 * stripe carries no text atoms for `Fission` to split — `buildLine`'s own
 * doc comment).
 */
export function buildWrappedLines(
  rawLines: readonly string[],
  font: FontConfiguration,
  resolveAtomImage: AtomImageResolver | undefined,
  stringBounder: StringBounder,
  maxWidth: number,
): readonly LineBuild[] {
  const result: LineBuild[] = [];
  for (const raw of rawLines) {
    const built = buildLine(raw, font);
    if (built.classification.type === 'HORIZONTAL_LINE' || maxWidth === 0) {
      result.push(built);
      continue;
    }
    const splitAtoms = getSplitted(built.atoms, maxWidth, (atom) =>
      measureSingleAtomWidth(stringBounder, atom, resolveAtomImage),
    );
    for (const sub of splitAtoms) {
      result.push({ classification: built.classification, atoms: sub, lineFont: built.lineFont });
    }
  }
  return result;
}
