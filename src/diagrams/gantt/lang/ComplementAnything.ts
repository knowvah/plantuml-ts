import { Failable } from '../../../core/gantt/Failable.js';
import type { CaptureLookup } from '../../../core/ubrex/CaptureLookup.js';
import { UBrexLeaf } from '../../../core/ubrex/builder/UBrexLeaf.js';
import { UBrexNamed } from '../../../core/ubrex/builder/UBrexNamed.js';
import type { UBrexPart } from '../../../core/ubrex/builder/UBrexPart.js';
import type { GanttDiagram } from '../GanttDiagram.js';
import type { Something } from './Something.js';

/**
 * ComplementAnything -- the rest of the line, captured as `ANYTHING`.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/ComplementAnything.java:46-59
 */
export class ComplementAnything implements Something<GanttDiagram> {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/ComplementAnything.java:48-51 */
  toUnicodeBracketedExpressionComplement(): UBrexPart {
    return new UBrexNamed('ANYTHING', new UBrexLeaf('〇*〴.'));
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/ComplementAnything.java:53-57 */
  getMe(_gantt: GanttDiagram, arg: CaptureLookup): Failable<string> {
    const value = arg.findFirstValueByKey('ANYTHING');
    // `Failable.ok(null)` throws IllegalArgumentException upstream; the Failable port keeps that guard.
    return Failable.ok(value as string);
  }
}
