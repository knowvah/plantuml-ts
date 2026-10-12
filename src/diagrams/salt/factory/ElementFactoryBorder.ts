import type { DataSource } from '../DataSource.js';
import type { Element } from '../element/Element.js';
import { ElementBorder } from '../element/ElementBorder.js';
import type { SaltDictionary } from '../SaltDictionary.js';
import { Terminated } from '../Terminated.js';
import { AbstractElementFactoryComplex } from './AbstractElementFactoryComplex.js';

/** The token that closes a structured block. @see ElementFactoryBorder.java:65 */
const CLOSE = '}';
/** The headers a border answers to (no `{^`), in upstream's test order. @see ElementFactoryBorder.java:94 */
const HEADERS: readonly string[] = ['{', '{+', '{#', '{!', '{-'];
/** A whole `N=`/`S=`/`E=`/`W=` token — no `C=` (Java `String#matches` is a full match). @see ElementFactoryBorder.java:96 */
const BORDER_POSITION = /^[NSEW]=$/;

/**
 * ElementFactoryBorder — the border layout `{ N=… S=… E=… W=… C=… }`: each
 * position token is dispatched on its FIRST char only (so `Wxyz` sets the
 * west), the region is the next `getNextElement()`; any other first char is
 * an `IllegalStateException`.
 *
 * Upstream's commented-out header strategy (java:61-64) is not ported. The
 * Java's `if (TeaVM.a()) assert header.startsWith("{")` (java:58) is a JVM
 * `assert`, off in the jar (no `-ea`); not ported.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/factory/ElementFactoryBorder.java:45-103
 */
export class ElementFactoryBorder extends AbstractElementFactoryComplex {
  /** @see ElementFactoryBorder.java:47-49 */
  constructor(dataSource: DataSource, dictionary: SaltDictionary) {
    super(dataSource, dictionary);
  }

  /** @see ElementFactoryBorder.java:51-90 */
  create(): Terminated<Element> {
    if (!this.ready()) {
      throw new Error('IllegalStateException');
    }
    this.getDataSource().next(); // `header`, read only by the assert (java:57-58)

    const result = new ElementBorder();

    while (this.getDataSource().peek(0).getElement() !== CLOSE) {
      const pos = this.getDataSource().next().getElement();
      this.setPosition(result, pos);
    }
    const next = this.getDataSource().next();
    return new Terminated<Element>(result, next.getTerminator());
  }

  /**
   * The loop body's `switch` (java:67-86), split out only to keep `create`
   * inside the complexity limit; dispatch and order unchanged.
   * @see ElementFactoryBorder.java:67-86
   */
  private setPosition(result: ElementBorder, pos: string): void {
    switch (pos.charAt(0)) {
      case 'N':
        result.setNorth(this.getNextElement().getElement());
        break;
      case 'S':
        result.setSouth(this.getNextElement().getElement());
        break;
      case 'E':
        result.setEast(this.getNextElement().getElement());
        break;
      case 'W':
        result.setWest(this.getNextElement().getElement());
        break;
      case 'C':
        result.setCenter(this.getNextElement().getElement());
        break;
      default:
        throw new Error('IllegalStateException');
    }
  }

  /** @see ElementFactoryBorder.java:92-102 */
  ready(): boolean {
    const text = this.getDataSource().peek(0).getElement();
    if (HEADERS.includes(text)) {
      const text1 = this.getDataSource().peek(1).getElement();
      if (BORDER_POSITION.test(text1)) {
        return true;
      }
      return false;
    }
    return false;
  }
}
