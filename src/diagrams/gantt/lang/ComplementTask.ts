import { Failable } from '../../../core/gantt/Failable.js';
import type { CaptureLookup } from '../../../core/ubrex/CaptureLookup.js';
import { UBrexNamed } from '../../../core/ubrex/builder/UBrexNamed.js';
import type { UBrexPart } from '../../../core/ubrex/builder/UBrexPart.js';
import type { Task } from '../core/Task.js';
import type { GanttDiagram } from '../GanttDiagram.js';
import type { Something } from './Something.js';
import { SubjectTask } from './SubjectTask.js';

/**
 * ComplementTask -- `[Task]`, resolved to an already existing task.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/ComplementTask.java:46-62
 */
export class ComplementTask implements Something<GanttDiagram> {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/ComplementTask.java:48-51 */
  toUnicodeBracketedExpressionComplement(): UBrexPart {
    return new UBrexNamed('COMPLEMENT', SubjectTask.taskCode('FOO'));
  }

  /**
   * `code` is always captured by the grammar above, so it is a `string`.
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/ComplementTask.java:53-60
   */
  getMe(gantt: GanttDiagram, arg: CaptureLookup): Failable<Task> {
    const code = arg.findFirstValueByKey('COMPLEMENT') as string;
    const task = gantt.getExistingTask(code);
    if (task === undefined) return Failable.error('No such task ' + code);
    return Failable.ok(task);
  }
}
