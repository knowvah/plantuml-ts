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

/**
 * Resolve a PlantUML color value to a plain CSS color.
 *
 * PlantUML supports gradient specs in the form "startColor-endColor"
 * (e.g. "#AAAAAA-white" or "#AAAAAA-red").  SVG does not understand this
 * syntax, so we extract the end color and use it as a solid fallback.
 * The end color is typically the more visually prominent tone.
 */
export function resolveColor(value: string): string {
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
  key = key.replace(
    /(?:activity|class|component|object|sequence|state|usecase)arrow/g,
    'arrow',
  );
  // Step 4: normalise "align" suffix to "alignment"
  key = key.replace(/align$/, 'alignment');
  return key;
}
