import { UBrexConcat } from '../../../core/ubrex/builder/UBrexConcat.js';
import { UBrexLeaf } from '../../../core/ubrex/builder/UBrexLeaf.js';
import { UBrexOr } from '../../../core/ubrex/builder/UBrexOr.js';
import type { UBrexPart } from '../../../core/ubrex/builder/UBrexPart.js';
import { UBrexZeroOrMore } from '../../../core/ubrex/builder/UBrexZeroOrMore.js';

/**
 * Words — the keyword constants and ubrex word-list builders of the gantt grammar.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/Words.java:44-111
 */
export class Words {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/Words.java:46-62 */
  static readonly AFTER = 'after';
  static readonly AND = 'and';
  static readonly AS = 'as';
  static readonly AT = 'at';
  static readonly BEFORE = 'before';
  static readonly COMPLETION = 'completion';
  static readonly DAY = 'day';
  static readonly END = 'end';
  static readonly FOR = 'for';
  static readonly FROM = 'from';
  static readonly ON = 'on';
  static readonly START = 'start';
  static readonly THE = 'the';
  static readonly TO = 'to';
  static readonly WEEK = 'week';
  static readonly WITH = 'with';
  static readonly WORKING = 'working';

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/Words.java:64-65 */
  static readonly THEN = 'then';
  static readonly IT = 'it';

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/Words.java:67-74 */
  static uzeroOrMore(...words: string[]): UBrexPart {
    const tmp: UBrexLeaf[] = [];
    for (const word of words) tmp.push(new UBrexLeaf(word));

    const or = new UBrexOr(...tmp);
    return new UBrexZeroOrMore(UBrexConcat.build(or, UBrexLeaf.spaceOneOrMore()));
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/Words.java:76-82 */
  static uoneOf(...words: string[]): UBrexPart {
    const tmp: UBrexLeaf[] = [];
    for (const word of words) tmp.push(new UBrexLeaf(word));

    return new UBrexOr(...tmp);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/Words.java:84-91 */
  static uexactly(...words: string[]): UBrexPart {
    const tmp: UBrexPart[] = [];
    for (const word of words) {
      tmp.push(UBrexLeaf.spaceOneOrMore());
      tmp.push(new UBrexLeaf(word));
    }
    return UBrexConcat.build(...tmp);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/Words.java:93-102 */
  static uexactly2(...words: string[]): UBrexPart {
    const tmp: UBrexPart[] = [];
    for (let i = 0; i < words.length; i++) {
      if (i > 0) tmp.push(UBrexLeaf.spaceOneOrMore());
      tmp.push(new UBrexLeaf(words[i] as string));
    }
    return UBrexConcat.build(...tmp);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/Words.java:103-105 */
  static usingle(word: string): UBrexPart {
    return new UBrexLeaf(word);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/Words.java:107-109 */
  static uconcat(...expressions: UBrexPart[]): UBrexPart {
    return UBrexConcat.build(...expressions);
  }
}
