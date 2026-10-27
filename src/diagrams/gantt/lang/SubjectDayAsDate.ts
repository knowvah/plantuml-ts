import { CommandExecutionResult } from '../../../core/command/CommandExecutionResult.js';
import { Failable } from '../../../core/gantt/Failable.js';
import type { HColor } from '../../../core/style/Value.js';
import { LocalDate } from '../../../core/time/LocalDate.js';
import type { UMatcher } from '../../../core/ubrex/UMatcher.js';
import { UBrexConcat } from '../../../core/ubrex/builder/UBrexConcat.js';
import { UBrexLeaf } from '../../../core/ubrex/builder/UBrexLeaf.js';
import { UBrexNamed } from '../../../core/ubrex/builder/UBrexNamed.js';
import { UBrexOr } from '../../../core/ubrex/builder/UBrexOr.js';
import type { UBrexPart } from '../../../core/ubrex/builder/UBrexPart.js';
import type { GanttDiagram } from '../GanttDiagram.js';
import { VerbPhraseAction } from '../ulang/VerbPhraseAction.js';
import type { CenterBorderColor } from './CenterBorderColor.js';
import { ComplementClose } from './ComplementClose.js';
import { ComplementInColors2 } from './ComplementInColors2.js';
import { ComplementOpen } from './ComplementOpen.js';
import type { Subject } from './Subject.js';
import { toUbrexB_YYYY_MM_DD } from './TimeResolution.js';
import { Verbs } from './Verbs.js';

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
 * SubjectDayAsDate -- a single day (`2020-07-14`, `d+3`, `t-1`, `e+0`) and the verb phrases it accepts.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/SubjectDayAsDate.java:56-145
 */
export class SubjectDayAsDate implements Subject<GanttDiagram> {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/SubjectDayAsDate.java:58 */
  static readonly ME: Subject<GanttDiagram> = new SubjectDayAsDate();

  private constructor() {}

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/SubjectDayAsDate.java:63-92 */
  getVerbPhrases(): VerbPhraseAction[] {
    const result: VerbPhraseAction[] = [];
    // :66-72
    result.push(
      new (class extends VerbPhraseAction {
        override execute(gantt: GanttDiagram, subject: unknown, complement: unknown): CommandExecutionResult {
          gantt.openDayAsDate(subject as LocalDate, complement as string);
          return CommandExecutionResult.ok();
        }
      })(Verbs.isOrAre, new ComplementOpen()),
    );

    // :74-80
    result.push(
      new (class extends VerbPhraseAction {
        override execute(gantt: GanttDiagram, subject: unknown, complement: unknown): CommandExecutionResult {
          gantt.closeDayAsDate(subject as LocalDate, complement as string);
          return CommandExecutionResult.ok();
        }
      })(Verbs.isOrAre, new ComplementClose()),
    );

    // :82-89
    result.push(
      new (class extends VerbPhraseAction {
        override execute(gantt: GanttDiagram, subject: unknown, complement: unknown): CommandExecutionResult {
          // `colorDay` takes the style layer's `HColor`; `getCenter()` is the wider klimt `GanttColor` (as in
          // `SubjectTaskVerbs.ts`, journal row 59).
          const color = (complement as CenterBorderColor).getCenter() as HColor;
          gantt.colorDay(subject as LocalDate, color);
          return CommandExecutionResult.ok();
        }
      })(Verbs.isOrAre, new ComplementInColors2()),
    );

    return result;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/SubjectDayAsDate.java:94-104 */
  getMe(gantt: GanttDiagram, arg: UMatcher): Failable<LocalDate> {
    if (arg.findFirstValueByKey('BDAY') !== undefined) return Failable.ok(this.#resultB(arg));

    if (arg.findFirstValueByKey('ECOUNT') !== undefined) return Failable.ok(this.#resultE(gantt, arg));

    throw new Error('IllegalStateException');
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/SubjectDayAsDate.java:106-111 */
  #resultB(arg: UMatcher): LocalDate {
    const day = parseInt32(arg.findFirstValueByKey('BDAY'));
    const month = parseInt32(arg.findFirstValueByKey('BMONTH'));
    const year = parseInt32(arg.findFirstValueByKey('BYEAR'));
    return LocalDate.of(year, month, day);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/SubjectDayAsDate.java:113-126 */
  #resultE(gantt: GanttDiagram, arg: UMatcher): LocalDate {
    const type = (arg.findFirstValueByKey('ETYPE') as string).toUpperCase();
    const operation = arg.findFirstValueByKey('EOPERATION');
    let day = parseInt32(arg.findFirstValueByKey('ECOUNT'));
    if (operation === '-') day = -day;
    if (type === 'D') return gantt.getMinDay().plusDays(day);
    if (type === 'T') return gantt.getToday().plusDays(day);
    if (type === 'E') return gantt.getMaxDay().plusDays(day);
    throw new Error('IllegalStateException');
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/SubjectDayAsDate.java:128-130 */
  #toUbrexB(): UBrexPart {
    return toUbrexB_YYYY_MM_DD('BYEAR', 'BMONTH', 'BDAY');
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/SubjectDayAsDate.java:132-138 */
  #toUbrexE(): UBrexPart {
    return UBrexConcat.build(
      new UBrexNamed('ETYPE', new UBrexLeaf('「dDtTeE」')), // :134
      new UBrexNamed('EOPERATION', new UBrexLeaf('「-+」')), // :135
      new UBrexNamed('ECOUNT', new UBrexLeaf('〇+〴d')), // :136
    );
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/SubjectDayAsDate.java:140-143 */
  toUnicodeBracketedExpressionSubject(): UBrexPart {
    return new UBrexOr(this.#toUbrexB(), this.#toUbrexE());
  }
}
