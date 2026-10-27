import { Failable } from '../../../core/gantt/Failable.js';
import type { CaptureLookup } from '../../../core/ubrex/CaptureLookup.js';
import { UBrexConcat } from '../../../core/ubrex/builder/UBrexConcat.js';
import { UBrexLeaf } from '../../../core/ubrex/builder/UBrexLeaf.js';
import { UBrexNamed } from '../../../core/ubrex/builder/UBrexNamed.js';
import type { UBrexPart } from '../../../core/ubrex/builder/UBrexPart.js';
import type { GanttDiagram } from '../GanttDiagram.js';
import type { Something } from './Something.js';

/**
 * ComplementNamed -- `[name]`.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/ComplementNamed.java:46-61
 */
export class ComplementNamed implements Something<GanttDiagram> {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/ComplementNamed.java:48-54 */
  toUnicodeBracketedExpressionComplement(): UBrexPart {
    return UBrexConcat.build(
      new UBrexLeaf('['),
      new UBrexNamed('COMPLEMENT', new UBrexLeaf('〇+「〤[]」')),
      new UBrexLeaf(']'),
    );
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/ComplementNamed.java:56-60 (a missing capture is Java `null`, which `Failable.ok` rejects) */
  getMe(_diagram: GanttDiagram, arg: CaptureLookup): Failable<string> {
    const name = arg.findFirstValueByKey('COMPLEMENT');
    return Failable.ok(name as string);
  }
}
