import type { DataSource } from '../DataSource.js';
import type { Element } from '../element/Element.js';
import { ElementPyramidScrolled } from '../element/ElementPyramidScrolled.js';
import { Positionner2 } from '../Positionner2.js';
import type { SaltDictionary } from '../SaltDictionary.js';
import { Terminated } from '../Terminated.js';
import { AbstractElementFactoryComplex } from './AbstractElementFactoryComplex.js';
import { fromDesc } from './ScrollStrategy.js';

/** The token that closes a structured block. @see ElementFactoryScroll.java:61 */
const CLOSE = '}';
/** The headers a scrolled pyramid answers to — exact, case-sensitive. @see ElementFactoryScroll.java:74 */
const HEADERS: readonly string[] = ['{S', '{S-', '{SI'];

/**
 * ElementFactoryScroll — the scrolled pyramid `{S`/`{SI`/`{S-`: every cell
 * from `getNextElement()` goes into a `Positionner2` (no `*` merge, unlike
 * `ElementFactoryPyramid`), and the header picks the `ScrollStrategy`.
 *
 * The Java's `if (TeaVM.a()) assert header.startsWith("{")` (java:58) is a
 * JVM `assert`, off in the jar (no `-ea`); not ported.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/factory/ElementFactoryScroll.java:46-79
 */
export class ElementFactoryScroll extends AbstractElementFactoryComplex {
  /** @see ElementFactoryScroll.java:48-50 */
  constructor(dataSource: DataSource, dictionary: SaltDictionary) {
    super(dataSource, dictionary);
  }

  /** @see ElementFactoryScroll.java:52-70 */
  create(): Terminated<Element> {
    if (!this.ready()) {
      throw new Error('IllegalStateException');
    }
    const tmp = this.getDataSource().next();
    const header = tmp.getElement();

    const positionner = new Positionner2();

    while (this.getDataSource().peek(0).getElement() !== CLOSE) {
      const next = this.getNextElement();
      positionner.add(next);
    }
    const next = this.getDataSource().next();
    return new Terminated<Element>(
      new ElementPyramidScrolled(positionner, this.getDictionary(), fromDesc(header)),
      next.getTerminator(),
    );
  }

  /** @see ElementFactoryScroll.java:72-78 */
  ready(): boolean {
    const text = this.getDataSource().peek(0).getElement();
    if (HEADERS.includes(text)) {
      return true;
    }
    return false;
  }
}
