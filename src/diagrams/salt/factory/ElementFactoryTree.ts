import { UFontFactory } from '../../../core/klimt/font/UFontFactory.js';
import type { DataSource } from '../DataSource.js';
import type { Element } from '../element/Element.js';
import { ElementTree } from '../element/ElementTree.js';
import { fromChar, TableStrategy } from '../element/TableStrategy.js';
import type { SaltDictionary } from '../SaltDictionary.js';
import { Terminated } from '../Terminated.js';
import { Terminator } from '../Terminator.js';
import { AbstractElementFactoryComplex } from './AbstractElementFactoryComplex.js';

/** The token that closes a structured block. @see ElementFactoryTree.java:79, 84 */
const CLOSE = '}';
/** The prefix of a token that opens a nested block. @see ElementFactoryTree.java:86 */
const OPEN = '{';
/** The tree-table marker after `{`. @see ElementFactoryTree.java:128-131 */
const TREE_MARKER = 'T';
/** The font size every factory asks for (`byDefault` ignores it). @see ElementFactoryTree.java:65 */
const FONT_SIZE = 12;

/**
 * ElementFactoryTree — the `{T` tree table: `{` then a `T`/`T<strategy>`
 * token, one row per line. A row's first cell is read as ONE raw token
 * (its leading `+` run is the level, `ElementTree#addEntry`); every other
 * cell is dispatched through `getNextElement()`, so a widget or a nested
 * `{ … }` group is one cell (issue #2730). A raw first cell starting with `{`
 * or equal to `}` moves a depth counter, so a raw group's `}` does not close
 * the tree.
 *
 * `PSystemSalt#createElement` builds ONE instance and wires it into every
 * complex factory, itself included (PSystemSalt.java:174-200).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/factory/ElementFactoryTree.java:48-137
 */
export class ElementFactoryTree extends AbstractElementFactoryComplex {
  /** @see ElementFactoryTree.java:50-52 */
  constructor(dataSource: DataSource, dictionary: SaltDictionary) {
    super(dataSource, dictionary);
  }

  /** @see ElementFactoryTree.java:54-110 */
  create(): Terminated<Element> {
    if (!this.ready()) {
      throw new Error('IllegalStateException');
    }
    const strategy = this.readHeader();

    const font = UFontFactory.byDefault(FONT_SIZE);
    const result = new ElementTree(font, this.getDictionary(), strategy);

    let takeMe = true;
    let depth = 0;
    while (depth > 0 || this.getDataSource().peek(0).getElement() !== CLOSE) {
      if (takeMe) {
        const t = this.getDataSource().next();
        const s = t.getElement();
        if (s === CLOSE) {
          depth--;
        } else if (s.startsWith(OPEN)) {
          depth++;
        }
        result.addEntry(s);
        takeMe = t.getTerminator() === Terminator.NEWLINE;
      } else {
        const next = this.getNextElement();
        result.addCellToEntry(next.getElement());
        takeMe = next.getTerminator() === Terminator.NEWLINE;
      }
    }
    const next = this.getDataSource().next();
    return new Terminated<Element>(result, next.getTerminator());
  }

  /**
   * Consumes the `{` header and the `T` marker and answers the marker's
   * strategy — `create`'s opening statements (java:58-63), split out only to
   * keep `create` inside the complexity limit; statement order unchanged.
   * @see ElementFactoryTree.java:58-63
   */
  private readHeader(): TableStrategy {
    this.getDataSource().next(); // `header`, unused upstream (java:58)
    const textT = this.getDataSource().next().getElement();
    let strategy: TableStrategy = TableStrategy.DRAW_NONE;
    if (textT.length === 2) {
      // Invariant: ready() admitted textT only as a tree marker, whose
      // second char maps (isTreeMarker, java:131-134).
      strategy = fromChar(textT.charAt(1)) as TableStrategy;
    }
    return strategy;
  }

  /** @see ElementFactoryTree.java:112-119 */
  ready(): boolean {
    const text = this.getDataSource().peek(0).getElement();
    if (text === OPEN) {
      const text1 = this.getDataSource().peek(1).getElement();
      return ElementFactoryTree.isTreeMarker(text1);
    }
    return false;
  }

  /**
   * Whether `text1` is a tree-table marker: `T`, or `T` + a char
   * `TableStrategy.fromChar` maps. Shared with `ElementFactoryPyramid#ready`
   * (issue #2730). Package-private upstream; TS has no package scope.
   * @see ElementFactoryTree.java:127-136
   */
  static isTreeMarker(text1: string): boolean {
    if (text1 === TREE_MARKER) {
      return true;
    }
    if (text1.length === 2 && text1.startsWith(TREE_MARKER)) {
      const c = text1.charAt(1);
      return fromChar(c) !== undefined;
    }
    return false;
  }
}
