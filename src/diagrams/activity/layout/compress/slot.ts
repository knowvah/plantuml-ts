/**
 * slot.ts — `klimt/compress/Slot.java`, `SlotSet.java`, `CompressionMode.java`
 * (mission `activity-klimt-compress` T2, `decisions.md` D2/D5).
 *
 * A `Slot` is a closed interval `[start, end]` on one axis, and a `SlotSet`
 * is the collection `SlotFinder`/`CompressionXorYBuilder` accumulate while
 * walking the finished drawing. This file is a pure port with no consumer
 * yet (T3/T4 wire it in) — the aggregate `weightedScore` MUST stay exactly
 * 42511 (mission README, stop condition 6) until then.
 *
 * `Slot.java`'s `drawDebugX`-equivalent is NOT ported here: `SlotSet
 * .drawDebugX` (`SlotSet.java:120-125`) draws a `URectangle` per slot into a
 * `UGraphic` for visual debugging only; it is never called from
 * `CompressionXorYBuilder`/`SlotFinder`/`CompressionTransform`, is absent
 * from the T2 interface contract, and would pull a rendering dependency
 * into a module the mission scopes as pure geometry (D2: the shape
 * adapter/draw dispatch belongs to `SlotFinder`, ported in T3). `Slot`'s and
 * `SlotSet`'s `toString()` overrides (`Slot.java:52-55`,
 * `SlotSet.java:94-97`, both `Object` debug printing only) are likewise not
 * ported — no contract method depends on them, and porting them literally
 * would carry Java's `double` `toString()` formatting (`10.0` vs JS's
 * `10`), which this port does not otherwise attempt to reproduce.
 */

/**
 * Java's `CompressionMode` enum (`CompressionMode.java:38-40`): `ON_X`/
 * `ON_Y`, which axis a `CompressionXorYBuilder` pass compresses.
 * @see CompressionMode.java:38-40
 */
export type CompressionMode = 'x' | 'y';

/**
 * Java's `Slot#compareTo` (`Slot.java:91-98`), ported per this mission's
 * translation rule (`Comparable#compareTo` -> an exported comparator
 * function used by the sort) rather than as an instance method. Orders by
 * `start` ascending; ties resolve to 0, exactly as upstream.
 * @see Slot.java:91-98
 */
export function compareSlotByStart(a: Slot, b: Slot): number {
  if (a.start < b.start) return -1;
  if (a.start > b.start) return 1;
  return 0;
}

/**
 * Mirrors `klimt/compress/Slot.java`: a closed interval `[start, end]`.
 * `start`/`end` are exposed as readonly properties per the T2 interface
 * contract; `getStart()`/`getEnd()` are kept as Java-name aliases.
 * @see Slot.java:38-99
 */
export class Slot {
  readonly start: number;
  readonly end: number;

  /**
   * @see Slot.java:44-50 -- throws when `start >= end`, matching the
   * jar's `IllegalArgumentException("start=" + start + " end=" + end)`
   * message text (modulo Java's `double#toString` vs JS `number#toString`
   * formatting, e.g. `10.0` vs `10` -- this port does not reproduce that
   * formatting difference elsewhere either).
   */
  constructor(start: number, end: number) {
    if (start >= end) {
      throw new Error(`IllegalArgumentException: start=${start} end=${end}`);
    }
    this.start = start;
    this.end = end;
  }

  /** Java-name alias for {@link start}. @see Slot.java:57-59 */
  getStart(): number {
    return this.start;
  }

  /** Java-name alias for {@link end}. @see Slot.java:61-63 */
  getEnd(): number {
    return this.end;
  }

  /** @see Slot.java:65-67 */
  size(): number {
    return this.end - this.start;
  }

  /** Inclusive at both ends. @see Slot.java:69-71 */
  contains(v: number): boolean {
    return v >= this.start && v <= this.end;
  }

