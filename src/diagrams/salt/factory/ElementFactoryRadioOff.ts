import { trin } from '../../../core/style/parser/StyleParser.js';
import { UFontFactory } from '../../../core/klimt/font/UFontFactory.js';
import type { ISkinSimple } from '../../../core/style/ISkinSimple.js';
import type { DataSource } from '../DataSource.js';
import type { Element } from '../element/Element.js';
import { ElementRadioCheckbox } from '../element/ElementRadioCheckbox.js';
import { Terminated } from '../Terminated.js';
import type { ElementFactory } from './ElementFactory.js';

/**
 * ElementFactoryRadioOff — recognises the `() / ( )` token and builds the
 * matching `ElementRadioCheckbox` from the text after the `)`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/factory/ElementFactoryRadioOff.java:50-80
 */
export class ElementFactoryRadioOff implements ElementFactory {
  /** @see ElementFactoryRadioOff.java:52-53 */
  private readonly dataSource: DataSource;
  /** @see ElementFactoryRadioOff.java:52-53 */
  private readonly spriteContainer: ISkinSimple;

  /** @see ElementFactoryRadioOff.java:55-58 */
  constructor(dataSource: DataSource, spriteContainer: ISkinSimple) {
    this.dataSource = dataSource;
    this.spriteContainer = spriteContainer;
  }

  /** @see ElementFactoryRadioOff.java:60-69 */
  create(): Terminated<Element> {
    if (this.ready() === false) {
      throw new Error('IllegalStateException');
    }
    const next = this.dataSource.next();
    const text = next.getElement();
    const font = UFontFactory.byDefault(12);
    return new Terminated<Element>(
      new ElementRadioCheckbox(this.extracted(text), font, true, false, this.spriteContainer),
      next.getTerminator(),
    );
  }

  /** @see ElementFactoryRadioOff.java:71-74 */
  private extracted(text: string): string[] {
    const x = text.indexOf(')');
    return [trin(text.substring(x + 1))];
  }

  /** @see ElementFactoryRadioOff.java:76-79 */
  ready(): boolean {
    const text = this.dataSource.peek(0).getElement();
    return text.startsWith('()') || text.startsWith('( )');
  }
}
