import { Failable } from '../../../core/gantt/Failable.js';
import type { CaptureLookup } from '../../../core/ubrex/CaptureLookup.js';
import { UBrexConcat } from '../../../core/ubrex/builder/UBrexConcat.js';
import { UBrexLeaf } from '../../../core/ubrex/builder/UBrexLeaf.js';
import type { UBrexPart } from '../../../core/ubrex/builder/UBrexPart.js';
import type { GanttDiagram } from '../GanttDiagram.js';
import type { Something } from './Something.js';

/**
 * ComplementWorkingHours -- `working hours`.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/ComplementWorkingHours.java:45-59
 */
export class ComplementWorkingHours implements Something<GanttDiagram> {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/ComplementWorkingHours.java:47-52 */
  toUnicodeBracketedExpressionComplement(): UBrexPart {
    return UBrexConcat.build(new UBrexLeaf('working'), UBrexLeaf.spaceOneOrMore(), new UBrexLeaf('hours'));
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/ComplementWorkingHours.java:54-57 */
  getMe(_gantt: GanttDiagram, _arg: CaptureLookup): Failable<string> {
    return Failable.ok('');
  }
}
