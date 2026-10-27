import { CommandExecutionResult } from '../../../core/command/CommandExecutionResult.js';
import type { DayOfWeek } from '../../../core/time/DayOfWeek.js';
import { Duration } from '../../../core/time/Duration.js';
import type { LocalDate } from '../../../core/time/LocalDate.js';
import type { HColor } from '../../../core/style/Value.js';
import type { Url } from '../../../core/url/Url.js';
import type { Completion } from '../Completion.js';
import type { Task } from '../core/Task.js';
import { TaskAttribute } from '../core/TaskAttribute.js';
import { TaskInstant } from '../core/TaskInstant.js';
import type { DaysAsDates } from '../DaysAsDates.js';
import { GanttConstraint } from '../GanttConstraint.js';
import type { GanttDiagram } from '../GanttDiagram.js';
import { Load } from '../ngm/Load.js';
import { TimePoint } from '../time/TimePoint.js';
import { VerbPhraseAction } from '../ulang/VerbPhraseAction.js';
import type { CenterBorderColor } from './CenterBorderColor.js';
import { ComplementAnything } from './ComplementAnything.js';
import { ComplementBeforeOrAfterOrAtTaskStartOrEnd } from './ComplementBeforeOrAfterOrAtTaskStartOrEnd.js';
import { ComplementCompleted } from './ComplementCompleted.js';
import { ComplementDate } from './ComplementDate.js';
import { ComplementDayOfWeek } from './ComplementDayOfWeek.js';
import { ComplementDeleted } from './ComplementDeleted.js';
import { ComplementDuration } from './ComplementDuration.js';
import { ComplementFromTo } from './ComplementFromTo.js';
import { ComplementInColors } from './ComplementInColors.js';
import { ComplementInColorsFromTo } from './ComplementInColorsFromTo.js';
import { ComplementIntervals } from './ComplementIntervals.js';
import { ComplementIntervalsSmart } from './ComplementIntervalsSmart.js';
import { ComplementNamed } from './ComplementNamed.js';
import { ComplementTimePoint } from './ComplementTimePoint.js';
import { ComplementUrl } from './ComplementUrl.js';
import { ComplementWithColorLink } from './ComplementWithColorLink.js';
import { PairOfSomething } from './PairOfSomething.js';
import type { TwoNames } from './TwoNames.js';
import { Verbs } from './Verbs.js';
import { Words } from './Words.js';

/**
 * The verb phrases a gantt task accepts, split out of `SubjectTask.ts` to stay under the 500-line file cap
 * (no behaviour change; every `@see` below cites the original `SubjectTask.java` lines).
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/SubjectTask.java:88-412
 */
