import { UBrexLeaf } from '../../../core/ubrex/builder/UBrexLeaf.js';
import type { UBrexPart } from '../../../core/ubrex/builder/UBrexPart.js';

/**
 * Verbs — the verb ubrex leaves of the gantt grammar.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/Verbs.java:41-74
 */
export class Verbs {
  private readonly ubrex: UBrexPart;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/Verbs.java:45-47 */
  toUnicodeBracketedExpression(): UBrexPart {
    return this.ubrex;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/Verbs.java:49-51 */
  constructor(ubrex: UBrexLeaf) {
    this.ubrex = ubrex;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/Verbs.java:53 */
  static are = new Verbs(new UBrexLeaf('are'));
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/Verbs.java:54 */
  static areColored = new Verbs(new UBrexLeaf('are 〇+〴s colo〇?ured'));
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/Verbs.java:55 */
  static displayOnSameRowAs = new Verbs(new UBrexLeaf('display〇?s 〇+〴s on 〇+〴s same 〇+〴s row 〇+〴s as'));
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/Verbs.java:56 */
  static ends = new Verbs(new UBrexLeaf('ends'));
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/Verbs.java:57 */
  static happens = new Verbs(new UBrexLeaf('happens'));
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/Verbs.java:58 */
  static is = new Verbs(new UBrexLeaf('is'));
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/Verbs.java:59 */
  static isColored = new Verbs(new UBrexLeaf('is 〇+〴s colo〇?ured'));
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/Verbs.java:60 */
  static isDeleted = new Verbs(new UBrexLeaf('is 〇+〴s deleted'));
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/Verbs.java:61 */
  static isDisplayedAs = new Verbs(new UBrexLeaf('is 〇+〴s displayed 〇+〴s as'));
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/Verbs.java:62 */
  static isOff = new Verbs(new UBrexLeaf('is 〇+〴s off'));
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/Verbs.java:63 */
  static isOn = new Verbs(new UBrexLeaf('is 〇+〴s on'));
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/Verbs.java:64 */
  static isOrAre = new Verbs(new UBrexLeaf('【is┇are】'));
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/Verbs.java:65 */
  static isOrAreNamed = new Verbs(new UBrexLeaf('【is┇are】〇+〴s named'));
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/Verbs.java:66 */
  static just = new Verbs(new UBrexLeaf('just'));
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/Verbs.java:67 */
  static linksTo = new Verbs(new UBrexLeaf('links 〇+〴s to'));
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/Verbs.java:68 */
  static occurs = new Verbs(new UBrexLeaf('occurs'));
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/Verbs.java:69 */
  static pauses = new Verbs(new UBrexLeaf('pauses'));
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/Verbs.java:70 */
  static requires = new Verbs(new UBrexLeaf('【lasts┇requires】'));
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/Verbs.java:71 */
  static starts = new Verbs(new UBrexLeaf('starts'));
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/Verbs.java:72 */
  static worksOn = new Verbs(new UBrexLeaf('works 〇+〴s on'));
}
