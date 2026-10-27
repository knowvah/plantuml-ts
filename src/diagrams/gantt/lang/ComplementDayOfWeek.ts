import { Failable } from '../../../core/gantt/Failable.js';
import type { DayOfWeek } from '../../../core/time/DayOfWeek.js';
import type { CaptureLookup } from '../../../core/ubrex/CaptureLookup.js';
import { UBrexNamed } from '../../../core/ubrex/builder/UBrexNamed.js';
import type { UBrexPart } from '../../../core/ubrex/builder/UBrexPart.js';
import type { GanttDiagram } from '../GanttDiagram.js';
import { DayOfWeekUtils } from '../time/DayOfWeekUtils.js';
import type { Something } from './Something.js';

/**
 * ComplementDayOfWeek -- a day name, captured as `COMPLEMENT`.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/ComplementDayOfWeek.java:48-61
 */
export class ComplementDayOfWeek implements Something<GanttDiagram> {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/ComplementDayOfWeek.java:50-53 */
  toUnicodeBracketedExpressionComplement(): UBrexPart {
    return new UBrexNamed('COMPLEMENT', DayOfWeekUtils.getUbrex());
  }

  /** The required group is non-null; `DayOfWeekUtils.fromString(null)` NPEs upstream (DayOfWeekUtils.java:79-80). @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/ComplementDayOfWeek.java:55-59 */
  getMe(_diagram: GanttDiagram, arg: CaptureLookup): Failable<DayOfWeek> {
    const s = arg.findFirstValueByKey('COMPLEMENT');
    return Failable.ok(DayOfWeekUtils.fromString(s as string));
  }
}
