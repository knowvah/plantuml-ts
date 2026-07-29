/**
 * AtomTree.test.ts — T10c: coverage for `klimt/creole/atom/AtomTree.java`'s
 * port. Concrete coordinate assertions throughout (`code-principles.md`/
 * `testing.md`): AtomTree is pure geometry, so every test pins an exact
 * drawn position, not a truthy/falsy check.
 */
import { describe, expect, it } from 'vitest';
import { AtomTree } from '../../../../../../src/core/klimt/creole/atom/AtomTree.js';
import type { Atom } from '../../../../../../src/core/klimt/creole/SheetBlock1.js';
import { XDimension2D } from '../../../../../../src/core/klimt/geom/XDimension2D.js';
import { UTranslate } from '../../../../../../src/core/klimt/UTranslate.js';
import { Fore } from '../../../../../../src/core/klimt/Fore.js';
import { ULine } from '../../../../../../src/core/klimt/shape/ULine.js';
import { URectangle } from '../../../../../../src/core/klimt/shape/URectangle.js';
import type { UChange } from '../../../../../../src/core/klimt/UChange.js';
import type { UGraphic } from '../../../../../../src/core/klimt/UGraphic.js';
import type { UShape } from '../../../../../../src/core/klimt/UShape.js';
import type { StringBounder } from '../../../../../../src/core/klimt/font/StringBounder.js';
import type { Paint } from '../../../../../../src/core/paint.js';

interface DrawEvent {
  readonly x: number;
  readonly y: number;
  readonly kind: 'rect' | 'hline' | 'vline';
}

const sb: StringBounder = { calculateDimension: () => new XDimension2D(0, 0) };

/** Records `draw(shape)` events keyed by the CURRENT accumulated translate,
 *  and every `Fore` color re-applied — same combined pattern as
 *  `Skeleton2.test.ts` (shape events) + `TextBlockLineBefore.test.ts` (Fore
 *  events), this project's established per-file RecordingUGraphic idiom. */
class RecordingUGraphic implements UGraphic {
  constructor(
    private readonly drawEvents: DrawEvent[],
    private readonly foreEvents: Paint[],
    private readonly translate: UTranslate = UTranslate.none(),
  ) {}

  apply(change: UChange): UGraphic {
    if (change instanceof UTranslate) {
      return new RecordingUGraphic(this.drawEvents, this.foreEvents, this.translate.compose(change));
    }
    if (change instanceof Fore) {
      this.foreEvents.push(change.getColor());
      return new RecordingUGraphic(this.drawEvents, this.foreEvents, this.translate);
    }
    return this;
  }

