import { Failable } from '../../../core/gantt/Failable.js';
import type { CaptureLookup } from '../../../core/ubrex/CaptureLookup.js';
import { UBrexLeaf } from '../../../core/ubrex/builder/UBrexLeaf.js';
import type { UBrexPart } from '../../../core/ubrex/builder/UBrexPart.js';
import type { GanttDiagram } from '../GanttDiagram.js';
import type { Something } from './Something.js';

/**
 * ComplementDeleted -- the word "deleted".
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/ComplementDeleted.java:45-57
 */
export class ComplementDeleted implements Something<GanttDiagram> {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/ComplementDeleted.java:47-50 */
  toUnicodeBracketedExpressionComplement(): UBrexPart {
    return new UBrexLeaf('deleted');
  }

  /** `new Object()`. @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/ComplementDeleted.java:52-55 */
  getMe(_gantt: GanttDiagram, _arg: CaptureLookup): Failable<object> {
    return Failable.ok({});
  }
}
