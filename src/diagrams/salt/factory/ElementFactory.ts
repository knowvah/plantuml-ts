import type { Element } from '../element/Element.js';
import type { Terminated } from '../Terminated.js';

/**
 * ElementFactory — builds one salt element from the token stream when
 * `ready()` recognises the next token.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/factory/ElementFactory.java:42-48
 */
export interface ElementFactory {
  /** @see ElementFactory.java:44 */
  create(): Terminated<Element>;

  /** @see ElementFactory.java:46 */
  ready(): boolean;
}
