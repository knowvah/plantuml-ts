/**
 * Table-driven dispatch, continued — see `skinparam-key-handlers.ts`'s own
 * doc comment for the full module map and why the table is split (`-table-
 * a.ts`/`-table-b.ts` were both already at the 500-line cap). This third
 * half holds only new entries added after that split; nothing here was
 * moved out of the first two.
 */

import type { KeyHandler } from './skinparam-key-handlers-shared.js';

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
];
