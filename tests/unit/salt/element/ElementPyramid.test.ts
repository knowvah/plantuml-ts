/**
 * `ElementPyramid` (ElementPyramid.java:58-176) against the 1.2026.8beta1
 * jar, deterministic text on. Fixtures under `fixtures/` (each `.puml`
 * rendered by `scripts/oracle-render.sh`; preferred dimensions by
 * `PreferredDimensionProbe.java` into `preferred-dimension.json`):
 *
 * - `pyramid-titled` — `{^"My group box"`: the 12 pt title pushes row 0 by
 *   half its height and is drawn over a white box (java:77-80, 111, 129).
 * - `pyramid-caret-untitled` — `{^` with no title: the empty 0 x 0 block.
 * - `pyramid-merge` — `{#` with `*` merges: a long merged cell only claims
 *   the width its columns lack (LeftFirst, java:134-140).
 * - `pyramid-outside-7x4` (= corpus `suvage-74-tera749`), `pyramid-all-7x4`.
 * - `pyramid-strategies` (= corpus `cifali-45-fexa238`): its four inner
 *   2 x 2 text tables, each drawn at the cell origin the jar placed it at.
 * - `pyramid-merge-overflow` — `a` / `b` / `*`: the merged cell runs past
 *   `colsStart`, which the jar dies on (ArrayIndexOutOfBoundsException,
 *   ElementPyramid.java:151).
 */
import { describe, expect, it } from 'vitest';
import type { StringBounder } from '../../../../src/core/klimt/font/StringBounder.js';
import { renderDrawableToFragment } from '../../../../src/core/klimt/document-shell-fragment.js';
import { Fore } from '../../../../src/core/klimt/Fore.js';
import { XDimension2D } from '../../../../src/core/klimt/geom/XDimension2D.js';
import type { UGraphic } from '../../../../src/core/klimt/UGraphic.js';
import { UTranslate } from '../../../../src/core/klimt/UTranslate.js';
import type { Element } from '../../../../src/diagrams/salt/element/Element.js';
import { ElementPyramid } from '../../../../src/diagrams/salt/element/ElementPyramid.js';
import { TableStrategy } from '../../../../src/diagrams/salt/element/TableStrategy.js';
import { measurer, stringBounder } from '../salt-test-support.js';
import {
  JAR_DIMENSIONS,
  STAR,
  dictionary,
  drawRoot,
  drawnElements,
  jarDrawnElements,
  positionner,
  textRows,
} from './container-test-support.js';
import { RecordingUGraphic } from './recording-ugraphic.js';

function pyramid(rows: string[][], strategy: TableStrategy, title: string | null = null): ElementPyramid {
  return new ElementPyramid(positionner(textRows(rows)), strategy, title, dictionary);
}

const GROUP_BOX = [
  ['Login', 'Password'],
  ['A', 'B'],
];
const MERGE = [['A', 'B', 'C'], ['A very long merged cell', STAR, 'D'], ['E'], ['F', STAR, STAR]];
const TABLE_7X4 = Array.from({ length: 7 }, (_, r) => ['A', 'B', 'C', 'D'].map((c) => `${c}${r}`));

/** Each fixture's root pyramid, as `ElementFactoryPyramid` builds it. */
const FIXTURE_ROOTS: Record<string, () => ElementPyramid> = {
  'pyramid-titled': () => pyramid(GROUP_BOX, TableStrategy.DRAW_OUTSIDE_WITH_TITLE, 'My group box'),
  'pyramid-caret-untitled': () => pyramid(GROUP_BOX, TableStrategy.DRAW_OUTSIDE_WITH_TITLE),
  'pyramid-merge': () => pyramid(MERGE, TableStrategy.DRAW_ALL),
  'pyramid-outside-7x4': () => pyramid(TABLE_7X4, TableStrategy.DRAW_OUTSIDE),
  'pyramid-all-7x4': () => pyramid(TABLE_7X4, TableStrategy.DRAW_ALL),
};

describe('ElementPyramid#getPreferredDimension — jar probe', () => {
  for (const [name, build] of Object.entries(FIXTURE_ROOTS)) {
    it(`${name}: ${JAR_DIMENSIONS[name]?.width} x ${JAR_DIMENSIONS[name]?.height}`, () => {
      const jar = JAR_DIMENSIONS[name];
      const dim = build().getPreferredDimension(stringBounder, 0, 0);
      expect(jar?.root).toBe('ElementPyramid');
      expect(dim.getWidth()).toBe(jar?.width);
      expect(dim.getHeight()).toBe(jar?.height);
    });
  }
});

