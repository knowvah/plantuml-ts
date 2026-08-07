/**
 * Measurement (D9) for Creole `<img>` / `<$sprite>` / `<&openiconic>` inline
 * atoms — the scaled pixel dims each atom contributes to label measurement,
 * and the per-line width/height composition built on top of them.
 *
 * Split out of `creole-atoms.ts` to keep that file under the project's
 * 500-line cap (S1L-f). That module owns the token model and the regex
 * scanner; this one owns the arithmetic. The split is also the natural seam:
 * every sizer and renderer in the port measures through the two functions
 * here, so the sizer<->renderer agreement invariant has one home.
 */

import type { FontSpec, StringMeasurer } from './measurer.js';
import { openIconicDims, openIconicFactor } from './openiconic-glyphs.js';
import {
  scanLineForAtoms,
  type InlineAtomToken,
  type SpriteDimsLookup,
} from './creole-atoms.js';

// ---------------------------------------------------------------------------
// Measurement (D9)
// ---------------------------------------------------------------------------

/**
 * The scaled pixel dims a single atom contributes to label measurement.
 * `img`: `{width, height} * scale` (IHDR dims, AtomImg.calculateDimensionSlow).
 * `sprite`: registry dims * {@link spriteScale} when the name resolves;
 * `{0, 0}` (i.e. contributes NOTHING) for an unknown name --
 * StripeSimple.addSprite (java :228-236) never adds an atom for a sprite the
 * skinparam doesn't know.
 * `openiconic` (G2 N41): `openIconicDims(openIconicFactor(atom.scale,
 * ambientFontSize))` -- `ambientFontSize` defaults to 12 (the OpenIconic
 * "native" font-size reference, `AtomOpenIconic`'s own `/12.0` divisor) when
 * the caller has no ambient font in scope, matching "no ambient context"
 * degrading to `factor === scale` rather than an arbitrary guess.
 */
export function measureInlineAtom(
  atom: InlineAtomToken,
  sprites?: SpriteDimsLookup,
  ambientFontSize?: number,
): { width: number; height: number } {
  if (atom.kind === 'img') {
    return { width: atom.width * atom.scale, height: atom.height * atom.scale };
  }
  if (atom.kind === 'openiconic') {
    return openIconicDims(openIconicFactor(atom.scale, ambientFontSize ?? 12));
  }
  const dims = sprites?.get(atom.name);
  if (dims === undefined) return { width: 0, height: 0 };
  const scale = spriteAtomScale(atom, ambientFontSize);
  return { width: dims.width * scale, height: dims.height * scale };
}

/** The font-size reference a creole `<$sprite>` is scaled against
 *  (`CommandCreoleSprite.java:82`'s literal `13.0`). */
const SPRITE_FONT_REFERENCE_SIZE = 13;

/**
 * Effective scale of a creole `<$name>` sprite atom: `Parser.getScale(...) *
 * fc.getSize2D() / 13.0` (`CommandCreoleSprite.java:82`) — the REQUESTED
 * scale times the ambient font size over a fixed 13px reference. This applies
 * to every sprite kind (monochrome, 4096-colour, SVG): the factor lives in
 * the creole `<$…>` command, not in any `Sprite` implementation.
 *
 * Jar-verified against the deterministic oracle at two font sizes and two
 * sprite kinds — a 48×48 encoded sprite measures 51.6923 at font 14
 * (48 × 14/13) and 96.0 at font 26 (48 × 26/13); a 16×16 SVG sprite measures
 * 17.2308 and 32.0 respectively. This port previously used the raw registry
 * dims × the requested scale, i.e. it silently assumed a font size of 13.
 *
 * `ambientFontSize === undefined` (a caller with no font in scope) keeps the
 * factor at 1 rather than guessing a size — every call site in this port
 * threads its own font, so that path is defensive only.
 */
export function spriteScale(requestedScale: number, ambientFontSize?: number): number {
  return requestedScale * ((ambientFontSize ?? SPRITE_FONT_REFERENCE_SIZE) / SPRITE_FONT_REFERENCE_SIZE);
}

