import { Failable } from '../../../core/gantt/Failable.js';
import type { LocalDate } from '../../../core/time/LocalDate.js';
import type { CaptureLookup } from '../../../core/ubrex/CaptureLookup.js';
import { UBrexConcat } from '../../../core/ubrex/builder/UBrexConcat.js';
import { UBrexLeaf } from '../../../core/ubrex/builder/UBrexLeaf.js';
import { UBrexNamed } from '../../../core/ubrex/builder/UBrexNamed.js';
import { UBrexOr } from '../../../core/ubrex/builder/UBrexOr.js';
import type { UBrexPart } from '../../../core/ubrex/builder/UBrexPart.js';
import { DaysAsDates } from '../DaysAsDates.js';
import type { GanttDiagram } from '../GanttDiagram.js';
import { DayPattern } from './DayPattern.js';
import type { Something } from './Something.js';
import { Words } from './Words.js';

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
 * ComplementIntervals -- `<day> to [the] <day>` or `d<n> to [the] d<m>`, resolved to a `DaysAsDates`.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/ComplementIntervals.java:52-105
 */
export class ComplementIntervals implements Something<GanttDiagram> {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/ComplementIntervals.java:54-57 */
  toUnicodeBracketedExpressionComplement(): UBrexPart {
    return new UBrexOr(this.#toRegexB(), this.#toRegexE());
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/ComplementIntervals.java:59-69 */
  #toRegexB(): UBrexPart {
    const dayPattern1 = new DayPattern('1'); // :60
    const dayPattern2 = new DayPattern('2'); // :61
    return UBrexConcat.build(
      dayPattern1.toUbrex(),
      Words.uexactly(Words.TO), // :64
      Words.uzeroOrMore(Words.THE), // :65
      UBrexLeaf.spaceOneOrMore(),
      dayPattern2.toUbrex(),
    );
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/ComplementIntervals.java:71-80 */
  #toRegexE(): UBrexPart {
    return UBrexConcat.build(
      new UBrexLeaf('「dD」+'), // :73
      new UBrexNamed('ECOUNT1', new UBrexLeaf('〇+〴d')), // :74
      Words.uexactly(Words.TO), // :75
      Words.uzeroOrMore(Words.THE), // :76
      UBrexLeaf.spaceOneOrMore(),
      new UBrexLeaf('「dD」+'), // :78
      new UBrexNamed('ECOUNT2', new UBrexLeaf('〇+〴d')), // :79
    );
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/ComplementIntervals.java:82-94 */
  getMe(gantt: GanttDiagram, arg: CaptureLookup): Failable<DaysAsDates> {
    const d1 = new DayPattern('1').getDay(arg);
    if (d1 !== undefined) {
      // Java passes the possibly-null `d2` straight to the constructor (:86-87); the grammar always captures both.
      const d2 = new DayPattern('2').getDay(arg) as LocalDate;
      return Failable.ok(new DaysAsDates(d1, d2));
    }

    if (arg.findFirstValueByKey('ECOUNT1') !== undefined) return Failable.ok(this.#resultE(gantt, arg));

    throw new Error('IllegalStateException');
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/ComplementIntervals.java:96-104 */
  #resultE(gantt: GanttDiagram, arg: CaptureLookup): DaysAsDates {
    const day1 = parseInt32(arg.findFirstValueByKey('ECOUNT1'));
    const date1 = gantt.getMinTimePoint().addDays(day1);

    const day2 = parseInt32(arg.findFirstValueByKey('ECOUNT2'));
    const date2 = gantt.getMinTimePoint().addDays(day2);

    return new DaysAsDates(date1.toDay(), date2.toDay());
  }
}
