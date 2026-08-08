/**
 * AtomEmoji — sizing constants for one `<:name:>` creole emoji atom.
 *
 * Upstream: `klimt/creole/atom/AtomEmoji.java` —
 * ```java
 * private static final double MAGIC = 24.0;
 * this.factor = scale * size2D / MAGIC;                 // ctor
 * calculateDimensionSlow -> new XDimension2D(36*factor, 36*factor);
 * getStartingAltitude    -> -3 * factor;
 * ```
 * The drawn box is a `36*factor` SQUARE; the atom additionally hangs
 * `3*factor` BELOW the baseline-anchored box (negative starting altitude),
 * so the line height a lone emoji imposes is `(36+3)*factor = 39*factor` —
 * jar-verified (A2s R2a probe1): `<:label:> label` at font 14 → factor
 * 14/24, line term 39×14/24 = 22.75, node height 32.75px (= 22.75 + the
 * header's own +10) and lecelo-92-loma110's 3-emoji-line header
 * 3×22.75 + 10 = 78.25px = 1.086806in golden-exact.
 *
 * Ported as plain constants + a factor function (not a class): this port's
 * `CreoleAtom` union is data-only (`atom/Atom.ts`'s own doc comment) and
 * the drawing half (`emoji.drawU`, Twemoji SVG artwork) is not ported.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/atom/AtomEmoji.java
 */
import type { FontConfiguration } from '../../shape/UText.js';
import { emojiCharacter } from '../Emoji.js';

/** `AtomEmoji.MAGIC` (java:46) — the font-size the artwork is scaled
 *  against. */
export const EMOJI_MAGIC = 24;

/** `calculateDimensionSlow`'s `36 * factor` square (java:57-59). */
export const EMOJI_BOX_FACTOR = 36;

/** `getStartingAltitude`'s `-3 * factor` (java:62-64) — how far the atom
 *  hangs BELOW its baseline-anchored box. */
export const EMOJI_ALTITUDE_FACTOR = -3;

/** The line height an emoji imposes when a TEXT atom shares its line: box
 *  height (36×factor) MINUS the negative starting altitude (-3×factor) →
 *  39×factor. See module doc comment for the jar probe.
 *
 *  NOT unconditional — see {@link emojiLineHeightFactor}. */
export const EMOJI_LINE_HEIGHT_FACTOR = 39;

/**
 * The line height factor an emoji atom imposes, per line CONTEXT.
 *
 * `39*factor` is not a property of `AtomEmoji` at all upstream — it is
 * EMERGENT from `Sea#doAlign` + `Sea#getHeight` (`Sea.java:73-88`, ported
 * verbatim in `creole/Sea.ts`). `doAlign` places every atom at
 * `y = -height + startingAltitude`, and the stripe's height is
 * `maxY - minY` across the line:
 *
 * - emoji: `minY = -36f + (-3f) = -39f`, `maxY = -3f`
 * - text (altitude 0, height S): `minY = -S`, `maxY = 0`
 *
 * With a text atom on the line `maxY` is the text's `0` and `minY` is the
 * emoji's `-39f` (at every font size this port reaches, `39f > S`), so the
 * line is `39*factor` — the mixed case, jar-verified in the module doc
 * comment. With NO text atom the emoji supplies BOTH bounds and the line
 * is its own box, `36*factor`. Jar-probed: `rectangle "<:rocket:>"` is
 * `41 x 41px` (36f + the 20px box margin), where the unconditional `39`
 * gives `41 x 42.75px` — `3*factor` = 1.75px too tall at font 14
 * (`oracle/goldens/description/emoji-only-line-height-0`).
 *
 * Callers driving the REAL `Sea` pipeline (`EntityImageDescription
 * Delegates.ts#descAtomOps`, via `BodyFactory.create3`) must NOT use this:
 * they report {@link emojiSquareDim} + {@link emojiStartingAltitude} and
 * let `Sea` derive both cases itself. This helper exists only for
 * `buildTextBlock`'s naive top-down height-summing SUBSTITUTE
 * (`EntityImageDescriptionTextBlock.ts`), which has no altitude concept.
 */
export function emojiLineHeightFactor(hasTextSiblingOnLine: boolean): number {
  return hasTextSiblingOnLine ? EMOJI_LINE_HEIGHT_FACTOR : EMOJI_BOX_FACTOR;
}

/** `AtomEmoji`'s ctor factor: `scale * size2D / MAGIC` (java:52). */
export function emojiFactor(scale: number, fontSize: number): number {
  return (scale * fontSize) / EMOJI_MAGIC;
}

/** The width/line-height an emoji atom contributes to its line: the
 *  `36*factor` box for width/x-advance, `39*factor` vertically (box plus
 *  the below-baseline hang -- see module doc comment). The single shared
 *  sizing helper for BOTH consumers (class member/header rows via
 *  `class-member-atom-resolve.ts`, description labels via
 *  `core/svek/image/EntityImageDescription*`). */
export function emojiBoxDim(factor: number): { width: number; height: number } {
  return { width: EMOJI_BOX_FACTOR * factor, height: EMOJI_LINE_HEIGHT_FACTOR * factor };
}

/** `AtomEmoji#calculateDimensionSlow` VERBATIM (java:57-59) — the
 *  `36*factor` SQUARE, with no line-height hang folded in. The dimension a
 *  caller driving the real `Sea` pipeline must report, paired with
 *  {@link emojiStartingAltitude}; {@link emojiBoxDim} is the pre-combined
 *  convenience for the naive substitute path and keeps its own contract. */
export function emojiSquareDim(factor: number): { width: number; height: number } {
  return { width: EMOJI_BOX_FACTOR * factor, height: EMOJI_BOX_FACTOR * factor };
}

/** `AtomEmoji#getStartingAltitude` VERBATIM (java:62-64) — `-3 * factor`. */
export function emojiStartingAltitude(factor: number): number {
  return EMOJI_ALTITUDE_FACTOR * factor;
}

/** The platform-glyph TEXT run an emoji atom renders as -- the emoji's own
 *  unicode character at font size `36*factor` (the drawn box), tinted by
 *  the atom's resolved forced color when present (`color: null` keeps the
 *  glyph's native colors). The Twemoji SVG artwork upstream draws
 *  (`Emoji#drawU`) is not ported; every SIZING quantity comes from
 *  {@link emojiBoxDim}, never from measuring this glyph. */
export function emojiRenderRun(atom: {
  readonly unicode: string;
  readonly factor: number;
  readonly color: string | null;
}): { text: string; font: FontConfiguration } {
  return {
    text: emojiCharacter(atom.unicode),
    font: {
      family: 'sans-serif',
      size: EMOJI_BOX_FACTOR * atom.factor,
      color: atom.color,
      styles: new Set(),
    },
  };
}
