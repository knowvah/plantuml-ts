import type { CaptureLookup } from '../../../core/ubrex/CaptureLookup.js';
import { UBrexConcat } from '../../../core/ubrex/builder/UBrexConcat.js';
import { UBrexLeaf } from '../../../core/ubrex/builder/UBrexLeaf.js';
import { UBrexNamed } from '../../../core/ubrex/builder/UBrexNamed.js';
import { UBrexOptional } from '../../../core/ubrex/builder/UBrexOptional.js';
import { UBrexOr } from '../../../core/ubrex/builder/UBrexOr.js';
import type { UBrexPart } from '../../../core/ubrex/builder/UBrexPart.js';
import { Failable } from '../../../core/gantt/Failable.js';
import type { GanttDiagram } from '../GanttDiagram.js';
import { CenterBorderColor } from './CenterBorderColor.js';
import type { Something } from './Something.js';

/**
 * ComplementWithColorLink -- `with [style ]<color> [style ]link`.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/ComplementWithColorLink.java:49-75
 */
export class ComplementWithColorLink implements Something<GanttDiagram> {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/ComplementWithColorLink.java:51-66 */
  toUnicodeBracketedExpressionComplement(): UBrexPart {
    const optionalStyle = new UBrexOptional(
      UBrexConcat.build(
        new UBrexNamed('STYLE', new UBrexOr(new UBrexLeaf('dotted'), new UBrexLeaf('bold'), new UBrexLeaf('dashed'))),
        UBrexLeaf.spaceOneOrMore(),
      ),
    );
    return UBrexConcat.build(
      new UBrexLeaf('with'),
      UBrexLeaf.spaceOneOrMore(),
      optionalStyle,
      new UBrexNamed('COLOR', new UBrexLeaf('〇?# 〇+〴w')),
      UBrexLeaf.spaceOneOrMore(),
      optionalStyle,
      new UBrexLeaf('link'),
    );
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/ComplementWithColorLink.java:68-74 */
  getMe(diagram: GanttDiagram, arg: CaptureLookup): Failable<CenterBorderColor> {
    const color1 = arg.findFirstValueByKey('COLOR');
    const style = arg.findFirstValueByKey('STYLE');
    const col1 = color1 === undefined ? undefined : diagram.getIHtmlColorSet().getColorOrWhite(color1);
    return Failable.ok(new CenterBorderColor(col1, col1, style));
  }
}
