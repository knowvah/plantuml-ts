import { UFontFactory } from '../../../core/klimt/font/UFontFactory.js';
import type { ISkinSimple } from '../../../core/style/ISkinSimple.js';
import type { DataSource } from '../DataSource.js';
import type { Element } from '../element/Element.js';
import { ElementButton } from '../element/ElementButton.js';
import { Terminated } from '../Terminated.js';
import type { ElementFactory } from './ElementFactory.js';

/**
 * ElementFactoryButton — `[text]` token to an `ElementButton`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/factory/ElementFactoryButton.java:46-83
 */
export class ElementFactoryButton implements ElementFactory {
  /** @see ElementFactoryButton.java:48 */
  private readonly dataSource: DataSource;
  /** @see ElementFactoryButton.java:49 */
  private readonly spriteContainer: ISkinSimple;

  /** @see ElementFactoryButton.java:51-54 */
  constructor(dataSource: DataSource, spriteContainer: ISkinSimple) {
    this.dataSource = dataSource;
    this.spriteContainer = spriteContainer;
  }

  /** @see ElementFactoryButton.java:56-65 */
  create(): Terminated<Element> {
    if (!this.ready()) throw new Error('IllegalStateException');
    const next = this.dataSource.next();
    const text = next.getElement();
    const font = UFontFactory.byDefault(12);
    return new Terminated<Element>(
      new ElementButton(text.substring(1, text.length - 1), font, this.spriteContainer),
      next.getTerminator(),
    );
  }

  /** @see ElementFactoryButton.java:67-81 */
  ready(): boolean {
    const text = this.dataSource.peek(0).getElement();
    // A "[[url{tooltip}]]" creole link also starts with "[" and ends with
    // "]"; excluding a leading "[[" lets it fall through to ElementFactoryText
    // (dispatch-order fix, issue #2732, java:66-76).
    if (text.startsWith('[[')) return false;
    return text.startsWith('[') && text.endsWith(']');
  }
}
