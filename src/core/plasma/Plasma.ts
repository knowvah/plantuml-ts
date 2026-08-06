import { PEntry } from './PEntry.js';
import { Quark } from './Quark.js';

/**
 * The "no separator" sentinel. While the separator equals this value,
 * `hasSeparator()` is false and `Quark#child` treats its argument as a
 * single name.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/plasma/Plasma.java:52
 */
export const MAGIC_SEPARATOR = '\u0001';

/**
 * A namespace for {@link Quark} objects.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/plasma/Plasma.java
 */
export class Plasma<DATA> {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/plasma/Plasma.java:54 */
  private separator: string = MAGIC_SEPARATOR;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/plasma/Plasma.java:55 */
  private readonly _root: Quark<DATA>;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/plasma/Plasma.java:56 */
  private readonly _quarks: Quark<DATA>[] = [];

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/plasma/Plasma.java:57 */
  private readonly stats = new Map<string, PEntry<DATA>>();

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/plasma/Plasma.java:59-61 */
  constructor() {
    this._root = new Quark<DATA>(this, undefined, '');
  }

  /**
   * Protected upstream (called from the `Quark` constructor, same
   * package); public here because TypeScript has no package visibility.
   *
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/plasma/Plasma.java:63-72
   */
  register(quark: Quark<DATA>): void {
    this._quarks.push(quark);
    const ent = this.stats.get(quark.getName());
    if (ent === undefined) {
      this.stats.set(quark.getName(), new PEntry<DATA>(quark));
    } else {
      ent.counter++;
    }
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/plasma/Plasma.java:74-76 */
  root(): Quark<DATA> {
    return this._root;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/plasma/Plasma.java:78-80 */
  getSeparator(): string {
    return this.separator;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/plasma/Plasma.java:82-86 */
  setSeparator(separator: string | undefined): void {
    if (separator === undefined) separator = MAGIC_SEPARATOR;
    this.separator = separator;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/plasma/Plasma.java:88-90 */
  hasSeparator(): boolean {
    return (this.separator === MAGIC_SEPARATOR) === false;
  }

  /**
   * Snapshot of every quark ever created, in creation order. Upstream
   * returns an unmodifiable live view; a snapshot is the TS equivalent —
   * callers only iterate it.
   *
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/plasma/Plasma.java:92-94
   */
  quarks(): readonly Quark<DATA>[] {
    return [...this._quarks];
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/plasma/Plasma.java:96-101 */
  firstWithName(name: string): Quark<DATA> | undefined {
    const ent = this.stats.get(name);
    if (ent === undefined) return undefined;
    return ent.first;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/plasma/Plasma.java:103-108 */
  countByName(name: string): number {
    const ent = this.stats.get(name);
    if (ent === undefined) return 0;
    return ent.counter;
  }
}
