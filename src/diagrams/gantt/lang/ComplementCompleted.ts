import { Failable } from '../../../core/gantt/Failable.js';
import type { CaptureLookup } from '../../../core/ubrex/CaptureLookup.js';
import { UBrexConcat } from '../../../core/ubrex/builder/UBrexConcat.js';
import { UBrexLeaf } from '../../../core/ubrex/builder/UBrexLeaf.js';
import { UBrexNamed } from '../../../core/ubrex/builder/UBrexNamed.js';
import type { UBrexPart } from '../../../core/ubrex/builder/UBrexPart.js';
import { Completion } from '../Completion.js';
import type { GanttDiagram } from '../GanttDiagram.js';
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
 * ComplementCompleted -- "<n>% complete[d]".
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/ComplementCompleted.java:48-64
 */
export class ComplementCompleted implements Something<GanttDiagram> {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/ComplementCompleted.java:50-57 */
  toUnicodeBracketedExpressionComplement(): UBrexPart {
    return UBrexConcat.build(
      new UBrexNamed('COMPLEMENT', new UBrexLeaf('〇+〴d')),
      new UBrexLeaf('〇+〴W complete〇?d'),
    );
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/ComplementCompleted.java:58-62 */
  getMe(_diagram: GanttDiagram, arg: CaptureLookup): Failable<Completion> {
    const value = arg.findFirstValueByKey('COMPLEMENT');
    return Failable.ok(new Completion(parseInt32(value)));
  }
}