describe('ElementPyramid#drawU — every drawn element equals the jar`s', () => {
  for (const [name, build] of Object.entries(FIXTURE_ROOTS)) {
    it(name, () => {
      expect(drawnElements(drawRoot(build()))).toEqual(jarDrawnElements(name));
    });
  }
});

describe('ElementPyramid#drawU — cifali-45-fexa238 inner tables', () => {
  const jar = jarDrawnElements('pyramid-strategies');
  /** The jar elements of the k-th inner table: from its "A" text up to the next "hop" field. */
  function jarTable(k: number): string[] {
    const starts = jar.flatMap((e, i) => (e.endsWith('>A</text>') ? [i] : []));
    const from = starts[k] ?? -1;
    const to = jar.findIndex((e, i) => i > from && e.includes('>hop'));
    return jar.slice(from, to === -1 ? jar.length : to);
  }

  /** The inner pyramid drawn z 0 then z 1 at its jar cell origin (6, top). */
  function drawInner(strategy: TableStrategy, k: number, top: number): string[] {
    const inner = pyramid(
      [
        ['A', 'B'],
        [`C${k + 1}`, 'D'],
      ],
      strategy,
    );
    const dim = inner.getPreferredDimension(stringBounder, 0, 0);
    const body = renderDrawableToFragment(
      {
        drawU: (ug) => {
          const at = ug.apply(new UTranslate(6, top)).apply(new Fore('#000000'));
          inner.drawU(at, 0, dim);
          inner.drawU(at, 1, dim);
        },
      },
      { width: 200, height: 300, measurer, uid: 'salt-inner' },
    ).body;
    return drawnElements(body);
  }

  const cases: [string, TableStrategy, number, number][] = [
    ['{ (DRAW_NONE)', TableStrategy.DRAW_NONE, 0, 6],
    ['{+ (DRAW_OUTSIDE)', TableStrategy.DRAW_OUTSIDE, 1, 52],
    ['{# (DRAW_ALL)', TableStrategy.DRAW_ALL, 2, 98],
    ['{! (DRAW_VERTICAL)', TableStrategy.DRAW_VERTICAL, 3, 144],
    ['{- (DRAW_HORIZONTAL)', TableStrategy.DRAW_HORIZONTAL, 4, 190],
  ];
  for (const [label, strategy, k, top] of cases) {
    it(label, () => {
      expect(drawInner(strategy, k, top)).toEqual(jarTable(k));
    });
  }

  it('each inner table measures 28.075 x 28 (the jar draws its right edge at 6 + 28.075)', () => {
    const dim = pyramid(
      [
        ['A', 'B'],
        ['C1', 'D'],
      ],
      TableStrategy.DRAW_OUTSIDE,
    ).getPreferredDimension(stringBounder, 0, 0);
    expect(dim.getWidth()).toBeCloseTo(28.075, 3);
    expect(dim.getHeight()).toBe(28);
    expect(JAR_DIMENSIONS['pyramid-strategies']).toEqual({ root: 'ElementPyramid', width: 40, height: 214 });
  });
});

/** A recorder measuring with the deterministic bounder (RecordingUGraphic's
 *  own answers 0 x 0, which would make the draw-time title height 0). Only
 *  the graphic the pyramid itself reads is measured: `apply(Fore)` returns
 *  `this`, `apply(UTranslate)` a plain recorder. */
class MeasuringRecorder extends RecordingUGraphic {
  override getStringBounder(): StringBounder {
    return stringBounder;
  }
}

/** A fixed-size cell that records every draw: translate, z-index, dimension. */
class CellStub implements Element {
  readonly draws: { x: number; y: number; zIndex: number; w: number; h: number }[] = [];
  measures = 0;
  constructor(
    private readonly width: number,
    private readonly height: number,
  ) {}
  getPreferredDimension(_sb: StringBounder, _x: number, _y: number): XDimension2D {
    this.measures++;
    return new XDimension2D(this.width, this.height);
  }
  drawU(ug: UGraphic, zIndex: number, dimToUse: XDimension2D): void {
    const { x, y } = ug.getTranslate().getPosition();
    this.draws.push({ x, y, zIndex, w: dimToUse.getWidth(), h: dimToUse.getHeight() });
  }
}

