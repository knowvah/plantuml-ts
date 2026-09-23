/**
 * ColorPalette4096 — the 64-character alphabet + 2-char-code <-> 12-bit-RGB
 * mapping `SpriteColorBuilder4096` reads a `/color` sprite body through.
 *
 * Ported: `getColorFor(String)` (java :82-99) — DECODE only. The ENCODE
 * direction (`getStringFor`, java :53-75, an O(4096) nearest-color search
 * used only when the JAR ITSELF authors a `/color` sprite from a raster
 * image, e.g. a `!includeurl`-fetched icon) has no caller on this port's
 * read-a-`.puml`-body path — cdd-T26 residual round's scope is decoding a
 * `sprite $name [WxH/color] { ... }` body already present in source, never
 * authoring one.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/sprite/ColorPalette4096.java:46-113
 */

/** `ColorPalette4096.java:51` — `!`/`#` were reserved for future use and
 *  reassigned to `.`/`,` per the Java source's own inline comment; the
 *  MIGRATION alias below restores backward compatibility with sprites
 *  authored under the older mapping. */
const COLOR_VALUE = '.,$%&*+-:;<=>?@^_~GHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

/** One decoded RGB channel triple, 8-bit per channel (already `dup()`-
 *  expanded from the palette's native 4-bit-per-channel resolution). */
export interface Rgb4096 {
  readonly r: number;
  readonly g: number;
  readonly b: number;
}

/** `ColorPalette4096#dup` (java :108-111) — expands a 4-bit nibble (0-15)
 *  to an 8-bit channel by duplicating it into both nibbles (`v*16+v`,
 *  e.g. `0xF` -> `0xFF`), NOT a left-shift-only expansion. */
function dup(v: number): number {
  return v * 16 + v;
}

/** `ColorPalette4096#getColorFor(int)` (java :101-106): unpacks a 12-bit
 *  packed code into 4-bit red/green/blue nibbles (`code = red*256 +
 *  green*16 + blue`, unpacked in the SAME base-16 order) then `dup()`s
 *  each to 8 bits. */
function colorForCode(code: number): Rgb4096 {
  const blue = code % 16;
  const green = Math.floor(code / 16) % 16;
  const red = Math.floor(code / 256) % 16;
  return { r: dup(red), g: dup(green), b: dup(blue) };
}

/**
 * `ColorPalette4096#getColorFor(String)` (java :82-99): decodes a 2-char
 * palette code into its RGB colour. Applies the `!`->`.`/`#`->`,`
 * migration alias (java :84-85) before the palette lookup. Returns
 * `undefined` for a 2-char string with either character outside the
 * palette alphabet (upstream: `v1 == -1` / after the `v2` lookup, both
 * return `null` — `indexOf` miss) or a string whose length isn't exactly
 * 2 (upstream throws `IllegalArgumentException`; this port declines
 * instead, matching the project's "no re-validation past a boundary"
 * convention for a value already length-checked by the caller's own
 * 2-char slicing).
 */
export function colorForCode4096(rawCode: string): Rgb4096 | undefined {
  const s = rawCode.replace(/!/g, '.').replace(/#/g, ',');
  if (s.length !== 2) return undefined;
  const v1 = COLOR_VALUE.indexOf(s.charAt(0));
  if (v1 === -1) return undefined;
  const v2 = COLOR_VALUE.indexOf(s.charAt(1));
  if (v2 === -1) return undefined;
  return colorForCode(v1 * 64 + v2);
}
