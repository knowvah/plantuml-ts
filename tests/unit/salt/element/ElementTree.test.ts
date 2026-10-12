/**
 * `ElementTree` (ElementTree.java:50-159) against the 1.2026.8beta1 jar,
 * deterministic text on.
 *
 * - Preferred dimensions: `fixtures/element-tree-dimensions.json`, printed by
 *   the jar's own `ElementTree` (`fixtures/ElementTreeProbe.java`, header
 *   says how to regenerate).
 * - Drawing: every `<text>`/`<line>`/`<rect>` the tree draws, compared with
 *   the jar's SVG for the `{T` corpus fixtures (`test-results/dot-cache/
 *   salt/<slug>/in.svg`) and two probes rendered by `scripts/oracle-render.sh`
 *   (`fixtures/tree-ragged`, `fixtures/tree-empty`). The tree's origin is
 *   where the jar placed it: the outer pyramid's cell origin (6, 6) — margin
 *   5 + 1 — or, for a tree lower down, the y of its first grid line.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { UTranslate } from '../../../../src/core/klimt/UTranslate.js';
import { ElementText } from '../../../../src/diagrams/salt/element/ElementText.js';
import { ElementTree } from '../../../../src/diagrams/salt/element/ElementTree.js';
import { TableStrategy } from '../../../../src/diagrams/salt/element/TableStrategy.js';
import { SaltDictionary } from '../../../../src/diagrams/salt/SaltDictionary.js';
import { FIXTURES, FONT_12, stringBounder } from '../salt-test-support.js';
import { cached, drawTo, jarRunFrom, jarShapes, shapeElements, treeOf } from './tree-svg-support.js';

type Dim = readonly [number, number];
const JAR_DIMS = JSON.parse(readFileSync(`${FIXTURES}/element-tree-dimensions.json`, 'utf8')) as Record<string, Dim>;

function jarDim(name: string): Dim {
  const d = JAR_DIMS[name];
  if (d === undefined) throw new Error(`no jar dimension ${name}`);
  return d;
}

function dimOf(tree: ElementTree): Dim {
  const d = tree.getPreferredDimension(stringBounder, 0, 0);
  return [d.getWidth(), d.getHeight()];
}

function drawn(tree: ElementTree, origin: readonly [number, number], zIndex = 0): string[] {
  const dim = tree.getPreferredDimension(stringBounder, 0, 0);
  return shapeElements(drawTo((ug) => tree.drawU(ug.apply(new UTranslate(origin[0], origin[1])), zIndex, dim)));
}

const dict = new SaltDictionary();

function tree(strategy: TableStrategy, rows: readonly (readonly string[])[]): ElementTree {
  const t = new ElementTree(FONT_12, dict, strategy);
  for (const [first, ...others] of rows) {
    t.addEntry(first ?? '');
    for (const o of others) t.addCellToEntry(new ElementText([o], FONT_12, dict));
  }
  return t;
}

describe('ElementTree#getPreferredDimension (java:81-98)', () => {
  it('rulico-91-pora469: w1 + other widths with margins + 2, by the sum of the row heights', () => {
    expect(dimOf(treeOf(cached('rulico-91-pora469', 'in.puml')))).toEqual(jarDim('rulico'));
  });

  it('gubexu-82-name357: no other cells, so no second margin (w2 = 0)', () => {
    expect(dimOf(treeOf(cached('gubexu-82-name357', 'in.puml')))).toEqual(jarDim('gubexu'));
  });

  it('ragged rows: the other-cell widths are merged per column (ListWidth#mergeMax)', () => {
    expect(dimOf(treeOf(`${FIXTURES}/tree-ragged.puml`))).toEqual(jarDim('ragged'));
  });

  it('an empty tree is 2 x 0', () => {
    expect(dimOf(tree(TableStrategy.DRAW_ALL, []))).toEqual(jarDim('empty'));
  });

  it('a first cell without a "+" run is level 0 (addEntry, java:64-72)', () => {
    expect(dimOf(tree(TableStrategy.DRAW_ALL, [['Root']]))).toEqual(jarDim('level0'));
  });

  it('a row is as tall as its tallest cell (getRowHeight, issue #2730 point 3)', () => {
    const t = new ElementTree(FONT_12, dict, TableStrategy.DRAW_NONE);
    t.addEntry('+A');
    t.addCellToEntry(new ElementText(['x', 'y'], FONT_12, dict));
    t.addEntry('++B');
    expect(dimOf(t)).toEqual(jarDim('tall-other'));
  });

  it('addCellToEntry before any entry is dropped (java:74-79)', () => {
    const t = new ElementTree(FONT_12, dict, TableStrategy.DRAW_NONE);
    t.addCellToEntry(new ElementText(['ignored'], FONT_12, dict));
    t.addEntry('+A');
    expect(dimOf(t)).toEqual(jarDim('orphan-cell'));
  });

  it('ignores x and y', () => {
    const t = treeOf(cached('rulico-91-pora469', 'in.puml'));
    const d = t.getPreferredDimension(stringBounder, 40, 17);
    expect([d.getWidth(), d.getHeight()]).toEqual(jarDim('rulico'));
  });
});

describe('ElementTree#drawU (java:118-157) — whole-diagram {T corpus fixtures', () => {
  it.each([
    ['gubexu-82-name357', 'DRAW_NONE: entries + Skeleton only', 39],
    ['kabevi-77-moje909', 'DRAW_NONE with one other column', 53],
    ['rulico-91-pora469', 'DRAW_ALL: entries, Skeleton, every row then column line', 84],
  ])('%s (%s) draws exactly the jar elements, in the jar order', (slug, _what, count) => {
    const ours = drawn(treeOf(cached(slug, 'in.puml')), [6, 6]);
    expect(ours).toEqual(jarShapes(cached(slug, 'in.svg')));
    expect(ours).toHaveLength(count);
  });
});

describe('ElementTree#drawU — nakuvu-18-nive718: one tree per strategy', () => {
  /** The jar's elements per tree: the pyramid's #AAA `--` separators split them. */
  const groups = jarShapes(cached('nakuvu-18-nive718', 'in.svg'))
    .join('\n')
    .split(/\n<line [^>]*stroke:#AAA;[^>]*\/>\n/)
    .map((g) => g.split('\n'));

  it.each([
    [0, '{T! DRAW_VERTICAL', 6, 16],
    [1, '{T- DRAW_HORIZONTAL', 52, 16],
    [2, '{T+ DRAW_OUTSIDE', 98, 16],
    [3, '{T# DRAW_ALL', 144, 20],
  ])('tree %i (%s) at y=%i draws the jar elements', (index, _what, y, count) => {
    const ours = drawn(treeOf(cached('nakuvu-18-nive718', 'in.puml'), index), [6, y]);
    expect(ours).toEqual(groups[index]);
    expect(ours).toHaveLength(count);
  });
});

