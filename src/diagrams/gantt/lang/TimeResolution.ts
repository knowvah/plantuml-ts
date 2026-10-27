/**
 * Ubrex date-shape builders (day-month-year, year-month-day, month-day-year).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/TimeResolution.java
 */
import { UBrexConcat } from '../../../core/ubrex/builder/UBrexConcat.js';
import { UBrexLeaf } from '../../../core/ubrex/builder/UBrexLeaf.js';
import { UBrexNamed } from '../../../core/ubrex/builder/UBrexNamed.js';
import type { UBrexPart } from '../../../core/ubrex/builder/UBrexPart.js';
import { UBrexUpto } from '../../../core/ubrex/builder/UBrexUpto.js';
import { getUbrex as monthUbrex } from '../time/MonthUtils.js';

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/TimeResolution.java:47-58 */
export function toUbrexA_DD_MONTH_YYYY(year: string, month: string, day: string): UBrexPart {
  const digits1to2 = new UBrexLeaf('〇{1-2}〴d');
  const digits1to4 = new UBrexLeaf('〇{1-4}〴d');
  return UBrexConcat.build(
    new UBrexNamed(day, digits1to2),
    new UBrexUpto(new UBrexLeaf('〴D'), new UBrexNamed(month, monthUbrex())),
    new UBrexLeaf('〇+〴D'),
    new UBrexNamed(year, digits1to4),
  );
}

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/TimeResolution.java:60-72 */
export function toUbrexB_YYYY_MM_DD(year: string, month: string, day: string): UBrexPart {
  const digits1to2 = new UBrexLeaf('〇{1-2}〴d');
  const digits1to4 = new UBrexLeaf('〇{1-4}〴d');
  const nonDigit = new UBrexLeaf('〇+〴D');
  return UBrexConcat.build(
    new UBrexNamed(year, digits1to4),
    nonDigit,
    new UBrexNamed(month, digits1to2),
    nonDigit,
    new UBrexNamed(day, digits1to2),
  );
}

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/TimeResolution.java:74-87 */
export function toUbrexC_MONTH_DD_YYYY(year: string, month: string, day: string): UBrexPart {
  const digits1to2 = new UBrexLeaf('〇{1-2}〴d');
  const digits1to4 = new UBrexLeaf('〇{1-4}〴d');
  const nonDigit = new UBrexLeaf('〇+〴D');
  return UBrexConcat.build(
    new UBrexNamed(month, monthUbrex()),
    nonDigit,
    new UBrexNamed(day, digits1to2),
    nonDigit,
    new UBrexNamed(year, digits1to4),
  );
}

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/TimeResolution.java:44 */
export const TimeResolution = { toUbrexA_DD_MONTH_YYYY, toUbrexB_YYYY_MM_DD, toUbrexC_MONTH_DD_YYYY } as const;
