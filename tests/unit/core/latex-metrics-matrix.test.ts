import { describe, expect, it } from 'vitest';

import { measureTeXIcon } from '../../../src/core/latex-metrics.js';
import type { Atom, MatrixAtom } from '../../../src/core/latex-metrics/atoms.js';
import type { Align, Box } from '../../../src/core/latex-metrics/box.js';
import { ALIGN_CENTER, ALIGN_LEFT, ALIGN_RIGHT, strutBox } from '../../../src/core/latex-metrics/box.js';
import type { Context } from '../../../src/core/latex-metrics/convert.js';
import type { KNode } from '../../../src/core/latex-metrics/katex-glyphs.js';
import { matrixBox } from '../../../src/core/latex-metrics/matrix.js';
import { convertNode } from '../../../src/core/latex-metrics/nodes.js';
import { STYLE_DISPLAY, TEX_ICON_SIZE, XHEIGHT_CM, param } from '../../../src/core/latex-metrics/tex-font.js';

/**
 * Every icon size below is JLaTeXMath 1.0.7's own `TeXIcon` answer, printed
 * from `jlatexmath-1.0.7.jar` built exactly as `math/TeXIconBuilder.java:
 * 52-73` does (`new TeXFormula(tex).new TeXIconBuilder().setStyle(0)
 * .setSize(20).build()`, then `setInsets(new Insets(1, 1, 1, 1))`).
 * The first row is `mefeke-43-xotu192`'s `<math>[[a,b],[c,d]]((n),(k))`
 * after the ASCIIMath conversion; its jar `<image>` is 150 x 56.
 *
 * The rules under test are `MatrixAtom`'s, read with `javap -c -p`:
 * `<clinit>` (hsep 1em, semihsep 0.5em, vsep_in 1ex, vsep_ext_top/bot 0.4ex),
 * `getColumnSep` (case ARRAY/MATRIX) and `createBox`.
 */
const MEFEKE_TEX =
  '{\\left[\\begin{array}{cc} {a}&{b}\\\\{c}&{d}\\end{array}\\right]}' +
  '{\\left(\\begin{array}{c} {n}\\\\{k}\\end{array}\\right)}';

const JLATEXMATH_MATRICES: ReadonlyArray<readonly [string, number, number]> = [
  [MEFEKE_TEX, 150, 56],
  ['\\begin{array}{c} a \\end{array}', 39, 24],
  ['\\begin{array}{cc} a & b \\end{array}', 68, 30],
  ['\\begin{array}{cc} a & b \\\\ c & d \\end{array}', 69, 52],
  ['\\begin{array}{lr} aaa & b \\\\ c & dddd \\end{array}', 122, 52],
  ['\\begin{array}{c} g \\\\ y \\\\ x \\end{array}', 40, 66],
  ['\\begin{array}{cc} a & \\\\ & d \\end{array}', 69, 46],
  ['\\begin{array}{cc} a & b \\\\ c \\end{array}', 68, 46],
  ['\\begin{array}{c} \\frac{a}{b} \\\\ x \\end{array}', 44, 68],
  ['\\begin{matrix} a & b \\\\ c & d \\end{matrix}', 49, 52],
  ['\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}', 79, 56],
];

describe('measureTeXIcon: array and matrix environments (MatrixAtom#createBox)', () => {
  it.each(JLATEXMATH_MATRICES)('%s is %i x %i', (tex, width, height) => {
    expect(measureTeXIcon(tex)).toEqual({ width, height, unsupported: [] });
  });

  it('flags a column rule rather than sizing it silently', () => {
    expect(measureTeXIcon('\\begin{array}{c|c} a & b \\end{array}').unsupported).toEqual(['array vline']);
  });

  it('flags a row rule', () => {
    expect(measureTeXIcon('\\begin{array}{c} a \\\\ \\hline b \\end{array}').unsupported).toEqual(['array hline']);
  });

  it('flags an environment with its own column separation', () => {
    expect(measureTeXIcon('\\begin{aligned} a &= b \\end{aligned}').unsupported).toEqual(['array']);
  });
});

