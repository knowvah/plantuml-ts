/**
 * `TextRun`'s three metric fields — the seam decisions.md D1 defines.
 *
 * Layout measures, the run carries, the renderer formats. These tests pin the
 * two halves a type cannot: that the metrics are the MEASURER's answer (not a
 * `size - size/4.5` shorthand), and that `scaleSequenceGeometry` scales them
 * with the coordinates they belong to.
 *
 * The scaling half matters more than it looks. `textWidth` reaches the SVG
 * `textLength`, so a `scale 2` diagram whose widths stayed unscaled would draw
 * every glyph compressed back into the unscaled advance — a visible text
 * distortion that the geometry comparator barely registers, because a wrong
 * number and a nearly-right one both cost it exactly 1.
 */
import { describe, it, expect } from 'vitest';

import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { FixedMeasurer } from '../../../src/core/measurer.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { messageLabelBlock } from '../../../src/diagrams/sequence/text-block-geo.js';
import { arrowFontSpecOf } from '../../../src/diagrams/sequence/sequence-layout-shared.js';
import { scaleSequenceGeometry } from '../../../src/diagrams/sequence/scale-geo.js';
import { arrowConfigurationOf } from '../../../src/diagrams/sequence/sequence-parse-helpers.js';
import type { SequenceGeometry, TextRun } from '../../../src/diagrams/sequence/ast.js';

const CENTER_X = 100;
const BASELINE_Y = 50;

describe('TextRun metrics', () => {
  it("takes textWidth from the measurer at the label's own ARROW font", () => {
    const measurer = new DeterministicMeasurer();
    const block = messageLabelBlock('hello', undefined, CENTER_X, BASELINE_Y, defaultTheme, measurer);
    const expected = measurer.measure('hello', arrowFontSpecOf(defaultTheme)).width;
    expect(block.lines[0]!.textWidth).toBeCloseTo(expected, 10);
    // The arrow font is 13pt where the ambient one is 14 — measuring at the
    // wrong one is the failure this asserts against, and it is invisible in
    // the emitted `x`.
    expect(arrowFontSpecOf(defaultTheme).size).toBe(13);
  });

  it('measures textAscent rather than deriving it from the font size', () => {
    // `FixedMeasurer(charWidth, lineHeight)` is the discriminating case: its
    // descent is `lineHeight / 4.5`, where the `size - size/4.5` shorthand in
    // `renderer-frame-header.ts` would use the 13pt FONT size. Under
    // `FixedMeasurer(8, 16)` the true ascent is 16 - 16/4.5 = 12.444 and the
    // shorthand says 13 - 13/4.5 = 10.111 (decisions.md D1, D2).
    const measurer = new FixedMeasurer(8, 16);
    const block = messageLabelBlock('hi', undefined, CENTER_X, BASELINE_Y, defaultTheme, measurer);
    expect(block.lines[0]!.textAscent).toBeCloseTo(16 - 16 / 4.5, 10);
    expect(block.lines[0]!.textAscent).not.toBeCloseTo(13 - 13 / 4.5, 3);
    expect(block.lines[0]!.textLineHeight).toBe(16);
  });

  it('gives the autonumber run its own measured width, not the label’s', () => {
    const measurer = new DeterministicMeasurer();
    const block = messageLabelBlock('hello', '[1]', CENTER_X, BASELINE_Y, defaultTheme, measurer);
    const spec = arrowFontSpecOf(defaultTheme);
    expect(block.number!.textWidth).toBeCloseTo(measurer.measure('[1]', spec).width, 10);
    expect(block.number!.textWidth).not.toBeCloseTo(block.lines[0]!.textWidth, 3);
  });

  it('advances each line of a multi-line label by exactly one textLineHeight', () => {
    const measurer = new DeterministicMeasurer();
    const block = messageLabelBlock('a\nb\nc', undefined, CENTER_X, BASELINE_Y, defaultTheme, measurer);
    const h = block.lines[0]!.textLineHeight;
    expect(block.lines[1]!.y - block.lines[0]!.y).toBeCloseTo(h, 10);
    expect(block.lines[2]!.y - block.lines[1]!.y).toBeCloseTo(h, 10);
  });
});

/** A geometry carrying exactly one message with one placed, measured run. */
function geometryWithRun(run: TextRun): SequenceGeometry {
  return {
    totalWidth: 200,
    totalHeight: 100,
    participants: [],
    events: [
      {
        kind: 'message',
        fromX: 40,
        toX: 160,
        y: 50,
        label: run.text,
        arrow: arrowConfigurationOf({}),
        labelLines: [run],
        labelNumber: run,
        arrowDirection: 'right',
      },
    ],
    headHeight: 30,
    lifelineEndY: 90,
    footerShapeY: 90,
    boxes: [],
    showFootbox: true,
  };
}

describe('scaleSequenceGeometry on TextRun metrics', () => {
  const RUN: TextRun = { text: 'hello', x: 20, y: 40, textWidth: 27.5, textAscent: 10.111, textLineHeight: 13 };
  const K = 2.5;

  it('multiplies textWidth, textAscent and textLineHeight by k', () => {
    const scaled = scaleSequenceGeometry(geometryWithRun(RUN), K);
    const message = scaled.events[0]!;
    expect(message.kind).toBe('message');
    if (message.kind !== 'message') throw new Error('unreachable');
    const line = message.labelLines[0]!;
    expect(line.textWidth).toBeCloseTo(27.5 * K, 10);
    expect(line.textAscent).toBeCloseTo(10.111 * K, 10);
    expect(line.textLineHeight).toBeCloseTo(13 * K, 10);
    // The coordinates scale too — the metrics must not be scaled INSTEAD of
    // them, which a careless spread would do.
    expect(line.x).toBeCloseTo(20 * K, 10);
    expect(line.y).toBeCloseTo(40 * K, 10);
  });

  it('scales the autonumber run as well as the label lines', () => {
    const scaled = scaleSequenceGeometry(geometryWithRun(RUN), K);
    const message = scaled.events[0]!;
    if (message.kind !== 'message') throw new Error('unreachable');
    expect(message.labelNumber!.textWidth).toBeCloseTo(27.5 * K, 10);
  });

  it('leaves the metrics untouched at k = 1', () => {
    const scaled = scaleSequenceGeometry(geometryWithRun(RUN), 1);
    const message = scaled.events[0]!;
    if (message.kind !== 'message') throw new Error('unreachable');
    expect(message.labelLines[0]).toEqual(RUN);
  });
});
