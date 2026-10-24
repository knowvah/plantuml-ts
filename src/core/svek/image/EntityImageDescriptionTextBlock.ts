/**
 * EntityImageDescriptionTextBlock — the text-construction seam split out of
 * `EntityImageDescriptionSupport.ts` (E2r/L1's own home for it) purely to
 * stay under this project's 500-line complexity-hook ceiling once T9
 * (svg-sprite-nanoparser) widened `drawAtoms`'s `drawable` branch to
 * re-apply each primitive's own translate (`DrawablePrimitive`,
 * `creole-atoms.ts`) — mechanical split only, not an upstream divergence,
 * same precedent as `EntityImageDescriptionDelegates.ts`'s own split out of
 * this same sibling file. `EntityImageDescriptionSupport.ts` re-exports
 * `measureLine`/`buildTextBlock` so every external import path is
 * unchanged (this project's established "500-line splits" workaround).
 *
 * `buildTextBlock` — scoped substitute for `BodyFactory.create2`/`create3`
 * (see `EntityImageDescription.ts`'s doc comment). A `\n`-split, multi-line
 * `TextBlock` whose per-line content runs through E2r/L1's ported creole
 * stripe/atom pipeline (`klimt/creole`) — nested `<b>`/`**`/`<i>`/`//`/
 * `<u>`/`__`/`<s>`/`--`/`<w>`/`~~` inline style runs, and per-line `==`
 * heading font cascade — plus SI5b+E2r T6/T7's `<img>`/`<$sprite>` atoms.
 */
import type { UGraphic } from '../../klimt/UGraphic.js';
import type { StringBounder } from '../../klimt/font/StringBounder.js';
import { XDimension2D } from '../../klimt/geom/XDimension2D.js';
import { HorizontalAlignment } from '../../klimt/geom/HorizontalAlignment.js';
import { UTranslate } from '../../klimt/UTranslate.js';
import { Fore } from '../../klimt/Fore.js';
import { Back } from '../../klimt/Back.js';
import { UText } from '../../klimt/shape/UText.js';
import type { FontConfiguration } from '../../klimt/shape/UText.js';
import { UImage } from '../../klimt/shape/UImage.js';
import { UHorizontalLine } from '../../klimt/shape/UHorizontalLine.js';
import type { TextBlock } from '../../klimt/shape/TextBlock.js';
import type { AtomImageResolver } from '../../creole-atoms.js';
import type { CreoleAtom, CreoleAtomUrl } from '../../klimt/creole/atom/Atom.js';
import { urlCapable } from '../../annotations/blocks-creole-atoms.js';
import { manageGuillemet, type GuillemetPair } from '../../text/Guillemet.js';
import { renderLatexAsImage } from '../../latex.js';
import { emojiBoxDim, emojiRenderRun } from '../../klimt/creole/atom/AtomEmoji.js';
import { spriteHrefOver } from '../../klimt/sprite/sprite-tint.js';
import {
  type LineMetrics,
  type ResolvedAtomImageWithRaster,
  SEPARATOR_DRAW_ADVANCE,
  SEPARATOR_DEFAULT_THICKNESS,
  measureLine,
  measureBuiltLine,
  measureAtomsWidthHeight,
  buildWrappedLines,
} from './EntityImageDescriptionTextMeasure.js';
export { measureLine } from './EntityImageDescriptionTextMeasure.js';

/** `HorizontalAlignment`-driven local x offset — same branch
 *  `DecorateEntityImage.ts`'s local `textX` implements (duplicated per
 *  that file's one-local-helper-per-call-site convention). */
function lineX(align: HorizontalAlignment, blockWidth: number, lineWidth: number): number {
  if (align === HorizontalAlignment.LEFT) return 0;
  if (align === HorizontalAlignment.RIGHT) return blockWidth - lineWidth;
  return (blockWidth - lineWidth) / 2;
}

/** Draws the separator's `UHorizontalLine` shape AT the running cursor `y`
 *  (see `SEPARATOR_SIZE_HEIGHT`'s doc comment for why this differs from a
 *  literal `CreoleHorizontalLine#drawU` port). */