const EM = 1;
const EX = XHEIGHT_CM;
const AXIS = param('axisheight', STYLE_DISPLAY);

/** A cell: an atom the stub builder maps to a fixed box. */
const cell = (): Atom => ({ kind: 'break' });

function stubBuild(boxes: Map<Atom, Box>): (atom: Atom, style: number) => Box {
  return (atom) => {
    const b = boxes.get(atom);
    if (b === undefined) throw new Error('unexpected atom');
    return { ...b };
  };
}

interface Grid {
  atom: MatrixAtom;
  build: (atom: Atom, style: number) => Box;
}

/** A matrix over cells of the given `[width, height, depth]`. */
function grid(
  env: MatrixAtom['env'],
  cells: ReadonlyArray<ReadonlyArray<readonly [number, number, number] | null>>,
): Grid {
  const boxes = new Map<Atom, Box>();
  const rows = cells.map((row) =>
    row.map((c) => {
      if (c === null) return undefined;
      const a = cell();
      boxes.set(a, strutBox(c[0], c[1], c[2]));
      return a;
    }),
  );
  const cols = Math.max(...cells.map((r) => r.length));
  const atom: MatrixAtom = {
    kind: 'matrix',
    type: 0,
    env,
    rows,
    align: Array.from({ length: cols }, () => ALIGN_CENTER),
  };
  return { atom, build: stubBuild(boxes) };
}

