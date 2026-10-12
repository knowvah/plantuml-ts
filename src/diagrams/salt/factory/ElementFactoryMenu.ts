import { UFontFactory } from '../../../core/klimt/font/UFontFactory.js';
import type { DataSource } from '../DataSource.js';
import type { Element } from '../element/Element.js';
import { ElementMenuBar } from '../element/ElementMenuBar.js';
import type { SaltDictionary } from '../SaltDictionary.js';
import { Terminated } from '../Terminated.js';
import { Terminator } from '../Terminator.js';
import { AbstractElementFactoryComplex } from './AbstractElementFactoryComplex.js';

/** The token that closes a structured block. @see ElementFactoryMenu.java:66 */
const CLOSE = '}';
/** The only header a menu bar answers to. @see ElementFactoryMenu.java:86 */
const HEADER = '{*';
/** The font size every factory asks for (`byDefault` ignores it). @see ElementFactoryMenu.java:61 */
const FONT_SIZE = 12;

/**
 * ElementFactoryMenu — the menu bar `{* File | Edit … }`: every token of the
 * header's line is a bar entry; on each later line the first token names
 * the entry and the rest are its popup's sub-entries. A name that matches
 * no entry is `ElementMenuBar#addSubEntry`'s `IllegalArgumentException`,
 * not caught here (the jar crash of salt/lakari-33-mone874,
 * ElementFactoryMenu.java:74 → ElementMenuBar.java:87).
 *
 * The Java's `if (TeaVM.a()) assert header.startsWith("{*")` (java:59) is a
 * JVM `assert`, off in the jar (no `-ea`); not ported.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/factory/ElementFactoryMenu.java:48-91
 */
export class ElementFactoryMenu extends AbstractElementFactoryComplex {
  /** @see ElementFactoryMenu.java:50-52 */
  constructor(dataSource: DataSource, dictionary: SaltDictionary) {
    super(dataSource, dictionary);
  }

  /** `subentry` is Java `null` on the header's line, `""` at a line start. @see ElementFactoryMenu.java:54-82 */
  create(): Terminated<Element> {
    if (!this.ready()) {
      throw new Error('IllegalStateException');
    }
    this.getDataSource().next(); // `header`, read only by the assert (java:58-59)

    const font = UFontFactory.byDefault(FONT_SIZE);
    const result = new ElementMenuBar(font, this.getDictionary());

    let subentry: string | null = null;

    while (this.getDataSource().peek(0).getElement() !== CLOSE) {
      const t = this.getDataSource().next();
      const s = t.getElement();
      if (subentry === null) {
        result.addEntry(s);
      } else if (subentry.length === 0) {
        subentry = s;
      } else {
        result.addSubEntry(subentry, s);
      }
      if (t.getTerminator() === Terminator.NEWLINE) {
        subentry = '';
      }
    }
    const next = this.getDataSource().next();
    return new Terminated<Element>(result, next.getTerminator());
  }

  /** @see ElementFactoryMenu.java:84-90 */
  ready(): boolean {
    const text = this.getDataSource().peek(0).getElement();
    if (text === HEADER) {
      return true;
    }
    return false;
  }
}
