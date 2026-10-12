import { UFontFactory } from '../../../core/klimt/font/UFontFactory.js';
import type { ISkinSimple } from '../../../core/style/ISkinSimple.js';
import type { DataSource } from '../DataSource.js';
import type { Element } from '../element/Element.js';
import { ElementText } from '../element/ElementText.js';
import { Terminated } from '../Terminated.js';
import type { ElementFactory } from './ElementFactory.js';
import { trin } from '../../../core/style/parser/StyleParser.js';
/**
 * ElementFactoryText — any token not opening/closing a block to an `ElementText`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/factory/ElementFactoryText.java:49-79
 */
export class ElementFactoryText implements ElementFactory {
  /** @see ElementFactoryText.java:51 */
  private readonly dataSource: DataSource;
  /** @see ElementFactoryText.java:52 */
  private readonly spriteContainer: ISkinSimple;

  /** @see ElementFactoryText.java:54-57 */
  constructor(dataSource: DataSource, spriteContainer: ISkinSimple) {
    this.dataSource = dataSource;
    this.spriteContainer = spriteContainer;
  }

  /** @see ElementFactoryText.java:59-68 */
  create(): Terminated<Element> {
    if (!this.ready()) throw new Error('IllegalStateException');
    const next = this.dataSource.next();
    const text = next.getElement();
    const font = UFontFactory.byDefault(12);
    return new Terminated<Element>(new ElementText([text], font, this.spriteContainer), next.getTerminator());
  }

  /** @see ElementFactoryText.java:70-77 */
  ready(): boolean {
    const text = this.dataSource.peek(0).getElement();
    // return text.startsWith("\\"") && text.endsWith("\\"");
    if (text.startsWith('{') || text.startsWith('}')) return false;
    return trin(text).length > 0;
  }
}
