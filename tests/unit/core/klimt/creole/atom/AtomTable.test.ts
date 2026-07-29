/**
 * AtomTable.test.ts — T10b: unit coverage for `AtomTable`
 * (klimt/creole/atom/AtomTable.java): column-width/row-height max
 * propagation, per-line/per-cell background fills, `RIGHT`-alignment
 * x-shift (via a real `SheetBlock1` cell, since the alignment probe is a
 * real `instanceof SheetBlock1` check), and the grid rule pass.
 */
import { describe, expect, it } from 'vitest';
import { AtomTable } from '../../../../../../src/core/klimt/creole/atom/AtomTable.js';
import { SheetBlock1 } from '../../../../../../src/core/klimt/creole/SheetBlock1.js';
import { Sheet } from '../../../../../../src/core/klimt/creole/Sheet.js';
import type { Stripe } from '../../../../../../src/core/klimt/creole/Stripe.js';
import type { AtomOps } from '../../../../../../src/core/klimt/creole/Sea.js';
import type { CreoleAtom } from '../../../../../../src/core/klimt/creole/atom/Atom.js';
import type { Atom } from '../../../../../../src/core/klimt/creole/SheetBlock1.js';
import { LineBreakStrategy } from '../../../../../../src/core/klimt/LineBreakStrategy.js';
import { HorizontalAlignment } from '../../../../../../src/core/klimt/geom/HorizontalAlignment.js';
import { XDimension2D } from '../../../../../../src/core/klimt/geom/XDimension2D.js';
import { URectangle } from '../../../../../../src/core/klimt/shape/URectangle.js';
import { ULine } from '../../../../../../src/core/klimt/shape/ULine.js';
import { UTranslate } from '../../../../../../src/core/klimt/UTranslate.js';
import { Fore } from '../../../../../../src/core/klimt/Fore.js';
import { Back } from '../../../../../../src/core/klimt/Back.js';
import type { UChange } from '../../../../../../src/core/klimt/UChange.js';
import type { UGraphic } from '../../../../../../src/core/klimt/UGraphic.js';
import type { UShape } from '../../../../../../src/core/klimt/UShape.js';
import type { StringBounder } from '../../../../../../src/core/klimt/font/StringBounder.js';

class FakeStringBounder implements StringBounder {
  calculateDimension(): XDimension2D {
    return new XDimension2D(0, 0);
  }
}
const sb: StringBounder = new FakeStringBounder();

function fakeCell(width: number, height: number): Atom & { drawnAt: UTranslate[] } {
  const drawnAt: UTranslate[] = [];
  return {
    drawnAt,
    calculateDimension: (): XDimension2D => new XDimension2D(width, height),
    getStartingAltitude: (): number => 0,
    getNeutrons: (): never => {
      throw new Error('not needed');
    },
    drawU: (ug: UGraphic): void => {
      drawnAt.push(ug.getTranslate());
    },
  };
}

interface DrawCall {
  readonly shape: UShape;
  readonly translate: UTranslate;
  readonly fg: string | undefined;
  readonly bg: string | undefined;
}

/** Records every `draw(shape)` call (shape + accumulated translate/
 *  Fore/Back paint) into a SHARED array, mirroring `SheetBlock1.test.ts`'s
 *  `RecordingUGraphic` -- extended here to also track `Fore`/`Back`
 *  application, which `AtomTable#drawU` (unlike `SheetBlock1#drawU`)
 *  actually exercises directly via `ug.draw(URectangle/ULine)`. */
class RecordingUGraphic implements UGraphic {
  constructor(
    readonly draws: DrawCall[] = [],
    private readonly translate: UTranslate = UTranslate.none(),
    private readonly fg?: string,
    private readonly bg?: string,
  ) {}

  apply(change: UChange): UGraphic {
    if (change instanceof UTranslate) return new RecordingUGraphic(this.draws, this.translate.compose(change), this.fg, this.bg);
    if (change instanceof Fore) return new RecordingUGraphic(this.draws, this.translate, change.getColor() as string, this.bg);
    if (change instanceof Back) return new RecordingUGraphic(this.draws, this.translate, this.fg, change.getBackColor() as string);
    return this;
  }

