/**
 * blocks-creole-atoms.ts — cdd6 T1b: the per-atom measure/draw helpers
 * `chromeAtomOps` (`blocks-creole.ts`) composes, split out so
 * `blocks-creole.ts` stays under this project's 500-line cap after D3's
 * `ChromeTextPaint.hyperlinkColor` addition. A pure move: every function
 * body, doc comment, and upstream citation below is unchanged from
 * `blocks-creole.ts`'s own pre-T1b shape; only the two module boundaries
 * (this file's exports, that file's imports) are new.
 *
 * @see ./blocks-creole.ts for the module doc comment this cluster serves.
 */
import { XDimension2D } from '../klimt/geom/XDimension2D.js';
import { UTranslate } from '../klimt/UTranslate.js';
import { Fore } from '../klimt/Fore.js';
import { Back } from '../klimt/Back.js';
import { UImage } from '../klimt/shape/UImage.js';
import { UText, getFont, type FontConfiguration } from '../klimt/shape/UText.js';
import { renderLatexAsImage } from '../latex.js';
import { emojiSquareDim } from '../klimt/creole/atom/AtomEmoji.js';
import { drawEmojiAtom } from '../svek/image/EntityImageDescriptionEmoji.js';
import { atomTextWidth } from '../klimt/creole/legacy/AtomText.js';
import type { AtomImageResolver } from '../creole-atoms.js';
import type { CreoleAtom, CreoleAtomUrl } from '../klimt/creole/atom/Atom.js';
import type { Atom } from '../klimt/creole/SheetBlock1.js';
import type { StringBounder } from '../klimt/font/StringBounder.js';
import type { UGraphic } from '../klimt/UGraphic.js';

/** `'kind' in x` duck-typing of the plain-data `CreoleAtom` union vs a
 *  composite OOP `Atom` (`AtomTable`/`AtomTree`/`AtomMath`/…) —
 *  `EntityImageDescriptionDelegates.ts#isCreoleAtomData`'s documented
 *  convention, which `leaf-sizing-folder-title.ts` already copies for the
 *  identical reason (the runtime `Sheet` mixes both). */
export function isCreoleAtomData(x: CreoleAtom | Atom): x is CreoleAtom {
  return 'kind' in x;
}

/** MEASUREMENT-only muted font — `EntityImageDescriptionDelegates.ts
 *  #measuringFont`'s identical convention (`AtomText.java` reads
 *  `fontConfiguration.getFont()`, i.e. the `fontPosition`-muted size,
 *  while `UText.build`/`drawU` keep the unmuted config). */
function measuringFont(fc: FontConfiguration): FontConfiguration {
  return { ...fc, size: getFont(fc).size };
}

const ATOM_TEXT_MIN_HEIGHT = 10; // AtomText.java:180 "if (h < 10) h = 10;"

/** `AtomText#calculateDimensionSlow` (java:180-184): height floors to
 *  `ATOM_TEXT_MIN_HEIGHT`; a tabulation run instead takes `#getWidth`'s
 *  tab-stop tokenizer (`atomTextWidth`) for width, per `measureLine`. */
function textDim(atom: CreoleAtom & { kind: 'text' }, stringBounder: StringBounder): XDimension2D {
  const font = measuringFont(atom.font);
  const height = Math.max(stringBounder.calculateDimension(font, atom.text).getHeight(), ATOM_TEXT_MIN_HEIGHT);
  const width = atomTextWidth(atom.text, font.size, (t) => stringBounder.calculateDimension(font, t).getWidth());
  return new XDimension2D(width, height);
}

/** The non-text atom kinds chrome can resolve, and how. Built once per
 *  chrome block from the diagram's OWN `SpriteRegistry` (`ast.sprites`,
 *  the same field `sprite-registry.ts#surfaceSpriteWarnings` reads off
 *  every engine's AST) — `makeAtomImageResolverFor` is the SHARED factory
 *  the description and class engines already call for `<img:>`/`<$sprite>`
 *  (`creole-atoms-image-resolver.ts`), so chrome resolves them identically
 *  rather than growing a second decomposition. Emoji artwork has no
 *  channel at this seam, which is not a gap in the drawing: `drawEmojiAtom`
 *  falls back to the platform-glyph text run when no artwork resolver is
 *  supplied, exactly as the description engine does for an unbundled
 *  emoji. */
function atomImageOf(
  atom: CreoleAtom,
  resolveAtomImage: AtomImageResolver | undefined,
): ResolvedAtomImageWithRaster | undefined {
  return atom.kind === 'inline' ? resolveAtomImage?.(atom.atom) : undefined;
}

/** SI15 T1's local widening of `AtomImageResolver`'s `image` variant with
 *  the optional raster-pixel fields its producers populate — declared
 *  locally for the reason `EntityImageDescriptionDelegates.ts` and
 *  `EntityImageDescriptionTextBlock.ts` both declare their own: the
 *  runtime shape carries them, the shared static type does not expose
 *  them. */
type ResolvedAtomImageWithRaster =
  | (Extract<ReturnType<AtomImageResolver>, { readonly kind: 'image' }> & {
      readonly rasterWidth?: number;
      readonly rasterHeight?: number;
    })
  | Exclude<ReturnType<AtomImageResolver>, { readonly kind: 'image' }>;

/** `AtomMath`'s own default ink (`renderLatexAsImage`'s caller convention
 *  in `EntityImageDescriptionDelegates.ts#descAtomOps`). */
const LATEX_DEFAULT_COLOR = '#000000';

