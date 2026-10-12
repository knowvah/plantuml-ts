import type { Terminated } from './Terminated.js';

/**
 * DataSource — the salt token stream the element factories read: a
 * `java.util.Iterator<Terminated<String>>` (`hasNext`, `next`, `remove`) plus
 * look-ahead by `peek(i)` relative to the cursor.
 *
 * The `Iterator` members are declared here because TypeScript has no
 * `java.util.Iterator`; they keep the Java names factories call
 * (`getDataSource().next()`, `hasNext()`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/DataSource.java:40-43
 */
export interface DataSource {
  /** @see DataSource.java:42 */
  peek(i: number): Terminated<string>;
  /** `java.util.Iterator#hasNext`. @see DataSource.java:40 */
  hasNext(): boolean;
  /** `java.util.Iterator#next`. @see DataSource.java:40 */
  next(): Terminated<string>;
  /** `java.util.Iterator#remove`. @see DataSource.java:40 */
  remove(): void;
}
