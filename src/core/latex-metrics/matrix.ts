/**
 * `MatrixAtom#createBox` for the `array` and `matrix` environments
 * (JLaTeXMath 1.0.7, `~/git/plantuml/gradle/libs.versions.toml:12`).
 *
 * The jar ships no sources; every rule below was read from the class files
 * with `javap -c -p -constants -classpath <unzipped jar>`:
 *
 * - `MatrixAtom.<clinit>`: `hsep = SpaceAtom(UNIT_EM, 1, 0, 0)`, `semihsep =
 *   SpaceAtom(UNIT_EM, 0.5, 0, 0)`, `vsep_in = SpaceAtom(UNIT_EX, 0, 1, 0)`,
 *   `vsep_ext_top = vsep_ext_bot = SpaceAtom(UNIT_EX, 0, 0.4, 0)`,
 *   `nullBox = StrutBox(0, 0, 0, 0)`.
 * - `SpaceAtom.createBox` (non-blank branch): `StrutBox(width * factor,
 *   height * factor, depth * factor, 0)` with `factor` from
 *   `SpaceAtom.getFactor(unit, env)`: `SpaceAtom$1` (em) is
 *   `TeXFont#getEM(style)` = `getSizeFactor(style)`, `SpaceAtom$2` (ex) is
 *   `TeXFont#getXHeight(style, env.getLastFontId())`.
 * - `MatrixAtom#getColumnSep`, `tableswitch` cases 0 (ARRAY) and 1 (MATRIX).
 * - `MatrixAtom#createBox`: per-cell boxes and the `lineDepth`/`lineHeight`/
 *   `rowWidth` maxima (offsets 84-319), the row `HorizontalBox` of
 *   `sep[0]`, then `HorizontalBox(cell, rowWidth[j], position[j])` and
 *   `sep[j + 1]` per column (offsets 696-1123), `setHeight(lineHeight[i])` /
 *   `setDepth(lineDepth[i])` (1332-1349), the `VerticalBox` of `vsep_ext_top`,
 *   the rows with `vsep_in` between them, `vsep_ext_bot` (583-1399), and the
 *   axis centring `setHeight(total / 2 + axis)` / `setDepth(total / 2 -
 *   axis)` with `axis = TeXFont#getAxisHeight(style)` (1402-1451).
 * - `ArrayOfAtoms#checkDimensions`: `col` is the widest row; a shorter row
 *   is padded with `null` cells.
 *
 * Not modelled (the node converter flags them unsupported): vertical and
 * horizontal rules (`VlineAtom`, `HlineAtom`), `MulticolumnAtom`, and the
 * `align`/`alignat`/`flalign`/`smallmatrix` environments.
 */
import type { BuildBox, MatrixAtom } from './atoms.js';
import type { Box } from './box.js';
import { ALIGN_CENTER, HBox, VBox, hboxAligned, strutBox } from './box.js';
import { param, sizeFactor, xHeight } from './tex-font.js';

/** `MatrixAtom.<clinit>`: the `SpaceAtom` widths in em and heights in ex. */
const HSEP_EM = 1;
const SEMIHSEP_EM = 0.5;
const VSEP_IN_EX = 1;
const VSEP_EXT_EX = 0.4;

/** `MatrixAtom.nullBox`. */
const nullBox = (): Box => strutBox(0, 0, 0);

/** One row's cells and its `lineHeight`/`lineDepth` (`createBox` offsets
 *  84-319); every maximum starts at the array's zero. */
interface GridRow {
  cells: Box[];
  height: number;
  depth: number;
}

/** The grid's measurements, with `rowWidth` per column. */
interface Grid {
  rows: GridRow[];
  columnWidth: number[];
  /** `env.getLastFontId()` after the cells: the last cell font's x-height. */
  lastXHeight: number | undefined;
}

/** `array[i]`, or `fallback` past its end. */
const at = <T>(array: readonly T[], i: number, fallback: T): T => array[i] ?? fallback;

function measureGrid(atom: MatrixAtom, style: number, build: BuildBox): Grid {
  const cols = Math.max(0, ...atom.rows.map((r) => r.length));
  const grid: Grid = { rows: [], columnWidth: Array.from({ length: cols }, () => 0), lastXHeight: undefined };
  for (const row of atom.rows) {
    // `ArrayOfAtoms#checkDimensions`: a short row is padded with `null`.
    const cells = Array.from({ length: cols }, (_, j) => {
      const cell = row[j];
      return cell === undefined ? nullBox() : build(cell, style);
    });
    grid.rows.push({
      cells,
      height: Math.max(0, ...cells.map((b) => b.height)),
      depth: Math.max(0, ...cells.map((b) => b.depth)),
    });
    grid.columnWidth = grid.columnWidth.map((w, j) => Math.max(w, at(cells, j, nullBox()).width));
    grid.lastXHeight = cells.reduce<number | undefined>((last, b) => b.lastXHeight ?? last, grid.lastXHeight);
  }
  return grid;
}

/** `MatrixAtom#getColumnSep`, case ARRAY (`spaceAround`: `semihsep` at both
 *  ends) and case MATRIX (`nullBox` at both ends); `hsep` between columns. */
function columnSeparators(atom: MatrixAtom, cols: number, style: number): Box[] {
  const hsep = strutBox(HSEP_EM * sizeFactor(style), 0, 0);
  const outer = atom.env === 'array' ? strutBox(SEMIHSEP_EM * sizeFactor(style), 0, 0) : nullBox();
  return Array.from({ length: cols + 1 }, (_, j) => (j === 0 || j === cols ? { ...outer } : { ...hsep }));
}

/** One row's `HorizontalBox`: `sep[0]`, then each cell padded to its column
 *  and `sep[j + 1]`; its height and depth are the row maxima. */
function rowBox(atom: MatrixAtom, row: GridRow, columnWidth: readonly number[], seps: readonly Box[]): Box {
  const h = new HBox().add(at(seps, 0, nullBox()));
  row.cells.forEach((cell, j) => {
    h.add(hboxAligned(cell, at(columnWidth, j, 0), at(atom.align, j, ALIGN_CENTER)));
    h.add(at(seps, j + 1, nullBox()));
  });
  h.box.height = row.height;
  h.box.depth = row.depth;
  return h.box;
}

/** `MatrixAtom#createBox` (see the file header for the offsets). */
export function matrixBox(atom: MatrixAtom, style: number, build: BuildBox): Box {
  const grid = measureGrid(atom, style, build);
  const seps = columnSeparators(atom, grid.columnWidth.length, style);
  // `SpaceAtom$2`: ex reads `env.getLastFontId()`, the mu font when no
  // cell has set one (`TeXEnvironment#getLastFontId`).
  const ex = xHeight(style, grid.lastXHeight);
  const v = new VBox().add(strutBox(0, VSEP_EXT_EX * ex, 0));
  grid.rows.forEach((row, i) => {
    v.add(rowBox(atom, row, grid.columnWidth, seps));
    if (i < grid.rows.length - 1) v.add(strutBox(0, VSEP_IN_EX * ex, 0));
  });
  v.add(strutBox(0, VSEP_EXT_EX * ex, 0));
  const total = v.box.height + v.box.depth;
  const axis = param('axisheight', style);
  v.box.height = total / 2 + axis;
  v.box.depth = total / 2 - axis;
  return v.box;
}
