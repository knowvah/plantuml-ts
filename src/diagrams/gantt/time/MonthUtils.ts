/**
 * Month name matching for gantt dates (regex string, ubrex part, lookup).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/time/MonthUtils.java
 */
import { Month } from '../../../core/time/Month.js';
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
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/time/MonthUtils.java:80-81
 */
function firstThree(value: string): string {
  if (value.length < 3) throw new Error('begin 0, end 3, length ' + String(value.length));
  return value.substring(0, 3);
}

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/time/MonthUtils.java:47-57 */
export function getRegexString(): string {
  let sb = '';
  for (const month of Month.values()) {
    if (sb.length > 0) sb += '|';

    sb += month.name().substring(0, 3) + '[a-z]*';
  }
  return sb;
}

/**
 * Declared `UnicodeBracketedExpression` upstream; the value is a `UBrexOr`
 * (a `UBrexPart`) -- `TimeResolution.java:51` casts it.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/time/MonthUtils.java:59-76
 */
export function getUbrex(): UBrexPart {
  const alternatives: UBrexPart[] = [];
  for (const month of Month.values()) {
    const prefix = month.name().substring(0, 3);
    let sb = '';
    for (const c of prefix) {
      sb += '「';
      sb += c.toUpperCase();
      sb += c.toLowerCase();
      sb += '」';
    }
    sb += ' 〇*〴le';
    alternatives.push(new UBrexLeaf(sb));
  }
  return new UBrexOr(...alternatives);
}

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/time/MonthUtils.java:78-85 */
export function fromString(value: string): Month {
  const key = firstThree(goUpperCase(value));
  for (const m of Month.values()) if (m.name().startsWith(key)) return m;

  throw new Error('IllegalArgumentException');
}

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/time/MonthUtils.java:46 */
export const MonthUtils = { getRegexString, getUbrex, fromString } as const;