describe('ElementTree#drawU — trees inside other widgets and probes', () => {
  it('neguge-98-cilu043: creole and "." cells in a {T# under a {+ pyramid at (6, 83)', () => {
    const ours = drawn(treeOf(cached('neguge-98-cilu043', 'in.puml')), [6, 83]);
    expect(ours).toHaveLength(41);
    expect(jarRunFrom(jarShapes(cached('neguge-98-cilu043', 'in.svg')), ours)).toEqual(ours);
  });

  it('tree-ragged: each other cell starts at the merged column x (drawSecondCell)', () => {
    const ours = drawn(treeOf(`${FIXTURES}/tree-ragged.puml`), [6, 6]);
    expect(ours).toEqual(jarShapes(`${FIXTURES}/tree-ragged.jar.svg`));
  });

  it('tree-empty: the grid still draws over rows [0] and cols [0, margin / 2]', () => {
    const ours = drawn(treeOf(`${FIXTURES}/tree-empty.puml`), [6, 6]);
    expect(ours).toEqual(jarShapes(`${FIXTURES}/tree-empty.jar.svg`));
    expect(ours).toHaveLength(3);
  });

  it('draws nothing at z-index 1 (java:119-120)', () => {
    expect(drawn(treeOf(cached('rulico-91-pora469', 'in.puml')), [6, 6], 1)).toEqual([]);
  });
});
