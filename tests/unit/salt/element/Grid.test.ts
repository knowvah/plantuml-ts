/**
 * `salt/element/Grid.java` — the pyramid table lines per `TableStrategy`,
 * in the jar's draw order, which is `HashSet<Segment>` iteration order
 * (Grid.java:57-58, 87-99). Expected events are read off jar oracles
 * (1.2026.8beta1):
 *
 * - `test-results/dot-cache/salt/cifali-45-fexa238` (= `fixtures/
 *   pyramid-strategies.jar.svg`): four 2 x 2 tables `{+`, `{#`, `{!`, `{-`,
 *   each at (6, top), column starts 0 / 17.375 / 28.075, row pitch 14.
 * - `suvage-74-tera749` (= `fixtures/pyramid-outside-7x4.jar.svg`, `{+`)
 *   and `fixtures/pyramid-all-7x4.jar.svg` (`{#`, oracle-render.sh probe):
 *   7 rows x 4 columns at (5, 5) — 14 / 22 / 32 / 35 segments, which grow
 *   the `HashMap` table past 16 and 32 bins, so the order pins the resize.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { StringBounder } from '../../../../src/core/klimt/font/StringBounder.js';
import { XDimension2D } from '../../../../src/core/klimt/geom/XDimension2D.js';
import type { TextBlock } from '../../../../src/core/klimt/shape/TextBlock.js';
import { TextBlockUtils } from '../../../../src/core/klimt/shape/TextBlockUtils.js';
import type { UGraphic } from '../../../../src/core/klimt/UGraphic.js';
import { UTranslate } from '../../../../src/core/klimt/UTranslate.js';
import { HColors } from '../../../../src/core/klimt/color/HColors.js';
import { Cell } from '../../../../src/diagrams/salt/Cell.js';
import { Grid } from '../../../../src/diagrams/salt/element/Grid.js';
import { TableStrategy } from '../../../../src/diagrams/salt/element/TableStrategy.js';
import { FIXTURES } from '../salt-test-support.js';
import { type DrawEvent, RecordingUGraphic, line, rect } from './recording-ugraphic.js';

const WHITE = HColors.WHITE;
const NO_TITLE = TextBlockUtils.empty(0, 0);

const ROWS_2 = [0, 14, 28];
const COLS_2 = [0, 17.375, 28.075];
/** The 2 x 2 tables' cells, in Positionner2 (reading) order. */
const CELLS_2 = (): Cell[] => [new Cell(0, 0), new Cell(0, 1), new Cell(1, 0), new Cell(1, 1)];

const ROWS_7 = [0, 14, 28, 42, 56, 70, 84, 98];
const COLS_4 = [0, 16.7, 33.4, 50.775, 68.15];
function cells7x4(): Cell[] {
  const cells: Cell[] = [];
  for (let r = 0; r < 7; r++) for (let c = 0; c < 4; c++) cells.push(new Cell(r, c));
  return cells;
}

/** Builds a grid, adds `cells` as ElementPyramid#drawU does, draws it at (x, y). */
function drawn(rows: number[], cols: number[], strategy: TableStrategy, cells: Cell[], x: number, y: number) {
  const ug = new RecordingUGraphic();
  const grid = new Grid(rows, cols, strategy, NO_TITLE);
  for (const c of cells) grid.addCell(c);
  grid.drawU(ug, x, y, WHITE);
  return ug.events;
}

/** Every `<line>` of a jar fixture, in document order. */
function jarLines(name: string): DrawEvent[] {
  const svg = readFileSync(`${FIXTURES}/${name}.jar.svg`, 'utf8');
  return [...svg.matchAll(/<line x1="([^"]+)" y1="([^"]+)" x2="([^"]+)" y2="([^"]+)"/g)].map((m) =>
    line(Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4])),
  );
}

