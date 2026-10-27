import { CommandExecutionResult } from '../../../core/command/CommandExecutionResult.js';
import { Failable } from '../../../core/gantt/Failable.js';
import type { DayOfWeek } from '../../../core/time/DayOfWeek.js';
import type { LocalDate } from '../../../core/time/LocalDate.js';
import type { UMatcher } from '../../../core/ubrex/UMatcher.js';
import { UBrexConcat } from '../../../core/ubrex/builder/UBrexConcat.js';
import { UBrexLeaf } from '../../../core/ubrex/builder/UBrexLeaf.js';
import { UBrexNamed } from '../../../core/ubrex/builder/UBrexNamed.js';
import { UBrexOr } from '../../../core/ubrex/builder/UBrexOr.js';
import type { UBrexPart } from '../../../core/ubrex/builder/UBrexPart.js';
import type { Resource } from '../core/Resource.js';
import type { Task } from '../core/Task.js';
import type { DaysAsDates } from '../DaysAsDates.js';
import type { GanttDiagram } from '../GanttDiagram.js';
import { VerbPhraseAction } from '../ulang/VerbPhraseAction.js';
import { ComplementDate } from './ComplementDate.js';
import { ComplementDayOfWeek } from './ComplementDayOfWeek.js';
import { ComplementIntervals } from './ComplementIntervals.js';
import { ComplementTask } from './ComplementTask.js';
import type { Subject } from './Subject.js';
import { Verbs } from './Verbs.js';
import { Words } from './Words.js';

/**
 * SubjectResource -- `{Alice}` or `she|he|they` and the verb phrases a resource accepts.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/SubjectResource.java:59-194
 */
export class SubjectResource implements Subject<GanttDiagram> {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/SubjectResource.java:61 */
  static readonly ME: Subject<GanttDiagram> = new SubjectResource();

  private constructor() {}

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/SubjectResource.java:66-78 */
  getMe(gantt: GanttDiagram, arg: UMatcher): Failable<Resource> {
    if (arg.findFirstValueByKey('THEY') !== undefined) {
      const they = gantt.getThey();
      if (they === undefined) return Failable.error('Not sure who are you refering to?');
      return Failable.ok(they);
    }
    const resource = arg.findFirstValueByKey('RESOURCE') as string; // RESOURCE is captured when THEY is not
    const result = gantt.getResource(resource);
    gantt.setThey(result);
    return Failable.ok(result);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/SubjectResource.java:80-181 */
  getVerbPhrases(): VerbPhraseAction[] {
    const result: VerbPhraseAction[] = [];

    // WorksOn, :85-93
    result.push(
      new (class extends VerbPhraseAction {
        override execute(_gantt: GanttDiagram, subject: unknown, complement: unknown): CommandExecutionResult {
          const resource = subject as Resource;
          const task = complement as Task;
          task.addResource(resource, 100);
          return CommandExecutionResult.ok();
        }
      })(Verbs.worksOn, new ComplementTask()),
    );

    // IsOffBeforeDate, :95-105
    result.push(
      new (class extends VerbPhraseAction {
        override execute(_gantt: GanttDiagram, subject: unknown, complement: unknown): CommandExecutionResult {
          const resource = subject as Resource;
          const when = complement as LocalDate;
          resource.setOffBeforeDate(when);
          return CommandExecutionResult.ok();
        }
      })(Verbs.isOff, Words.uconcat(Words.usingle(Words.BEFORE), Words.uzeroOrMore(Words.THE)), ComplementDate.any()),
    );

    // IsOffAfterDate, :107-117
    result.push(
      new (class extends VerbPhraseAction {
        override execute(_gantt: GanttDiagram, subject: unknown, complement: unknown): CommandExecutionResult {
          const resource = subject as Resource;
          const when = complement as LocalDate;
          resource.setOffAfterDate(when);
          return CommandExecutionResult.ok();
        }
      })(Verbs.isOff, Words.uconcat(Words.usingle(Words.AFTER), Words.uzeroOrMore(Words.THE)), ComplementDate.any()),
    );

    // IsOffDates, :119-130
    result.push(
      new (class extends VerbPhraseAction {
        override execute(_gantt: GanttDiagram, subject: unknown, complement: unknown): CommandExecutionResult {
          const resource = subject as Resource;
          for (const when of complement as DaysAsDates) resource.addCloseDay(when);

          return CommandExecutionResult.ok();
        }
      })(
        Verbs.isOff,
        Words.uzeroOrMore(Words.FROM, Words.ON, Words.FOR, Words.THE, Words.AT),
        new ComplementIntervals(),
      ),
    );

    // IsOffDayOfWeek, :132-141
    result.push(
      new (class extends VerbPhraseAction {
        override execute(_gantt: GanttDiagram, subject: unknown, complement: unknown): CommandExecutionResult {
          const resource = subject as Resource;
          resource.addCloseDay(complement as DayOfWeek);
          return CommandExecutionResult.ok();
        }
      })(
        Verbs.isOff,
        Words.uzeroOrMore(Words.FROM, Words.ON, Words.FOR, Words.THE, Words.AT),
        new ComplementDayOfWeek(),
      ),
    );

    // IsOffDate, :143-153
    result.push(
      new (class extends VerbPhraseAction {
        override execute(_gantt: GanttDiagram, subject: unknown, complement: unknown): CommandExecutionResult {
          const resource = subject as Resource;
          const when = complement as LocalDate;
          resource.addCloseDay(when);
          return CommandExecutionResult.ok();
        }
      })(Verbs.isOff, Words.uzeroOrMore(Words.FROM, Words.ON, Words.FOR, Words.THE, Words.AT), ComplementDate.any()),
    );

    // IsOnDates, :155-166
    result.push(
      new (class extends VerbPhraseAction {
        override execute(_gantt: GanttDiagram, subject: unknown, complement: unknown): CommandExecutionResult {
          const resource = subject as Resource;
          for (const when of complement as DaysAsDates) resource.addForceOnDay(when);

          return CommandExecutionResult.ok();
        }
      })(
        Verbs.isOn,
        Words.uzeroOrMore(Words.FROM, Words.ON, Words.FOR, Words.THE, Words.AT),
        new ComplementIntervals(),
      ),
    );

    // IsOnDate, :168-178
    result.push(
      new (class extends VerbPhraseAction {
        override execute(_gantt: GanttDiagram, subject: unknown, complement: unknown): CommandExecutionResult {
          const resource = subject as Resource;
          const when = complement as LocalDate;
          resource.addForceOnDay(when);
          return CommandExecutionResult.ok();
        }
      })(Verbs.isOn, Words.uzeroOrMore(Words.FROM, Words.ON, Words.FOR, Words.THE, Words.AT), ComplementDate.any()),
    );

    return result;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/SubjectResource.java:184-193 */
  toUnicodeBracketedExpressionSubject(): UBrexPart {
    return new UBrexOr(
      new UBrexNamed('THEY', new UBrexLeaf('【she┇he┇they】')), // :187
      UBrexConcat.build(
        new UBrexLeaf('{'), // :189
        new UBrexNamed('RESOURCE', new UBrexLeaf('〇+「〤{}」')), // :190
        new UBrexLeaf('}'), // :191
      ),
    );
  }
}
