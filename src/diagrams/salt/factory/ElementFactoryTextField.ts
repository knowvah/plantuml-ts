import { UFontFactory } from '../../../core/klimt/font/UFontFactory.js';
import type { ISkinSimple } from '../../../core/style/ISkinSimple.js';
import type { DataSource } from '../DataSource.js';
import type { Element } from '../element/Element.js';
import { ElementTextField } from '../element/ElementTextField.js';
import { Terminated } from '../Terminated.js';
import type { ElementFactory } from './ElementFactory.js';

/**
 * ElementFactoryTextField — `"text"` token to an `ElementTextField`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/factory/ElementFactoryTextField.java:46-73
 */
export class ElementFactoryTextField implements ElementFactory {
  /** @see ElementFactoryTextField.java:48 */
  private readonly dataSource: DataSource;
  /** @see ElementFactoryTextField.java:49 */
  private readonly spriteContainer: ISkinSimple;

  /** @see ElementFactoryTextField.java:51-54 */
  constructor(dataSource: DataSource, spriteContainer: ISkinSimple) {
    this.dataSource = dataSource;
    this.spriteContainer = spriteContainer;
  }

  /** @see ElementFactoryTextField.java:56-66 */
  create(): Terminated<Element> {
    if (!this.ready()) throw new Error('IllegalStateException');
    const next = this.dataSource.next();
    const text = next.getElement();
    const font = UFontFactory.byDefault(12);
    return new Terminated<Element>(
      new ElementTextField(text.substring(1, text.length - 1), font, this.spriteContainer),
      next.getTerminator(),
    );
  }

  /** @see ElementFactoryTextField.java:68-71 */
  ready(): boolean {
    const text = this.dataSource.peek(0).getElement();
    return text.startsWith('"') && text.endsWith('"');
  }
}
