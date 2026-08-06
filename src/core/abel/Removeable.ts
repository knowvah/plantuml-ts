/**
 * Removeable — implemented by anything a `remove` command can remove.
 *
 * SI1/T5.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/Removeable.java:40-42
 */
export interface Removeable {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/Removeable.java:41 */
  isRemoved(): boolean;
}
