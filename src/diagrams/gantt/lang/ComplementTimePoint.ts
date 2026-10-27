import { Failable } from '../../../core/gantt/Failable.js';
import { LocalDateTime } from '../../../core/time/LocalDateTime.js';
import { LocalTime } from '../../../core/time/LocalTime.js';
import type { CaptureLookup } from '../../../core/ubrex/CaptureLookup.js';
import { UBrexConcat } from '../../../core/ubrex/builder/UBrexConcat.js';
import { UBrexLeaf } from '../../../core/ubrex/builder/UBrexLeaf.js';
import { UBrexNamed } from '../../../core/ubrex/builder/UBrexNamed.js';
import { UBrexOptional } from '../../../core/ubrex/builder/UBrexOptional.js';
import type { UBrexPart } from '../../../core/ubrex/builder/UBrexPart.js';
import type { GanttDiagram } from '../GanttDiagram.js';
import { TimePoint } from '../time/TimePoint.js';
import { DayPattern } from './DayPattern.js';
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
 * ComplementTimePoint -- a day followed by `T`/`t`/space-less `HH:MM[:SS]`.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/ComplementTimePoint.java:52-100
 */
export class ComplementTimePoint implements Something<GanttDiagram> {
  private constructor() {}

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/ComplementTimePoint.java:56-58 */
  static any(): ComplementTimePoint {
    return new ComplementTimePoint();
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/ComplementTimePoint.java:60-67 */
  toUnicodeBracketedExpressionComplement(): UBrexPart {
    const dayPattern = new DayPattern('');
    return UBrexConcat.build(dayPattern.toUbrex(), this.toUbrexTime());
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/ComplementTimePoint.java:69-83 */
  private toUbrexTime(): UBrexPart {
    const digits1to2 = new UBrexLeaf('〇{1-2}〴d');
    const seconds = new UBrexOptional(UBrexConcat.build(new UBrexLeaf(':'), new UBrexNamed('SECOND', digits1to2)));
    return UBrexConcat.build(
      new UBrexLeaf('「Tt∙」'),
      new UBrexNamed('HOUR', digits1to2),
      new UBrexLeaf(':'),
      new UBrexNamed('MINUTE', digits1to2),
      seconds,
    );
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/ComplementTimePoint.java:85-91 */
  getMe(_gantt: GanttDiagram, arg: CaptureLookup): Failable<TimePoint> {
    const dayPattern = new DayPattern('');
    const day = dayPattern.getDay(arg);
    if (day === undefined) throw new Error('IllegalStateException');
    return Failable.ok(TimePoint.of(LocalDateTime.of(day, this.getTime(arg))));
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/ComplementTimePoint.java:93-99 */
  private getTime(arg: CaptureLookup): LocalTime {
    const hour = parseInt32(arg.findFirstValueByKey('HOUR'));
    const minute = parseInt32(arg.findFirstValueByKey('MINUTE'));
    const second = arg.findFirstValueByKey('SECOND') === undefined ? 0 : parseInt32(arg.findFirstValueByKey('SECOND'));
    return LocalTime.of(hour, minute, second);
  }
}
