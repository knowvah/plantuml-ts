import type { Failable } from '../../../core/gantt/Failable.js';
import type { CaptureLookup } from '../../../core/ubrex/CaptureLookup.js';
import { UBrexConcat } from '../../../core/ubrex/builder/UBrexConcat.js';
import { UBrexLeaf } from '../../../core/ubrex/builder/UBrexLeaf.js';
import { UBrexNamed } from '../../../core/ubrex/builder/UBrexNamed.js';
import { UBrexOptional } from '../../../core/ubrex/builder/UBrexOptional.js';
import { UBrexOr } from '../../../core/ubrex/builder/UBrexOr.js';
import type { UBrexPart } from '../../../core/ubrex/builder/UBrexPart.js';
import type { TaskInstant } from '../core/TaskInstant.js';
import type { GanttDiagram } from '../GanttDiagram.js';
import { AbstractComplementTaskInstant } from './AbstractComplementTaskInstant.js';
import { SubjectTask } from './SubjectTask.js';
import { Words } from './Words.js';

/**
 * ComplementBeforeOrAfterOrAtTaskStartOrEnd -- `[at|with|after|<n> days before|after] [Task] start|end`.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/ComplementBeforeOrAfterOrAtTaskStartOrEnd.java:50-94
 */
export class ComplementBeforeOrAfterOrAtTaskStartOrEnd extends AbstractComplementTaskInstant {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/ComplementBeforeOrAfterOrAtTaskStartOrEnd.java:52-88 */
  toUnicodeBracketedExpressionComplement(): UBrexPart {
    const durationBeforeOrAfter = UBrexConcat.build(
      new UBrexNamed('COMPLEMENT_NB1', new UBrexLeaf('〇+〴d')), // :55
      UBrexLeaf.spaceOneOrMore(),
      new UBrexOptional(
        UBrexConcat.build(new UBrexNamed('COMPLEMENT_WORKING1', new UBrexLeaf('working')), UBrexLeaf.spaceOneOrMore()),
      ), // :57-58
      new UBrexNamed('COMPLEMENT_DAY_OR_WEEK1', new UBrexLeaf('【day┇week】')), // :59
      new UBrexLeaf('〇?s'),
      new UBrexOptional(
        UBrexConcat.build(
          UBrexLeaf.spaceOneOrMore(),
          new UBrexLeaf('and'),
          UBrexLeaf.spaceOneOrMore(),
          new UBrexNamed('COMPLEMENT_NB2', new UBrexLeaf('〇+〴d')), // :65
          UBrexLeaf.spaceOneOrMore(),
          new UBrexOptional(
            UBrexConcat.build(
              new UBrexNamed('COMPLEMENT_WORKING2', new UBrexLeaf('working')),
              UBrexLeaf.spaceOneOrMore(),
            ),
          ), // :68-70
          new UBrexNamed('COMPLEMENT_DAY_OR_WEEK2', new UBrexLeaf('【day┇week】')), // :71
          new UBrexLeaf('〇?s'),
        ),
      ),
      UBrexLeaf.spaceOneOrMore(),
      new UBrexNamed('COMPLEMENT_BEFORE_OR_AFTER', Words.uoneOf(Words.BEFORE, Words.AFTER)), // :74
    );

    return UBrexConcat.build(
      new UBrexOptional(
        new UBrexOr(
          new UBrexLeaf(Words.AT), // :78
          new UBrexLeaf(Words.WITH), // :79
          new UBrexLeaf(Words.AFTER), // :80
          durationBeforeOrAfter, // :81
        ),
      ), // :77
      UBrexLeaf.spaceZeroOrMore(),
      UBrexConcat.build(
        SubjectTask.taskCode('COMPLEMENT_CODE_OTHER'), // :84
        new UBrexLeaf('〴.s'), // :85
      ),
      UBrexLeaf.spaceOneOrMore(),
      new UBrexNamed('COMPLEMENT_START_OR_END', Words.uoneOf(Words.START, Words.END)), // :87
    );
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/ComplementBeforeOrAfterOrAtTaskStartOrEnd.java:90-93 */
  getMe(gantt: GanttDiagram, arg: CaptureLookup): Failable<TaskInstant> {
    return this.getComplementTaskInstant(gantt, arg);
  }
}
