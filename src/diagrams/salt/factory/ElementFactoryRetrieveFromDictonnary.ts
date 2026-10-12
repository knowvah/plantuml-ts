import type { DataSource } from '../DataSource.js';
import type { Element } from '../element/Element.js';
import type { SaltDictionary } from '../SaltDictionary.js';
import { Terminated } from '../Terminated.js';
import type { ElementFactory } from './ElementFactory.js';

/** `text.matches("\\<\\<\\w+\\>\\>")`, full-string as `String#matches`. @see ElementFactoryRetrieveFromDictonnary.java:70 */
const DICTIONARY_REFERENCE = /^<<\w+>>$/;

/**
 * ElementFactoryRetrieveFromDictonnary — turns a `<<name>>` token into the
 * element registered under `name` (upstream's spelling kept).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/factory/ElementFactoryRetrieveFromDictonnary.java:45-72
 */
export class ElementFactoryRetrieveFromDictonnary implements ElementFactory {
  /** @see ElementFactoryRetrieveFromDictonnary.java:47 */
  private readonly dictionary: SaltDictionary;
  /** @see ElementFactoryRetrieveFromDictonnary.java:48 */
  private readonly dataSource: DataSource;

  /** @see ElementFactoryRetrieveFromDictonnary.java:50-53 */
  constructor(dataSource: DataSource, dictionary: SaltDictionary) {
    this.dataSource = dataSource;
    this.dictionary = dictionary;
  }

  /**
   * `Objects.requireNonNull(dictionary.get(name), name)`: the port's
   * `SaltDictionary#get` already throws on a missing name.
   * @see ElementFactoryRetrieveFromDictonnary.java:55-66
   */
  create(): Terminated<Element> {
    if (!this.ready()) throw new Error('IllegalStateException');
    const next = this.dataSource.next();

    let name = next.getElement();
    name = name.substring(2, name.length - 2);
    const retrieve = this.dictionary.get(name);

    return new Terminated<Element>(retrieve, next.getTerminator());
  }

  /** @see ElementFactoryRetrieveFromDictonnary.java:68-71 */
  ready(): boolean {
    const text = this.dataSource.peek(0).getElement();
    return DICTIONARY_REFERENCE.test(text);
  }
}
