import { UFontFactory } from '../../../core/klimt/font/UFontFactory.js';
import type { ISkinSimple } from '../../../core/style/ISkinSimple.js';
import type { DataSource } from '../DataSource.js';
import type { Element } from '../element/Element.js';
import { ElementDroplist } from '../element/ElementDroplist.js';
import { Terminated } from '../Terminated.js';
import type { ElementFactory } from './ElementFactory.js';

/**
 * ElementFactoryDroplist — `^text^` token to an `ElementDroplist`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/factory/ElementFactoryDroplist.java:46-71
 */
export class ElementFactoryDroplist implements ElementFactory {
  /** @see ElementFactoryDroplist.java:48 */
  private readonly dataSource: DataSource;
  /** @see ElementFactoryDroplist.java:49 */
  private readonly spriteContainer: ISkinSimple;

  /** @see ElementFactoryDroplist.java:51-54 */
  constructor(dataSource: DataSource, spriteContainer: ISkinSimple) {
    this.dataSource = dataSource;
    this.spriteContainer = spriteContainer;
  }

  /** @see ElementFactoryDroplist.java:56-65 */
  create(): Terminated<Element> {
    if (!this.ready()) throw new Error('IllegalStateException');
    const next = this.dataSource.next();
    const text = next.getElement();
    const font = UFontFactory.byDefault(12);
    return new Terminated<Element>(
      new ElementDroplist(text.substring(1, text.length - 1), font, this.spriteContainer),
      next.getTerminator(),
    );
  }

  /** @see ElementFactoryDroplist.java:67-70 */
  ready(): boolean {
    const text = this.dataSource.peek(0).getElement();
    return text.startsWith('^') && text.endsWith('^');
  }
}
