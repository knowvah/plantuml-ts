import type { CommandExecutionResult } from '../../../core/command/CommandExecutionResult.js';
import { Failable } from '../../../core/gantt/Failable.js';
import type { LocalDate } from '../../../core/time/LocalDate.js';
import type { UMatcher } from '../../../core/ubrex/UMatcher.js';
import { UBrexLeaf } from '../../../core/ubrex/builder/UBrexLeaf.js';
import { UBrexOr } from '../../../core/ubrex/builder/UBrexOr.js';
import type { UBrexPart } from '../../../core/ubrex/builder/UBrexPart.js';
import type { GanttDiagram } from '../GanttDiagram.js';
import { VerbPhraseAction } from '../ulang/VerbPhraseAction.js';
import { ComplementDate } from './ComplementDate.js';
import type { Subject } from './Subject.js';
import { Verbs } from './Verbs.js';
import { Words } from './Words.js';

/**
 * SubjectGantt -- `project` / `gantt` and its single verb phrase (`starts [on|for|the|at] <date>`).
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/SubjectGantt.java:54-87
 */
export class SubjectGantt implements Subject<GanttDiagram> {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/SubjectGantt.java:56 */
  static readonly ME: Subject<GanttDiagram> = new SubjectGantt();

  private constructor() {}

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/SubjectGantt.java:61-64 */
  toUnicodeBracketedExpressionSubject(): UBrexPart {
    return new UBrexOr(new UBrexLeaf('project'), new UBrexLeaf('gantt')); // :63
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/SubjectGantt.java:66-81 */
  getVerbPhrases(): VerbPhraseAction[] {
    const result: VerbPhraseAction[] = [];
    result.push(
      new (class extends VerbPhraseAction {
        override execute(gantt: GanttDiagram, _subject: unknown, complement: unknown): CommandExecutionResult {
          const start = complement as LocalDate;
          // `if (TeaVM.a()) assert gantt == subject;` (:74-75) is assertion-only and dropped (journal row 68).
          return gantt.updateStartingPoint(start);
        }
      })(Verbs.starts, Words.uzeroOrMore(Words.ON, Words.FOR, Words.THE, Words.AT), ComplementDate.onlyAbsolute()),
    );
    return result;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/SubjectGantt.java:83-86 */
  getMe(gantt: GanttDiagram, _arg: UMatcher): Failable<GanttDiagram> {
    return Failable.ok(gantt);
  }
}
