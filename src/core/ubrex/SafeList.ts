/**
 * `SafeList` -- persistent append-only list: each node holds one element
 * (data1) or a block (data2); `size` is the cumulative chain size. Elements
 * are never `undefined` (Java never stores null here).
 *
 * @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/SafeList.java
 */
export class SafeList<E> implements Iterable<E> {
  static readonly #EMPTY: SafeList<unknown> = new SafeList<unknown>(0, undefined, undefined, undefined);

  readonly #size: number;
  readonly #previous: SafeList<E> | undefined;
  readonly #data1: E | undefined;
  readonly #data2: E[] | undefined;
  #cachedArray: E[] | undefined;

  private constructor(size: number, previous: SafeList<E> | undefined, data1: E | undefined, data2: E[] | undefined) {
    this.#size = size;
    this.#previous = previous;
    this.#data1 = data1;
    this.#data2 = data2;
  }

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/SafeList.java */
  public size(): number {
    return this.#size;
  }

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/SafeList.java */
  public static createEmpty<E>(): SafeList<E> {
    return SafeList.#EMPTY as SafeList<E>;
  }

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/SafeList.java */
  public add(data: E): SafeList<E> {
    return new SafeList<E>(this.#size + 1, this, data, undefined);
  }

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/SafeList.java */
  public mapped(fn: (e: E) => E): SafeList<E> {
    if (this.#size === 0) return this;
    const source = this.#getCachedArray();
    const transformed: E[] = new Array<E>(this.#size);
    for (let i = 0; i < this.#size; i++) transformed[i] = fn(source[i] as E);
    const empty = SafeList.createEmpty<E>();
    const result = new SafeList<E>(this.#size, empty, undefined, transformed);
    // The block IS the full materialized list, so it is the cache.
    result.#cachedArray = transformed;
    return result;
  }

  #blockSize(): number {
    if (this.#data1 !== undefined) return 1;
    if (this.#data2 !== undefined) return this.#data2.length;
    return 0;
  }

  #copyBlockInto(dest: E[], destEnd: number): void {
    if (this.#data1 !== undefined) {
      dest[destEnd - 1] = this.#data1;
    } else if (this.#data2 !== undefined) {
      const block = this.#data2;
      for (let i = 0; i < block.length; i++) dest[destEnd - block.length + i] = block[i] as E;
    }
  }

  #toList(): readonly E[] {
    if (this.#size === 0) return [];
    return this.#getCachedArray();
  }

  #getCachedArray(): E[] {
    if (this.#cachedArray !== undefined) return this.#cachedArray;
    const cache: E[] = new Array<E>(this.#size);
    this.#cachedArray = cache;
    SafeList.#fillFrom(this, cache);
    return cache;
  }

  static #fillFrom<T>(start: SafeList<T>, cache: T[]): void {
    let current: SafeList<T> | undefined = start;
    let end = start.#size;
    while (current !== undefined && current.#size !== 0) {
      current.#copyBlockInto(cache, end);
      end -= current.#blockSize();
      current = current.#previous;
    }
  }

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/SafeList.java */
  public [Symbol.iterator](): Iterator<E> {
    return this.#toList()[Symbol.iterator]();
  }

  /** Java `List#toString`: `[a, b]`. @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/SafeList.java */
  public toString(): string {
    return '[' + this.#toList().map(String).join(', ') + ']';
  }

  #singletonElement(): E {
    if (this.#data1 !== undefined) return this.#data1;
    return (this.#data2 as E[])[0] as E;
  }

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/SafeList.java */
  public addAll(other: SafeList<E>): SafeList<E> {
    if (other.#size === 0) return this;
    if (this.#size === 0) return other;
    if (other.#size === 1) return this.add(other.#singletonElement());
    const otherArray = other.#getCachedArray();
    return new SafeList<E>(this.#size + other.#size, this, undefined, otherArray);
  }
}
