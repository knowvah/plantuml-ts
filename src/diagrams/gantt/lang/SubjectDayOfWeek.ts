import { CommandExecutionResult } from '../../../core/command/CommandExecutionResult.js';
import { Failable } from '../../../core/gantt/Failable.js';
import type { HColor } from '../../../core/style/Value.js';
import type { DayOfWeek } from '../../../core/time/DayOfWeek.js';
import type { UMatcher } from '../../../core/ubrex/UMatcher.js';
import { UBrexNamed } from '../../../core/ubrex/builder/UBrexNamed.js';
import type { UBrexPart } from '../../../core/ubrex/builder/UBrexPart.js';
import type { GanttDiagram } from '../GanttDiagram.js';
import { DayOfWeekUtils } from '../time/DayOfWeekUtils.js';
import { VerbPhraseAction } from '../ulang/VerbPhraseAction.js';
import type { CenterBorderColor } from './CenterBorderColor.js';
import { ComplementClose } from './ComplementClose.js';
import { ComplementInColors2 } from './ComplementInColors2.js';
import { ComplementOpen } from './ComplementOpen.js';
import type { Subject } from './Subject.js';
import { Verbs } from './Verbs.js';

/**
 * SubjectDayOfWeek -- `<day of week> are open|closed [for [task]]` and `... is|are colored ...`.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/SubjectDayOfWeek.java:54-108
 */
export class SubjectDayOfWeek implements Subject<GanttDiagram> {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/SubjectDayOfWeek.java:56 */
  static readonly ME: Subject<GanttDiagram> = new SubjectDayOfWeek();

  private constructor() {}

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/SubjectDayOfWeek.java:61-64 */
  toUnicodeBracketedExpressionSubject(): UBrexPart {
    return new UBrexNamed('SUBJECT', DayOfWeekUtils.getUbrex()); // :63
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/SubjectDayOfWeek.java:66-99 */
  getVerbPhrases(): VerbPhraseAction[] {
    const result: VerbPhraseAction[] = [];
    // :69-76
    result.push(
      new (class extends VerbPhraseAction {
        override execute(gantt: GanttDiagram, subject: unknown, complement: unknown): CommandExecutionResult {
          const day = subject as DayOfWeek;
          gantt.openDayOfWeek(day, complement as string);
          return CommandExecutionResult.ok();
        }
      })(Verbs.are, new ComplementOpen()),
    );

    // :78-85
    result.push(
      new (class extends VerbPhraseAction {
        override execute(gantt: GanttDiagram, subject: unknown, complement: unknown): CommandExecutionResult {
          const day = subject as DayOfWeek;
          gantt.closeDayOfWeek(day, complement as string);
          return CommandExecutionResult.ok();
        }
      })(Verbs.are, new ComplementClose()),
    );

    // :87-96
    result.push(
      new (class extends VerbPhraseAction {
        override execute(gantt: GanttDiagram, subject: unknown, complement: unknown): CommandExecutionResult {
          // `colorDay` takes the style layer's `HColor`; `getCenter()` is the wider klimt `GanttColor` (as in
          // `SubjectTaskVerbs.ts`, journal row 59).
          const color = (complement as CenterBorderColor).getCenter() as HColor;
          const day = subject as DayOfWeek;
          gantt.colorDay(day, color);

          return CommandExecutionResult.ok();
        }
      })(Verbs.isOrAre, new ComplementInColors2()),
    );

    return result;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/SubjectDayOfWeek.java:101-106 */
  getMe(_gantt: GanttDiagram, arg: UMatcher): Failable<DayOfWeek> {
    const s = arg.findFirstValueByKey('SUBJECT') as string; // grammar above always captures SUBJECT
    return Failable.ok(DayOfWeekUtils.fromString(s));
  }
}
