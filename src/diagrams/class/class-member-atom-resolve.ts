/**
 * class-member-atom-resolve.ts — the non-text atom resolvers backing
 * `class-member-creole.ts#resolveOneAtom` (inline img/sprite, OpenIconic
 * vector, emoji, latex). Split out of that file (A2s R2i) purely to keep it
 * under the repo's 500-line cap while the emoji/row-height seam lands — each
 * function is a pure move (img/sprite, openiconic) or the new R2i emoji
 * resolver; no behavior change to the moved code. {@link resolveLatexAtom}
 * joined them later, for the same 500-line-cap reason.
 */
import type { FontConfiguration } from '../../core/klimt/shape/UText.js';
import type { CreoleAtom } from '../../core/klimt/creole/atom/Atom.js';
import type { MemberRenderAtom } from './class-member-creole.js';
import { emojiBoxDim, emojiRenderRun } from '../../core/klimt/creole/atom/AtomEmoji.js';
import {
  type SpriteDimsLookup,
  type InlineAtomToken,
} from '../../core/creole-atoms.js';
import {
  measureInlineAtom,
  spriteScale,
} from '../../core/creole-atoms-measure.js';
import { isKnownOpenIconicGlyph, openIconicDims, openIconicFactor } from '../../core/openiconic-glyphs.js';
import { resolveColorToSvgHex } from '../../core/klimt/color/HColorSet.js';
import { getSpriteMonochrome, type SpriteRegistry } from '../../core/sprite-commands.js';
import { spriteToPngDataUri, spriteMonochromeAsLike } from '../../core/klimt/sprite/sprite-raster.js';
import { renderLatexAsImage } from '../../core/latex.js';
import { JAR_DEFAULT_TEXT_COLOR } from '../../core/decoration/symbol/usymbol-resolve.js';

/** One resolved atom + the width/line-height it contributes to its row —
 *  the shared return shape of `class-member-creole.ts#resolveOneAtom` and
 *  every resolver here. */
export interface ResolvedMemberAtom {
  readonly atom: MemberRenderAtom;
  readonly width: number;
  readonly lineHeight: number;
}

/** Resolves one `'inline'` `CreoleAtom` (an `InlineAtomToken`, img or
 *  sprite) to a drawable `<image>` -- the class-local mirror of `diagrams/
 *  description/render-atoms.ts#resolveImgAtom`/`resolveSpriteAtom` (that
 *  file lives under `description/` but is otherwise diagram-agnostic; not
 *  imported directly here to avoid a cross-diagram-type dependency on a
 *  file the description mission owns -- see `class-member-creole.ts`'s own
 *  doc comment for why a second small adapter is the right shape, not a
 *  re-port: the underlying `spriteToPngDataUri`/`getSpriteMonochrome` calls
 *  are IDENTICAL, only the caller-side glue differs). `baseFont` is the
 *  ROW's own base font (NOT a per-atom font -- `CreoleAtom`'s `'inline'`
 *  variant carries no font of its own; the shared engine's own
 *  `StripeAtomBuilder.modifyStripe` never captures one either,
 *  description's `render-atoms.ts` doc comment already documents this as an
 *  approximation, "the CURRENT textblock's own resolved font color" --
 *  reused verbatim here, same precedent, not a new gap this file
 *  introduces) used as the sprite tint's fallback color when the atom
 *  carries no `forcedColor` of its own. `undefined` registry/spriteDims (no
 *  `sprite` definitions on this diagram) resolves an `img` atom fine (it
 *  needs no registry) but always skips a `sprite` atom, matching
 *  `StripeSimple.addSprite`'s "unknown name contributes nothing" rule. */
export function resolveInlineAtom(
  atom: Extract<CreoleAtom, { kind: 'inline' }>['atom'],
  baseFont: FontConfiguration,
  sprites: SpriteRegistry | undefined,
  spriteDims: SpriteDimsLookup | undefined,
): Extract<MemberRenderAtom, { kind: 'image' }> | undefined {
  if (atom.kind === 'img') {
    const dims = measureInlineAtom(atom);
    return { kind: 'image', href: atom.dataUri, width: dims.width, height: dims.height };
  }
  if (sprites === undefined) return undefined;
  const sprite = getSpriteMonochrome(sprites, atom.name);
  if (sprite === undefined) return undefined; // unknown name -- contributes nothing.
  // `baseFont.size` threads CommandCreoleSprite's `fc.getSize2D() / 13.0`
  // factor -- same call the sizer makes (S1L-f).
  const dims = measureInlineAtom(atom, spriteDims, baseFont.size);
  const png = spriteToPngDataUri(
    spriteMonochromeAsLike(sprite),
    baseFont.color ?? undefined,
    atom.forcedColor,
    spriteScale(atom.scale, baseFont.size),
  );
  return { kind: 'image', href: png.dataUri, width: dims.width, height: dims.height };
}

/**
 * A2s R2i (lecelo-92-loma110): resolves a `<:name:>` emoji atom. Sizing is
 * `AtomEmoji`'s exact contract (`core/klimt/creole/atom/AtomEmoji.ts`): a
 * `36*factor` square box for width/x-advance, `39*factor` line height (box
 * + the 3*factor below-baseline hang). Rendered as a TEXT run of the
 * emoji's own unicode character (platform glyph) at font size `36*factor`
 * with `textLength = 36*factor` -- the Twemoji SVG artwork upstream draws
 * (`Emoji#drawU`) is not ported; the platform glyph is the closest
 * self-contained rendering, and every SIZING quantity (the golden-DOT
 * contract) comes from the ported constants, never from measuring the
 * glyph. A forced tint resolves onto the run's font color; untinted emoji
 * keep `color: null` (the renderer's default fill -- platform emoji glyphs
 * carry their own native colors).
 */
