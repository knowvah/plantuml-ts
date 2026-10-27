import { Failable } from '../../../core/gantt/Failable.js';
import type { CaptureLookup } from '../../../core/ubrex/CaptureLookup.js';
import { UBrexConcat } from '../../../core/ubrex/builder/UBrexConcat.js';
import { UBrexLeaf } from '../../../core/ubrex/builder/UBrexLeaf.js';
import type { UBrexPart } from '../../../core/ubrex/builder/UBrexPart.js';
import type { GanttDiagram } from '../GanttDiagram.js';
import type { Something } from './Something.js';
import { SubjectTask } from './SubjectTask.js';
import { TwoNames } from './TwoNames.js';

/**
 * ComplementFromTo -- `from [A] to [B]`.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/ComplementFromTo.java:46-65
 */
export class ComplementFromTo implements Something<GanttDiagram> {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/ComplementFromTo.java:48-57 */
  toUnicodeBracketedExpressionComplement(): UBrexPart {
    return UBrexConcat.build(
      new UBrexLeaf('from'), // :51
      UBrexLeaf.spaceOneOrMore(),
      SubjectTask.taskCode('COMPLEMENT1'), // :53
      UBrexLeaf.spaceOneOrMore(),
      new UBrexLeaf('to'), // :54
      UBrexLeaf.spaceOneOrMore(),
      SubjectTask.taskCode('COMPLEMENT2'), // :56
    );
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/ComplementFromTo.java:59-64 */
  getMe(_diagram: GanttDiagram, arg: CaptureLookup): Failable<TwoNames> {
    const name1 = arg.findFirstValueByKey('COMPLEMENT1');
    const name2 = arg.findFirstValueByKey('COMPLEMENT2');
    return Failable.ok(new TwoNames(name1 as string, name2 as string));
  }
}