describe('ElementPyramid — cell placement (java:107-117, 123-166)', () => {
  it('places each cell at its column/row start + 1 with the span minus 1 as its dimension', () => {
    const a = new CellStub(10, 5);
    const b = new CellStub(20, 7);
    const wide = new CellStub(50, 3);
    const p = new ElementPyramid(
      positionner([
        [a, b],
        [wide, STAR],
      ]),
      TableStrategy.DRAW_NONE,
      null,
      dictionary,
    );
    // cols: 0 | 12 | 34, then the 52-wide merge adds 18 to the last start; rows: 0 | 9 | 14.
    expect(p.getPreferredDimension(stringBounder, 0, 0)).toEqual(new XDimension2D(52, 14));
    p.drawU(new RecordingUGraphic(), 0, new XDimension2D(52, 14));
    expect(a.draws).toEqual([{ x: 1, y: 1, zIndex: 0, w: 11, h: 8 }]);
    expect(b.draws).toEqual([{ x: 13, y: 1, zIndex: 0, w: 39, h: 8 }]);
    expect(wide.draws).toEqual([{ x: 1, y: 10, zIndex: 0, w: 51, h: 4 }]);
  });

  it('draws the cells at every z-index but the grid at z-index 0 only (java:118-119)', () => {
    const a = new CellStub(10, 5);
    const p = new ElementPyramid(positionner([[a]]), TableStrategy.DRAW_ALL, null, dictionary);
    const ug0 = new RecordingUGraphic();
    p.drawU(ug0, 0, new XDimension2D(12, 7));
    const ug1 = new RecordingUGraphic();
    p.drawU(ug1, 1, new XDimension2D(12, 7));
    expect(ug0.events).toHaveLength(4);
    expect(ug1.events).toEqual([]);
    expect(a.draws.map((d) => d.zIndex)).toEqual([0, 1]);
  });

  it('measures each cell twice, once per init pass, and only on the first call (java:124-125)', () => {
    const a = new CellStub(10, 5);
    const p = new ElementPyramid(positionner([[a]]), TableStrategy.DRAW_NONE, null, dictionary);
    p.getPreferredDimension(stringBounder, 0, 0);
    p.getPreferredDimension(stringBounder, 3, 4);
    p.drawU(new RecordingUGraphic(), 0, new XDimension2D(12, 7));
    expect(a.measures).toBe(2);
  });

  it('a titled pyramid moves row 0 cells down by half the title height (java:111, 144)', () => {
    const a = new CellStub(10, 5);
    const b = new CellStub(10, 5);
    const p = new ElementPyramid(positionner([[a], [b]]), TableStrategy.DRAW_NONE, 'T', dictionary);
    // 12 pt title: 12 high, so rowsStart = 6 | 6 + 5 + 6 + 2 = 19 | 26.
    expect(p.getPreferredDimension(stringBounder, 0, 0).getHeight()).toBe(26 + 12);
    p.drawU(new MeasuringRecorder(), 1, new XDimension2D(0, 0));
    expect(a.draws).toEqual([{ x: 1, y: 13, zIndex: 1, w: 11, h: 12 }]);
    expect(b.draws).toEqual([{ x: 1, y: 20, zIndex: 1, w: 11, h: 6 }]);
  });

  it('an empty pyramid measures 0 x 0 and draws nothing', () => {
    const p = new ElementPyramid(positionner([]), TableStrategy.DRAW_ALL, null, dictionary);
    expect(p.getPreferredDimension(stringBounder, 0, 0)).toEqual(new XDimension2D(0, 0));
    const ug = new RecordingUGraphic();
    p.drawU(ug, 0, new XDimension2D(0, 0));
    expect(ug.events.every((e) => e.x1 === e.x2 && e.y1 === e.y2)).toBe(true);
    expect(p.getNbRows()).toBe(2);
    expect(p.getNbCols()).toBe(2);
  });

  it('getNbRows / getNbCols are the counted extent + 1 (java:168-174)', () => {
    const p = pyramid(MERGE, TableStrategy.DRAW_ALL);
    expect(p.getNbRows()).toBe(5);
    expect(p.getNbCols()).toBe(4);
  });
});

describe('ElementPyramid — the jar`s crash rows', () => {
  it('pyramid-merge-overflow: a / b / * throws the jar`s ArrayIndexOutOfBoundsException', () => {
    const p = pyramid([['a'], ['b'], [STAR]], TableStrategy.DRAW_NONE);
    expect(() => p.getPreferredDimension(stringBounder, 0, 0)).toThrow(
      new RangeError('Index 2 out of bounds for length 2'),
    );
  });
});