export function buildSubjectTaskVerbPhrases(): VerbPhraseAction[] {
  const result: VerbPhraseAction[] = [];
  // :91
  result.push(
    new (class extends VerbPhraseAction {
      override execute(_gantt: GanttDiagram, subject: unknown, complement: unknown): CommandExecutionResult {
        const task = subject as Task;
        const duration = complement as Load;
        task.setLoad(duration);
        return CommandExecutionResult.ok();
      }
    })(Verbs.requires, Words.uzeroOrMore(Words.ON, Words.FOR, Words.THE, Words.AT), new ComplementDuration()),
  );

  // :102
  result.push(
    new (class extends VerbPhraseAction {
      override execute(gantt: GanttDiagram, subject: unknown, complement: unknown): CommandExecutionResult {
        if (gantt.getMinDay().equals(TimePoint.epoch()))
          return CommandExecutionResult.error('No starting date for the project');

        const task = subject as Task;
        const start = complement as TimePoint;

        task.setStart(start);
        return CommandExecutionResult.ok();
      }
    })(Verbs.starts, Words.uzeroOrMore(Words.THE, Words.ON, Words.AT), ComplementTimePoint.any()),
  );

  // :117
  result.push(
    new (class extends VerbPhraseAction {
      override execute(gantt: GanttDiagram, subject: unknown, complement: unknown): CommandExecutionResult {
        const task = subject as Task;

        const pairs = complement as unknown[];
        const when = pairs[0] as TaskInstant;
        const complement22 = pairs[1] as CenterBorderColor;

        task.setStart(when.getInstantPrecise());
        if (when.isTask()) {
          // `GanttConstraint` takes the style layer's `HColor` slice (`style/Value.ts:15`, a `withDark` interface);
          // `getCenter()` is the wider klimt `GanttColor` (journal row 59). The value is the same object Java passes
          // (`SubjectTask.java:129`); an automagic/paint centre reaches the draw-time crash exactly as upstream.
          const color = complement22.getCenter() as HColor | undefined;
          const link = new GanttConstraint(
            gantt.getIHtmlColorSet(),
            gantt.getSkinParam().getCurrentStyleBuilder(), // gantt.getCurrentStyleBuilder() inlined (journal row 51)
            when,
            new TaskInstant(task, TaskAttribute.START),
            color,
          );
          link.applyStyle(complement22.getStyle());
          gantt.addContraint(link);
        }
        return CommandExecutionResult.ok();
      }
    })(
      Verbs.starts,
      new PairOfSomething<GanttDiagram>(new ComplementBeforeOrAfterOrAtTaskStartOrEnd(), new ComplementWithColorLink()),
    ),
  );

  // :140
  result.push(
    new (class extends VerbPhraseAction {
      override execute(gantt: GanttDiagram, subject: unknown, complement: unknown): CommandExecutionResult {
        const task = subject as Task;
        const color = undefined;
        const when = complement as TaskInstant;
        task.setStart(when.getInstantPrecise());
        if (when.isTask())
          gantt.addContraint(
            new GanttConstraint(
              gantt.getIHtmlColorSet(),
              gantt.getSkinParam().getCurrentStyleBuilder(),
              when,
              new TaskInstant(task, TaskAttribute.START),
              color,
            ),
          );

        return CommandExecutionResult.ok();
      }
    })(Verbs.starts, new ComplementBeforeOrAfterOrAtTaskStartOrEnd()),
  );

  // :156
  result.push(
    new (class extends VerbPhraseAction {
      override execute(_gantt: GanttDiagram, subject: unknown, complement: unknown): CommandExecutionResult {
        const task = subject as Task;
        const start = complement as LocalDate;

        task.setStart(TimePoint.ofStartOfDay(start));
        return CommandExecutionResult.ok();
      }
    })(Verbs.starts, Words.uzeroOrMore(Words.THE, Words.ON, Words.AT), ComplementDate.onlyRelative()),
  );

  // :168
  result.push(
    new (class extends VerbPhraseAction {
      override execute(gantt: GanttDiagram, subject: unknown, complement: unknown): CommandExecutionResult {
        if (gantt.getMinDay().equals(TimePoint.epoch()))
          return CommandExecutionResult.error('No starting date for the project');

        const task = subject as Task;
        const start = complement as LocalDate;
        task.setStart(TimePoint.ofStartOfDay(start));
        return CommandExecutionResult.ok();
      }
    })(Verbs.starts, Words.uzeroOrMore(Words.THE, Words.ON, Words.AT), ComplementDate.any()),
  );

  // :182
  result.push(
    new (class extends VerbPhraseAction {
      override execute(_gantt: GanttDiagram, subject: unknown, complement: unknown): CommandExecutionResult {
        const task = subject as Task;
        const colors = complement as CenterBorderColor;
        task.setColors(colors);
        return CommandExecutionResult.ok();
      }
    })(Verbs.isColored, new ComplementInColors()),
  );

  // :192
  result.push(
    new (class extends VerbPhraseAction {
      override execute(_gantt: GanttDiagram, subject: unknown, complement: unknown): CommandExecutionResult {
        const task = subject as Task;
        const colors = complement as CenterBorderColor[];
        task.setColors(...colors);
        return CommandExecutionResult.ok();
      }
    })(Verbs.isColored, Words.uexactly2(Words.FOR, Words.COMPLETION), new ComplementInColorsFromTo()),
  );

  // :203
  result.push(
    new (class extends VerbPhraseAction {
      override execute(_gantt: GanttDiagram, subject: unknown, complement: unknown): CommandExecutionResult {
        const task = subject as Task;
        task.setLoad(Load.of(Duration.ofDays(1)));
        const start = complement as LocalDate;
        task.setStart(TimePoint.ofStartOfDay(start));
        task.setDiamond(true);
        return CommandExecutionResult.ok();
      }
    })(Verbs.happens, Words.uzeroOrMore(Words.THE, Words.ON, Words.AT), ComplementDate.any()),
  );

  // :216
  result.push(
    new (class extends VerbPhraseAction {
      override execute(_gantt: GanttDiagram, subject: unknown, complement: unknown): CommandExecutionResult {
        const task = subject as Task;
        task.setLoad(Load.of(Duration.ofDays(1)));
        task.setDiamond(true);
        const when = complement as TaskInstant;
        if (when.getAttribute() === TaskAttribute.END) task.setStart(when.getInstantPrecise().decrement());
        else task.setStart(when.getInstantPrecise());
        return CommandExecutionResult.ok();
      }
    })(
      Verbs.happens,
      Words.uzeroOrMore(Words.THE, Words.ON, Words.AT),
      new ComplementBeforeOrAfterOrAtTaskStartOrEnd(),
    ),
  );

  // :233
  result.push(
    new (class extends VerbPhraseAction {
      override execute(gantt: GanttDiagram, subject: unknown, complement: unknown): CommandExecutionResult {
        const task = subject as Task;
        const bothNames = complement as TwoNames;
        const name1 = bothNames.getName1();
        const name2 = bothNames.getName2();
        const from = gantt.getExistingTask(name1);
        if (from === undefined) return CommandExecutionResult.error('No such ' + name1 + ' task');

        const to = gantt.getExistingTask(name2);
        if (to === undefined) return CommandExecutionResult.error('No such ' + name2 + ' task');

        task.setStart(from.getStart());
        task.setEnd(to.getEnd());
        gantt.addContraint(
          new GanttConstraint(
            gantt.getIHtmlColorSet(),
            gantt.getSkinParam().getCurrentStyleBuilder(),
            new TaskInstant(from, TaskAttribute.START),
            new TaskInstant(task, TaskAttribute.START),
          ),
        );
        gantt.addContraint(
          new GanttConstraint(
            gantt.getIHtmlColorSet(),
            gantt.getSkinParam().getCurrentStyleBuilder(),
            new TaskInstant(to, TaskAttribute.END),
            new TaskInstant(task, TaskAttribute.END),
          ),
        );
        return CommandExecutionResult.ok();
      }
    })(Verbs.occurs, new ComplementFromTo()),
  );

  // :258
  result.push(
    new (class extends VerbPhraseAction {
      override execute(gantt: GanttDiagram, subject: unknown, complement: unknown): CommandExecutionResult {
        if (gantt.getMinDay().equals(TimePoint.epoch()))
          return CommandExecutionResult.error('No starting date for the project');

        const task = subject as Task;
        const start = complement as TimePoint;

        task.setEnd(start);
        return CommandExecutionResult.ok();
      }
    })(Verbs.ends, Words.uzeroOrMore(Words.THE, Words.ON, Words.AT), ComplementTimePoint.any()),
  );

  // :275
  result.push(
    new (class extends VerbPhraseAction {
      override execute(gantt: GanttDiagram, subject: unknown, complement: unknown): CommandExecutionResult {
        const task = subject as Task;
        const when = complement as TaskInstant;
        task.setEnd(when.getInstantPrecise());
        gantt.addContraint(
          new GanttConstraint(
            gantt.getIHtmlColorSet(),
            gantt.getSkinParam().getCurrentStyleBuilder(),
            when,
            new TaskInstant(task, TaskAttribute.END),
          ),
        );
        return CommandExecutionResult.ok();
      }
    })(Verbs.ends, new ComplementBeforeOrAfterOrAtTaskStartOrEnd()),
  );

  // :287
  result.push(
    new (class extends VerbPhraseAction {
      override execute(_gantt: GanttDiagram, subject: unknown, complement: unknown): CommandExecutionResult {
        const task = subject as Task;
        const end = complement as LocalDate;

        task.setEnd(TimePoint.ofStartOfDay(end).increment());
        return CommandExecutionResult.ok();
      }
    })(Verbs.ends, Words.uzeroOrMore(Words.THE, Words.ON, Words.AT), ComplementDate.onlyRelative()),
  );

  // :299
  result.push(
    new (class extends VerbPhraseAction {
      override execute(gantt: GanttDiagram, subject: unknown, complement: unknown): CommandExecutionResult {
        const task = subject as Task;
        const end = complement as LocalDate;
        if (gantt.getMinDay().equals(TimePoint.epoch()))
          return CommandExecutionResult.error('No starting date for the project');
        task.setEnd(TimePoint.ofStartOfDay(end).increment());

        return CommandExecutionResult.ok();
      }
    })(Verbs.ends, Words.uzeroOrMore(Words.THE, Words.ON, Words.AT), ComplementDate.any()),
  );

  // :313 (`"No such task " + task2` concatenates the null `task2`: "No such task null")
  result.push(
    new (class extends VerbPhraseAction {
      override execute(gantt: GanttDiagram, subject: unknown, complement: unknown): CommandExecutionResult {
        const task1 = subject as Task;
        const task2 = gantt.getExistingTask(complement as string);
        if (task2 === undefined) return CommandExecutionResult.error('No such task ' + 'null');

        task1.putInSameRowAs(task2);
        return CommandExecutionResult.ok();
      }
    })(Verbs.displayOnSameRowAs, new ComplementNamed()),
  );

  // :326
  result.push(
    new (class extends VerbPhraseAction {
      override execute(gantt: GanttDiagram, subject: unknown, _complement: unknown): CommandExecutionResult {
        const task = subject as Task;
        return gantt.deleteTask(task);
      }
    })(Verbs.is, new ComplementDeleted()),
  );

  // :334
  result.push(
    new (class extends VerbPhraseAction {
      override execute(_gantt: GanttDiagram, subject: unknown, complement: unknown): CommandExecutionResult {
        const task = subject as Task;
        const completed = complement as Completion;
        task.setCompletion(completed.getCompletion());
        return CommandExecutionResult.ok();
      }
    })(Verbs.is, new ComplementCompleted()),
  );

  // :344
  result.push(
    new (class extends VerbPhraseAction {
      override execute(_gantt: GanttDiagram, subject: unknown, complement: unknown): CommandExecutionResult {
        const task = subject as Task;
        const pauses = complement as DaysAsDates;
        for (const day of pauses) task.addPause(day);

        return CommandExecutionResult.ok();
      }
    })(Verbs.pauses, Words.uzeroOrMore(Words.THE, Words.ON, Words.AT, Words.FROM), new ComplementIntervals()),
  );

  // :357
  result.push(
    new (class extends VerbPhraseAction {
      override execute(_gantt: GanttDiagram, subject: unknown, complement: unknown): CommandExecutionResult {
        const task = subject as Task;
        const pauses = complement as DaysAsDates;
        for (const day of pauses) task.addPause(day);
        return CommandExecutionResult.ok();
      }
    })(Verbs.pauses, Words.uzeroOrMore(Words.THE, Words.ON, Words.AT, Words.FROM), new ComplementIntervalsSmart()),
  );

  // :369
  result.push(
    new (class extends VerbPhraseAction {
      override execute(_gantt: GanttDiagram, subject: unknown, complement: unknown): CommandExecutionResult {
        const task = subject as Task;
        const pause = complement as LocalDate;
        task.addPause(pause);
        return CommandExecutionResult.ok();
      }
    })(Verbs.pauses, Words.uzeroOrMore(Words.THE, Words.ON, Words.AT, Words.FROM), ComplementDate.any()),
  );

  // :380
  result.push(
    new (class extends VerbPhraseAction {
      override execute(_gantt: GanttDiagram, subject: unknown, complement: unknown): CommandExecutionResult {
        const task = subject as Task;
        const pause = complement as DayOfWeek;
        task.addPause(pause);
        return CommandExecutionResult.ok();
      }
    })(Verbs.pauses, Words.uzeroOrMore(Words.THE, Words.ON, Words.AT, Words.FROM), new ComplementDayOfWeek()),
  );

  // :391
  result.push(
    new (class extends VerbPhraseAction {
      override execute(_gantt: GanttDiagram, subject: unknown, complement: unknown): CommandExecutionResult {
        const task = subject as Task;
        const url = complement as Url;
        task.setUrl(url);
        return CommandExecutionResult.ok();
      }
    })(Verbs.linksTo, new ComplementUrl()),
  );

  // :401
  result.push(
    new (class extends VerbPhraseAction {
      override execute(_gantt: GanttDiagram, subject: unknown, complement: unknown): CommandExecutionResult {
        const task = subject as Task;
        const displayString = complement as string;
        task.setDisplay(displayString);
        return CommandExecutionResult.ok();
      }
    })(Verbs.isDisplayedAs, new ComplementAnything()),
  );

  return result;
}
