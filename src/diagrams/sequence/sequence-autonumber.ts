/**
 * Autonumber helpers: message number formatting and dotted `autonumber
 * START` values. Split from `sequence-parse-helpers.ts` (500-line cap, sdd2
 * close-b7); re-exported there so callers need no import changes.
 *
 * @see net/sourceforge/plantuml/sequencediagram/AutoNumber.java
 * @see net/sourceforge/plantuml/sequencediagram/DottedNumber.java
 */
import type { MessageEvent } from './ast.js';
import type { ParseState } from './sequence-parse-helpers.js';

/**
 * `autonumber` with no quoted FORMAT formats with `<b>0</b>`
 * (`CommandAutonumber.java:119`): the number is creole bold, which is why the
 * jar draws it at `font-weight="700"`. `autonumber resume` keeps whatever
 * format is current (`AutoNumber.java:59-72`), and this port's `format`
 * field IS that state, so an absent field means this default.
 */
export const DEFAULT_AUTONUMBER_FORMAT = '<b>0</b>';

/**
 * `AutoNumber#getNextMessageNumber` (`AutoNumber.java:82-89`): format the
 * CURRENT value, then advance by `step` (`DottedNumber#incrementMinor`,
 * `DottedNumber.java:75-79` — the last segment only). The formatted string is
 * the `MessageNumber` `getLabelNumbered` puts first in the display
 * (`AbstractMessage.java:199-207`).
 */
export function applyAutonumber(state: ParseState, msg: MessageEvent): MessageEvent {
  const auto = state.ast.autonumber;
  if (!auto.enabled) return msg;
  const num = auto.current;
  auto.current += auto.step;
  return {
    ...msg,
    sequenceNumber: num,
    sequenceLabel: formatDottedNumber(auto.prefix, num, auto.format ?? DEFAULT_AUTONUMBER_FORMAT),
  };
}

/**
 * `DottedNumber#format(DecimalFormat)`: a single number with no separator
 * goes through the format; a dotted one IGNORES it and is always bold.
 *
 * ```java
 * if (nums.size() == 1 && separators.size() == 0)
 *     return format.format(nums.get(0));
 * return "<b>" + toString() + "</b>";
 * ```
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/DottedNumber.java:106-111
 */
function formatDottedNumber(prefix: string, num: number, format: string): string {
  if (prefix === '') return formatAutonumber(format, num);
  return `<b>${prefix}${String(num)}</b>`;
}

/**
 * `java.text.DecimalFormat` subset: a run of one-or-more `0` characters is
 * the zero-pad placeholder (`new DecimalFormat(df).format(n)`,
 * `CommandAutonumber.java:119-123`); every other character — including
 * creole markup like `<b>`/`<font ...>` — is copied through verbatim. Other
 * `DecimalFormat` pattern characters (`#`, `,`, `.`) are not ported: none
 * appear in the corpus bucket's format strings.
 */
export function formatAutonumber(format: string, num: number): string {
  const run = /0+/.exec(format);
  if (run === null) return format;
  const padded = String(num).padStart(run[0].length, '0');
  return format.slice(0, run.index) + padded + format.slice(run.index + run[0].length);
}

// ---------------------------------------------------------------------------
// autonumber START — dotted numbers (DottedNumber.java, T13)
// ---------------------------------------------------------------------------

/** A parsed `autonumber START` value: everything before the last `\d+` run
 *  (verbatim, including separators like `.`/`-`/`:`) as `prefix`, and the
 *  last run itself as `value` — the only segment `incrementMinor` ever
 *  changes (`DottedNumber.java:75-79`). A plain `"5"` yields `prefix: ''`. */
export interface DottedStart {
  readonly prefix: string;
  readonly value: number;
}

/** @see sequencediagram/DottedNumber.java:53-58 (`create`) */
export function parseDottedStart(raw: string): DottedStart {
  const lastRun = /(\d+)(?!.*\d)/.exec(raw);
  if (lastRun === null || lastRun.index === undefined) return { prefix: '', value: 1 };
  return { prefix: raw.slice(0, lastRun.index), value: Number(lastRun[1]) };
}
