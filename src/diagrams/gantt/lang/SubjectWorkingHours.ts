import type { CommandExecutionResult } from '../../../core/command/CommandExecutionResult.js';
import { Failable } from '../../../core/gantt/Failable.js';
import type { UMatcher } from '../../../core/ubrex/UMatcher.js';
import { UBrexConcat } from '../../../core/ubrex/builder/UBrexConcat.js';
import { UBrexLeaf } from '../../../core/ubrex/builder/UBrexLeaf.js';
import { UBrexNamed } from '../../../core/ubrex/builder/UBrexNamed.js';
import type { UBrexPart } from '../../../core/ubrex/builder/UBrexPart.js';
import { TimeRange } from '../core/TimeRange.js';
import type { GanttDiagram } from '../GanttDiagram.js';
import { VerbPhraseAction } from '../ulang/VerbPhraseAction.js';
import { ComplementWorkingHours } from './ComplementWorkingHours.js';
import type { Subject } from './Subject.js';
import { Verbs } from './Verbs.js';

/**
 * SubjectWorkingHours -- `from hh:mm to hh:mm are ...` (the working-hours subject).
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/SubjectWorkingHours.java:54-93
 */
export class SubjectWorkingHours implements Subject<GanttDiagram> {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/SubjectWorkingHours.java:56 */
  static readonly ME: Subject<GanttDiagram> = new SubjectWorkingHours();

  private constructor() {}

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/SubjectWorkingHours.java:61-66 */
  getMe(_gantt: GanttDiagram, arg: UMatcher): Failable<TimeRange> {
    const start = arg.findFirstValueByKey('START');
    const end = arg.findFirstValueByKey('END');
    return Failable.ok(new TimeRange(start ?? null, end ?? null));
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/SubjectWorkingHours.java:68-78 */
  toUnicodeBracketedExpressionSubject(): UBrexPart {
    return UBrexConcat.build(
      new UBrexLeaf('from'), // :71
      UBrexLeaf.spaceOneOrMore(),
      new UBrexNamed('START', new UBrexLeaf('〇+〴d:〇+〴d')), // :73
      UBrexLeaf.spaceOneOrMore(),
      new UBrexLeaf('to'), // :75
      UBrexLeaf.spaceOneOrMore(),
      new UBrexNamed('END', new UBrexLeaf('〇+〴d:〇+〴d')), // :77
    );
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/SubjectWorkingHours.java:80-93 */
  getVerbPhrases(): VerbPhraseAction[] {
    const result: VerbPhraseAction[] = [];

    result.push(
      new (class extends VerbPhraseAction {
        override execute(gantt: GanttDiagram, subject: unknown, _complement: unknown): CommandExecutionResult {
          const timeRange = subject as TimeRange;
          return gantt.addWorkingTimeRange(timeRange);
        }
      })(Verbs.are, new ComplementWorkingHours()),
    );

    return result;
  }
}
