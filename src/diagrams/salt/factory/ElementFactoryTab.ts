import { UFontFactory } from '../../../core/klimt/font/UFontFactory.js';
import type { DataSource } from '../DataSource.js';
import type { Element } from '../element/Element.js';
import { ElementTabBar } from '../element/ElementTabBar.js';
import type { SaltDictionary } from '../SaltDictionary.js';
import { Terminated } from '../Terminated.js';
import { Terminator } from '../Terminator.js';
import { AbstractElementFactoryComplex } from './AbstractElementFactoryComplex.js';

/** The token that closes a structured block. @see ElementFactoryTab.java:64 */
const CLOSE = '}';
/** The only header a tab bar answers to. @see ElementFactoryTab.java:77 */
const HEADER = '{/';
/** The font size every factory asks for (`byDefault` ignores it). @see ElementFactoryTab.java:61 */
const FONT_SIZE = 12;

/**
 * ElementFactoryTab — the tab bar `{/ One | Two … }`: every token is a tab;
 * the bar turns vertical as soon as one tab ends its source line.
 *
 * The Java's `if (TeaVM.a()) assert header.startsWith("{/")` (java:59) is a
 * JVM `assert`, off in the jar (no `-ea`); not ported.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/factory/ElementFactoryTab.java:48-82
 */
export class ElementFactoryTab extends AbstractElementFactoryComplex {
  /** @see ElementFactoryTab.java:50-52 */
  constructor(dataSource: DataSource, dictionary: SaltDictionary) {
    super(dataSource, dictionary);
  }

  /** @see ElementFactoryTab.java:54-73 */
  create(): Terminated<Element> {
    if (!this.ready()) {
      throw new Error('IllegalStateException');
    }
    this.getDataSource().next(); // `header`, read only by the assert (java:58-59)

    const font = UFontFactory.byDefault(FONT_SIZE);
    const result = new ElementTabBar(font, this.getDictionary());

    while (this.getDataSource().peek(0).getElement() !== CLOSE) {
      const t = this.getDataSource().next();
      result.addTab(t.getElement());
      if (t.getTerminator() === Terminator.NEWLINE) {
        result.setVertical(true);
      }
    }
    const next = this.getDataSource().next();
    return new Terminated<Element>(result, next.getTerminator());
  }

  /** @see ElementFactoryTab.java:75-81 */
  ready(): boolean {
    const text = this.getDataSource().peek(0).getElement();
    if (text === HEADER) {
      return true;
    }
    return false;
  }
}
