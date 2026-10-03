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
];
