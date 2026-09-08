/**
 * Shared `KeyHandler` type + parse helpers for the skinparam key→handler
 * table.
 *
 * Split out of skinparam-key-handlers.ts to keep that file (and its own
 * 73-entry table, split further into two halves) under the project's
 * 500-line cap — see skinparam.ts's own doc comment for the full module
 * map. A pure move: every helper below is unchanged from the pre-split
 * version.
 */

import type { SkinparamAccumulator } from './skinparam-accumulator.js';
import { resolveColorToSvgHex, parseSimpleColor } from './klimt/color/HColorSet.js';

/**
 * SI26 D1: the arrow-label FontColor value as the theme carries it --
 * RESOLVED hex (`XColor#toSvg`), or `undefined` for a token that is not a
 * colour at all (an unexpanded skin macro such as `reddress`'s
 * `ARROWFONTCOLOR`, a typo). The same guard `style-cascade-class.ts
 * #cascadeHex` applies on the `<style>` path, for the same reason: an
 * unresolvable raw string as an SVG `fill` is worse than the `#000000`
 * default. Named divergence: the jar draws such tokens WHITE
 * (`HColorSet#getColorOrWhite`; oracle experiment `bad` in
 * `plans/arrow-label-font-colour/decision-journal.md`).
 */
export function arrowFontColorValue(color: string): string | undefined {
  const lower = color.toLowerCase();
  if (lower !== 'transparent' && lower !== 'background' && parseSimpleColor(color) === undefined) {
    return undefined;
  }
  return resolveColorToSvgHex(color);
}

export type KeyHandler = (acc: SkinparamAccumulator, value: string, color: string) => void;

// ---------------------------------------------------------------------------
// Shared numeric/string parse helpers — each dedupes an identical parse
// pattern that appears at multiple original case sites (verified byte-
// identical against the pre-split switch before extraction).
// ---------------------------------------------------------------------------

/** `Number(value)` with an `isFinite` guard (classAttributeFontSize et al). */
export function parseFiniteNumber(value: string): number | undefined {
  const v = Number(value);
  return Number.isFinite(v) ? v : undefined;
}

/** `Number.parseFloat(value.trim())` with an `isFinite` guard. */
export function parseFiniteFloat(value: string): number | undefined {
  const v = Number.parseFloat(value.trim());
  return Number.isFinite(v) ? v : undefined;
}

/** `Number.parseInt(value.trim(), 10)` with an `isFinite` guard, no zero-reject. */
export function parseFiniteInt(value: string): number | undefined {
  const v = Number.parseInt(value.trim(), 10);
  return Number.isFinite(v) ? v : undefined;
}

/** Same as {@link parseFiniteInt} but treats 0 as "unset" (nodesep/ranksep/wrapwidth). */
export function parseNonZeroInt(value: string): number | undefined {
  const v = Number.parseInt(value.trim(), 10);
  return Number.isFinite(v) && v !== 0 ? v : undefined;
}

/**
 * `SkinParam#getFontFace`'s real substring-match rule -- "bold"/"italic" may
 * both appear (e.g. "bold italic"), matched independently, case-
 * insensitively, anywhere in the value.
 */
export function parseFontStyleFlags(value: string): { bold: boolean; italic: boolean } {
  const lower = value.trim().toLowerCase();
  return { bold: lower.includes('bold'), italic: lower.includes('italic') };
}

/**
 * `Guillemet.fromDescription` (java): "false"/"<< >>" -> the literal << >>
 * pair; "none" -> both empty; any OTHER value containing a space ->
 * tokenize into (start, end); anything else (including a garbage spaceless
 * value) falls through to the default GUILLEMET wrapper, left unset here.
 */
export function applyGuillemet(acc: SkinparamAccumulator, value: string): void {
  const raw = value.trim();
  const lower = raw.toLowerCase();
  if (lower === 'false' || lower === '<< >>') {
    acc.guillemetStart = '<<';
    acc.guillemetEnd = '>>';
  } else if (lower === 'none') {
    acc.guillemetStart = '';
    acc.guillemetEnd = '';
  } else if (raw.includes(' ')) {
    const tokens = raw.split(/\s+/).filter((t) => t !== '');
    if (tokens.length >= 2) {
      acc.guillemetStart = tokens[0];
      acc.guillemetEnd = tokens[1];
    }
  }
}