/** One atom's measured box. `latex` resolves through the SAME
 *  `renderLatexAsImage` the description engine measures with; `emoji` is
 *  `AtomEmoji#calculateDimensionSlow`'s own 36*factor SQUARE (never
 *  `emojiBoxDim`'s pre-combined line height — `Sea` derives the line
 *  height itself from the altitude below, F4-b); an unresolved
 *  `<$sprite>` contributes NOTHING, matching `StripeSimple.addSprite`
 *  (java:228-236). */
export function atomDim(
  atom: CreoleAtom,
  stringBounder: StringBounder,
  resolveAtomImage: AtomImageResolver | undefined,
): XDimension2D {
  if (atom.kind === 'text') return textDim(atom, stringBounder);
  if (atom.kind === 'latex') {
    const r = renderLatexAsImage(atom.expr, atom.color ?? LATEX_DEFAULT_COLOR);
    return new XDimension2D(r.width, r.height);
  }
  if (atom.kind === 'emoji') {
    const { width, height } = emojiSquareDim(atom.factor);
    return new XDimension2D(width, height);
  }
  const resolved = atomImageOf(atom, resolveAtomImage);
  return resolved === undefined ? new XDimension2D(0, 0) : new XDimension2D(resolved.width, resolved.height);
}

/** `AtomSprite`/`AtomImg`'s draw, reached with `ug` ALREADY positioned at
 *  the atom's own origin by `SheetBlock1#drawU` — mirrors
 *  `EntityImageDescriptionDelegates.ts#descAtomOps`'s identical branch
 *  pair (`SvgNanoParser`-decomposed primitives re-apply their own
 *  translate/paint; a raster image draws one `<image>`). */
function drawAtomImage(resolved: ResolvedAtomImageWithRaster, ug: UGraphic): void {
  if (resolved === undefined) return;
  if (resolved.kind === 'image') {
    const raster =
      resolved.rasterWidth !== undefined && resolved.rasterHeight !== undefined
        ? { rasterWidth: resolved.rasterWidth, rasterHeight: resolved.rasterHeight }
        : undefined;
    ug.draw(UImage.build(resolved.width, resolved.height, resolved.href, raster));
    return;
  }
  for (const primitive of resolved.primitives) {
    ug.apply(primitive.translate)
      .apply(new Fore(primitive.fore))
      .apply(new Back(primitive.back))
      .apply(primitive.stroke)
      .draw(primitive.shape);
  }
}

const DESCENT_DIVISOR = 4.5; // WidthTableMeasurer/FixedMeasurer#getDescent's own size/4.5 (measurer.ts).

function drawTextAtom(atom: CreoleAtom & { kind: 'text' }, ug: UGraphic): void {
  const stringBounder = ug.getStringBounder();
  const font = measuringFont(atom.font);
  const dim = stringBounder.calculateDimension(font, atom.text);
  const descent = stringBounder.getDescent?.(font, atom.text) ?? font.size / DESCENT_DIVISOR;
  ug.apply(new UTranslate(0, dim.getHeight() - descent)).draw(UText.build(atom.text, atom.font));
}

/** `AtomText#drawU` brackets its runs with `ug.startUrl(url)` /
 *  `ug.closeUrl()` whenever the run carries one
 *  (`klimt/creole/legacy/AtomText.java:197-198,235-236`) — that pair is
 *  what makes the jar emit `<a target="_top" href=…>` around a creole
 *  `[[url label]]`. Duck-typed rather than widened onto the `UGraphic`
 *  interface, matching `skin/VisibilityModifier.ts`'s own established
 *  check for the sibling `startGroup`/`closeGroup` pair: `UGraphicSvg` is
 *  the only implementor that can emit an `<a>`, and a measuring/limit-
 *  finding graphic legitimately has nothing to open. */
interface UrlCapableUGraphic {
  startUrl(url: CreoleAtomUrl): void;
  closeUrl(): void;
}

function urlCapable(ug: UGraphic): UrlCapableUGraphic | undefined {
  const candidate = ug as unknown as Partial<UrlCapableUGraphic>;
  return typeof candidate.startUrl === 'function' && typeof candidate.closeUrl === 'function'
    ? (candidate as UrlCapableUGraphic)
    : undefined;
}

export function drawAtom(atom: CreoleAtom, ug: UGraphic, resolveAtomImage: AtomImageResolver | undefined): void {
  if (atom.kind === 'text') {
    const url = atom.url;
    const linkable = url === undefined ? undefined : urlCapable(ug);
    if (linkable === undefined || url === undefined) return drawTextAtom(atom, ug);
    linkable.startUrl(url);
    drawTextAtom(atom, ug);
    linkable.closeUrl();
    return;
  }
  if (atom.kind === 'latex') {
    const r = renderLatexAsImage(atom.expr, atom.color ?? LATEX_DEFAULT_COLOR);
    ug.draw(UImage.build(r.width, r.height, r.href));
    return;
  }
  if (atom.kind === 'emoji') return drawEmojiAtom(ug, atom, undefined);
  drawAtomImage(atomImageOf(atom, resolveAtomImage), ug);
}

/** `AtomSprite`'s tint colour is the SURROUNDING text configuration's own
 *  (`legacy/StripeSimple.java#addSprite`), which
 *  `makeAtomImageResolverFor`'s curried `font` parameter carries. A
 *  non-text atom has no font of its own in this port's `CreoleAtom` union
 *  except through the run that produced it, so the block's own base
 *  configuration stands in — the same approximation
 *  `creole-atoms-image-resolver.ts`'s own doc comment records for the
 *  description engine's per-textblock font. */
export function fontOfAtom(atom: CreoleAtom, baseFont: FontConfiguration): FontConfiguration {
  return atom.kind === 'text' ? atom.font : baseFont;
}
