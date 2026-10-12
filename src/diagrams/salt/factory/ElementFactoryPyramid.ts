import { eventuallyRemoveStartingAndEndingDoubleQuote } from '../../../core/url/Url.js';
import type { DataSource } from '../DataSource.js';
import type { Element } from '../element/Element.js';
import { ElementPyramid } from '../element/ElementPyramid.js';
import { ElementText } from '../element/ElementText.js';
import { fromChar, TableStrategy } from '../element/TableStrategy.js';
import { Positionner2 } from '../Positionner2.js';
import type { SaltDictionary } from '../SaltDictionary.js';
import { Terminated } from '../Terminated.js';
import { Terminator } from '../Terminator.js';
import { AbstractElementFactoryComplex } from './AbstractElementFactoryComplex.js';
import { ElementFactoryTree } from './ElementFactoryTree.js';

/** The token that closes a structured block. @see ElementFactoryPyramid.java:75 */
const CLOSE = '}';
/** The cell that merges into its left neighbour. @see ElementFactoryPyramid.java:92 */
const STAR = '*';
/** The quote `eventuallyRemoveStartingAndEndingDoubleQuote` strips from a title. @see ElementFactoryPyramid.java:70 */
const TITLE_QUOTES = '"';
/** The headers a pyramid answers to, in upstream's test order. @see ElementFactoryPyramid.java:97-98 */
const HEADERS: readonly string[] = ['{', '{+', '{^', '{#', '{!', '{-'];
/** A whole `N=`/`S=`/`E=`/`W=` token (Java `String#matches` is a full match). @see ElementFactoryPyramid.java:100 */
const BORDER_POSITION = /^[NSEW]=$/;

/**
 * ElementFactoryPyramid — the salt grid `{ … }` (and `{+`, `{^`, `{#`, `{!`,
 * `{-`): every cell comes from `getNextElement()` and goes into a
 * `Positionner2`, except a `*` text cell, which merges the previous cell
 * right. The header's second char is the `TableStrategy`; `{^` followed on
 * the same line by a token takes that token as the title, one pair of
 * double quotes stripped.
 *
 * `ready()` declines a header followed by a border position (`ElementFactoryBorder`)
 * or a tree marker (`ElementFactoryTree`).
 *
 * The Java's `if (TeaVM.a()) assert header.startsWith("{")` (java:62) is a
 * JVM `assert`, off in the jar (no `-ea`); not ported.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/factory/ElementFactoryPyramid.java:50-107
 */
export class ElementFactoryPyramid extends AbstractElementFactoryComplex {
  /** @see ElementFactoryPyramid.java:52-54 */
  constructor(dataSource: DataSource, dictionary: SaltDictionary) {
    super(dataSource, dictionary);
  }

  /** @see ElementFactoryPyramid.java:56-86 */
  create(): Terminated<Element> {
    if (!this.ready()) {
      throw new Error('IllegalStateException');
    }
    const tmp = this.getDataSource().next();
    const header = tmp.getElement();
    let title: string | null = null;

    let strategy: TableStrategy = TableStrategy.DRAW_NONE;
    if (header.length === 2) {
      // Invariant: ready() admits only HEADERS, whose second chars all map
      // (TableStrategy.java:39-46).
      strategy = fromChar(header.charAt(1)) as TableStrategy;
    }
    if (strategy === TableStrategy.DRAW_OUTSIDE_WITH_TITLE && tmp.getTerminator() === Terminator.NEWCOL) {
      // A non-null input comes back non-null (StringUtils.java:63-90).
      title = eventuallyRemoveStartingAndEndingDoubleQuote(this.getDataSource().next().getElement(), TITLE_QUOTES);
    }

    const positionner = new Positionner2();

    while (this.getDataSource().peek(0).getElement() !== CLOSE) {
      const next = this.getNextElement();
      if (this.isStar(next.getElement())) {
        positionner.mergeLeft(next.getTerminator());
      } else {
        positionner.add(next);
      }
    }
    const next = this.getDataSource().next();
    return new Terminated<Element>(
      new ElementPyramid(positionner, strategy, title, this.getDictionary()),
      next.getTerminator(),
    );
  }

  /** @see ElementFactoryPyramid.java:88-93 */
  private isStar(element: Element): boolean {
    if (!(element instanceof ElementText)) {
      return false;
    }
    return STAR === element.getText();
  }

  /** @see ElementFactoryPyramid.java:95-106 */
  ready(): boolean {
    const text = this.getDataSource().peek(0).getElement();
    if (HEADERS.includes(text)) {
      const text1 = this.getDataSource().peek(1).getElement();
      if (BORDER_POSITION.test(text1) || ElementFactoryTree.isTreeMarker(text1)) {
        return false;
      }
      return true;
    }
    return false;
  }
}
