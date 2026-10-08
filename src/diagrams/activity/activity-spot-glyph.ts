/**
 * Translates {@link SPOT_GLYPH_D}'s reference-position outline to an
 * arbitrary spot centre -- the SAME per-token `(x, y, x, y, ...)` shift
 * `class-badge.ts#badgeGlyphPath` uses for its own captured table (every
 * command this letter set emits, `M`/`L`/`Q`/`Z`, alternates coordinate
 * pairs in that order). Kept as its own small module rather than importing
 * `badgeGlyphPath`'s private helper: the two tables are genuinely different
 * glyph data (see `activity-spot-glyph-data.ts`'s own doc comment for the
 * non-uniform-scale check), so there is no shared TABLE to hoist, only a
 * shared shift-and-format IDIOM -- too small a duplication (one regex, one
 * replace) to justify a cross-diagram-family import for.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vertical/FtileCircleSpot.java:99-111
 * @see net/sourceforge/plantuml/klimt/drawing/svg/DriverCenteredCharacterSvg.java:56-81
 */
import { DEFAULT_SVG_DECIMALS, formatDecimal } from '../../core/svg-format.js';
import {
  CAPTURED_SPOT_LETTERS,
  SPOT_GLYPH_D,
  SPOT_REFERENCE_CX,
  SPOT_REFERENCE_CY,
} from './activity-spot-glyph-data.js';

/** Numeric-token regex (lizard-safe: built from a string, matches
 *  `class-badge.ts#NUMBER_RE`'s own convention for `<`/`>`-adjacent regex
 *  literals). */
const NUMBER_RE = new RegExp('-?\\d+(?:\\.\\d+)?', 'g');

/**
 * The captured, reference-centred outline for `letter` (case-insensitive),
 * translated to `(cx, cy)` -- or `undefined` when no outline has been
 * captured for that letter (every corpus letter outside A/B/G,
 * {@link CAPTURED_SPOT_LETTERS}; the caller falls back to
 * `DriverCenteredCharacterSvg.java:64-69`'s own deterministic `<text>`
 * branch, {@link SPOT_TEXT_FALLBACK_NOTE} documents which letters that
 * applies to today).
 */
export function spotGlyphPath(letter: string, cx: number, cy: number): string | undefined {
  const upper = letter.toUpperCase();
  if (!CAPTURED_SPOT_LETTERS.has(upper)) return undefined;
  const refD = SPOT_GLYPH_D[upper as keyof typeof SPOT_GLYPH_D];
  const dx = cx - SPOT_REFERENCE_CX;
  const dy = cy - SPOT_REFERENCE_CY;
  let axis = 0;
  return refD.replace(NUMBER_RE, (tok) => {
    const shifted = Number(tok) + (axis === 0 ? dx : dy);
    axis = 1 - axis;
    return formatDecimal(shifted, DEFAULT_SVG_DECIMALS);
  });
}

/**
 * Every corpus spot letter OUTSIDE {@link CAPTURED_SPOT_LETTERS} falls
 * back to upstream's own `FileFormat.SVG_DETERMINISTIC` `<text>` branch
 * (`DriverCenteredCharacterSvg.java:64-69`): `x - 5, y + 5`, `monospace`,
 * size 14. That branch is not what the real (non-deterministic-text)
 * format this port's oracle always exercises would draw for an UNCAPTURED
 * letter -- there is no faithful answer for a platform AWT outline this
 * table has not scraped -- so it is a documented, deliberate divergence
 * (CLAUDE.md "preserve information-carrying output": a wrong-but-present
 * glyph beats a missing one), not a second upstream code path actually
 * reached by this corpus. Empty today: {@link CAPTURED_SPOT_LETTERS}
 * covers every `circle,spot` letter this corpus's cached oracle SVGs
 * contain (T3g census, `activity-spot-glyph-data.ts`).
 */
export const SPOT_TEXT_FALLBACK_NOTE =
  'no letter in the current corpus falls back to the <text> branch -- A/B/G are all captured';