export function resolveEmojiAtom(atom: Extract<CreoleAtom, { kind: 'emoji' }>): ResolvedMemberAtom {
  const box = emojiBoxDim(atom.factor);
  const run = emojiRenderRun(atom);
  return {
    atom: { kind: 'text', text: run.text, font: run.font, width: box.width },
    width: box.width,
    lineHeight: box.height,
  };
}

/**
 * G2 N41: resolves an OpenIconic `<&glyph>` atom -- `undefined` for an
 * unrecognized glyph name (should not occur: `creole-atoms-openicon.ts
 * #buildOpenIconSpan` already filters unknown names before an atom is ever
 * built, but this stays defensive rather than assuming that invariant holds
 * forever). `factor = openIconicFactor(atom.scale, ambientFontSize)` --
 * `ambientFontSize` comes from `ambientFont` (the font active AT THE POINT
 * the markup was recognized, `Atom.ts`'s own field doc comment), falling
 * back to `baseFont.size` (the ROW's own base font) when unset (the
 * `buildLiteralAtoms` path, which always threads `ambientFont`, so this
 * fallback is defensive only). Color precedence (`AtomOpenIconic` ctor):
 * forced `color=`/`#RRGGBB` override wins; else the ambient font's own
 * color; else the row's base font color; else hardcoded black.
 */
export function resolveOpenIconicAtom(
  atom: Extract<InlineAtomToken, { kind: 'openiconic' }>,
  ambientFont: FontConfiguration | undefined,
  baseFont: FontConfiguration,
): Extract<MemberRenderAtom, { kind: 'vector' }> | undefined {
  if (!isKnownOpenIconicGlyph(atom.name)) return undefined;
  const fontSize = ambientFont?.size ?? baseFont.size;
  const factor = openIconicFactor(atom.scale, fontSize);
  const fill =
    atom.forcedColor !== undefined
      ? resolveColorToSvgHex(atom.forcedColor)
      : (ambientFont?.color ?? baseFont.color ?? '#000000');
  const dims = openIconicDims(factor);
  return { kind: 'vector', name: atom.name, factor, fill, width: dims.width, height: dims.height };
}

/**
 * A creole `<math>`/`<latex>` atom as a drawable `<image>` — `AtomMath`
 * MEASURES the rendered image's own box (`#calculateDimensionSlow`,
 * `AtomMath.java:64-71`) and DRAWS that same image and nothing else
 * (`#drawU`, `AtomMath.java:78-97`), which one call to
 * `core/latex.ts#renderLatexAsImage` answers — the ONE latex renderer this
 * port has, bound exactly as `klimt/creole/atom/AtomMath.ts`, the
 * description engine (`EntityImageDescriptionDelegates.ts#descAtomOps`) and
 * the state/sequence seams already bind it. Sizing and drawing therefore
 * agree by construction rather than by two parallel formulas.
 *
 * It resolves to this union's PRE-EXISTING `'image'` kind rather than a new
 * one because `AtomMath#getStartingAltitude` returns 0 (`AtomMath.java:
 * 73-75`) — the same altitude `AtomImg` reports (`AtomImg.java:242-244`) —
 * so `Sea#doAlign` drops its box to `-height + 0` (`Sea.java:72-80`),
 * exactly the placement both class renderers already implement for an
 * `'image'` atom: `renderer-classifier-rows.ts#renderRowAtoms` bottom-aligns
 * it to the line bottom, and `renderer-note.ts#renderNoteLineAtoms` puts it
 * at the line top, which is the SAME point for the atom that sets the line's
 * own height (`lineHeight === maxSpan === height` when it is the tallest on
 * the line, `class-member-creole-sea.ts#seaLineHeightAndSpan`). A per-atom
 * `top` — what the state seam carries — would mean driving the general
 * `Sea` here, silently widening this engine's deliberately text-only
 * altitude scope (that module's own doc comment).
 *
 * The colour is `AtomMath#getColor(colorMapper, foreground, XColor.BLACK)`
 * (`AtomMath.java:88,100-106`): the run's own resolved font colour, falling
 * back to the default black whenever it is not an `HColorSimple` — a `null`
 * atom colour here.
 *
 * The image BYTES and its exact `width`/`height` are a PERMANENT divergence:
 * this port renders through KaTeX where the jar renders through JLaTeXMath
 * (`DIVERGENCES.md`, which names `<math>` as well as `<latex>`). The
 * STRUCTURE — an image atom in the text flow, in source order — is the
 * conformance target; the numbers are not.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/atom/AtomMath.java:64-106
 */
export function resolveLatexAtom(atom: Extract<CreoleAtom, { kind: 'latex' }>): ResolvedMemberAtom {
  const drawn = renderLatexAsImage(atom.expr, atom.color ?? JAR_DEFAULT_TEXT_COLOR);
  return {
    atom: { kind: 'image', href: drawn.href, width: drawn.width, height: drawn.height },
    width: drawn.width,
    lineHeight: drawn.height,
  };
}
