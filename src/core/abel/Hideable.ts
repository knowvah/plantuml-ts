/**
 * Hideable — implemented by anything a `hide` command can hide.
 *
 * SI1/T5.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/Hideable.java:41-43
 */
export interface Hideable {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/Hideable.java:42 */
  isHidden(): boolean;
}
