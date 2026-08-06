/**
 * Bag — upstream marker interface shared by `Entity` and `Together`
 * (an empty tagging interface; no members — kept genuinely empty so
 * classes can `implements` it without TS's weak-type check rejecting
 * them).
 *
 * SI1/T5.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/Bag.java:39
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface Bag {}
