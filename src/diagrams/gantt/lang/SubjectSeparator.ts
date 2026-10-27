import { CommandExecutionResult } from '../../../core/command/CommandExecutionResult.js';
import { Failable } from '../../../core/gantt/Failable.js';
import type { LocalDate } from '../../../core/time/LocalDate.js';
import type { UMatcher } from '../../../core/ubrex/UMatcher.js';
import { UBrexLeaf } from '../../../core/ubrex/builder/UBrexLeaf.js';
import type { UBrexPart } from '../../../core/ubrex/builder/UBrexPart.js';
import type { TaskInstant } from '../core/TaskInstant.js';
import type { GanttDiagram } from '../GanttDiagram.js';
import { VerbPhraseAction } from '../ulang/VerbPhraseAction.js';
import { ComplementBeforeOrAfterOrAtTaskStartOrEnd } from './ComplementBeforeOrAfterOrAtTaskStartOrEnd.js';
import { ComplementDate } from './ComplementDate.js';
import type { Subject } from './Subject.js';
import { Verbs } from './Verbs.js';
import { Words } from './Words.js';

/**
 * SubjectSeparator -- `separator just before|after <date>` and `separator just <task instant>`.
 * The `TeaVM.a()` guards (:79, :90, :102) only wrap `assert gantt == subject` and are dropped (precedent
 * `src/core/abel/Entity.ts:47`, journal rows 28/40).
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/SubjectSeparator.java:54-113
 */
export class SubjectSeparator implements Subject<GanttDiagram> {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/SubjectSeparator.java:56 */
  static readonly ME: Subject<GanttDiagram> = new SubjectSeparator();

  private constructor() {}

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/SubjectSeparator.java:61-64 */
  toUnicodeBracketedExpressionSubject(): UBrexPart {
    return new UBrexLeaf('separator'); // :63
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/SubjectSeparator.java:66-69 */
  getMe(gantt: GanttDiagram, _arg: UMatcher): Failable<GanttDiagram> {
    return Failable.ok(gantt);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/SubjectSeparator.java:71-110 */
  getVerbPhrases(): VerbPhraseAction[] {
    const result: VerbPhraseAction[] = [];

    // :75-84
    result.push(
      new (class extends VerbPhraseAction {
        override execute(gantt: GanttDiagram, _subject: unknown, complement: unknown): CommandExecutionResult {
          const day = complement as LocalDate;
          gantt.addVerticalSeparatorBefore(day);
          return CommandExecutionResult.ok();
        }
      })(Verbs.just, Words.usingle(Words.BEFORE), ComplementDate.any()),
    );

    // :86-95
    result.push(
      new (class extends VerbPhraseAction {
        override execute(gantt: GanttDiagram, _subject: unknown, complement: unknown): CommandExecutionResult {
          const day = complement as LocalDate;
          gantt.addVerticalSeparatorBefore(day.plusDays(1));
          return CommandExecutionResult.ok();
        }
      })(Verbs.just, Words.usingle(Words.AFTER), ComplementDate.any()),
    );

    // :97-107
    result.push(
      new (class extends VerbPhraseAction {
        override execute(gantt: GanttDiagram, _subject: unknown, complement: unknown): CommandExecutionResult {
          const when = complement as TaskInstant;
          gantt.addVerticalSeparatorBefore(when.getInstantPrecise().toDay());
          return CommandExecutionResult.ok();
        }
      })(Verbs.just, new ComplementBeforeOrAfterOrAtTaskStartOrEnd()),
    );

    return result;
  }
}