/**
 * Effective scale of ONE `<$name>` sprite ATOM — {@link spriteScale} on the
 * ordinary inline path, but the atom's RAW `scale` when it was recognized
 * inside a `[[url label]]` link (`SpriteAtomToken.insideUrl`, set by
 * `klimt/creole/legacy/StripeSimple.ts#modifyStripe`).
 *
 * Upstream builds a url-label sprite through a SECOND, separate constructor:
 * `AtomTextUtils#createAtomTextForUrl` (`java:119-127`) hands
 * `Parser.getScale(m.group(6), 1)` to `AtomSprite` unmodified, deliberately
 * omitting the `* fc.getSize2D() / 13.0` factor
 * `CommandCreoleSprite#executeAndAdvance` (`java:82`) applies everywhere
 * else. (Upstream's own comment on that branch: "sprites are probably not
 * working in URL".) Jar-verified against the deterministic oracle
 * (`bivira-53-boja685`, `vivido-49-nisu863`): a `[48x48/16z]` sprite at the
 * default font 14 measures `48 × 14/13 = 51.6923` OUTSIDE a link and flat
 * `48` INSIDE one — a 3.6923px difference on BOTH axes, reproduced
 * independently by `vivido-49`'s unrelated `[48x48/16]` `$database` sprite.
 *
 * Sprite-only by construction, not by omission: upstream's url branch also
 * passes a raw scale for `AtomOpenIconic` (`java:116`) and `AtomImg`
 * (`java:129`), but those two are ALREADY raw on the ordinary path
 * (`CommandCreoleOpenIcon`/`CommandCreoleImg` never multiply by the font
 * ratio), so the sprite kind is the only one that diverges.
 *
 * This is the SINGLE site both the sizer (`measureInlineAtom` above,
 * reached via `leaf-sizing-entity.ts#sizingAtomImageResolverFor`) and the
 * renderer (`diagrams/description/render-atoms.ts#resolveSpriteAtom` /
 * `#resolveSvgSpriteAtom`) scale a sprite through, so the two cannot drift
 * — the lockstep requirement in `planning/sizer-renderer-parity.md`.
 * {@link spriteScale}'s own signature is deliberately unchanged: the bypass
 * is a per-ATOM decision, not a new parameter every other caller must reason
 * about.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/legacy/AtomTextUtils.java#createAtomTextForUrl
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/command/CommandCreoleSprite.java#executeAndAdvance
 */
export function spriteAtomScale(
  atom: Extract<InlineAtomToken, { kind: 'sprite' }>,
  ambientFontSize?: number,
): number {
  return atom.insideUrl === true ? atom.scale : spriteScale(atom.scale, ambientFontSize);
}

/**
 * Measure one line's width/height, atom-aware. Atom-free lines take the
 * exact same code path as before this task (`measurer.measure(line,
 * fontSpec)`), so this is a zero-diff drop-in everywhere it replaces a bare
 * `measurer.measure` call. Atom-bearing lines: text width comes from the
 * markup-stripped text (`scanLineForAtoms`); each atom's scaled width ADDS
 * to the total; each atom's scaled height MAXES against the running height
 * (D9) -- mirrors StripeSimple's ArithmeticStrategySum (width) /
 * ArithmeticStrategyMax (height) composition of one line's atoms.
 */
export function measureLineWithAtoms(
  line: string,
  fontSpec: FontSpec,
  measurer: StringMeasurer,
  sprites?: SpriteDimsLookup,
): { width: number; height: number } {
  const scan = scanLineForAtoms(line);
  if (scan.atoms.length === 0) return measurer.measure(line, fontSpec);
  const textDim = measurer.measure(scan.textWithoutAtoms, fontSpec);
  let width = textDim.width;
  let height = textDim.height;
  for (const atom of scan.atoms) {
    const dims = measureInlineAtom(atom, sprites, fontSpec.size);
    width += dims.width;
    if (dims.height > height) height = dims.height;
  }
  return { width, height };
}

/**
 * The additional height a line's atoms need beyond a plain text line
 * (`fontSpec.size`) -- 0 for an atom-free line. Callers that build a
 * uniform `lineCount * lineHeight` multi-line total (e.g. leaf-sizing.ts)
 * add this per line to preserve that formula exactly for atom-free
 * displays while still growing the box for a line with a tall atom.
 */
export function lineAtomHeightExcess(line: string, fontSpec: FontSpec, sprites?: SpriteDimsLookup): number {
  const { atoms } = scanLineForAtoms(line);
  let maxAtomHeight = 0;
  for (const atom of atoms) {
    const h = measureInlineAtom(atom, sprites, fontSpec.size).height;
    if (h > maxAtomHeight) maxAtomHeight = h;
  }
  return maxAtomHeight > fontSpec.size ? maxAtomHeight - fontSpec.size : 0;
}
