/**
 * Skinparam key/value normalisation primitives.
 *
 * Split out of skinparam.ts to keep that file under the project's 500-line
 * file-size cap — see skinparam.ts's own doc comment for the full module map.
 *
 * Key normalisation follows SkinParam.cleanForKeySlow in upstream
 * SkinParam.java, which is NOT a simple toLowerCase(). The exact sequence
 * is preserved here so that keys like "classArrowColor",
 * "sequenceArrowColor", and "arrowColor" all normalise to "arrowcolor".
 */

import { parseSimpleColor, parseConditionalColor } from './klimt/color/HColorSet.js';
import { parseColor } from './paint.js';

/** `HColors.WHITE`: what `HColorSet#getColorOrWhite` (java:58-63) returns
 *  for a token `parseColor` rejects. */
export const UNPARSEABLE_COLOR = '#FFFFFF';

/** The keywords `HColorSet#parseColor` accepts ahead of any hex/name parse
 *  (java:82-89), plus `none`: `SkinParam#getHtmlColor` (java:385-387) takes
 *  it for background/arrowHead before `parseColor` runs, and this port's
 *  document shell already treats it as a keyword downstream. */
const COLOR_KEYWORDS = new Set(['transparent', 'background', 'automatic', 'none']);

/** Upstream's 3-part conditional validates ONLY the third color (java:104-106). */
function isConditionalSpec(s: string): boolean | undefined {
  const cond = parseConditionalColor(`#${s}`);
  if (cond === undefined) return undefined;
  if (cond.transparent !== undefined) return parseSimpleColor(cond.transparent) !== undefined;
  return parseSimpleColor(cond.light) !== undefined && parseSimpleColor(cond.dark) !== undefined;
}

/**
 * `HColorSet#parseColor` (klimt/color/HColorSet.java:78-119) as a predicate:
 * would upstream get an `HColor` out of this token? A keyword, a simple
 * hex/name, a `?light:dark[:transparent]` conditional, or an `a<sep>b`
 * gradient whose halves are both simple. Nothing else -- in particular not
 * an unexpanded skin macro, a typo, or an attribute-breaking string.
 */
export function isColorSpec(value: string): boolean {
  const s = value.startsWith('#') ? value.substring(1) : value;
  if (COLOR_KEYWORDS.has(s.toLowerCase())) return true;
  if (parseSimpleColor(s) !== undefined) return true;
  const conditional = isConditionalSpec(s);
  if (conditional !== undefined) return conditional;
  return typeof parseColor(s) !== 'string';
}

/**
 * Resolve a PlantUML color value to a plain CSS color.
 *
 * `HColorSet#getColorOrWhite` (java:58-63) first: a token `parseColor`
 * rejects becomes WHITE, never the raw text. That is what keeps an
 * unparseable `skinparam …Color` string out of every `fill="…"` downstream
 * (CodeQL js/html-constructed-from-input on `svgRoot`; the jar, asked to
 * render `skinparam backgroundColor x"onload="…`, draws `#FFFFFF`).
 *
 * PlantUML supports gradient specs in the form "startColor-endColor"
 * (e.g. "#AAAAAA-white" or "#AAAAAA-red").  SVG does not understand this
 * syntax, so we extract the end color and use it as a solid fallback.
 * The end color is typically the more visually prominent tone.
 */
export function resolveColor(value: string): string {
  if (!isColorSpec(value)) return UNPARSEABLE_COLOR;
  const m = /^(.+)-([a-zA-Z]+|#[0-9A-Fa-f]{3,8})$/.exec(value);
  return m ? (m[2] ?? value) : value;
}

/**
 * Normalise a raw skinparam key to its canonical lowercase form.
 *
 * Ported from SkinParam.java:cleanForKeySlow. The sequence matters:
 *  1. Trim whitespace and convert to lowercase
 *  2. Strip underscores and dots (so "class_background_color" == "classbackgroundcolor")
 *  3. Collapse "sequenceparticipant" / "sequenceactor" prefixes to plain
 *     "participant" / "actor" (upstream stores these without the "sequence" prefix)
 *  4. Collapse diagram-type arrow prefixes — activityarrow, classarrow,
 *     componentarrow, objectarrow, sequencearrow, statearrow, usecasearrow —
 *     all become plain "arrow" so they share one slot in the mapping table
 *  5. Normalise "align" suffix to "alignment"
 */
export function normaliseKey(raw: string): string {
  let key = raw.trim().toLowerCase();
  // Step 1: strip underscores and dots
  key = key.replace(/[_.]/g, '');
  // Step 2: collapse sequenceparticipant / sequenceactor prefix
  key = key.replace(/sequence(participant|actor)/g, '$1');
  // Step 3: collapse diagram-type arrow prefixes to plain "arrow"
  key = key.replace(/(?:activity|class|component|object|sequence|state|usecase)arrow/g, 'arrow');
  // Step 4: normalise "align" suffix to "alignment"
  key = key.replace(/align$/, 'alignment');
  return key;
}
