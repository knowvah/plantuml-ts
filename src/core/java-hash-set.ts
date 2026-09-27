/**
 * java-hash-set.ts — the iteration order of a `java.util.HashSet` built by
 * successive `add` calls, for code upstream iterates straight out of a
 * `HashSet` (e.g. `dot/Neighborhood.java:70-80`'s `contactPoints`).
 *
 * A `HashSet` is a `HashMap` with dummy values (`java/util/HashSet.java:106-108,228-230`),
 * and a `HashMap` iterates its table bucket by bucket, each bucket in
 * insertion order. The bucket of a key depends on the table capacity, which
 * depends on the insertion history (`putVal`'s `++size > threshold` resize
 * and `treeifyBin`'s small-table resize), so the history is replayed here
 * exactly: JDK 21 `java/util/HashMap.java:336-339` (`hash`), `:631-672`
 * (`putVal`), `:683-755` (`resize`), `:761-764` (`treeifyBin`).
 *
 * Not ported: the red-black tree bin (`treeifyBin`'s `else` branch,
 * `HashMap.java:765-779`, and `TreeNode#putTreeVal`). It needs nine keys in
 * ONE bucket of a table of at least 64 buckets (`MIN_TREEIFY_CAPACITY`),
 * i.e. at least 49 keys; a tree bin keeps its `next` links in insertion
 * order except after `putTreeVal`, which this port does not model — such a
 * bucket iterates in plain insertion order here.
 *
 * @see JDK 21 src/java.base/share/classes/java/util/HashMap.java
 */

/** `HashMap.java:238` `DEFAULT_INITIAL_CAPACITY = 1 << 4`. */
const DEFAULT_INITIAL_CAPACITY = 16;
/** `HashMap.java:250` `DEFAULT_LOAD_FACTOR = 0.75f`. */
const DEFAULT_LOAD_FACTOR = 0.75;
/** `HashMap.java:260` `TREEIFY_THRESHOLD = 8`. */
const TREEIFY_THRESHOLD = 8;
/** `HashMap.java:275` `MIN_TREEIFY_CAPACITY = 64`. */
const MIN_TREEIFY_CAPACITY = 64;

/**
 * `Double.hashCode(double)` (JDK 21 `java/lang/Double.java:1038-1040`):
 * `Long.hashCode(doubleToLongBits(value))`, i.e. `(int)(bits ^ (bits >>>
 * 32))`. `doubleToLongBits` collapses every NaN to `0x7ff8000000000000`,
 * which is what `DataView#setFloat64` writes for a JS `NaN`.
 */
export function javaDoubleHashCode(value: number): number {
  const view = new DataView(new ArrayBuffer(8));
  view.setFloat64(0, Number.isNaN(value) ? Number.NaN : value);
  return view.getInt32(0) ^ view.getInt32(4);
}

/** `HashMap.java:336-339` `hash(key)`: `h ^ (h >>> 16)`, as a Java int. */
function spread(h: number): number {
  return (h ^ (h >>> 16)) | 0;
}

interface Entry<T> {
  readonly hash: number;
  readonly key: T;
}

/** `resize()` (`HashMap.java:683-755`): the lo/hi split keeps each old
 *  bucket's relative order, so re-bucketing in iteration order is the same
 *  table. */
function rehash<T>(table: Entry<T>[][], capacity: number): Entry<T>[][] {
  const next: Entry<T>[][] = Array.from({ length: capacity }, () => []);
  for (const bucket of table) {
    for (const e of bucket) next[(capacity - 1) & e.hash]!.push(e);
  }
  return next;
}

/**
 * The order a `HashSet` iterates after `add(items[0])`, `add(items[1])`, …
 * on a default-constructed set. `hashCode` and `equals` are the element's
 * own Java methods; a duplicate (same spread hash AND `equals`, `putVal`'s
 * `p.hash == hash && key.equals(k)`) is dropped, keeping the first.
 */
export function javaHashSetOrder<T>(
  items: readonly T[],
  hashCode: (item: T) => number,
  equals: (a: T, b: T) => boolean,
): T[] {
  let capacity = DEFAULT_INITIAL_CAPACITY;
  let table: Entry<T>[][] = Array.from({ length: capacity }, () => []);
  let size = 0;
  const grow = (): void => {
    capacity *= 2;
    table = rehash(table, capacity);
  };
  for (const key of items) {
    const hash = spread(hashCode(key));
    const bucket = table[(capacity - 1) & hash]!;
    if (bucket.some((e) => e.hash === hash && equals(e.key, key))) continue;
    bucket.push({ hash, key });
    // `putVal`'s `binCount >= TREEIFY_THRESHOLD - 1` on the appended node:
    // the bucket held at least TREEIFY_THRESHOLD nodes before it.
    if (bucket.length > TREEIFY_THRESHOLD && capacity < MIN_TREEIFY_CAPACITY) grow();
    size++;
    if (size > capacity * DEFAULT_LOAD_FACTOR) grow();
  }
  return table.flatMap((bucket) => bucket.map((e) => e.key));
}
