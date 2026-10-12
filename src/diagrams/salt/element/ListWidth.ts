/**
 * ListWidth — one width per "other" column of a `{T` tree row;
 * `ElementTree#getWidthOther` folds every row's list with `mergeMax`
 * (`ElementTree.java:100-107`).
 *
 * Mutable like upstream: `add` appends in place; `mergeMax` returns a new
 * list and leaves both operands untouched.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/element/ListWidth.java:42-82
 */
export class ListWidth {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/element/ListWidth.java:44 */
  private readonly allWidth: number[] = [];

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/element/ListWidth.java:46-48 */
  add(width: number): void {
    this.allWidth.push(width);
  }

  /**
   * Per-index max of the two lists; the shorter one reads as 0 past its end.
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/element/ListWidth.java:50-58
   */
  mergeMax(other: ListWidth): ListWidth {
    const result = new ListWidth();
    for (let i = 0; i < this.allWidth.length || i < other.allWidth.length; i++) {
      const w1 = this.getWidthSafe(i);
      const w2 = other.getWidthSafe(i);
      result.add(Math.max(w1, w2));
    }
    return result;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/element/ListWidth.java:60-65 */
  private getWidthSafe(i: number): number {
    return this.allWidth[i] ?? 0;
  }

  /**
   * Sum of the widths, with `margin` added before each width once the
   * running total is positive (upstream's `result > 0` test, so leading
   * zero widths cost no margin).
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/element/ListWidth.java:67-76
   */
  getTotalWidthWithMargin(margin: number): number {
    let result = 0;
    for (const w of this.allWidth) {
      if (result > 0) {
        result += margin;
      }
      result += w;
    }
    return result;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/element/ListWidth.java:78-80 */
  iterator(): Iterator<number> {
    return this.allWidth.values();
  }
}
