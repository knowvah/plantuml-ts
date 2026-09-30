/**
 * cdd7 T2b (xuloxo-85-vibu502, journal row 19): a multi-line class edge
 * label under `skinparam maxMessageSize N` wraps per `Display#create0` ->
 * `Fission#getSplitted` (`SvekEdge.java:288-299`: `wrapWidth` =
 * `arrowStyle.wrapWidth()` else `skinParam.maxMessageSize()`). Every
 * physical line is rebuilt from neutrons, so each word and each space is its
 * OWN atom -- the jar draws `[Optional`, ` `, `Technology]` as three
 * `<text>`s even when nothing breaks -- and a line wider than N breaks at
 * its last space. The DOT box reservation measures the same physical lines.
 *
 * Expected values: oracle probes (`scripts/oracle-render.sh`,
 * 1.2026.8beta1) of
 *   class A / class B / skinparam maxMessageSize {60|150} /
 *   A --> B : **Label**\n//[Optional Technology]//
 * -- `svek-1.dot` label TABLE 72x41 (60) and 124x28 (150), i.e. the
 * content box plus `marginLabel` 1 per side; `<text>` x/y as asserted. The
 * `center` inputs are the label centres those jar positions imply.
 */
import { describe, it, expect } from 'vitest';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';
import { multiLineLabelAnchorWrapped } from '../../../src/diagrams/class/class-edge-label-lines.js';
import { multiLineLabelAnchor } from '../../../src/diagrams/class/class-edge-label-anchor.js';
import { computeMeasuredLabelAttrs } from '../../../src/diagrams/class/class-edge-label-measure.js';

const measurer = new WidthTableMeasurer();
const font = { family: 'sans-serif', size: 13 };
const LINES = ['**Label**', '//[Optional Technology]//'];
const LABEL = '**Label**\\n//[Optional Technology]//';

function positions(anchors: ReadonlyArray<{ text: string; x: number; y: number; width: number }>): unknown[] {
  return anchors.map((a) => [a.text, Number(a.x.toFixed(3)), Number(a.y.toFixed(3)), Number(a.width.toFixed(3))]);
}

describe('multiLineLabelAnchorWrapped -- Fission atoms per physical line', () => {
  it('splits a fitting line into word/space atoms (maxMessageSize 150)', () => {
    const ctx = { center: { x: 89.68, y: 99 }, measurer, labelFont: font, maxWidth: 150 };
    expect(positions(multiLineLabelAnchorWrapped(LINES, 'center', ctx))).toEqual([
      ['Label', 74.18, 96.111, 31.85],
      ['[Optional', 28.68, 109.111, 52],
      [' ', 80.68, 109.111, 0],
      ['Technology]', 80.68, 109.111, 70.85],
    ]);
  });

  it('breaks an over-wide line at its last space (maxMessageSize 60)', () => {
    const ctx = { center: { x: 63.68, y: 105.5 }, measurer, labelFont: font, maxWidth: 60 };
    expect(positions(multiLineLabelAnchorWrapped(LINES, 'center', ctx))).toEqual([
      ['Label', 48.18, 96.111, 31.85],
      ['[Optional', 38.105, 109.111, 52],
      ['Technology]', 28.68, 122.111, 70.85],
    ]);
  });

  it('keeps the bold/italic flags of the logical line on every atom', () => {
    const ctx = { center: { x: 63.68, y: 105.5 }, measurer, labelFont: font, maxWidth: 60 };
    const flags = multiLineLabelAnchorWrapped(LINES, 'center', ctx).map((a) => [a.bold, a.italic]);
    expect(flags).toEqual([
      [true, undefined],
      [undefined, true],
      [undefined, true],
    ]);
  });

  it('is multiLineLabelAnchor exactly when no wrap width is set', () => {
    const center = { x: 89.68, y: 99 };
    expect(multiLineLabelAnchorWrapped(LINES, 'center', { center, measurer, labelFont: font })).toEqual(
      multiLineLabelAnchor(LINES, 'center', center, measurer, font),
    );
  });
});

describe('computeMeasuredLabelAttrs -- the reservation measures the wrapped lines', () => {
  it('reserves three rows at the widest physical line (maxMessageSize 60)', () => {
    const attrs = computeMeasuredLabelAttrs(LABEL, font, measurer, { maxWidth: 60 });
    expect(attrs.labelWidth).toBeCloseTo(70.85, 6);
    expect(attrs.labelHeight).toBe(39);
  });

  it('reserves the unwrapped box when every line fits (maxMessageSize 150)', () => {
    const attrs = computeMeasuredLabelAttrs(LABEL, font, measurer, { maxWidth: 150 });
    expect(attrs.labelWidth).toBeCloseTo(122.85, 6);
    expect(attrs.labelHeight).toBe(26);
  });
});
