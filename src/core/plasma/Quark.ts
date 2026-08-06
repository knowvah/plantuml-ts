import type { Plasma } from './Plasma.js';

/**
 * A named node in the entity graph.
 *
 * Faithful port of upstream's plasma tree node. Children are held in a
 * `Map` (insertion-ordered, matching Java's `LinkedHashMap`). The
 * constructor is package-private upstream (called only by `Plasma`'s
 * constructor and by `getDirectChild`); TypeScript has no package
 * visibility, so it is public here — construct quarks via
 * `Plasma#root()` + `child()` in normal use.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/plasma/Quark.java
 */
export class Quark<DATA> {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/plasma/Quark.java:50 */
  private readonly plasma: Plasma<DATA>;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/plasma/Quark.java:51 */
  private readonly parent: Quark<DATA> | undefined;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/plasma/Quark.java:52 */
  private readonly name: string;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/plasma/Quark.java:53 */
  private data: DATA | undefined;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/plasma/Quark.java:54 */
  private readonly children = new Map<string, Quark<DATA>>();

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/plasma/Quark.java:55 */
  private readonly qualifiedName: string;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/plasma/Quark.java:57-66 */
  constructor(plasma: Plasma<DATA>, parent: Quark<DATA> | undefined, name: string) {
    this.name = name;
    this.plasma = plasma;
    this.parent = parent;
    if (parent === undefined || parent.parent === undefined) this.qualifiedName = name;
    else this.qualifiedName = parent.qualifiedName + plasma.getSeparator() + name;
    this.plasma.register(this);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/plasma/Quark.java:68-70 */
  getParent(): Quark<DATA> | undefined {
    return this.parent;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/plasma/Quark.java:72-75 */
  toString(): string {
    return this.qualifiedName;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/plasma/Quark.java:77-82 */
  toStringPoint(): string {
    if (this.parent === undefined || this.parent.parent === undefined) return this.name;

    return this.parent.toStringPoint() + '.' + this.name;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/plasma/Quark.java:84-86 */
  getName(): string {
    return this.name;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/plasma/Quark.java:88-90 */
  getQualifiedName(): string {
    return this.qualifiedName;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/plasma/Quark.java:92-94 */
  isRoot(): boolean {
    return this.parent === undefined;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/plasma/Quark.java:96-98 */
  getPlasma(): Plasma<DATA> {
    return this.plasma;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/plasma/Quark.java:100-102 */
  getData(): DATA | undefined {
    return this.data;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/plasma/Quark.java:104-108 */
  setData(data: DATA): void {
    if (this.data !== undefined) throw new Error('IllegalStateException');
    this.data = data;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/plasma/Quark.java:110-114 */
  childIfExists(name: string): Quark<DATA> | undefined {
    if (this.plasma.hasSeparator() && name.includes(this.plasma.getSeparator()))
      throw new Error('IllegalArgumentException');
    return this.children.get(name);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/plasma/Quark.java:116-132 */
  child(full: string): Quark<DATA> {
    if (this.plasma.hasSeparator() === false) return this.getDirectChild(full);

    full = this.clean(full);
    const separator = this.plasma.getSeparator();
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let current: Quark<DATA> = this;
    for (;;) {
      const idx = full.indexOf(separator);
      if (idx === -1) return current.getDirectChild(full);

      const first = full.substring(0, idx);
      current = current.getDirectChild(first);
      full = this.clean(full.substring(idx + separator.length));
    }
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/plasma/Quark.java:134-141 */
  private getDirectChild(name: string): Quark<DATA> {
    let result = this.children.get(name);
    if (result === undefined) {
      result = new Quark<DATA>(this.plasma, this, name);
      this.children.set(name, result);
    }
    return result;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/plasma/Quark.java:143-151 */
  private clean(full: string): string {
    const separator = this.plasma.getSeparator();
    while (full.startsWith(separator)) full = full.substring(separator.length);
    while (full.endsWith(separator)) full = full.substring(0, full.length - separator.length);

    return full;
  }

  /**
   * Snapshot of the direct children in insertion order. Upstream returns
   * an unmodifiable live view (`Collections.unmodifiableCollection`); a
   * frozen snapshot is the TS equivalent — callers only iterate it.
   *
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/plasma/Quark.java:153-155
   */
  getChildren(): readonly Quark<DATA>[] {
    return [...this.children.values()];
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/plasma/Quark.java:157-159 */
  countChildren(): number {
    return this.children.size;
  }
}
