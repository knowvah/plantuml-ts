/**
 * The FORM a color takes in the emitted SVG, as distinct from which color it
 * is.
 *
 * Upstream never writes a user's color string through. Every color reaches the
 * SVG as `HColor#toSvg(colorMapper)` — always `#RRGGBB` — and `SvgGraphics`
 * then runs `shortenColor` to collapse `#RRGGBB` to `#RGB` where the pairs
 * repeat. So a theme saying `black` emits `#000`, and one saying `green` emits
 * `#008000` (no collapse possible).
 *
 * This port carries theme colors as their source strings, which is why the
 * json family was emitting `fill="black"` where every golden has
 * `fill="#000"`. Visually identical, structurally wrong, and invisible to a
 * DOM-parsing normalizer — see the `black != #000` class of diff that made up
 * 42 of mission A5's residual across seven fixtures.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/drawing/svg/SvgGraphics.java#styleMe
 */

import { shortenColor } from '../../core/svg-format.js';
import { resolveColorToSvgHex } from '../../core/klimt/color/HColorSet.js';

/**
 * A color in the form the jar emits: named colors resolved to hex, then
 * shortened.
 *
 * `none` and `transparent` are NOT colors in this sense — SVG keywords the jar
 * also passes through — so they are returned untouched rather than resolved to
 * an opaque black.
 */
export function canonicalColor(color: string): string {
  if (color === 'none' || color === 'transparent') return color;
  return shortenColor(resolveColorToSvgHex(color));
}

/** {@link canonicalColor} for an optional field, preserving `undefined`. */
export function canonicalColorOpt(color: string | undefined): string | undefined {
  return color === undefined ? undefined : canonicalColor(color);
}
