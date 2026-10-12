import type { DataSource } from '../DataSource.js';
import type { Element } from '../element/Element.js';
import { ElementLine } from '../element/ElementLine.js';
import { Terminated } from '../Terminated.js';
import type { ElementFactory } from './ElementFactory.js';

/**
 * ElementFactoryLine — turns a `--…--`, `==…==`, `~~…~~` or `..…..` token
 * into an `ElementLine` of its first character.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/factory/ElementFactoryLine.java:43-81
 */
export class ElementFactoryLine implements ElementFactory {
  /** @see ElementFactoryLine.java:45 */
  private readonly dataSource: DataSource;

  /** @see ElementFactoryLine.java:47-49 */
  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
  }

  /** @see ElementFactoryLine.java:51-58 */
  create(): Terminated<Element> {
    if (!this.ready()) throw new Error('IllegalStateException');
    const next = this.dataSource.next();
    const text = next.getElement();
    return new Terminated<Element>(new ElementLine(text.charAt(0)), next.getTerminator());
  }

  /** @see ElementFactoryLine.java:60-75 */
  ready(): boolean {
    const text = this.dataSource.peek(0).getElement();
    if (this.isLine(text, '-')) return true;
    if (this.isLine(text, '=')) return true;
    if (this.isLine(text, '~')) return true;
    if (this.isLine(text, '.')) return true;
    return false;
  }

  /** @see ElementFactoryLine.java:77-80 */
  private isLine(text: string, c: string): boolean {
    const s = c + c;
    return text.startsWith(s) && text.endsWith(s);
  }
}
