/**
 * Chrome color shorthand helpers — gray-shorthand hex expansion and the
 * `transparent` -> `null` mapping shared by skinparam and `<style>` override
 * resolution (`annotation-skinparam.ts`, `annotation-style-overrides.ts`).
 */

function hexNibble(ch: string): number {
  const lower = ch.toLowerCase();
  if (lower >= '0' && lower <= '9') return lower.charCodeAt(0) - '0'.charCodeAt(0);
  if (lower >= 'a' && lower <= 'f') return lower.charCodeAt(0) - 'a'.charCodeAt(0) + 10;
  return -1;
}

/**
 * Expand PlantUML's single-hex-digit gray shorthand (`#8` -> `#888888`,
 * `#D` -> `#DDDDDD`). Any other value (named colors, `transparent`, 3/6/8
 * digit hex) is returned unchanged — SVG/CSS already understand those.
 *
 * @see HColorSet.java#parseSimpleColor, len==1 branch:
 *   `v = (d<<4)|d; rgb = (v<<16)|(v<<8)|v`.
 */
export function expandGrayShorthand(value: string): string {
  if (value.length !== 2 || value[0] !== '#') return value;
  const d = hexNibble(value[1] ?? '');
  if (d < 0) return value;
  const nibble = ((d << 4) | d).toString(16).toUpperCase().padStart(2, '0');
  return `#${nibble}${nibble}${nibble}`;
}

/** `transparent` (case-insensitive) resolves to `null` (no paint), matching
 *  the `string | null` contract; everything else runs through
 *  {@link expandGrayShorthand}. */
export function resolveChromeColor(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.toLowerCase() === 'transparent') return null;
  return expandGrayShorthand(trimmed);
}
