/**
 * gtc T3: `skinparam arrow<<tag>> { Color X;line.Bold() }` (and the flat `arrowColor<<tag>>`; the preprocessor
 * normalizes both to `arrowcolor<<tag>>`) -- the stereotype-signed LineColor / LineThickness of a description link.
 *
 * `FromSkinparamToStyle`'s ctor strips `<<tag>>` off the key (`:292-302`); `convertNow` (`:317-352`) takes the FIRST
 * `;` token as the plain value (a leading `;` becomes a blank one, which is skipped) -> `LineColor`, and hands every
 * later token to `readValue` (`:357-376`), where a token containing `bold` is `LineThickness 2`; `addStyle`
 * (`:396-410`) re-signs each with the stereotype at +1000 priority. `text:`, `line.dotted` and `line.dashed` tokens
 * (FontColor / LineStyle) have no field in the description tag cascade yet and are ignored.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/FromSkinparamToStyle.java:292-302,317-376,396-410
 */
import type { SkinparamAccumulator } from './skinparam-accumulator.js';
import { resolveColorToSvgHex } from './klimt/color/HColorSet.js';

const ARROW_COLOR_STEREO_RE = new RegExp('^arrowcolor<<(.+)>>$');
/** `FromSkinparamToStyle.java:374`: `read.toLowerCase().contains("bold")` -> `LineThickness 2`. */
const BOLD_LINE_THICKNESS = 2;

/** Whether `key` was an `arrowcolor<<tag>>` key (consumed). */
export function applyArrowColorByStereo(acc: SkinparamAccumulator, key: string, value: string): boolean {
  const m = ARROW_COLOR_STEREO_RE.exec(key);
  if (m === null) return false;
  const [first = '', ...rest] = (value.startsWith(';') ? ` ${value}` : value).split(';');
  const entry: { color?: string; thickness?: number } = {};
  if (first.trim() !== '') entry.color = resolveColorToSvgHex(first.trim());
  if (rest.some((token) => token.toLowerCase().includes('bold'))) entry.thickness = BOLD_LINE_THICKNESS;
  if (Object.keys(entry).length > 0) {
    acc.descriptionArrowTagCascade = { ...acc.descriptionArrowTagCascade, [m[1]!.trim()]: entry };
  }
  return true;
}
