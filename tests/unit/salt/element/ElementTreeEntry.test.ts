/**
 * `ElementTreeEntry` (ElementTreeEntry.java:47-102) against the
 * 1.2026.8beta1 jar, deterministic text on. Dimensions are the jar's own
 * `ElementTreeEntry(3, "Germany")` with cells `82 million` and a two-line
 * `x`/`y` (`fixtures/ElementTreeProbe.java` →
 * `fixtures/element-tree-dimensions.json`); drawn coordinates are
 * `rulico-91-pora469`'s Germany row (`in.svg`: first cell `x="36"`, others at
 * `x="95.275"` and `x="177.95"`, baseline `y="135.333"`), the row origin
 * being the tree origin (6, 6) + yvar 120.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { UTranslate } from '../../../../src/core/klimt/UTranslate.js';
import { ElementText } from '../../../../src/diagrams/salt/element/ElementText.js';
import { ElementTreeEntry } from '../../../../src/diagrams/salt/element/ElementTreeEntry.js';
import { ListWidth } from '../../../../src/diagrams/salt/element/ListWidth.js';
import { SaltDictionary } from '../../../../src/diagrams/salt/SaltDictionary.js';
import { FIXTURES, FONT_12, stringBounder } from '../salt-test-support.js';
import { cached, drawTo, jarShapes, shapeElements } from './tree-svg-support.js';

const JAR = JSON.parse(readFileSync(`${FIXTURES}/element-tree-dimensions.json`, 'utf8')) as {
  readonly 'entry-first-cell': readonly [number, number];
  readonly 'entry-row-height': number;
  readonly 'entry-x-delta': number;
  readonly 'entry-other-widths': readonly number[];
};

const dict = new SaltDictionary();
const text = (...lines: string[]): ElementText => new ElementText(lines, FONT_12, dict);

/** `ElementTree.java:56`: the column margin `ElementTree#drawU` passes. */
const MARGIN = 10;
/** rulico's Germany row origin: tree origin (6, 6) + 10 rows of 12. */
const ROW = new UTranslate(6, 126);

function probeEntry(): ElementTreeEntry {
  const entry = new ElementTreeEntry(3, text('Germany'));
  entry.addCell(text('82 million'));
  entry.addCell(text('x', 'y'));
  return entry;
}

function widths(list: ListWidth): number[] {
  const out: number[] = [];
  const it = list.iterator();
  for (let r = it.next(); r.done !== true; r = it.next()) out.push(r.value);
  return out;
}

/** The jar's `<text>` elements of rulico's Germany row. */
function jarGermanyRow(): string[] {
  return jarShapes(cached('rulico-91-pora469', 'in.svg')).filter((e) => e.includes('y="135.333"'));
}

describe('ElementTreeEntry dimensions (java:62-84)', () => {
  it('getXDelta is level * 10', () => {
    expect(probeEntry().getXDelta()).toBe(JAR['entry-x-delta']);
    expect(new ElementTreeEntry(0, text('a')).getXDelta()).toBe(0);
  });

  it('the first cell is widened by getXDelta, height unchanged', () => {
    const d = probeEntry().getPreferredDimensionFirstCell(stringBounder);
    expect([d.getWidth(), d.getHeight()]).toEqual(JAR['entry-first-cell']);
  });

  it('the other cells list their widths in order', () => {
    expect(widths(probeEntry().getPreferredDimensionOtherCell(stringBounder))).toEqual(JAR['entry-other-widths']);
  });

  it('no other cells is an empty width list', () => {
    expect(widths(new ElementTreeEntry(1, text('a')).getPreferredDimensionOtherCell(stringBounder))).toEqual([]);
  });

  it('the row height is the tallest cell, other cells included', () => {
    expect(probeEntry().getRowHeight(stringBounder)).toBe(JAR['entry-row-height']);
    expect(new ElementTreeEntry(1, text('a')).getRowHeight(stringBounder)).toBe(12);
  });
});

describe('ElementTreeEntry drawing (java:90-100) — rulico Germany row', () => {
  const entry = new ElementTreeEntry(3, text('Germany'));
  entry.addCell(text('82 million'));
  entry.addCell(text('30'));
  /** rulico's merged column widths: its widest cells `617 thousand` and `Age`. */
  const otherWidth = new ListWidth();
  otherWidth.add(text('617 thousand').getPreferredDimension(stringBounder, 0, 0).getWidth());
  otherWidth.add(text('Age').getPreferredDimension(stringBounder, 0, 0).getWidth());
  /** ElementTree.java:141 passes x = w1 + margin; rulico's w1 is Germany's first cell (level 3). */
  const w1 = entry.getPreferredDimensionFirstCell(stringBounder).getWidth();

  it('drawFirstCell draws the first cell at (x + getXDelta, y)', () => {
    const ours = shapeElements(drawTo((ug) => entry.drawFirstCell(ug.apply(ROW), 0, 0)));
    expect(ours).toEqual(jarGermanyRow().slice(0, 1));
  });

  it('drawSecondCell steps x by each column width + margin', () => {
    const ours = shapeElements(drawTo((ug) => entry.drawSecondCell(ug.apply(ROW), w1 + MARGIN, 0, otherWidth, MARGIN)));
    expect(ours).toEqual(jarGermanyRow().slice(1));
  });

  it('drawSecondCell throws NoSuchElementException when otherWidth is shorter than the cells', () => {
    expect(() => drawTo((ug) => entry.drawSecondCell(ug, 0, 0, new ListWidth(), MARGIN))).toThrow(
      /NoSuchElementException/,
    );
  });
});
