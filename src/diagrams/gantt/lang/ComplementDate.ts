import { Failable } from '../../../core/gantt/Failable.js';
import type { LocalDate } from '../../../core/time/LocalDate.js';
import type { CaptureLookup } from '../../../core/ubrex/CaptureLookup.js';
import { UBrexConcat } from '../../../core/ubrex/builder/UBrexConcat.js';
import { UBrexLeaf } from '../../../core/ubrex/builder/UBrexLeaf.js';
import { UBrexNamed } from '../../../core/ubrex/builder/UBrexNamed.js';
import { UBrexOr } from '../../../core/ubrex/builder/UBrexOr.js';
import type { UBrexPart } from '../../../core/ubrex/builder/UBrexPart.js';
import type { GanttDiagram } from '../GanttDiagram.js';
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
 * `static enum Type` (package-private), as-const object + type.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/ComplementDate.java:54-56
 */
const Type = {
  ANY: 'ANY',
  ONLY_RELATIVE: 'ONLY_RELATIVE',
  ONLY_ABSOLUTE: 'ONLY_ABSOLUTE',
} as const;
type Type = (typeof Type)[keyof typeof Type];

/**
 * ComplementDate -- an absolute date, "<n> day[s] after start" or a "d<n>" day count.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/ComplementDate.java:50-129
 */
export class ComplementDate implements Something<GanttDiagram> {
  readonly #type: Type;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/ComplementDate.java:58-60 */
  private constructor(type: Type) {
    this.#type = type;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/ComplementDate.java:62-64 */
  static any(): ComplementDate {
    return new ComplementDate(Type.ANY);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/ComplementDate.java:66-68 */
  static onlyRelative(): ComplementDate {
    return new ComplementDate(Type.ONLY_RELATIVE);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/ComplementDate.java:70-72 */
  static onlyAbsolute(): ComplementDate {
    return new ComplementDate(Type.ONLY_ABSOLUTE);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/ComplementDate.java:74-84 */
  toUnicodeBracketedExpressionComplement(): UBrexPart {
    const dayPattern = new DayPattern('');
    switch (this.#type) {
      case Type.ONLY_ABSOLUTE:
        return dayPattern.toUbrex();
      case Type.ONLY_RELATIVE:
        return new UBrexOr(this.#toUbrexD(), this.#toUbrexE());
      case Type.ANY:
        break;
    }
    return new UBrexOr(dayPattern.toUbrex(), this.#toUbrexD(), this.#toUbrexE());
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/ComplementDate.java:86-96 */
  #toUbrexD(): UBrexPart {
    return UBrexConcat.build(
      new UBrexNamed('DCOUNT', new UBrexLeaf('〇+〴d')),
      UBrexLeaf.spaceOneOrMore(),
      new UBrexLeaf('day〇?s'),
      UBrexLeaf.spaceOneOrMore(),
      new UBrexLeaf('after'),
      UBrexLeaf.spaceOneOrMore(),
      new UBrexLeaf('start'),
    );
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/ComplementDate.java:98-102 */
  #toUbrexE(): UBrexPart {
    return UBrexConcat.build(new UBrexLeaf('「dD」+'), new UBrexNamed('ECOUNT', new UBrexLeaf('〇+〴d')));
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/ComplementDate.java:104-117 */
  getMe(gantt: GanttDiagram, arg: CaptureLookup): Failable<LocalDate> {
    const dayPattern = new DayPattern('');
    const result = dayPattern.getDay(arg);
    if (result !== undefined) return Failable.ok(result);
    if (arg.findFirstValueByKey('DCOUNT') !== undefined) return Failable.ok(this.#resultD(gantt, arg));

    if (arg.findFirstValueByKey('ECOUNT') !== undefined) return Failable.ok(this.#resultE(gantt, arg));

    throw new Error('IllegalStateException');
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/ComplementDate.java:119-122 */
  #resultD(gantt: GanttDiagram, arg: CaptureLookup): LocalDate {
    const day = parseInt32(arg.findFirstValueByKey('DCOUNT'));
    return gantt.getMinDay().plusDays(day);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/ComplementDate.java:124-127 */
  #resultE(gantt: GanttDiagram, arg: CaptureLookup): LocalDate {
    const day = parseInt32(arg.findFirstValueByKey('ECOUNT'));
    return gantt.getMinDay().plusDays(day);
  }
}
