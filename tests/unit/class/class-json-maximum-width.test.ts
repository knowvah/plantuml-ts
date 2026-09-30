/**
 * cdd6 T3g: `<style> json { MaximumWidth N }` word-wraps a json leaf's key
 * AND scalar-value cells. `BodierJSon.java:85` hands `style.wrapWidth()`
 * (`Style.java:330-332`, `PName.MaximumWidth`) to `TextBlockCucaJSon`, whose
 * `getTextBlock` (`TextBlockCucaJSon.java:184-190`) builds every cell with
 * `Display#create0(..., wordWrap, ...)` -- a `Fission` split per stripe.
 *
 * Oracle: `unknown/nadedo-37-nesa665` (jar 1.2026.8beta1, deterministic
 * text): JSON box 237.087 x 78 with the value on 4 lines 14px apart;
 * JSON1 200 x 36 (MinimumWidth floor, one line).
 */
import { describe, it, expect } from 'vitest';
import { parseClass } from './parse-helper.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';
import type { Classifier } from '../../../src/diagrams/class/ast.js';
import type { Theme } from '../../../src/core/theme.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';
import { measureJsonClassifier } from '../../../src/diagrams/class/class-json-sizing.js';

const measurer = new WidthTableMeasurer();
const LOREM =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';

function jsonLeaf(value: string): Classifier {
  const lines = ['json J {', `"text": "${value}"`, '}'];
  const block: UmlSource = { lines, type: 'class' };
  const c = parseClass(block).classifiers.find((cl) => cl.id === 'J');
  if (c === undefined) throw new Error('json leaf J not parsed');
  return c;
}

function themeWithJsonBucket(maximumWidth: number | undefined): Theme {
  const json = { minimumWidth: 200, ...(maximumWidth === undefined ? {} : { maximumWidth }) };
  return { ...defaultTheme, colors: { ...defaultTheme.colors, elements: { json } } };
}

function rowYs(value: string, theme: Theme): number[] {
  const m = measureJsonClassifier(jsonLeaf(value), theme, measurer);
  return (m.jsonBody ?? []).flatMap((i) => (i.kind === 'text' ? [i.row.y] : []));
}

describe('measureJsonClassifier — MaximumWidth word-wrap (nadedo-37-nesa665)', () => {
  it('wraps the long value to the jar box 237.087 x 78', () => {
    const m = measureJsonClassifier(jsonLeaf(LOREM), themeWithJsonBucket(200), measurer);
    expect(m.width).toBeCloseTo(237.087, 3);
    expect(m.height).toBe(78);
  });

  it('draws the key once and the value on 4 lines, 14px apart', () => {
    const ys = rowYs(LOREM, themeWithJsonBucket(200));
    // key "text" + 4 wrapped value lines; title height 18 -> first baseline
    // 18 + 2 (cell margin) + baseline offset, each next line +14.
    expect(ys.length).toBe(5);
    const valueYs = ys.slice(1);
    [0, 14, 28, 42].forEach((step, i) => expect(valueYs[i]! - valueYs[0]!).toBeCloseTo(step, 9));
    expect(ys[0]).toBe(valueYs[0]);
  });

  it('splits a short value into word/space atoms without breaking it (jar JSON1)', () => {
    const m = measureJsonClassifier(jsonLeaf('a min. test'), themeWithJsonBucket(200), measurer);
    expect(m.width).toBe(200);
    expect(m.height).toBe(36);
    const valueRow = (m.jsonBody ?? []).flatMap((i) => (i.kind === 'text' ? [i.row] : []))[1]!;
    const texts = (valueRow.atoms ?? []).map((a) => (a.kind === 'text' ? a.text : ''));
    expect(texts).toEqual(['a', ' ', 'min.', ' ', 'test']);
  });

  it('no MaximumWidth keeps the value on one unsplit line', () => {
    const m = measureJsonClassifier(jsonLeaf(LOREM), themeWithJsonBucket(undefined), measurer);
    expect(m.height).toBe(36);
    expect(rowYs(LOREM, themeWithJsonBucket(undefined)).length).toBe(2);
  });
});
