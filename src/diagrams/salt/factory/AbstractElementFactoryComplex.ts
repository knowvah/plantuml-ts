import type { DataSource } from '../DataSource.js';
import type { Element } from '../element/Element.js';
import type { SaltDictionary } from '../SaltDictionary.js';
import type { Terminated } from '../Terminated.js';
import type { ElementFactory } from './ElementFactory.js';

/**
 * AbstractElementFactoryComplex — base of the container factories: holds the
 * token stream, the dictionary and an ordered list of child factories, and
 * builds the next element with the first child that is `ready()`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/factory/AbstractElementFactoryComplex.java:44-76
 */
export abstract class AbstractElementFactoryComplex implements ElementFactory {
  /** @see AbstractElementFactoryComplex.java:46 */
  private readonly dataSource: DataSource;
  /** @see AbstractElementFactoryComplex.java:47 */
  private readonly factories: ElementFactory[] = [];
  /** @see AbstractElementFactoryComplex.java:48 */
  private readonly dictionary: SaltDictionary;

  /** @see AbstractElementFactoryComplex.java:50-53 */
  constructor(dataSource: DataSource, dictionary: SaltDictionary) {
    this.dataSource = dataSource;
    this.dictionary = dictionary;
  }

  /** `ElementFactory#create`, left to the subclass as in the Java. */
  abstract create(): Terminated<Element>;

  /** `ElementFactory#ready`, left to the subclass as in the Java. */
  abstract ready(): boolean;

  /** @see AbstractElementFactoryComplex.java:55-57 */
  addFactory(factory: ElementFactory): void {
    this.factories.push(factory);
  }

  /**
   * First ready child wins; none ready throws
   * `IllegalStateException(dataSource.peek(0).getElement())`.
   * @see AbstractElementFactoryComplex.java:59-66
   */
  protected getNextElement(): Terminated<Element> {
    for (const factory of this.factories) if (factory.ready()) return factory.create();

    throw new Error(`IllegalStateException: ${this.dataSource.peek(0).getElement()}`);
  }

  /** @see AbstractElementFactoryComplex.java:68-70 */
  protected getDataSource(): DataSource {
    return this.dataSource;
  }

  /** @see AbstractElementFactoryComplex.java:72-74 */
  protected getDictionary(): SaltDictionary {
    return this.dictionary;
  }
}
