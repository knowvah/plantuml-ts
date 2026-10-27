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
 * ComplementInColorsFromTo -- `from <c>[/<b>] to <c>[/<b>]`.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/ComplementInColorsFromTo.java:50-83
 */
export class ComplementInColorsFromTo implements Something<GanttDiagram> {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/ComplementInColorsFromTo.java:52-68 */
  toUnicodeBracketedExpressionComplement(): UBrexPart {
    return UBrexConcat.build(
      new UBrexLeaf('from'),
      UBrexLeaf.spaceOneOrMore(),
      new UBrexNamed('FROM1', new UBrexLeaf('〇?# 〇+〴w')),
      new UBrexOptional(UBrexConcat.build(new UBrexLeaf('/'), new UBrexNamed('FROM2', new UBrexLeaf('〇?# 〇+〴w')))),
      UBrexLeaf.spaceOneOrMore(),
      new UBrexLeaf('to'),
      UBrexLeaf.spaceOneOrMore(),
      new UBrexNamed('TO1', new UBrexLeaf('〇?# 〇+〴w')),
      new UBrexOptional(UBrexConcat.build(new UBrexLeaf('/'), new UBrexNamed('TO2', new UBrexLeaf('〇?# 〇+〴w')))),
    );
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/ComplementInColorsFromTo.java:70-82 */
  getMe(diagram: GanttDiagram, arg: CaptureLookup): Failable<CenterBorderColor[]> {
    const arg0 = arg.findFirstValueByKey('FROM1');
    const arg1 = arg.findFirstValueByKey('FROM2');
    const arg2 = arg.findFirstValueByKey('TO1');
    const arg3 = arg.findFirstValueByKey('TO2');
    const from0 = arg0 === undefined ? undefined : diagram.getIHtmlColorSet().getColorOrWhite(arg0);
    const from1 = arg1 === undefined ? undefined : diagram.getIHtmlColorSet().getColorOrWhite(arg1);
    const to0 = arg2 === undefined ? undefined : diagram.getIHtmlColorSet().getColorOrWhite(arg2);
    const to1 = arg3 === undefined ? undefined : diagram.getIHtmlColorSet().getColorOrWhite(arg3);
    const result: CenterBorderColor[] = [new CenterBorderColor(from0, from1), new CenterBorderColor(to0, to1)];
    return Failable.ok(result);
  }
}