function drawSeparatorLine(ug: UGraphic, y: number, style: string): void {
  ug.apply(new UTranslate(0, y)).draw(UHorizontalLine.infinite(SEPARATOR_DEFAULT_THICKNESS, 0, 0, style));
}

/** Cursor advance to the NEXT line: `SEPARATOR_DRAW_ADVANCE` for a
 *  separator (half its own `SEPARATOR_SIZE_HEIGHT` -- see that constant's
 *  doc comment), else the line's own measured height. */
function lineCursorAdvance(isHorizontalLine: boolean, m: LineMetrics): number {
  return isHorizontalLine ? SEPARATOR_DRAW_ADVANCE : m.height;
}

/** `AtomSprite.java:73-80` / `AtomImg.java:246-254` / `AtomOpenIconic.java:
 *  76-82`: every inline atom brackets its draw in `ug.startUrl(url)` /
 *  `ug.closeUrl()` when it carries one -- and so does `AtomText.java:197-198,
 *  235-236` for a text run. ONE `<a>` per atom, never per url span. A
 *  graphic with no link support (measuring/limit-finding) just draws. */
export function drawWithAtomUrl(ug: UGraphic, url: CreoleAtomUrl | undefined, draw: () => void): void {
  const linkable = url === undefined ? undefined : urlCapable(ug);
  if (linkable === undefined || url === undefined) {
    draw();
    return;
  }
  linkable.startUrl(url);
  draw();
  linkable.closeUrl();
}

/** One resolved inline atom's draw at `(x, y)` (the tail of `drawAtoms`'s
 *  loop, extracted unchanged so `drawWithAtomUrl` can bracket it). */
function drawResolvedInline(
  ug: UGraphic,
  resolved: NonNullable<ResolvedAtomImageWithRaster>,
  x: number,
  y: number,
): void {
  if (resolved.kind === 'image') {
    // SI15 T1 (ADR-1): raster dims present only for a real raster-backed
    // atom (sprite/img) -- guarded fallback keeps `UImage.build`'s 4th
    // arg `undefined` otherwise, so `Footprint.drawImage` falls back to
    // the declared dims exactly as before this task.
    const rasterDims =
      resolved.rasterWidth !== undefined && resolved.rasterHeight !== undefined
        ? { rasterWidth: resolved.rasterWidth, rasterHeight: resolved.rasterHeight }
        : undefined;
    ug.apply(new UTranslate(x, y)).draw(
      UImage.build(resolved.width, resolved.height, spriteHrefOver(resolved, ug.getParam().getBackcolor()), rasterDims),
    );
  } else {
    const translated = ug.apply(new UTranslate(x, y)); // @see SvgNanoParser.java#drawU
    // Each primitive re-applies its OWN translate+paint on top of the
    // atom's origin (`DrawablePrimitive`, creole-atoms.ts): `UPath`'s
    // translate is always `(0,0)` (its geometry is already absolute), but
    // `UEllipse`/`UText` carry no position of their own; fore/back/stroke
    // are the SAME `SvgNanoParser` paint state, snapshotted rather than
    // forwarded when it was resolved (T9 amendment 2) -- `DriverPathSvg`
    // collapses `fore === back` to a strokeless flat fill on its own, so
    // an absent jar stroke reproduces without special-casing it here.
    for (const primitive of resolved.primitives) {
      translated
        .apply(primitive.translate)
        .apply(new Fore(primitive.fore))
        .apply(new Back(primitive.back))
        .apply(primitive.stroke)
        .draw(primitive.shape);
    }
  }
}

/**
 * Draws one line's already-built atom sequence (E2r/L1): each atom draws as
 * its OWN `UText` (a text run) or `UImage`/`DrawablePrimitive[]` (a resolved
 * inline atom, T7/T9 ADR-2), left to right, x-advancing by each segment's
 * own DECLARED width — the SAME math `measureAtomsWidthHeight` (above)
 * already summed, so drawing and measuring agree by construction. Atoms sit
 * at the line's TOP (`origin.y`, no baseline offset), matching
 * `AtomImg`/`AtomSprite.getStartingAltitude() === 0`; text keeps its normal
 * baseline (`origin.y + baselineDy`) even when a taller atom on the same
 * line grows `m.height` beyond any one text run's own height. This produces
 * ONE `<text>` SVG element per styled run — the jar's own element structure
 * — rather than the pre-E2r single-`UText`-per-line path.
 *
 * `origin` bundles x/y into a single param to stay under this project's
 * 5-param complexity-hook ceiling; `stringBounder` comes off
 * `ug.getStringBounder()` directly rather than a separate param — every
 * caller already has `ug`.
 */