  draw(shape: UShape): void {
    this.draws.push({ shape, translate: this.translate, fg: this.fg, bg: this.bg });
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

describe('AtomTable.calculateDimensionSlow (java:91-96)', () => {
  it('column width is the MAX cell width in that column; row height is the MAX cell height in that row', () => {
    const table = new AtomTable('black');
    table.newLine(null);
    table.addCell(fakeCell(10, 5), null); // col0
    table.addCell(fakeCell(30, 8), null); // col1 (widest)
    table.newLine(null);
    table.addCell(fakeCell(20, 12), null); // col0 (tallest row1)
    // row1 has only 1 cell -- col1 contributes 0 to that row's height/width.

    // width = colWidth(0) + colWidth(1) = max(10,20) + max(30,0) = 20 + 30 = 50
    // height = lineHeight(0) + lineHeight(1) = max(5,8) + max(12,0) = 8 + 12 = 20
    expect(table.calculateDimension(sb)).toEqual(new XDimension2D(50, 20));
  });

  it('single 1x1 table: dimension is exactly the one cell (java: getEndingX/Y at nbCols-1/nbLines-1)', () => {
    const table = new AtomTable('black');
    table.newLine(null);
    table.addCell(fakeCell(7, 9), null);
    expect(table.calculateDimension(sb)).toEqual(new XDimension2D(7, 9));
  });

  it('getStartingAltitude is always 0 (java:98-100)', () => {
    const table = new AtomTable('black');
    table.newLine(null);
    table.addCell(fakeCell(1, 1), null);
    expect(table.getStartingAltitude(sb)).toBe(0);
  });
});

describe('AtomTable.addCell/newLine cache invalidation (java:277-284)', () => {
  it('addCell after a draw pass invalidates the memoized positions (positions.clear()), so a later draw sees the new cell', () => {
    // `drawU` (unlike `calculateDimension`, which is additionally wrapped
    // by `TextBlockMemoized`'s OWN outer cache -- a separate, unrelated
    // memoization layer keyed on the `StringBounder`'s constructor) always
    // calls `initMap` fresh, whose OWN guard (`positions.size > 0 ->
    // return`) is exactly what `addCell`/`newLine`'s `positions.clear()`
    // defeats -- so this exercises the cache-invalidation contract
    // directly, sidestepping the unrelated outer cache.
    const table = new AtomTable('black');
    table.newLine(null);
    const first = fakeCell(10, 10);
    table.addCell(first, null);
    table.drawU(new RecordingUGraphic());
    expect(first.drawnAt).toHaveLength(1);

    const second = fakeCell(25, 3);
    table.addCell(second, null);
    table.drawU(new RecordingUGraphic());
    // Both cells drawn again on the second pass -- `initMap` recomputed
    // rather than trusting a stale `positions` map that never saw `second`.
    expect(first.drawnAt).toHaveLength(2);
    expect(second.drawnAt).toHaveLength(1);
  });

  it('a second draw with NO intervening addCell/newLine reuses the memoized positions (java:170-171 early return)', () => {
    const table = new AtomTable('black');
    table.newLine(null);
    const cell = fakeCell(10, 10);
    table.addCell(cell, null);
    table.drawU(new RecordingUGraphic());
    table.drawU(new RecordingUGraphic());
    // Same position both times -- `initMap`'s `positions.size > 0` guard
    // short-circuited the second call instead of recomputing from scratch.
    expect(cell.drawnAt).toEqual([new UTranslate(0, 0), new UTranslate(0, 0)]);
  });
});

describe('AtomTable.drawU (java:102-157)', () => {
  it('draws each cell at its column/row-accumulated (x,y) position', () => {
    const table = new AtomTable('black');
    table.newLine(null);
    const c00 = fakeCell(10, 5);
    const c01 = fakeCell(30, 8);
    table.addCell(c00, null);
    table.addCell(c01, null);
    table.newLine(null);
    const c10 = fakeCell(20, 12);
    table.addCell(c10, null);

    table.drawU(new RecordingUGraphic());

    expect(c00.drawnAt[0]).toEqual(new UTranslate(0, 0));
    expect(c01.drawnAt[0]).toEqual(new UTranslate(20, 0)); // col0 width = max(10,20) = 20
    expect(c10.drawnAt[0]).toEqual(new UTranslate(0, 8)); // row0 height = max(5,8) = 8
  });

  it('draws the full N+1 x M+1 grid of horizontal/vertical rules at accumulated column/row boundaries', () => {
    const table = new AtomTable('#123456');
    table.newLine(null);
    table.addCell(fakeCell(10, 5), null);
    table.addCell(fakeCell(30, 8), null);
    table.newLine(null);
    table.addCell(fakeCell(20, 12), null);

    const ug = new RecordingUGraphic();
    table.drawU(ug);

    const hlines = ug.draws.filter((d) => d.shape instanceof ULine && d.shape.getWidth() !== 0);
    const vlines = ug.draws.filter((d) => d.shape instanceof ULine && d.shape.getHeight() !== 0);
    // 2 rows -> 3 horizontal rules; 2 cols -> 3 vertical rules.
    expect(hlines).toHaveLength(3);
    expect(vlines).toHaveLength(3);
    // Every grid-rule draw carries the table's own lineColor as foreground.
    for (const d of [...hlines, ...vlines]) expect(d.fg).toBe('#123456');
    // Horizontal rule boundaries land at y=0, y=8 (row0 height), y=20 (row0+row1).
    expect(hlines.map((d) => d.translate.getDy()).sort((a, b) => a - b)).toEqual([0, 8, 20]);
    // Vertical rule boundaries land at x=0, x=20 (col0 width), x=50 (col0+col1).
    expect(vlines.map((d) => d.translate.getDx()).sort((a, b) => a - b)).toEqual([0, 20, 50]);
  });

  it('fills a per-line background with Fore(none)+Back(color) before drawing cells (java:106-113)', () => {
    const table = new AtomTable('black');
    table.newLine('red');
    table.addCell(fakeCell(10, 5), null);

    const ug = new RecordingUGraphic();
    table.drawU(ug);

    const rectDraws = ug.draws.filter((d) => d.shape instanceof URectangle);
    expect(rectDraws).toHaveLength(1);
    expect(rectDraws[0]?.fg).toBe('none');
    expect(rectDraws[0]?.bg).toBe('red');
    expect((rectDraws[0]?.shape as URectangle).getWidth()).toBe(10);
    expect((rectDraws[0]?.shape as URectangle).getHeight()).toBe(5);
  });

  it('fills a per-cell background independently of the per-line background (java:118-137)', () => {
    const table = new AtomTable('black');
    table.newLine(null); // no line background
    table.addCell(fakeCell(10, 5), 'blue');

    const ug = new RecordingUGraphic();
    table.drawU(ug);

    const rectDraws = ug.draws.filter((d) => d.shape instanceof URectangle);
    expect(rectDraws).toHaveLength(1);
    expect(rectDraws[0]?.bg).toBe('blue');
  });

  it('a RIGHT-aligned SheetBlock1 cell shifts its draw by (cellWidth - dimCell.width) (java:120-121,136-139)', () => {
    // Real SheetBlock1, not a fake -- `AtomTable#drawU`'s alignment probe
    // is a genuine `instanceof SheetBlock1` check (java:120), so only a
    // real instance exercises it. `atomOps.drawU` records the `UGraphic`
    // translate it was called with, mirroring `SheetBlock1.test.ts`'s own
    // `AtomOps` test-double pattern (SheetBlock1#drawU routes cell content
    // through the injected `AtomOps`, never `ug.draw` directly).
    function textAtom(text: string): CreoleAtom {
      return { kind: 'text', text, font: { family: 'sans-serif', size: 12, color: '#000', styles: new Set() } };
    }
    const CHAR_WIDTH = 2;
    const drawnTranslates: UTranslate[] = [];
    const unitOps: AtomOps = {
      calculateDimension: (atom): XDimension2D => {
        const text = atom.kind === 'text' ? atom.text : '';
        return new XDimension2D(text.length * CHAR_WIDTH, 10);
      },
      getStartingAltitude: (): number => 0,
      drawU: (_atom, ug): void => {
        drawnTranslates.push(ug.getTranslate());
      },
    };
    const rightAlignedStripe: Stripe & { getCellAlignment(): HorizontalAlignment } = {
      getLHeader: () => null,
      getAtoms: () => [textAtom('AB')], // width 4
      getCellAlignment: () => HorizontalAlignment.RIGHT,
    };
    const sheet = new Sheet(HorizontalAlignment.LEFT);
    sheet.add(rightAlignedStripe);
    const narrowCell = new SheetBlock1(sheet, LineBreakStrategy.NONE, unitOps);

    const table = new AtomTable('black');
    table.newLine(null);
    table.addCell(narrowCell, null); // col0
    table.newLine(null);
    table.addCell(fakeCell(24, 6), null); // col0, row1: widens col0 to 24

    table.drawU(new RecordingUGraphic());

    // col0 width = max(narrowCell's own 4, sibling row's 24) = 24.
    // narrowCell's own measured width is 4 -> dx = 24 - 4 = 20.
    expect(drawnTranslates).toHaveLength(1);
    expect(drawnTranslates[0]).toEqual(new UTranslate(20, 0));
  });
});
