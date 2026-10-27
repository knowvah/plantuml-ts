import { Failable } from '../../../core/gantt/Failable.js';
import type { LocalDate } from '../../../core/time/LocalDate.js';
import type { CaptureLookup } from '../../../core/ubrex/CaptureLookup.js';
import { UBrexConcat } from '../../../core/ubrex/builder/UBrexConcat.js';
import { UBrexLeaf } from '../../../core/ubrex/builder/UBrexLeaf.js';
import { UBrexNamed } from '../../../core/ubrex/builder/UBrexNamed.js';
import { UBrexOptional } from '../../../core/ubrex/builder/UBrexOptional.js';
import type { UBrexPart } from '../../../core/ubrex/builder/UBrexPart.js';
import { TaskAttribute } from '../core/TaskAttribute.js';
import { DaysAsDates } from '../DaysAsDates.js';
import type { GanttDiagram } from '../GanttDiagram.js';
import { AbstractComplementTaskInstant } from './AbstractComplementTaskInstant.js';
import { DayPattern } from './DayPattern.js';
import { SubjectTask } from './SubjectTask.js';
import { Words } from './Words.js';

/**
 * ComplementIntervalsSmart -- `<day> to [<n> days before|after] [Task] start|end`, resolved to a `DaysAsDates`.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/ComplementIntervalsSmart.java:54-111
 */
export class ComplementIntervalsSmart extends AbstractComplementTaskInstant {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/ComplementIntervalsSmart.java:56-92 */
  toUnicodeBracketedExpressionComplement(): UBrexPart {
    const dayPattern1 = new DayPattern('1'); // :58

    const durationBeforeOrAfter = UBrexConcat.build(
      new UBrexNamed('COMPLEMENT_NB1', new UBrexLeaf('〇+〴d')), // :61
      UBrexLeaf.spaceOneOrMore(),
      new UBrexOptional(
        UBrexConcat.build(new UBrexNamed('COMPLEMENT_WORKING1', new UBrexLeaf('working')), UBrexLeaf.spaceOneOrMore()),
      ), // :63-64
      new UBrexNamed('COMPLEMENT_DAY_OR_WEEK1', new UBrexLeaf('【day┇week】')), // :65
      new UBrexLeaf('〇?s'),
      new UBrexOptional(
        UBrexConcat.build(
          UBrexLeaf.spaceOneOrMore(),
          new UBrexLeaf('and'),
          UBrexLeaf.spaceOneOrMore(),
          new UBrexNamed('COMPLEMENT_NB2', new UBrexLeaf('〇+〴d')), // :71
          UBrexLeaf.spaceOneOrMore(),
          new UBrexOptional(
            UBrexConcat.build(
              new UBrexNamed('COMPLEMENT_WORKING2', new UBrexLeaf('working')),
              UBrexLeaf.spaceOneOrMore(),
            ),
          ), // :73-75
          new UBrexNamed('COMPLEMENT_DAY_OR_WEEK2', new UBrexLeaf('【day┇week】')), // :76
          new UBrexLeaf('〇?s'),
        ),
      ),
      UBrexLeaf.spaceOneOrMore(),
      new UBrexNamed('COMPLEMENT_BEFORE_OR_AFTER', Words.uoneOf(Words.BEFORE, Words.AFTER)), // :79
    );

    return UBrexConcat.build(
      dayPattern1.toUbrex(), // :82
      Words.uexactly(Words.TO), // :83
      UBrexLeaf.spaceZeroOrMore(),
      new UBrexOptional(durationBeforeOrAfter), // :85
      UBrexLeaf.spaceZeroOrMore(),
      UBrexConcat.build(
        SubjectTask.taskCode('COMPLEMENT_CODE_OTHER'), // :88
        new UBrexLeaf('〴.s'), // :89
      ),
      UBrexLeaf.spaceOneOrMore(),
      new UBrexNamed('COMPLEMENT_START_OR_END', Words.uoneOf(Words.START, Words.END)), // :91
    );
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/ComplementIntervalsSmart.java:94-109 */
  getMe(gantt: GanttDiagram, arg: CaptureLookup): Failable<DaysAsDates> {
    // Java passes the possibly-null `d1` straight to the constructor (:105); the grammar always captures it.
    const d1 = new DayPattern('1').getDay(arg) as LocalDate;

    const i2 = this.getComplementTaskInstant(gantt, arg);

    if (i2.isFail()) return Failable.error(i2.getError());

    const end = i2.get();
    let precise = end.getInstantPrecise();
    if (end.getAttribute() === TaskAttribute.END) precise = precise.decrement();

    const days = new DaysAsDates(d1, precise.toDay());
    return Failable.ok(days);
  }
}
