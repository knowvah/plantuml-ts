import type { CaptureLookup } from '../../../core/ubrex/CaptureLookup.js';
import { UBrexConcat } from '../../../core/ubrex/builder/UBrexConcat.js';
import { UBrexLeaf } from '../../../core/ubrex/builder/UBrexLeaf.js';
import { UBrexNamed } from '../../../core/ubrex/builder/UBrexNamed.js';
import { UBrexOptional } from '../../../core/ubrex/builder/UBrexOptional.js';
import type { UBrexPart } from '../../../core/ubrex/builder/UBrexPart.js';
import { Failable } from '../../../core/gantt/Failable.js';
import type { GanttDiagram } from '../GanttDiagram.js';
import { CenterBorderColor } from './CenterBorderColor.js';
import type { Something } from './Something.js';

/**
 * ComplementInColors -- `in <color>[/<border>]`.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/ComplementInColors.java:50-69
 */
export class ComplementInColors implements Something<GanttDiagram> {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/ComplementInColors.java:52-61 */
  toUnicodeBracketedExpressionComplement(): UBrexPart {
    return UBrexConcat.build(
      new UBrexLeaf('in'),
      UBrexLeaf.spaceOneOrMore(),
      new UBrexNamed('COMPLEMENT1', new UBrexLeaf('〇?# 〇+〴w')),
      new UBrexOptional(
        UBrexConcat.build(new UBrexLeaf('/'), new UBrexNamed('COMPLEMENT2', new UBrexLeaf('〇?# 〇+〴w'))),
      ),
    );
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/ComplementInColors.java:63-68 */
  getMe(diagram: GanttDiagram, arg: CaptureLookup): Failable<CenterBorderColor> {
    const color1 = arg.findFirstValueByKey('COMPLEMENT1');
    const color2 = arg.findFirstValueByKey('COMPLEMENT2');
    const col1 = color1 === undefined ? undefined : diagram.getIHtmlColorSet().getColorOrWhite(color1);
    const col2 = color2 === undefined ? undefined : diagram.getIHtmlColorSet().getColorOrWhite(color2);
    return Failable.ok(new CenterBorderColor(col1, col2));
  }
}
