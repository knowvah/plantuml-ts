import { CommandExecutionResult } from '../../../core/command/CommandExecutionResult.js';
import { Failable } from '../../../core/gantt/Failable.js';
import type { HColor } from '../../../core/style/Value.js';
import type { UMatcher } from '../../../core/ubrex/UMatcher.js';
import { UBrexConcat } from '../../../core/ubrex/builder/UBrexConcat.js';
import { UBrexLeaf } from '../../../core/ubrex/builder/UBrexLeaf.js';
import { UBrexNamed } from '../../../core/ubrex/builder/UBrexNamed.js';
import { UBrexOr } from '../../../core/ubrex/builder/UBrexOr.js';
import type { UBrexPart } from '../../../core/ubrex/builder/UBrexPart.js';
import { DaysAsDates } from '../DaysAsDates.js';
import type { GanttDiagram } from '../GanttDiagram.js';
import { TimePoint } from '../time/TimePoint.js';
import { VerbPhraseAction } from '../ulang/VerbPhraseAction.js';
import type { CenterBorderColor } from './CenterBorderColor.js';
import { ComplementClose } from './ComplementClose.js';
import { ComplementInColors2 } from './ComplementInColors2.js';
import { ComplementNamed } from './ComplementNamed.js';
import { ComplementOpen } from './ComplementOpen.js';
import type { Subject } from './Subject.js';
import { toUbrexB_YYYY_MM_DD } from './TimeResolution.js';
import { Verbs } from './Verbs.js';
import { Words } from './Words.js';

/**
 * `Integer.parseInt(s)`: optional sign then digits, else `NumberFormatException`; a null argument is also a
 * `NumberFormatException` upstream (same helper as `ComplementDate.ts`).
 */
function parseInt32(s: string | undefined): number {
  if (s === undefined || !/^[+-]?[0-9]+$/.test(s)) throw new Error('NumberFormatException');
  const n = Number.parseInt(s, 10);
  if (n > 2147483647 || n < -2147483648) throw new Error('NumberFormatException');
  return n;
}

/**
 * SubjectDaysAsDates -- a range or run of days (`2020-07-01 to 2020-07-05`, `d+1 to d+3`, `2020-07-01 and 3 days`,
 * `then 2 days`) and the verb phrases it accepts.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/SubjectDaysAsDates.java:58-202
 */
export class SubjectDaysAsDates implements Subject<GanttDiagram> {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/SubjectDaysAsDates.java:60 */
  static readonly ME: Subject<GanttDiagram> = new SubjectDaysAsDates();

