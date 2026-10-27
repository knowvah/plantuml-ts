import { Failable } from '../../../core/gantt/Failable.js';
import type { CaptureLookup } from '../../../core/ubrex/CaptureLookup.js';
import { UBrexConcat } from '../../../core/ubrex/builder/UBrexConcat.js';
import { UBrexLeaf } from '../../../core/ubrex/builder/UBrexLeaf.js';
import { UBrexNamed } from '../../../core/ubrex/builder/UBrexNamed.js';
import type { UBrexPart } from '../../../core/ubrex/builder/UBrexPart.js';
import { UBrexZeroOrMore } from '../../../core/ubrex/builder/UBrexZeroOrMore.js';
import type { GanttDiagram } from '../GanttDiagram.js';
import { Load } from '../ngm/Load.js';
import type { Something } from './Something.js';

/**
 * `Integer.parseInt(s)`: optional sign then digits, else `NumberFormatException`; a null argument
 * (`findFirstValueByKey` found nothing) is also a `NumberFormatException` upstream.
 */
function parseInt32(s: string | undefined): number {
  if (s === undefined || !/^[+-]?[0-9]+$/.test(s)) throw new Error('NumberFormatException');
  const n = Number.parseInt(s, 10);
  if (n > 2147483647 || n < -2147483648) throw new Error('NumberFormatException');
  return n;
}

/**
 * ComplementDuration -- "<n> <unit>[s]" elements joined by "and" or commas, summed into a `Load`.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/ComplementDuration.java:52-128
 */
export class ComplementDuration implements Something<GanttDiagram> {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/ComplementDuration.java:54-61 */
  toUnicodeBracketedExpressionComplement(): UBrexPart {
    return UBrexConcat.build(
      ComplementDuration.#oneElement('0'),
      new UBrexZeroOrMore(UBrexConcat.build(ComplementDuration.#separator(), ComplementDuration.#oneElement('1'))),
    );
  }

  /** A single "<number> <unit>[s]" element. @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/ComplementDuration.java:63-71 */
  static #oneElement(prefix: string): UBrexPart {
    return UBrexConcat.build(
      new UBrexNamed('CNUM' + prefix, new UBrexLeaf('〇+〴d')),
      UBrexLeaf.spaceOneOrMore(),
      new UBrexNamed('CUNIT' + prefix, new UBrexLeaf('【hour┇minute┇second┇day┇week┇month】')),
      new UBrexLeaf('〇?s'),
    );
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/ComplementDuration.java:73-75 */
  static #separator(): UBrexPart {
    return new UBrexLeaf('【〇+「∙,」and〇+「∙,」┇〇+「∙,」】');
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/ComplementDuration.java:77-94 */
  getMe(gantt: GanttDiagram, arg: CaptureLookup): Failable<Load> {
    const totals = [0, 0, 0, 0]; // days, hours, minutes, seconds

    // The first element is captured under CNUM0/CUNIT0, the repeated ones under CNUM1/CUNIT1.
    ComplementDuration.#accumulate(gantt, totals, arg.findFirstValueByKey('CNUM0'), arg.findFirstValueByKey('CUNIT0'));

    const cnum = arg.findValuesByKey('CNUM1');
    const cunit = arg.findValuesByKey('CUNIT1');
    for (let i = 0; i < cnum.length; i++) ComplementDuration.#accumulate(gantt, totals, cnum[i], cunit[i]);

    const duration = gantt.durationOfDaysHoursMinutesSeconds(totals[0]!, totals[1]!, totals[2]!, totals[3]!);

    return Failable.ok(Load.of(duration));
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/ComplementDuration.java:96-127 */
  static #accumulate(gantt: GanttDiagram, totals: number[], num: string | undefined, unit: string | undefined): void {
    const value = parseInt32(num);
    // `unit.charAt(0)` on null / empty is a NullPointerException / StringIndexOutOfBoundsException upstream.
    if (unit === undefined || unit.length === 0) throw new Error('NullPointerException');
    switch (unit.charAt(0)) {
      case 'H':
      case 'h':
        totals[1]! += value;
        break;
      case 'D':
      case 'd':
        totals[0]! += value;
        break;
      case 'W':
      case 'w':
        totals[0]! += value * gantt.daysInWeek();
        break;
      case 'S':
      case 's':
        totals[3]! += value;
        break;
      case 'M':
      case 'm':
        // 'm' is ambiguous between "minute" and "month": disambiguate on the
        // second letter ("mi" -> minute, otherwise month).
        if (unit.length >= 2 && (unit.charAt(1) === 'i' || unit.charAt(1) === 'I')) totals[2]! += value;
        else totals[0]! += value * gantt.daysInMonth();
        break;
      default:
        throw new Error('IllegalArgumentException: unknown time unit: ' + unit);
    }
  }
}