describe('Grid.drawU — cifali-45-fexa238 2 x 2 tables', () => {
  it('{+ (DRAW_OUTSIDE) draws the outline only, in HashSet order', () => {
    expect(drawn(ROWS_2, COLS_2, TableStrategy.DRAW_OUTSIDE, CELLS_2(), 6, 52)).toEqual([
      line(6, 52, 23.375, 52),
      line(23.375, 52, 34.075, 52),
      line(6, 80, 23.375, 80),
      line(23.375, 80, 34.075, 80),
      line(6, 52, 6, 66),
      line(34.075, 66, 34.075, 80),
      line(34.075, 52, 34.075, 66),
      line(6, 66, 6, 80),
    ]);
  });

  it('{# (DRAW_ALL) draws every cell edge once, de-duplicated on hashCode + equals', () => {
    expect(drawn(ROWS_2, COLS_2, TableStrategy.DRAW_ALL, CELLS_2(), 6, 98)).toEqual([
      line(6, 98, 23.375, 98),
      line(23.375, 112, 34.075, 112),
      line(23.375, 98, 34.075, 98),
      line(6, 126, 23.375, 126),
      line(23.375, 126, 34.075, 126),
      line(6, 112, 23.375, 112),
      line(6, 98, 6, 112),
      line(23.375, 112, 23.375, 126),
      line(34.075, 112, 34.075, 126),
      line(23.375, 98, 23.375, 112),
      line(34.075, 98, 34.075, 112),
      line(6, 112, 6, 126),
    ]);
  });

  it('{! (DRAW_VERTICAL) draws every column edge and no row edge', () => {
    expect(drawn(ROWS_2, COLS_2, TableStrategy.DRAW_VERTICAL, CELLS_2(), 6, 144)).toEqual([
      line(6, 144, 6, 158),
      line(23.375, 158, 23.375, 172),
      line(23.375, 144, 23.375, 158),
      line(34.075, 158, 34.075, 172),
      line(34.075, 144, 34.075, 158),
      line(6, 158, 6, 172),
    ]);
  });

  it('{- (DRAW_HORIZONTAL) draws every row edge and no column edge', () => {
    expect(drawn(ROWS_2, COLS_2, TableStrategy.DRAW_HORIZONTAL, CELLS_2(), 6, 190)).toEqual([
      line(6, 190, 23.375, 190),
      line(23.375, 204, 34.075, 204),
      line(23.375, 190, 34.075, 190),
      line(6, 218, 23.375, 218),
      line(6, 204, 23.375, 204),
      line(23.375, 218, 34.075, 218),
    ]);
  });

  it('{ (DRAW_NONE) draws nothing, whatever cells are added', () => {
    expect(drawn(ROWS_2, COLS_2, TableStrategy.DRAW_NONE, CELLS_2(), 6, 6)).toEqual([]);
  });

  it('{^ (DRAW_OUTSIDE_WITH_TITLE) ignores added cells like DRAW_OUTSIDE', () => {
    expect(drawn(ROWS_2, COLS_2, TableStrategy.DRAW_OUTSIDE_WITH_TITLE, CELLS_2(), 6, 52)).toEqual(
      drawn(ROWS_2, COLS_2, TableStrategy.DRAW_OUTSIDE, [], 6, 52),
    );
  });
});

describe('Grid.drawU — 7 x 4 tables (HashMap resize order)', () => {
  it('{+ (suvage-74-tera749): 14 verticals resize the table to 32 bins', () => {
    expect(drawn(ROWS_7, COLS_4, TableStrategy.DRAW_OUTSIDE, cells7x4(), 5, 5)).toEqual(
      jarLines('pyramid-outside-7x4'),
    );
  });

  it('{# (pyramid-all-7x4 probe): 32 horizontals and 35 verticals resize it to 64 bins', () => {
    const events = drawn(ROWS_7, COLS_4, TableStrategy.DRAW_ALL, cells7x4(), 5, 5);
    expect(events).toHaveLength(67);
    expect(events).toEqual(jarLines('pyramid-all-7x4'));
  });
});

/** A fixed-size title that records where it was drawn. */
class TitleStub implements TextBlock {
  readonly drawnAt: { x: number; y: number }[] = [];
  constructor(
    private readonly width: number,
    private readonly height: number,
  ) {}
  calculateDimension(_sb: StringBounder): XDimension2D {
    return new XDimension2D(this.width, this.height);
  }
  drawU(ug: UGraphic): void {
    this.drawnAt.push(ug.getTranslate().getPosition());
  }
}

describe('Grid.drawU — title (Grid.java:101-107)', () => {
  it('draws the outline, then a title-sized box and the title at (x + 6, y) (vizono-80-vipa581)', () => {
    const title = new TitleStub(72.6, 12);
    const ug = new RecordingUGraphic();
    new Grid([6, 28, 44, 67], [0, 59, 139], TableStrategy.DRAW_OUTSIDE_WITH_TITLE, title).drawU(ug, 5, 5, WHITE);
    expect(ug.events.slice(-1)).toEqual([rect(11, 5, 72.6, 12)]);
    expect(ug.events.slice(0, 4)).toEqual([
      line(5, 11, 64, 11),
      line(64, 11, 144, 11),
      line(5, 72, 64, 72),
      line(64, 72, 144, 72),
    ]);
    expect(title.drawnAt).toEqual([{ x: 11, y: 5 }]);
  });

  it('skips the box and the title when either side of the title is 0', () => {
    for (const title of [new TitleStub(0, 12), new TitleStub(40, 0)]) {
      const ug = new RecordingUGraphic();
      new Grid(ROWS_2, COLS_2, TableStrategy.DRAW_NONE, title).drawU(ug, 0, 0, WHITE);
      expect(ug.events).toEqual([]);
      expect(title.drawnAt).toEqual([]);
    }
  });
});

describe('Grid — Java array bounds', () => {
  it('a cell past the column starts is the jar`s ArrayIndexOutOfBoundsException at draw time', () => {
    const grid = new Grid([0, 14], [0, 10], TableStrategy.DRAW_HORIZONTAL, NO_TITLE);
    grid.addCell(new Cell(0, 1));
    expect(() => grid.drawU(new RecordingUGraphic(), 0, 0, WHITE)).toThrow('Index 2 out of bounds for length 2');
  });

  it('draws relative to the translate the graphic already carries', () => {
    const ug = new RecordingUGraphic().apply(new UTranslate(100, 200));
    new Grid([0, 10], [0, 20], TableStrategy.DRAW_OUTSIDE, NO_TITLE).drawU(ug, 1, 2, WHITE);
    expect((ug as RecordingUGraphic).events).toEqual([
      line(101, 202, 121, 202),
      line(101, 212, 121, 212),
      line(101, 202, 101, 212),
      line(121, 202, 121, 212),
    ]);
  });
});