describe('matrixBox rules (MatrixAtom#getColumnSep, #createBox)', () => {
  it('array: semihsep, hsep between columns, semihsep (getColumnSep case ARRAY, spaceAround)', () => {
    const { atom, build } = grid('array', [
      [
        [2, 1, 0],
        [3, 1, 0],
        [4, 1, 0],
      ],
    ]);
    // 0.5em + 2 + 1em + 3 + 1em + 4 + 0.5em
    expect(matrixBox(atom, STYLE_DISPLAY, build).width).toBeCloseTo(0.5 * EM + 2 + EM + 3 + EM + 4 + 0.5 * EM, 10);
  });

  it('matrix: no outer separators, hsep between columns (getColumnSep case MATRIX)', () => {
    const { atom, build } = grid('matrix', [
      [
        [2, 1, 0],
        [3, 1, 0],
      ],
    ]);
    expect(matrixBox(atom, STYLE_DISPLAY, build).width).toBeCloseTo(2 + EM + 3, 10);
  });

  it('single column: only the two semihsep (arraycolsep) around the cell', () => {
    const { atom, build } = grid('array', [[[5, 1, 0]]]);
    expect(matrixBox(atom, STYLE_DISPLAY, build).width).toBeCloseTo(0.5 * EM + 5 + 0.5 * EM, 10);
  });

  it('column width is the widest cell of the column (rowWidth[j] = max)', () => {
    const { atom, build } = grid('matrix', [
      [
        [2, 1, 0],
        [9, 1, 0],
      ],
      [
        [7, 1, 0],
        [1, 1, 0],
      ],
    ]);
    expect(matrixBox(atom, STYLE_DISPLAY, build).width).toBeCloseTo(7 + EM + 9, 10);
  });

  it('rows: vsep_ext_top + row + vsep_in + row + vsep_ext_bot, centred on the axis', () => {
    const { atom, build } = grid('array', [[[1, 3, 1]], [[1, 2, 5]]]);
    const total = 0.4 * EX + (3 + 1) + 1 * EX + (2 + 5) + 0.4 * EX;
    const box = matrixBox(atom, STYLE_DISPLAY, build);
    expect(box.height).toBeCloseTo(total / 2 + AXIS, 10);
    expect(box.depth).toBeCloseTo(total / 2 - AXIS, 10);
  });

  it('row height and depth are the maxima over the row (lineHeight/lineDepth)', () => {
    const { atom, build } = grid('matrix', [
      [
        [1, 2, 0.5],
        [1, 6, 0],
        [1, 1, 4],
      ],
    ]);
    const total = 0.4 * EX + (6 + 4) + 0.4 * EX;
    expect(matrixBox(atom, STYLE_DISPLAY, build).height).toBeCloseTo(total / 2 + AXIS, 10);
  });

  it('a negative depth is clamped at the zero the maxima start from', () => {
    const { atom, build } = grid('matrix', [[[1, 2, -3]]]);
    const total = 0.4 * EX + 2 + 0.4 * EX;
    expect(matrixBox(atom, STYLE_DISPLAY, build).height).toBeCloseTo(total / 2 + AXIS, 10);
  });

  it('an empty cell is the null box and a short row is padded with it', () => {
    const { atom, build } = grid('matrix', [
      [
        [2, 1, 0],
        [3, 1, 0],
      ],
      [[4, 1, 0]],
    ]);
    expect(matrixBox(atom, STYLE_DISPLAY, build).width).toBeCloseTo(4 + EM + 3, 10);
    const empty = grid('matrix', [[null, [3, 1, 0]]]);
    expect(matrixBox(empty.atom, STYLE_DISPLAY, empty.build).width).toBeCloseTo(0 + EM + 3, 10);
  });

  it('column alignment pads the narrower cell (HorizontalBox(box, w, alignment))', () => {
    const { atom, build } = grid('matrix', [[[10, 1, 0]], [[2, 1, 0]]]);
    const aligns: Align[] = [ALIGN_LEFT, ALIGN_RIGHT, ALIGN_CENTER];
    for (const align of aligns) {
      atom.align = [align];
      expect(matrixBox(atom, STYLE_DISPLAY, build).width).toBeCloseTo(10, 10);
    }
  });

  it('ex is the x-height of the last cell font, scaled by the style', () => {
    const boxes = new Map<Atom, Box>();
    const a = cell();
    boxes.set(a, { ...strutBox(1, 1, 0), lastXHeight: 0.5 });
    const atom: MatrixAtom = { kind: 'matrix', type: 0, env: 'matrix', rows: [[a]], align: [ALIGN_CENTER] };
    const total = 0.4 * 0.5 + 1 + 0.4 * 0.5;
    expect(matrixBox(atom, STYLE_DISPLAY, stubBuild(boxes)).height).toBeCloseTo(total / 2 + AXIS, 10);
  });

  it('is sized in em of the icon: a 20pt icon multiplies at the end only', () => {
    // 1em hsep in display style is exactly 1 box unit (TEX_ICON_SIZE applies in texIconDimension).
    expect(TEX_ICON_SIZE).toBe(20);
  });
});

describe('convertNode on an array node KaTeX shaped unusually', () => {
  const ctx = (): Context => ({ mode: 'math', font: undefined, bold: false, unsupported: new Set() });
  const array = (raw: Record<string, unknown>): KNode => ({
    type: 'array',
    mode: 'math',
    raw: { type: 'array', ...raw },
  });

  it('an array with no body is an empty grid', () => {
    expect(convertNode(array({ hskipBeforeAndAfter: true }), ctx())).toEqual({
      kind: 'matrix',
      type: 0,
      env: 'array',
      rows: [],
      align: [],
    });
  });

  it('keeps only node cells, takes a bare cell as its own formula, and defaults a column to centred', () => {
    const cell = { type: 'mathord', mode: 'math', text: 'x' };
    const atom = convertNode(array({ body: [[cell, 7], 'row'], cols: [{ type: 'align', align: 'z' }] }), ctx());
    expect(atom).toMatchObject({ kind: 'matrix', env: 'matrix', align: [ALIGN_CENTER] });
    expect((atom as MatrixAtom).rows.map((r) => r.map((c) => c?.kind))).toEqual([['char'], []]);
  });
});
