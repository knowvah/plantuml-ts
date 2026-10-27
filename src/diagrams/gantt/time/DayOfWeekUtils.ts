/**
 * Day-of-week name matching for gantt (regex string, ubrex part, lookup).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/time/DayOfWeekUtils.java
 */
import { DayOfWeek } from '../../../core/time/DayOfWeek.js';
import { UBrexLeaf } from '../../../core/ubrex/builder/UBrexLeaf.js';
import { UBrexOr } from '../../../core/ubrex/builder/UBrexOr.js';
import type { UBrexPart } from '../../../core/ubrex/builder/UBrexPart.js';

/**
 * `StringUtils.goUpperCase` -- `s.toUpperCase(Locale.ENGLISH)`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/StringUtils.java:55-57
 */
function goUpperCase(s: string): string {
  return s.toUpperCase();
}

/**
 * `String#substring(0, 3)`, which throws on a shorter string (JDK
 * StringIndexOutOfBoundsException), unlike JS `substring`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/time/DayOfWeekUtils.java:79
 */
function firstThree(value: string): string {
  if (value.length < 3) throw new Error('begin 0, end 3, length ' + String(value.length));
  return value.substring(0, 3);
}

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/time/DayOfWeekUtils.java:47-57 */
export function getRegexString(): string {
  let sb = '';
  for (const day of DayOfWeek.values()) {
    if (sb.length > 0) sb += '|';

    sb += day.name().substring(0, 3) + '[a-z]*';
  }
  return sb;
}

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/time/DayOfWeekUtils.java:59-76 */
export function getUbrex(): UBrexPart {
  const alternatives: UBrexPart[] = [];
  for (const day of DayOfWeek.values()) {
    const prefix = day.name().substring(0, 3);
    let sb = '';
    for (const c of prefix) {
      sb += '「';
      sb += c.toUpperCase();
      sb += c.toLowerCase();
      sb += '」';
    }
    sb += '〇*〴le';
    alternatives.push(new UBrexLeaf(sb));
  }
  return new UBrexOr(...alternatives);
}

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/time/DayOfWeekUtils.java:78-86 */
export function fromString(value: string): DayOfWeek {
  const key = firstThree(goUpperCase(value));
  for (const day of DayOfWeek.values()) if (day.name().startsWith(key)) return day;

  throw new Error('IllegalArgumentException');
}

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/time/DayOfWeekUtils.java:44 */
export const DayOfWeekUtils = { getRegexString, getUbrex, fromString } as const;