  draw(shape: UShape): void {
    const { x, y } = this.translate.getPosition();
    if (shape instanceof URectangle) {
      this.drawEvents.push({ x, y, kind: 'rect' });
      return;
    }
    if (shape instanceof ULine) {
      this.drawEvents.push({ x, y, kind: shape.getDX() !== 0 ? 'hline' : 'vline' });
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

interface CellDraw {
  readonly label: string;
  readonly translate: UTranslate;
}

function fakeCell(width: number, height: number, label: string, log: CellDraw[]): Atom {
  return {
    calculateDimension: (): XDimension2D => new XDimension2D(width, height),
    drawU: (ug: UGraphic): void => {
      log.push({ label, translate: ug.getTranslate() });
    },
    getStartingAltitude: (): number => 0,
    getNeutrons: (): never => {
      throw new Error('not needed');
    },
  };
}

describe('AtomTree.calculateDimensionSlow (java:62-73)', () => {
  it('width = max over cells of (getXEndForLevel(level) + margin(2) + cell.width); height = sum of heights', () => {
    const log: CellDraw[] = [];
    const tree = new AtomTree('#000000');
    tree.addCell(fakeCell(20, 10, 'a', log), 1);
    tree.addCell(fakeCell(15, 8, 'b', log), 1);
    // xEndForLevel(1) = 1*8+8 = 16. width = max(16+2+20, 16+2+15) = max(38,33) = 38.
    expect(tree.calculateDimension(sb)).toEqual(new XDimension2D(38, 18));
  });

  it('different levels widen the indent zone independently', () => {
    const log: CellDraw[] = [];
    const tree = new AtomTree('#000000');
    tree.addCell(fakeCell(5, 3, 'a', log), 0); // xEnd(0)=8, +2+5=15
    tree.addCell(fakeCell(5, 3, 'b', log), 2); // xEnd(2)=24, +2+5=31
    expect(tree.calculateDimension(sb)).toEqual(new XDimension2D(31, 6));
  });
});

describe('AtomTree.getStartingAltitude (java:75-77)', () => {
  it('always returns 0, regardless of cells added', () => {
    const tree = new AtomTree('#000000');
    tree.addCell(fakeCell(5, 3, 'a', []), 4);
    expect(tree.getStartingAltitude(sb)).toBe(0);
  });
});

describe('AtomTree.drawU (java:79-92)', () => {
  it('draws each cell at margin+xEndForLevel(level), accumulates y by height, then draws the tree connectors', () => {
    const log: CellDraw[] = [];
    const drawEvents: DrawEvent[] = [];
    const foreEvents: Paint[] = [];
    const tree = new AtomTree('#123456');
    tree.addCell(fakeCell(20, 10, 'a', log), 1);
    tree.addCell(fakeCell(15, 8, 'b', log), 1);
    tree.drawU(new RecordingUGraphic(drawEvents, foreEvents));

    // Cell translate: dx = margin(2) + xEndForLevel(1)=16 = 18. Cell "a"'s
    // own y is 0 (ug starts untranslated); cell "b" draws after ug has
    // accumulated dy=10 from cell "a"'s own height.
    expect(log).toEqual([
      { label: 'a', translate: new UTranslate(18, 0) },
      { label: 'b', translate: new UTranslate(18, 10) },
    ]);

    // Fore(lineColor) applied exactly once, to draw the connectors.
    expect(foreEvents).toEqual(['#123456']);

    // Skeleton2 connectors: entry0 (level1, midY=0+10/2=5), entry1
    // (level1, midY=10+8/2=14). xStart=1*8=8 for both (same level).
    expect(drawEvents).toEqual([
      { x: 15, y: 4, kind: 'rect' }, // entry0 bullet: (xStart+7, midY-1)
      { x: 8, y: 5, kind: 'hline' }, // entry0 hline: (xStart, midY)
      { x: 8, y: 0, kind: 'vline' }, // entry0 vline: no mother/sister, lastY=0
      { x: 15, y: 13, kind: 'rect' }, // entry1 bullet
      { x: 8, y: 14, kind: 'hline' }, // entry1 hline
      { x: 8, y: 5, kind: 'vline' }, // entry1 vline: sister = entry0 (same level), lastY=5
    ]);
  });

  it('a single cell draws no vline offset beyond y=0 (no mother/sister)', () => {
    const drawEvents: DrawEvent[] = [];
    const foreEvents: Paint[] = [];
    const tree = new AtomTree('#000000');
    tree.addCell(fakeCell(10, 20, 'solo', []), 2);
    tree.drawU(new RecordingUGraphic(drawEvents, foreEvents));
    // xStart=2*8=16. midY=0+20/2=10.
    const vline = drawEvents.find((e) => e.kind === 'vline');
    expect(vline).toEqual({ x: 16, y: 0, kind: 'vline' });
  });
});

describe('AtomTree.addCell (java:98-101)', () => {
  it('preserves insertion order across calculateDimensionSlow (height accumulates in add order)', () => {
    const tree = new AtomTree('#000000');
    tree.addCell(fakeCell(1, 100, 'first', []), 0);
    tree.addCell(fakeCell(1, 1, 'second', []), 0);
    expect(tree.calculateDimension(sb).getHeight()).toBe(101);
  });
});