function drawAtoms(
  ug: UGraphic,
  atoms: readonly CreoleAtom[],
  origin: { readonly x: number; readonly y: number },
  m: LineMetrics,
  resolveAtomImage: AtomImageResolver | undefined,
): void {
  const stringBounder = ug.getStringBounder();
  const baselineDy = m.rawHeight - m.descent;
  let x = origin.x;
  for (const atom of atoms) {
    if (atom.kind === 'text') {
      const segM = measureLine(stringBounder, atom.text, atom.font);
      drawWithAtomUrl(ug, atom.url, () =>
        ug.apply(new UTranslate(x, origin.y + baselineDy)).draw(UText.build(atom.text, atom.font)),
      );
      x += segM.width;
      continue;
    }
    if (atom.kind === 'latex') {
      const resolved = renderLatexAsImage(atom.expr, atom.color ?? '#000000');
      ug.apply(new UTranslate(x, origin.y)).draw(UImage.build(resolved.width, resolved.height, resolved.href));
      x += resolved.width;
      continue;
    }
    // A2s R2i: an emoji draws as its platform-glyph text run
    // (`atom/AtomEmoji.ts#emojiRenderRun`); x-advance stays the DECLARED
    // 36*factor box (ADR-2), never this glyph's own measure.
    if (atom.kind === 'emoji') {
      const run = emojiRenderRun(atom);
      ug.apply(new UTranslate(x, origin.y + baselineDy)).draw(UText.build(run.text, run.font));
      x += emojiBoxDim(atom.factor).width;
      continue;
    }
    // `AtomSpace#drawU` is empty; the cursor still advances its width.
    if (atom.kind === 'space') {
      x += atom.width;
      continue;
    }
    // `AtomVerticalTexts#drawU` (`AtomVerticalTexts.java:71-78`): each stacked
    // line is drawn as its own atom row, `dy` the heights of the rows above.
    if (atom.kind === 'vertical') {
      let rowY = origin.y;
      for (const row of atom.lines) {
        const rowM = measureAtomsWidthHeight(stringBounder, row, resolveAtomImage);
        drawAtoms(ug, row, { x, y: rowY }, rowM, resolveAtomImage);
        rowY += rowM.height;
      }
      x += measureAtomsWidthHeight(stringBounder, [atom], resolveAtomImage).width;
      continue;
    }
    // ADR-2: cursor advances by DECLARED width, never ink.
    const resolved: ResolvedAtomImageWithRaster | undefined = resolveAtomImage?.(atom.atom, () => stringBounder);
    if (resolved === undefined) continue;
    const drawX = x;
    drawWithAtomUrl(ug, atom.url, () => drawResolvedInline(ug, resolved, drawX, origin.y));
    x += resolved.width;
  }
  // #lizard forgives -- ADR-2's two-variant branch pushed NLOC over 30 (T7).
}

