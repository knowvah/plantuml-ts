import type { DataSource } from '../DataSource.js';
import type { Element } from '../element/Element.js';
import { ElementImage } from '../element/ElementImage.js';
import type { SaltDictionary } from '../SaltDictionary.js';
import { Terminated } from '../Terminated.js';
import type { ElementFactory } from './ElementFactory.js';

/** `text.matches("\\<\\<\\w+")`, full-string as `String#matches`. @see ElementFactoryImage.java:77 */
const IMAGE_HEADER = /^<<\w+$/;

/**
 * ElementFactoryImage — turns a `<<` / `<<name` token through the closing
 * `>>` into an `ElementImage`, registered in the dictionary when named.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/factory/ElementFactoryImage.java:47-79
 */
export class ElementFactoryImage implements ElementFactory {
  /** @see ElementFactoryImage.java:49 */
  private readonly dataSource: DataSource;
  /** @see ElementFactoryImage.java:50 */
  private readonly dictionary: SaltDictionary;

  /** @see ElementFactoryImage.java:52-55 */
  constructor(dataSource: DataSource, dictionary: SaltDictionary) {
    this.dataSource = dataSource;
    this.dictionary = dictionary;
  }

  /** @see ElementFactoryImage.java:57-73 */
  create(): Terminated<Element> {
    if (!this.ready()) throw new Error('IllegalStateException');
    const header = this.dataSource.next().getElement();
    const name = header.length > 2 ? header.substring(2) : null;
    const img: string[] = [];
    while (this.dataSource.peek(0).getElement() !== '>>') img.push(this.dataSource.next().getElement());

    const next = this.dataSource.next();
    const element = new ElementImage(img);
    if (name !== null) this.dictionary.put(name, element);

    return new Terminated<Element>(element, next.getTerminator());
  }

  /** @see ElementFactoryImage.java:75-78 */
  ready(): boolean {
    const text = this.dataSource.peek(0).getElement();
    return text === '<<' || IMAGE_HEADER.test(text);
  }
}
