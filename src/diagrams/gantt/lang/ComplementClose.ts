import { Failable } from '../../../core/gantt/Failable.js';
import type { CaptureLookup } from '../../../core/ubrex/CaptureLookup.js';
import { UBrexConcat } from '../../../core/ubrex/builder/UBrexConcat.js';
import { UBrexLeaf } from '../../../core/ubrex/builder/UBrexLeaf.js';
import { UBrexNamed } from '../../../core/ubrex/builder/UBrexNamed.js';
import { UBrexOptional } from '../../../core/ubrex/builder/UBrexOptional.js';
import type { UBrexPart } from '../../../core/ubrex/builder/UBrexPart.js';
import type { GanttDiagram } from '../GanttDiagram.js';
import type { Something } from './Something.js';
import { SubjectTask } from './SubjectTask.js';

/**
 * ComplementClose -- `close` or `closed` with an optional `for [task]`; yields the task code, or "" without one.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/ComplementClose.java:48-70
 */
export class ComplementClose implements Something<GanttDiagram> {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/ComplementClose.java:51-57 */
  toUnicodeBracketedExpressionComplement(): UBrexPart {
    return new UBrexNamed(
      'CLOSED',
      UBrexConcat.build(
        new UBrexLeaf('close〇?d'), // :54
        new UBrexOptional(UBrexConcat.build(new UBrexLeaf('∙for∙'), SubjectTask.taskCode('FOO'))), // :55
      ),
    );
  }

  /**
   * A missing capture is Java `null` (an NPE at `value.indexOf`); `CLOSED` is always captured by the grammar above.
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/ComplementClose.java:59-68
   */
  getMe(_diagram: GanttDiagram, arg: CaptureLookup): Failable<string> {
    const value = arg.findFirstValueByKey('CLOSED') as string;
    const x = value.indexOf('[');
    if (x > 0) {
      const y = value.lastIndexOf(']');
      const s = value.substring(x + 1, y);
      return Failable.ok(s);
    }
    return Failable.ok('');
  }
}
