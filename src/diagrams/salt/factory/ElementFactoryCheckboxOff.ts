import { trin } from '../../../core/style/parser/StyleParser.js';
import { UFontFactory } from '../../../core/klimt/font/UFontFactory.js';
import type { ISkinSimple } from '../../../core/style/ISkinSimple.js';
import type { DataSource } from '../DataSource.js';
import type { Element } from '../element/Element.js';
import { ElementRadioCheckbox } from '../element/ElementRadioCheckbox.js';
import { Terminated } from '../Terminated.js';
import type { ElementFactory } from './ElementFactory.js';

/**
 * ElementFactoryCheckboxOff — recognises the `[] / [ ]` token and builds the
 * matching `ElementRadioCheckbox` from the text after the `]`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/factory/ElementFactoryCheckboxOff.java:50-81
 */
export class ElementFactoryCheckboxOff implements ElementFactory {
  /** @see ElementFactoryCheckboxOff.java:53-54 */
  private readonly dataSource: DataSource;
  /** @see ElementFactoryCheckboxOff.java:53-54 */
  private readonly spriteContainer: ISkinSimple;

  /** @see ElementFactoryCheckboxOff.java:56-59 */
  constructor(dataSource: DataSource, spriteContainer: ISkinSimple) {
    this.dataSource = dataSource;
    this.spriteContainer = spriteContainer;
  }

  /** @see ElementFactoryCheckboxOff.java:61-70 */
  create(): Terminated<Element> {
    if (this.ready() === false) {
      throw new Error('IllegalStateException');
    }
    const next = this.dataSource.next();
    const text = next.getElement();
    const font = UFontFactory.byDefault(12);
    return new Terminated<Element>(
      new ElementRadioCheckbox(this.extracted(text), font, false, false, this.spriteContainer),
      next.getTerminator(),
    );
  }

  /** @see ElementFactoryCheckboxOff.java:72-75 */
  private extracted(text: string): string[] {
    const x = text.indexOf(']');
    return [trin(text.substring(x + 1))];
  }

  /** @see ElementFactoryCheckboxOff.java:77-80 */
  ready(): boolean {
    const text = this.dataSource.peek(0).getElement();
    return text.startsWith('[]') || text.startsWith('[ ]');
  }
}
