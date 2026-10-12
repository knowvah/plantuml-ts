/**
 * `salt/element/Grid2.java` — the `{T` table lines `ElementTree#drawU`
 * draws per `TableStrategy` (java:56-91). Expected events are read off the
 * jar oracle `test-results/dot-cache/salt/nakuvu-18-nive718/in.svg`
 * (1.2026.8beta1), whose four tables are `{T!`, `{T-`, `{T+`, `{T#` over
 * the same 3 rows x 3 columns.
 *
 * Inputs: `rowsStart` is 0 plus the running 12 px row heights;
 * `colsStart` is the jar's column starts relative to the table (the
 * oracle's vertical `x` minus the table's x = 6). Each table is drawn at
 * the (6, y) offset at which the jar places it.
 */
import { describe, expect, it } from 'vitest';
import { Grid2 } from '../../../../src/diagrams/salt/element/Grid2.js';
import { TableStrategy } from '../../../../src/diagrams/salt/element/TableStrategy.js';
import { UTranslate } from '../../../../src/core/klimt/UTranslate.js';
import { RecordingUGraphic, line } from './recording-ugraphic.js';

const ROWS = [0, 12, 24, 36];
const COLS = [0, 69.025, 136.475, 167.85];

function drawn(strategy: TableStrategy, top: number): RecordingUGraphic {
  const ug = new RecordingUGraphic();
  new Grid2(ROWS, COLS, strategy).drawU(ug.apply(new UTranslate(6, top)));
  return ug;
}

const verticals = (top: number) => [6, 75.025, 142.475, 173.85].map((x) => line(x, top, x, top + 36));
const horizontals = (top: number) => [0, 12, 24, 36].map((dy) => line(6, top + dy, 173.85, top + dy));
const outside = (top: number) => [
  line(6, top, 173.85, top),
  line(6, top + 36, 173.85, top + 36),
  line(6, top, 6, top + 36),
  line(173.85, top, 173.85, top + 36),
];

describe('Grid2.drawU — nakuvu-18-nive718', () => {
  it('{T! (DRAW_VERTICAL) draws every column line, no row line', () => {
    expect(drawn(TableStrategy.DRAW_VERTICAL, 6).events).toEqual(verticals(6));
  });

  it('{T- (DRAW_HORIZONTAL) draws every row line, no column line', () => {
    expect(drawn(TableStrategy.DRAW_HORIZONTAL, 52).events).toEqual(horizontals(52));
  });

  it('{T+ (DRAW_OUTSIDE) draws top, bottom, left, right in that order', () => {
    expect(drawn(TableStrategy.DRAW_OUTSIDE, 98).events).toEqual(outside(98));
  });

  it('{T# (DRAW_ALL) draws all row lines then all column lines', () => {
    expect(drawn(TableStrategy.DRAW_ALL, 144).events).toEqual([...horizontals(144), ...verticals(144)]);
  });
});

describe('Grid2.drawU — strategies the oracle does not exercise (java:61, 79-91)', () => {
  it('DRAW_OUTSIDE_WITH_TITLE draws the same outline as DRAW_OUTSIDE', () => {
    expect(drawn(TableStrategy.DRAW_OUTSIDE_WITH_TITLE, 98).events).toEqual(outside(98));
  });

  it('DRAW_NONE draws nothing', () => {
    expect(drawn(TableStrategy.DRAW_NONE, 6).events).toEqual([]);
  });

  it('a single row/column start collapses to zero-length lines at it', () => {
    const ug = new RecordingUGraphic();
    new Grid2([4], [9], TableStrategy.DRAW_ALL).drawU(ug);
    expect(ug.events).toEqual([line(9, 4, 9, 4), line(9, 4, 9, 4)]);
  });

  it('empty starts throw like the Java List.get(0) (IndexOutOfBoundsException)', () => {
    expect(() => new Grid2([], [0], TableStrategy.DRAW_ALL).drawU(new RecordingUGraphic())).toThrow(RangeError);
    expect(() => new Grid2([0], [], TableStrategy.DRAW_ALL).drawU(new RecordingUGraphic())).toThrow(RangeError);
  });
});