  /**
   * Java overloads `intersect` on parameter type (`Slot.java:73-89`): the
   * `Slot` overload is an any-endpoint-inside overlap test; the
   * `(start, end)` overload clips this slot to the given range, returning
   * `undefined` (Java `null`) when disjoint.
   * @see Slot.java:73-75
   * @see Slot.java:81-89
   */
  intersect(other: Slot): boolean;
  intersect(otherStart: number, otherEnd: number): Slot | undefined;
  intersect(otherOrStart: Slot | number, otherEnd?: number): boolean | Slot | undefined {
    if (otherOrStart instanceof Slot) {
      const other = otherOrStart;
      return (
        this.contains(other.start) ||
        this.contains(other.end) ||
        other.contains(this.start) ||
        other.contains(this.end)
      );
    }
    const otherStart = otherOrStart;
    const end = otherEnd as number;
    if (otherStart >= this.end) return undefined;
    if (end <= this.start) return undefined;
    return new Slot(Math.max(this.start, otherStart), Math.min(this.end, end));
  }

  /**
   * T2 interface-contract alias for the `intersect(Slot)` overload above
   * (the contract disambiguates it from the `(start, end)` overload by
   * name; Java itself uses overloading instead).
   * @see Slot.java:73-75
   */
  intersects(other: Slot): boolean {
    return this.intersect(other);
  }

  /** @see Slot.java:77-79 */
  merge(other: Slot): Slot {
    return new Slot(Math.min(this.start, other.start), Math.max(this.end, other.end));
  }
}

/**
 * Mirrors `klimt/compress/SlotSet.java`: a mutable collection of `Slot`s
 * that merges on overlap. `slots()` is the T2 interface-contract name;
 * `getSlots()` is the Java-name alias. `[Symbol.iterator]` mirrors Java's
 * `Iterable<Slot>` implementation (`SlotSet.java:103-105`).
 * @see SlotSet.java:47-126
 */
export class SlotSet {
  private readonly all: Slot[] = [];

  /** @see SlotSet.java:52-61 */
  filter(start: number, end: number): SlotSet {
    const result = new SlotSet();
    for (const slot of this.all) {
      const intersec = slot.intersect(start, end);
      if (intersec !== undefined) result.all.push(intersec);
    }
    return result;
  }

  /** @see SlotSet.java:63-65 */
  addAll(other: SlotSet): void {
    this.all.push(...other.all);
  }

  /**
   * Removes every slot colliding with the new `(start, end)` range and
   * merges them all into it, in original list order (Java iterates
   * forward with `Iterator#remove`; this walks backward with `splice` to
   * stay index-safe, then restores forward order before merging -- `merge`
   * is min/max so order does not change the result).
   * @see SlotSet.java:67-81
   */
  addSlot(start: number, end: number): void {
    let newSlot = new Slot(start, end);
    const collisions: Slot[] = [];
    for (let i = this.all.length - 1; i >= 0; i--) {
      const s = this.all[i];
      if (s !== undefined && s.intersect(newSlot)) {
        this.all.splice(i, 1);
        collisions.unshift(s);
      }
    }
    for (const s of collisions) {
      newSlot = newSlot.merge(s);
    }
    this.all.push(newSlot);
  }

  /**
   * Skips slots whose size is `<= 2 * margin`; the rest shrink by `margin`
   * on each side.
   * @see SlotSet.java:83-92
   */
  smaller(margin: number): SlotSet {
    const result = new SlotSet();
    for (const sl of this.all) {
      if (sl.size() <= 2 * margin) continue;
      result.addSlot(sl.start + margin, sl.end - margin);
    }
    return result;
  }

  /** T2 interface-contract name for {@link getSlots}. */
  slots(): readonly Slot[] {
    return this.all;
  }

  /** Java-name alias for {@link slots}. @see SlotSet.java:99-101 */
  getSlots(): readonly Slot[] {
    return this.slots();
  }

  /** @see SlotSet.java:103-105 */
  [Symbol.iterator](): Iterator<Slot> {
    return this.all[Symbol.iterator]();
  }

  /**
   * Sorts by start ascending (mutating this set's own order, matching
   * Java's in-place `Collections.sort(all)`) and returns a new `SlotSet`
   * of the gaps between consecutive slots.
   * @see SlotSet.java:107-118
   */
  reverse(): SlotSet {
    const result = new SlotSet();
    this.all.sort(compareSlotByStart);
    let last: Slot | undefined;
    for (const slot of this.all) {
      if (last !== undefined) {
        result.addSlot(last.end, slot.start);
      }
      last = slot;
    }
    return result;
  }
}