  private constructor() {}

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/SubjectDaysAsDates.java:65-68 */
  toUnicodeBracketedExpressionSubject(): UBrexPart {
    return new UBrexOr(this.#toUBrexB(), this.#toUBrexE(), this.#andUBrex(), this.#thenUBrex());
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/SubjectDaysAsDates.java:70-77 */
  #toUBrexB(): UBrexPart {
    return UBrexConcat.build(
      toUbrexB_YYYY_MM_DD('BYEAR1', 'BMONTH1', 'BDAY1'),
      Words.uexactly(Words.TO), // :73
      UBrexLeaf.spaceOneOrMore(),
      toUbrexB_YYYY_MM_DD('BYEAR2', 'BMONTH2', 'BDAY2'),
    );
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/SubjectDaysAsDates.java:79-87 */
  #toUBrexE(): UBrexPart {
    return UBrexConcat.build(
      new UBrexLeaf('「dD」+'), // :81
      new UBrexNamed('ECOUNT1', new UBrexLeaf('〇+〴d')), // :82
      Words.uexactly(Words.TO), // :82
      UBrexLeaf.spaceOneOrMore(),
      new UBrexLeaf('「dD」+'), // :84
      new UBrexNamed('ECOUNT2', new UBrexLeaf('〇+〴d')), // :85
    );
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/SubjectDaysAsDates.java:89-98 */
  #andUBrex(): UBrexPart {
    return UBrexConcat.build(
      toUbrexB_YYYY_MM_DD('BYEAR3', 'BMONTH3', 'BDAY3'),
      Words.uexactly(Words.AND),
      UBrexLeaf.spaceOneOrMore(),
      new UBrexNamed('COUNT_AND', new UBrexLeaf('〇+〴d')), // :94
      UBrexLeaf.spaceOneOrMore(),
      new UBrexLeaf('day〇?s'), // :96
    );
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/SubjectDaysAsDates.java:100-109 */
  #thenUBrex(): UBrexPart {
    return UBrexConcat.build(
      new UBrexLeaf('then'), // :102
      UBrexLeaf.spaceOneOrMore(),
      new UBrexNamed('COUNT_THEN', new UBrexLeaf('〇+〴d')), // :104
      UBrexLeaf.spaceOneOrMore(),
      new UBrexLeaf('day〇?s'), // :106
    );
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/SubjectDaysAsDates.java:110-127 */
  getMe(gantt: GanttDiagram, arg: UMatcher): Failable<DaysAsDates> {
    const countAnd = arg.findFirstValueByKey('COUNT_AND');
    if (countAnd !== undefined) {
      const date3 = this.#getDate(gantt, arg, '3');
      const nb = parseInt32(countAnd);
      return Failable.ok(new DaysAsDates(gantt, date3.toDay(), nb));
    }
    const countThen = arg.findFirstValueByKey('COUNT_THEN');
    if (countThen !== undefined) {
      const date3 = gantt.getThenDate();
      const nb = parseInt32(countThen);
      return Failable.ok(new DaysAsDates(gantt, date3.toDay(), nb));
    }
    const date1 = this.#getDate(gantt, arg, '1');
    const date2 = this.#getDate(gantt, arg, '2');
    return Failable.ok(new DaysAsDates(date1.toDay(), date2.toDay()));
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/SubjectDaysAsDates.java:129-140 */
  #getDate(gantt: GanttDiagram, arg: UMatcher, suffix: string): TimePoint {
    if (arg.findFirstValueByKey('BDAY' + suffix) !== undefined) {
      const day = parseInt32(arg.findFirstValueByKey('BDAY' + suffix));
      const month = parseInt32(arg.findFirstValueByKey('BMONTH' + suffix));
      const year = parseInt32(arg.findFirstValueByKey('BYEAR' + suffix));
      return TimePoint.ofStartOfDay(year, month, day);
    }
    if (arg.findFirstValueByKey('ECOUNT' + suffix) !== undefined) {
      const day = parseInt32(arg.findFirstValueByKey('ECOUNT' + suffix));
      return gantt.getMinTimePoint().addDays(day);
    }
    throw new Error('IllegalStateException');
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/SubjectDaysAsDates.java:143-199 (the commented-out phrase at :189-196 is not ported) */
  getVerbPhrases(): VerbPhraseAction[] {
    const result: VerbPhraseAction[] = [];
    // :146-154
    result.push(
      new (class extends VerbPhraseAction {
        override execute(gantt: GanttDiagram, subject: unknown, complement: unknown): CommandExecutionResult {
          for (const d of subject as DaysAsDates) gantt.closeDayAsDate(d, complement as string);

          return CommandExecutionResult.ok();
        }
      })(Verbs.isOrAre, new ComplementClose()),
    );

    // :156-164
    result.push(
      new (class extends VerbPhraseAction {
        override execute(gantt: GanttDiagram, subject: unknown, complement: unknown): CommandExecutionResult {
          for (const d of subject as DaysAsDates) gantt.openDayAsDate(d, complement as string);

          return CommandExecutionResult.ok();
        }
      })(Verbs.isOrAre, new ComplementOpen()),
    );

    // :166-175
    result.push(
      new (class extends VerbPhraseAction {
        override execute(gantt: GanttDiagram, subject: unknown, complement: unknown): CommandExecutionResult {
          // `colorDay` takes the style layer's `HColor`; `getCenter()` is the wider klimt `GanttColor` (as in
          // `SubjectTaskVerbs.ts`, journal row 59).
          const color = (complement as CenterBorderColor).getCenter() as HColor;
          for (const d of subject as DaysAsDates) gantt.colorDay(d, color);

          return CommandExecutionResult.ok();
        }
      })(Verbs.isOrAre, new ComplementInColors2()),
    );

    // :177-187
    result.push(
      new (class extends VerbPhraseAction {
        override execute(gantt: GanttDiagram, subject: unknown, complement: unknown): CommandExecutionResult {
          const name = complement as string;
          const days = subject as DaysAsDates;
          for (const d of days) gantt.nameDay(d, name);

          return CommandExecutionResult.ok();
        }
      })(Verbs.isOrAreNamed, new ComplementNamed()),
    );

    return result;
  }
}
