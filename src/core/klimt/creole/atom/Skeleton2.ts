/**
 * Skeleton2 — accumulates one `Entry` (level, y-midpoint) per drawn cell of
 * an `AtomTree` and, once every cell has been drawn, renders the bullet +
 * horizontal + vertical connector lines that give the tree its indentation
 * guides. `AtomTree#drawU` is the sole caller: it builds one `Skeleton2`,
 * calls `add` once per cell as it draws that cell's own content, then calls
 * `draw` exactly once at the end (`AtomTree.ts`'s own doc comment).
 *
 * Upstream: salt/element/Skeleton2.java. Ported in full: `add`, `draw`,
 * the private `getMotherOrSister` backward scan, `getXStartForLevel`/
 * `getXEndForLevel`, and `Entry#drawHline`/`#drawVline`.
 *
 * NOT ported: `drawOld`/`drawChild` (java:106-134) — both are ALREADY
 * commented out in the Java source itself (dead, disabled code upstream,
 * not merely unreached by this port — same precedent as `CreoleParser.ts`'s
 * omitted `checkColor`, `.agent-notes/T9a-creoleparser.md`).
 *
 * Write-set note (T10c, ADR-8 corollary): `AtomTree.java#drawU`/
 * `#calculateDimensionSlow` call `Skeleton2` directly, and no TS port of it
 * existed anywhere in `src/` — genuinely required, not a large, separable
 * follow-on (55 real lines, single direct consumer), so it is ported here
 * alongside `AtomTree.ts` rather than cited as a seam. Placed under
 * `klimt/creole/atom/` (co-located with its sole consumer) rather than
 * mirroring upstream's `salt/element/` package path — this port has no
 * `src/core/salt/` tree yet and this task is not chartered to establish
 * that package boundary for one class; the upstream path is preserved via
 * the `@see` below for anyone who later builds `salt/`.
 *
 * Independent cross-check: `src/diagrams/class/class-body-tree.ts`
 * (`xStartForLevel`/`xEndForLevel`/`motherOrSisterMidY`/
 * `computeTreeConnectors`) re-derived this SAME algorithm as free functions
 * over its own row model, jar-verified byte-exact (G2 N42). Both encode the
 * identical `sizeX = 8` step and the identical backward-scan stop condition
 * (first entry whose level equals the current level, OR the current level
 * minus one) — see this task's own report for the side-by-side formula
 * table.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/element/Skeleton2.java
 */
import { UTranslate } from '../../UTranslate.js';
import { ULine } from '../../shape/ULine.js';
import { URectangle } from '../../shape/URectangle.js';
import type { UGraphic } from '../../UGraphic.js';

/** `Skeleton2.sizeX` — the per-level horizontal indent step, in px. */
const SIZE_X = 8;

function getXStartForLevel(level: number): number {
  return level * SIZE_X;
}

/** One drawn cell's (level, y-midpoint) — upstream's private static inner
 *  `Entry` class, ported as its own class rather than inlined tuples so
 *  `drawHline`/`drawVline` stay 1:1 with `Entry#drawHline`/`#drawVline`. */
class Entry {
  constructor(
    readonly level: number,
    readonly ypos: number,
  ) {}

  /** A 2x2 bullet `URectangle` at `(xEnd-1, ypos-1)` plus an 8px `ULine`
   *  from `(xStart, ypos)` — java:61-64. */
  drawHline(ug: UGraphic): void {
    const xpos = getXStartForLevel(this.level);
    ug.apply(new UTranslate(xpos + SIZE_X - 1, this.ypos - 1)).draw(URectangle.build(2, 2));
    ug.apply(new UTranslate(xpos, this.ypos)).draw(ULine.hline(SIZE_X));
  }

  /** A vertical `ULine` from `lastY` (the mother/sister entry's own
   *  `ypos`, or 0 if there is none) down to this entry's `ypos` — java:67-71. */
  drawVline(ug: UGraphic, lastY: number): void {
    const xpos = getXStartForLevel(this.level);
    ug.apply(new UTranslate(xpos, lastY)).draw(ULine.vline(this.ypos - lastY));
  }
}

export class Skeleton2 {
  private readonly entries: Entry[] = [];

  add(level: number, y: number): void {
    this.entries.push(new Entry(level, y));
  }

  draw(ug: UGraphic): void {
    for (let i = 0; i < this.entries.length; i++) {
      // Invariant: `i < this.entries.length`, so this is always defined.
      const en = this.entries[i] as Entry;
      en.drawHline(ug);
      const up = this.getMotherOrSister(i);
      en.drawVline(ug, up === undefined ? 0 : up.ypos);
    }
  }

  /** Scans BACKWARDS from `idx - 1` for the first entry whose level equals
   *  the current entry's level (a sibling) or that level minus one (the
   *  parent) — skipping over any deeper-level subtree entirely. `undefined`
   *  (upstream: `null`) if no such entry exists (the very first entry, or a
   *  level-1 entry with no preceding sibling). */
  private getMotherOrSister(idx: number): Entry | undefined {
    // Invariant: `idx` is always a valid index into `entries` (only called
    // from `draw`'s own loop, which iterates `0..entries.length`).
    const currentLevel = (this.entries[idx] as Entry).level;
    for (let i = idx - 1; i >= 0; i--) {
      const otherLevel = (this.entries[i] as Entry).level;
      if (otherLevel === currentLevel || otherLevel === currentLevel - 1) return this.entries[i];
    }
    return undefined;
  }

  getXEndForLevel(level: number): number {
    return getXStartForLevel(level) + SIZE_X;
  }
}
