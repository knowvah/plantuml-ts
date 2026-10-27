import { Failable } from '../../../core/gantt/Failable.js';
import type { CaptureLookup } from '../../../core/ubrex/CaptureLookup.js';
import type { UBrexPart } from '../../../core/ubrex/builder/UBrexPart.js';
import { GanttConstraintMode } from '../GanttConstraintMode.js';
import type { GanttDiagram } from '../GanttDiagram.js';
import { TaskAttribute } from '../core/TaskAttribute.js';
import { TaskInstant } from '../core/TaskInstant.js';
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
 * AbstractComplementTaskInstant -- package-private upstream; the base of the complements resolving to a
 * `TaskInstant` (a task's start or end, optionally shifted by days or weeks).
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/AbstractComplementTaskInstant.java:47-86
 */
export abstract class AbstractComplementTaskInstant implements Something<GanttDiagram> {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/Something.java:46 */
  abstract getMe(diagram: GanttDiagram, arg: CaptureLookup): Failable<unknown>;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/Something.java:48 */
  abstract toUnicodeBracketedExpressionComplement(): UBrexPart;

  /** `final` upstream. @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/AbstractComplementTaskInstant.java:49-84 */
  getComplementTaskInstant(gantt: GanttDiagram, arg: CaptureLookup): Failable<TaskInstant> {
    const code = arg.findFirstValueByKey('COMPLEMENT_CODE_OTHER');
    const startOrEnd = arg.findFirstValueByKey('COMPLEMENT_START_OR_END');

    // `getExistingMoment(null)` and `TaskAttribute.fromString(null)` dereference null upstream.
    const task = gantt.getExistingMoment(code as string);
    if (task === undefined) return Failable.error('No such task ' + String(code));

    let result = new TaskInstant(task, TaskAttribute.fromString(startOrEnd as string));
    const nb1 = arg.findFirstValueByKey('COMPLEMENT_NB1');
    if (nb1 !== undefined) {
      const factor1 = (arg.findFirstValueByKey('COMPLEMENT_DAY_OR_WEEK1') as string).startsWith('w')
        ? gantt.daysInWeek()
        : 1;
      const days1 = parseInt32(nb1) * factor1;

      const nb2 = arg.findFirstValueByKey('COMPLEMENT_NB2');
      let days2 = 0;
      if (nb2 !== undefined) {
        const factor2 = (arg.findFirstValueByKey('COMPLEMENT_DAY_OR_WEEK2') as string).startsWith('w')
          ? gantt.daysInWeek()
          : 1;
        days2 = parseInt32(nb2) * factor2;
      }

      let delta = days1 + days2;
      if ('before' === arg.findFirstValueByKey('COMPLEMENT_BEFORE_OR_AFTER')?.toLowerCase()) delta = -delta;

      const working =
        arg.findFirstValueByKey('COMPLEMENT_WORKING1') !== undefined ||
        arg.findFirstValueByKey('COMPLEMENT_WORKING2') !== undefined;

      const mode = working ? GanttConstraintMode.DO_NOT_COUNT_CLOSE_DAY : GanttConstraintMode.IGNORE_CALENDAR;

      result = result.withDelta(delta, mode, gantt.getDefaultPlan());
    }
    return Failable.ok(result);
  }
}
