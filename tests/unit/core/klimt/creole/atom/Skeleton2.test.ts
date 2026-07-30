/**
 * Skeleton2.test.ts — T10c: coverage for `salt/element/Skeleton2.java`'s
 * port (`src/core/klimt/creole/atom/Skeleton2.ts`) — the bullet/hline/vline
 * tree-connector geometry `AtomTree#drawU` draws after every cell. Every
 * assertion is a concrete drawn coordinate (`code-principles.md`/
 * `testing.md`: real values, not `toBeTruthy`), cross-checked by hand
 * against `Skeleton2.getXStartForLevel`/`sizeX = 8` and independently
 * against `src/diagrams/class/class-body-tree.ts#computeTreeConnectors`'s
 * own jar-verified formula (read-only prior art — see this task's report
 * for the side-by-side table).
 */
import { describe, expect, it } from 'vitest';
import { Skeleton2 } from '../../../../../../src/core/klimt/creole/atom/Skeleton2.js';
import { ULine } from '../../../../../../src/core/klimt/shape/ULine.js';
import { URectangle } from '../../../../../../src/core/klimt/shape/URectangle.js';
import { UTranslate } from '../../../../../../src/core/klimt/UTranslate.js';
import type { UChange } from '../../../../../../src/core/klimt/UChange.js';
import type { UGraphic } from '../../../../../../src/core/klimt/UGraphic.js';
import type { UShape } from '../../../../../../src/core/klimt/UShape.js';
import type { StringBounder } from '../../../../../../src/core/klimt/font/StringBounder.js';
import { XDimension2D } from '../../../../../../src/core/klimt/geom/XDimension2D.js';

interface DrawEvent {
  readonly x: number;
  readonly y: number;
  readonly kind: 'rect' | 'hline' | 'vline';
  readonly a: number;
  readonly b: number;
}

const sb: StringBounder = { calculateDimension: () => new XDimension2D(0, 0) };

/** Records every `draw(shape)` call's shape + the CURRENT accumulated
 *  translate at draw time — same pattern as `TextBlockLineBefore.test.ts`'s
 *  `RecordingUGraphic` (this project's established per-file convention). */
class RecordingUGraphic implements UGraphic {
  constructor(
    private readonly events: DrawEvent[],
    private readonly translate: UTranslate = UTranslate.none(),
  ) {}

  apply(change: UChange): UGraphic {
    if (change instanceof UTranslate) return new RecordingUGraphic(this.events, this.translate.compose(change));
    return this;
  }

  draw(shape: UShape): void {
    const { x, y } = this.translate.getPosition();
    if (shape instanceof URectangle) {
      this.events.push({ x, y, kind: 'rect', a: shape.getWidth(), b: shape.getHeight() });
      return;
    }
    if (shape instanceof ULine) {
      this.events.push({ x, y, kind: shape.getDX() !== 0 ? 'hline' : 'vline', a: shape.getDX(), b: shape.getDY() });
    }
  }

  getParam(): never {
    throw new Error('not needed');
  }

  getTranslate(): UTranslate {
    return this.translate;
  }

  getStringBounder(): StringBounder {
    return sb;
  }
}

describe('Skeleton2.getXEndForLevel (java:102-104)', () => {
  it('level * sizeX + sizeX, sizeX=8', () => {
    const s = new Skeleton2();
    expect(s.getXEndForLevel(0)).toBe(8);
    expect(s.getXEndForLevel(1)).toBe(16);
    expect(s.getXEndForLevel(3)).toBe(32);
  });
});

describe('Skeleton2.draw — single entry, no mother/sister (java:61-71,87-96)', () => {
  it('draws bullet rect, hline, then vline from y=0, all keyed off level*8', () => {
    const events: DrawEvent[] = [];
    const s = new Skeleton2();
    s.add(1, 5);
    s.draw(new RecordingUGraphic(events));
    // xStart = 1*8 = 8. bullet: (xStart+8-1, ypos-1)=(15,4), 2x2.
    // hline: (xStart, ypos)=(8,5), dx=8. vline: (xStart, 0)=(8,0), dy=5-0=5.
    expect(events).toEqual([
      { x: 15, y: 4, kind: 'rect', a: 2, b: 2 },
      { x: 8, y: 5, kind: 'hline', a: 8, b: 0 },
      { x: 8, y: 0, kind: 'vline', a: 0, b: 5 },
    ]);
  });
});

describe('Skeleton2.draw — getMotherOrSister (java:87-96)', () => {
  it('two siblings at the same level: second connects to the first (a sister)', () => {
    const events: DrawEvent[] = [];
    const s = new Skeleton2();
    s.add(1, 5);
    s.add(1, 15);
    s.draw(new RecordingUGraphic(events));
    // Second entry's vline: xStart=8, from lastY=5 (first entry's ypos) to 15.
    expect(events[5]).toEqual({ x: 8, y: 5, kind: 'vline', a: 0, b: 10 });
  });

  it('parent then child (level+1): child connects to the parent', () => {
    const events: DrawEvent[] = [];
    const s = new Skeleton2();
    s.add(1, 5);
    s.add(2, 15);
    s.draw(new RecordingUGraphic(events));
    // Child's xStart=2*8=16, vline from lastY=5 (parent's ypos) to 15.
    expect(events[5]).toEqual({ x: 16, y: 5, kind: 'vline', a: 0, b: 10 });
  });

  it('skips over a deeper subtree entirely to reach the real sister/parent', () => {
    // level sequence: 1, 2 (child of #0), 2 (sister of #1), 1 (sister of #0,
    // must skip PAST #1/#2's level-2 entries) -- the exact shape
    // `class-body-tree.ts`'s own jar-verified comment cites
    // (fecolo-08-gepu579's trailing root cell connects to its OWN sibling,
    // not the deeper subtree).
    const events: DrawEvent[] = [];
    const s = new Skeleton2();
    s.add(1, 0); // idx0
    s.add(2, 10); // idx1, child of idx0
    s.add(2, 20); // idx2, sister of idx1 (level2==level2)
    s.add(1, 30); // idx3, must skip idx2/idx1 (level2), match idx0 (level1)
    s.draw(new RecordingUGraphic(events));
    // idx3's vline is the 4th entry's vline: events[0..2]=idx0(rect,hline,vline),
    // [3..5]=idx1, [6..8]=idx2, [9..11]=idx3.
    expect(events[9]).toEqual({ x: 15, y: 29, kind: 'rect', a: 2, b: 2 }); // idx3 bullet: xStart(8)+7, ypos(30)-1
    expect(events[11]).toEqual({ x: 8, y: 0, kind: 'vline', a: 0, b: 30 }); // lastY = idx0.ypos = 0
  });

  it('no earlier entry at level or level-1: vline falls back to y=0', () => {
    const events: DrawEvent[] = [];
    const s = new Skeleton2();
    s.add(3, 7); // no idx before it at all
    s.draw(new RecordingUGraphic(events));
    expect(events[2]).toEqual({ x: 24, y: 0, kind: 'vline', a: 0, b: 7 });
  });
});