/**
 * buildTextBlock — scoped substitute for `BodyFactory.create2`/`create3`
 * (see EntityImageDescription.ts's doc comment). A `\n`-split, multi-line
 * `TextBlock` whose per-line content runs through E2r/L1's ported creole
 * stripe/atom pipeline (`klimt/creole`) — nested `<b>`/`**`/`<i>`/`//`/
 * `<u>`/`__`/`<s>`/`--`/`<w>`/`~~` inline style runs, and per-line `==`
 * heading font cascade — plus SI5b+E2r T6/T7's `<img>`/`<$sprite>` atoms.
 * Each line is measured/drawn through whichever `StringBounder` its CALLER
 * supplies (`calculateDimension`'s own param, `ug.getStringBounder()`
 * inside `drawU`) — no measurer captured in this closure, no eager
 * measurement: both `calculateDimension` and `drawU` are only ever invoked
 * later, by a caller that already holds a real `stringBounder`/`ug`
 * (`EntityImageDescription`'s own `calculateDimensionSlow`/`getShield`/
 * `getOverscanX`/`drawU` — see that class's doc comment), so this is
 * genuinely lazy, not "pre-draw".
 *
 * `resolveAtomImage` (SI5b+E2r T7 write-set expansion, journaled —
 * additive-only optional 4th param; every existing call site that omits it
 * keeps byte-identical behavior for atom-free lines — see
 * `measureAtomsWidthHeight`/`drawAtoms` above): resolves a line's Creole
 * `<img>`/`<$sprite>` atoms to drawable image geometry, per `src/diagrams/
 * description/render-atoms.ts`'s builder.
 *
 * `maxWidth` (E2r/L3, additive — default 0/disabled, every pre-L3 caller
 * unchanged): word-wrap, via `Fission.ts#getSplitted` — see that module's
 * doc comment for the trigger (`skinparam wrapWidth`, reachable directly
 * OR via the AWS-icon stdlib's own `AWSCommon.puml` include) and its
 * measured corpus reach/impact.
 *
 * NOT in E2r scope (mission brief NOT-in-scope list — journaled,
 * `plans/e2r-creole/decision-journal.md`): `<back:>`/`<u:color>`/
 * `<U+NNNN>`-inside-TIM-strings/`<code>` (L2, still deferred — see that
 * journal's per-directive table). The command-chain architecture
 * (`klimt/creole/command/`) is built to accept more `Command` registrations
 * for these without changing `StripeSimple`'s dispatch loop — see
 * `legacy/CommandCreoleBuilder.ts`'s doc comment.
 *
 * The `<img>` cannot-decode fallback font is NOT threaded here — it is
 * hardcoded inside `buildLineAtoms` (`StripeSimple.ts`'s
 * `IMG_FALLBACK_FONT`, `sizer-footprint-parity` ADR-1); a PREVIOUS
 * mission's additive 7th `defaultFont` param is deleted. */
export function buildTextBlock(
  text: string,
  font: FontConfiguration,
  align: HorizontalAlignment,
  resolveAtomImage?: AtomImageResolver,
  maxWidth = 0,
  guillemet?: GuillemetPair,
): TextBlock {
  // `<<x>>` -> `«x»` before classify/measure, mirroring `CreoleParser.java:175`
  // (SIZER applies the same transform at the same point, S1L-f).
  const managed = manageGuillemet(text, guillemet);
  const lines = managed.length === 0 ? [] : managed.split('\n');

  function calculateDimension(stringBounder: StringBounder): XDimension2D {
    const built = buildWrappedLines(lines, font, resolveAtomImage, stringBounder, maxWidth);
    let width = 0;
    let height = 0;
    for (const b of built) {
      const m = measureBuiltLine(stringBounder, b, resolveAtomImage);
      if (m.width > width) width = m.width;
      height += m.height;
    }
    return new XDimension2D(width, height);
  }

  return {
    calculateDimension,
    drawU(ug: UGraphic): void {
      const stringBounder = ug.getStringBounder();
      const built = buildWrappedLines(lines, font, resolveAtomImage, stringBounder, maxWidth);
      const dim = calculateDimension(stringBounder);
      let y = 0;
      for (const b of built) {
        const m = measureBuiltLine(stringBounder, b, resolveAtomImage);
        if (b.classification.type === 'HORIZONTAL_LINE') {
          drawSeparatorLine(ug, y, b.classification.style);
        } else {
          const x = lineX(align, dim.getWidth(), m.width);
          drawAtoms(ug, b.atoms, { x, y }, m, resolveAtomImage);
        }
        y += lineCursorAdvance(b.classification.type === 'HORIZONTAL_LINE', m);
      }
    },
  };
  // #lizard forgives -- pre-existing 6-PARAM violation (text/font/align/
  // resolveAtomImage/maxWidth/guillemet, all load-bearing). Placed here, not
  // after the signature: a nested fn's own end-of-function resets lizard's
  // forgive flag before this fn's own end-of-function fires.
}
