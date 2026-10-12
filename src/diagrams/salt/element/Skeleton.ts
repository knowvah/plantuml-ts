/**
 * Skeleton — the `{T` tree-guide lines: a 2x2 bullet under every entry that
 * has a deeper next entry, and an L-shaped vertical + horizontal guide from
 * each entry's parent down and across to it. `ElementTree#drawU` adds one
 * entry per row, then draws once (`ElementTree.java:127-150`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/element/Skeleton.java:46-96
 */
import { UTranslate } from '../../../core/klimt/UTranslate.js';
import { ULine } from '../../../core/klimt/shape/ULine.js';
import { URectangle } from '../../../core/klimt/shape/URectangle.js';
import type { UGraphic } from '../../../core/klimt/UGraphic.js';

/**
 * One tree row's guide anchor.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/element/Skeleton.java:50-62
 */
class Entry {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/element/Skeleton.java:54-57 */
  constructor(
    readonly xpos: number,
    readonly ypos: number,
  ) {}

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/element/Skeleton.java:59-61 */
  drawRectangle(ug: UGraphic): void {
    ug.apply(new UTranslate(this.xpos, this.ypos)).draw(URectangle.build(2, 2));
  }
}

export class Skeleton {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/element/Skeleton.java:48 */
  private readonly entries: Entry[] = [];

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/element/Skeleton.java:64-66 */
  add(x: number, y: number): void {
    this.entries.push(new Entry(x, y));
  }

  /**
   * Per entry, in order: its bullet when the NEXT entry is deeper, then the
   * guide from its parent — the LAST earlier entry with a smaller `xpos`.
   * Upstream's `x`/`y` parameters are never read (java:68); kept for the
   * signature as `_x`/`_y`.
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/element/Skeleton.java:68-85
   */
  draw(ug: UGraphic, _x: number, _y: number): void {
    for (let i = 0; i < this.entries.length; i++) {
      // Invariant: i < entries.length (and j < i below), so the reads are defined.
      const en = this.entries[i] as Entry;
      // `next !== undefined` is upstream's `i + 1 < entries.size()`.
      const next = this.entries[i + 1];
      if (next !== undefined && next.xpos > en.xpos) {
        en.drawRectangle(ug);
      }
      let parent: Entry | undefined;
      for (let j = 0; j < i; j++) {
        const en0 = this.entries[j] as Entry;
        if (en0.xpos < en.xpos) {
          parent = en0;
        }
      }
      if (parent !== undefined) {
        this.drawChild(ug, parent, en);
      }
    }
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/element/Skeleton.java:87-94 */
  private drawChild(ug: UGraphic, parent: Entry, child: Entry): void {
    const dy = child.ypos - parent.ypos - 2;
    ug.apply(new UTranslate(parent.xpos + 1, parent.ypos + 3)).draw(ULine.vline(dy));
    const dx = child.xpos - parent.xpos - 2;
    ug.apply(new UTranslate(parent.xpos + 1, child.ypos + 1)).draw(ULine.hline(dx));
  }
}
