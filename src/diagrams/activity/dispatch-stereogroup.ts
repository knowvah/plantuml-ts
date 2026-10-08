/**
 * dispatch-stereogroup -- the single `stereotype` an activity keeps from its
 * trailing stereogroup (`<<a>> <<b>>`), split out of `dispatch-support.ts`
 * (500-line cap).
 *
 * `Stereogroup#getLabels` (`stereo/Stereogroup.java:134-144`) is every
 * `<<([^<>]+)>>` match, trimmed; `getBoxStyle` (`:100-107`) is the FIRST
 * label `BoxStyle.fromString` maps to a non-PLAIN style. The AST keeps one
 * field, so it carries that label when there is one, else the first label
 * (the pre-existing single-stereotype behaviour), lowercased.
 */
import { boxStyleName } from './tiles/gtile-action.js';

/** `Stereogroup.java:70`'s `pattern`. */
const STEREO_LABEL = /<<([^<>]+)>>/g;

/** See module doc. `undefined` when there is no stereogroup. */
export function stereogroupStereotype(group: string | undefined): string | undefined {
  if (group === undefined) return undefined;
  const labels = [...group.matchAll(STEREO_LABEL)].map((m) => m[1]!.trim().toLowerCase());
  return labels.find((l) => boxStyleName(l) !== undefined) ?? labels[0];
}

/** A bare `#color` label, the slice of `Stereogroup#getInnerColors`
 *  (`Stereogroup.java:184-185`, `new Colors(label, set, ColorType.BACK)`)
 *  this port reads. `##`/`###` (line/text colour) and `name:value;` style
 *  labels (`:150-190`) are not ported. */
const BACK_COLOR_LABEL = /^#\w+$/;

/** The BACK colour of the stereogroup's `<<#color>>` labels -- the LAST one
 *  wins, `Colors#mergeWith`'s `putAll` (`klimt/color/Colors.java:80-90`). */
export function stereogroupBackColor(group: string | undefined): string | undefined {
  if (group === undefined) return undefined;
  const colors = [...group.matchAll(STEREO_LABEL)].map((m) => m[1]!.trim()).filter((l) => BACK_COLOR_LABEL.test(l));
  return colors.at(-1);
}
