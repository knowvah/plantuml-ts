/**
 * Table-driven dispatch, continued — see `skinparam-key-handlers.ts`'s own
 * doc comment for the full module map and why the table is split (`-table-
 * a.ts`/`-table-b.ts` were both already at the 500-line cap). This third
 * half holds only new entries added after that split; nothing here was
 * moved out of the first two.
 */

import type { KeyHandler } from './skinparam-key-handlers-shared.js';
import { parseFiniteNumber } from './skinparam-key-handlers-shared.js';

export const KEY_HANDLERS_C: ReadonlyArray<readonly [keys: readonly string[], handler: KeyHandler]> = [
  // T2c (ex-T2a): `SkinParam.getConditionStyle` (`skin/SkinParam.java:
  // 997-1004`) via `ConditionStyle.fromString` (`svek/ConditionStyle.java:
  // 45-64`, case-insensitive): "insidediamond"/"foo1" -> INSIDE_DIAMOND,
  // "diamond" -> EMPTY_DIAMOND, "inside" -> INSIDE_HEXAGON, else a fallback
  // loop matching the enum's own name (`EMPTY_DIAMOND`/`INSIDE_HEXAGON`/
  // `INSIDE_DIAMOND`, with or without the underscore). An
  // unrecognized/absent value falls back to INSIDE_HEXAGON (`:1001`), so an
  // unmatched token is simply left unset (acc default `undefined` already
  // reads as insideHexagon downstream).
  [
    ['conditionstyle'],
    (acc, value) => {
      const v = value.trim().toLowerCase().replace(/_/g, '');
      if (v === 'insidediamond' || v === 'foo1') acc.conditionStyle = 'insideDiamond';
      else if (v === 'diamond' || v === 'emptydiamond') acc.conditionStyle = 'emptyDiamond';
      else if (v === 'inside' || v === 'insidehexagon') acc.conditionStyle = 'insideHexagon';
    },
  ],
  // add4-T3gates: `addConvert("hyperlinkColor", PName.HyperLinkColor,
  // SName.root)` (`FromSkinparamToStyle.java:135`) -- the root `HyperLinkColor`
  // a `<style> root { HyperLinkColor }` block also writes (`style-map-element.ts`).
  [
    ['hyperlinkcolor'],
    (acc, _v, color) => {
      (acc.elements['root'] ??= {}).hyperlinkColor = color;
    },
  ],
  // add2 T3e (family F): `SkinParam#useUnderlineForHyperlink()`
  // (`skin/SkinParam.java:1056-1060`): underline stays ON unless the value
  // is the case-insensitive literal "false" -- `valueIs` lower-cases
  // neither side itself (`String#equalsIgnoreCase`), so this mirrors that
  // exactly rather than a stricter `=== 'false'`.
  [
    ['hyperlinkunderline'],
    (acc, value) => {
      acc.hyperlinkUnderline = value.toLowerCase() !== 'false';
    },
  ],
  // add2 T3e (family F): `SkinParam#getSvgLinkTarget()`
  // (`skin/SkinParam.java:1080-1082`): `getValue("svglinktarget", "_top")`,
  // a raw passthrough, no validation.
  [
    ['svglinktarget'],
    (acc, value) => {
      acc.svgLinkTarget = value;
    },
  ],
  // add2 T3e (family G): `SkinParam#getPreserveAspectRatio()`
  // (`skin/SkinParam.java:1085-1087`): `getValue("preserveaspectratio",
  // DEFAULT_PRESERVE_ASPECT_RATIO)`, a raw passthrough, no validation.
  [
    ['preserveaspectratio'],
    (acc, value) => {
      acc.preserveAspectRatio = value;
    },
  ],
  // add2 T3e (family K): `FromSkinparamToStyle.java:144`
  // (`addConFont("activity", SName.activity)` registers the flat
  // `activityFontName` key -> `PName.FontName` on `SName.activity`).
  // `activity` is already a per-element bucket SName (D3,
  // `skinparam-element-buckets.ts#ELEMENT_BUCKET_SNAMES`); diamond inherits
  // it for free (`StyleSignatureBasic.java:271-273`: the diamond's own
  // signature nests `SName.activity`), mirroring `activitydiamondfontname`
  // below for the diamond's OWN bucket.
  [
    ['activityfontname'],
    (acc, value) => {
      (acc.elements['activity'] ??= {}).fontFamily = value;
    },
  ],
  // add3-T3f (PADDING): `SkinParam#getPadding()` (`skin/SkinParam.java
  // :1147-1150`): `getAsDouble("padding")` -- `isIntOrDecimal` guard, a
  // non-numeric value is left unset rather than poisoning the tier (same
  // convention as `defaultfontsize` above).
  [
    ['padding'],
    (acc, value) => {
      acc.padding = parseFiniteNumber(value);
    },
  ],
  // add4-T1b: `SkinParam#swimlaneWidth()` (`skin/SkinParam.java:1121-1130`)
  // -- `"same".equalsIgnoreCase` -> `SWIMLANE_WIDTH_SAME` (-1,
  // `style/ISkinParam.java:71`), `isDigits` (`\d+`, `:130-136`) ->
  // `Integer.parseInt`, else `0`. `getValue` reads the value already
  // trimmed (`setParam`'s `StringUtils.trin`, `:229`).
  [
    ['swimlanewidth'],
    (acc, value) => {
      acc.swimlaneWidth = parseSwimlaneWidth(value.trim());
    },
  ],
  // add4-T2b: `FromSkinparamToStyle.java:131-133` -- `PartitionBorderColor`
  // -> `LineColor`, `PartitionBackgroundColor` -> `BackGroundColor`,
  // `addConFont("Partition", ...)` -> `FontColor`/`FontSize`, all on
  // `SName.composite`.
  [
    ['partitionbordercolor'],
    (acc, _v, color) => {
      acc.partitionBorder = color;
    },
  ],
  [
    ['partitionbackgroundcolor'],
    (acc, _v, color) => {
      acc.partitionBackground = color;
    },
  ],
  [
    ['partitionfontcolor'],
    (acc, _v, color) => {
      acc.partitionFontColor = color;
    },
  ],
  [
    ['partitionfontsize'],
    (acc, value) => {
      const v = parseFiniteNumber(value);
      if (v !== undefined) acc.partitionFontSize = v;
    },
  ],
];

/** `ISkinParam.SWIMLANE_WIDTH_SAME` (`style/ISkinParam.java:71`). */
const SWIMLANE_WIDTH_SAME = -1;

/** `SkinParam.java:130`'s `DIGITS` pattern, matched whole (`matches()`). */
const DIGITS = /^\d+$/;

/** @see net/sourceforge/plantuml/skin/SkinParam.java:1121-1130 */
function parseSwimlaneWidth(value: string): number {
  if (value.toLowerCase() === 'same') return SWIMLANE_WIDTH_SAME;
  if (DIGITS.test(value)) return Number.parseInt(value, 10);
  return 0;
}
