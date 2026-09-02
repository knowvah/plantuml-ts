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

const LEFT_X = 100;
const ARROW_Y = 50;

describe('TextRun metrics', () => {
  it("takes textWidth from the measurer at the label's own ARROW font", () => {
    const measurer = new DeterministicMeasurer();
    const block = messageLabelBlock('hello', undefined, LEFT_X, ARROW_Y, defaultTheme, measurer);
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
    const block = messageLabelBlock('hi', undefined, LEFT_X, ARROW_Y, defaultTheme, measurer);
    expect(block.lines[0]!.textAscent).toBeCloseTo(16 - 16 / 4.5, 10);
    expect(block.lines[0]!.textAscent).not.toBeCloseTo(13 - 13 / 4.5, 3);
    expect(block.lines[0]!.textLineHeight).toBe(16);
  });

  it('gives the autonumber run its own measured width, not the label’s', () => {
    const measurer = new DeterministicMeasurer();
    const block = messageLabelBlock('hello', '[1]', LEFT_X, ARROW_Y, defaultTheme, measurer);
    const spec = arrowFontSpecOf(defaultTheme);
    expect(block.number!.textWidth).toBeCloseTo(measurer.measure('[1]', spec).width, 10);
    expect(block.number!.textWidth).not.toBeCloseTo(block.lines[0]!.textWidth, 3);
  });

  it('advances each line of a multi-line label by exactly one textLineHeight', () => {
    const measurer = new DeterministicMeasurer();
    const block = messageLabelBlock('a\nb\nc', undefined, LEFT_X, ARROW_Y, defaultTheme, measurer);
    const h = block.lines[0]!.textLineHeight;
    expect(block.lines[1]!.y - block.lines[0]!.y).toBeCloseTo(h, 10);
    expect(block.lines[2]!.y - block.lines[1]!.y).toBeCloseTo(h, 10);
  });
});

describe('messageLabelBlock placement (A2)', () => {
  const measurer = new DeterministicMeasurer();

  it('puts the block at leftX, not centred on it', () => {
    const block = messageLabelBlock('hello', undefined, LEFT_X, ARROW_Y, defaultTheme, measurer);
    expect(block.lines[0]!.x).toBe(LEFT_X);
  });

  it("derives every y from the ARROW's y, one getTextHeight above it", () => {
    // `posArrow = getTextHeight(stringBounder)` with `yText = 0`
    // (`ComponentRoseArrow.java:141-148`); `getTextHeight` is the block plus
    // the 1px padding on each side (`AbstractTextualComponent.java:110-114`).
    const block = messageLabelBlock('hello', undefined, LEFT_X, ARROW_Y, defaultTheme, measurer);
    const run = block.lines[0]!;
    const top = ARROW_Y - (run.textLineHeight + 2);
    expect(run.y).toBeCloseTo(top + run.textAscent, 10);
  });

  it('grows a multi-line label UPWARD, leaving the arrow where the caller put it', () => {
    const one = messageLabelBlock('a', undefined, LEFT_X, ARROW_Y, defaultTheme, measurer);
    const three = messageLabelBlock('a\nb\nc', undefined, LEFT_X, ARROW_Y, defaultTheme, measurer);
    const h = one.lines[0]!.textLineHeight;
    // The LAST line of the three-line block sits where the single line did.
    expect(three.lines[2]!.y).toBeCloseTo(one.lines[0]!.y, 10);
    expect(three.lines[0]!.y).toBeCloseTo(one.lines[0]!.y - 2 * h, 10);
  });

  it('starts the autonumber at leftX and the label after it plus the 4px margin', () => {
    const block = messageLabelBlock('hello', '[1]', LEFT_X, ARROW_Y, defaultTheme, measurer);
    expect(block.number!.x).toBe(LEFT_X);
    // `TextBlockUtils.withMargin(tb1, 0, 4, 0, 0)` (`Display.java:706`).
    expect(block.lines[0]!.x).toBeCloseTo(LEFT_X + block.number!.textWidth + 4, 10);
  });

  it('centres the autonumber vertically against a multi-line label', () => {
    // VerticalAlignment.CENTER (`Display.java:711`).
    const block = messageLabelBlock('a\nb\nc', '[1]', LEFT_X, ARROW_Y, defaultTheme, measurer);
    expect(block.number!.y).toBeCloseTo(block.lines[1]!.y, 10);
  });

  it('reserves one row for a number-only label', () => {
    const block = messageLabelBlock('', '[1]', LEFT_X, ARROW_Y, defaultTheme, measurer);
    expect(block.lines).toEqual([]);
    const n = block.number!;
    expect(n.y).toBeCloseTo(ARROW_Y - (n.textLineHeight + 2) + n.textAscent, 10);
  });

  it('emits nothing at all for a message with neither label nor number', () => {
    // `AbstractTextualComponent` maps an empty display to a `TextBlockEmpty`
    // (`AbstractTextualComponent.java:84-85`).
    const block = messageLabelBlock('', undefined, LEFT_X, ARROW_Y, defaultTheme, measurer);
    expect(block.lines).toEqual([]);
    expect(block.number).toBeUndefined();
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

/**
 * C3 — a message label's lines AND its autonumber go through the shared
 * creole atom engine (`sequence-creole.ts`), so one source line becomes one
 * `TextRun` per styled atom.
 *
 * Every expected number here is the JAR's own, from an oracle render of
 *
 * ```
 * autonumber "<font color=red>[000]</font>"
 * Alice -> Bob : a <b>bold</b> label
 * Alice -> Bob : ""x->  ""
 * ```
 *
 * whose label runs the jar emits at `x=39.225` (`[001]`, `textLength
 * 28.844`), `72.069` (`a`), `79.3` (`bold`, `24.619`, `font-weight="700"`)
 * and `103.919` (`label`, `27.544`) — i.e. the number's own width plus
 * `Display.java:706`'s 4px margin, then each run advancing by its own.
 */
describe('messageLabelBlock creole (C3)', () => {
  const measurer = new DeterministicMeasurer();
  const spec = arrowFontSpecOf(defaultTheme);

  it('splits one line into one run per styled atom, bolding only the <b> run', () => {
    const block = messageLabelBlock(
      'a <b>bold</b> label', undefined, LEFT_X, ARROW_Y, defaultTheme, measurer,
    );
    expect(block.lines.map((r) => r.text)).toEqual(['a ', 'bold', ' label']);
    expect(block.lines.map((r) => r.bold)).toEqual([undefined, true, undefined]);
    // The jar's own three advances: 7.231, 24.619, 27.544.
    expect(block.lines.map((r) => Number(r.textWidth.toFixed(3)))).toEqual([7.231, 24.619, 27.544]);
  });

  it('advances each run by the previous run’s own measured width', () => {
    const block = messageLabelBlock(
      'a <b>bold</b> label', undefined, LEFT_X, ARROW_Y, defaultTheme, measurer,
    );
    const [a, bold, label] = block.lines;
    expect(bold!.x).toBeCloseTo(a!.x + a!.textWidth, 10);
    expect(label!.x).toBeCloseTo(bold!.x + bold!.textWidth, 10);
    // All three share the one baseline — a styled run is a sibling, never a
    // new line (decisions.md D3).
    expect(bold!.y).toBe(a!.y);
    expect(label!.y).toBe(a!.y);
  });

  it('carries a ""…"" run’s own monospace family, keeping its trailing spaces', () => {
    const block = messageLabelBlock('""x->  ""', undefined, LEFT_X, ARROW_Y, defaultTheme, measurer);
    expect(block.lines).toHaveLength(1);
    // PlantUML's LOGICAL name — the CSS `monospace` rename is a draw-time
    // concern (`svg-text-font.ts#textFontFamily`), so the run carries the
    // logical one.
    expect(block.lines[0]!.fontFamily).toBe('monospaced');
    expect(block.lines[0]!.text).toBe('x->  ');
    expect(block.lines[0]!.textWidth).toBeCloseTo(18.444, 3);
  });

  it('interprets creole in the AUTONUMBER rather than emitting it literally', () => {
    const block = messageLabelBlock(
      'plain', '<font color=red>[001]</font>', LEFT_X, ARROW_Y, defaultTheme, measurer,
    );
    expect(block.number!.text).toBe('[001]');
    expect(block.number!.color).toBe('#FF0000');
    // The width that matters is the RENDERED number's, not the markup's: the
    // label beside it starts one `MESSAGE_NUMBER_MARGIN` past it
    // (`Display.java:706`), which is what the jar's 72.069 - 39.225 = 32.844
    // shows.
    expect(block.number!.textWidth).toBeCloseTo(28.844, 3);
    expect(block.lines[0]!.x).toBeCloseTo(LEFT_X + 28.844 + 4, 3);
  });

  it('leaves a markup-free label exactly one run whose width is the raw measure', () => {
    // C1's measurement identity, and the whole safety property of this task.
    for (const label of ['hello', 'a b c', 'こんにちわ']) {
      const block = messageLabelBlock(label, undefined, LEFT_X, ARROW_Y, defaultTheme, measurer);
      expect(block.lines).toHaveLength(1);
      expect(block.lines[0]!.text).toBe(label);
      expect(block.lines[0]!.x).toBe(LEFT_X);
      expect(block.lines[0]!.textWidth).toBeCloseTo(measurer.measure(label, spec).width, 10);
    }
  });

  it('keeps a multi-line label’s rows one lineHeight apart when a row splits', () => {
    const block = messageLabelBlock(
      'a <b>b</b>\\nc', undefined, LEFT_X, ARROW_Y, defaultTheme, measurer,
    );
    // Row 0 is two runs, row 1 is one — four entries would mean the split
    // leaked into the row advance.
    expect(block.lines).toHaveLength(3);
    const h = block.lines[0]!.textLineHeight;
    expect(block.lines[1]!.y).toBe(block.lines[0]!.y);
    expect(block.lines[2]!.y - block.lines[0]!.y).toBeCloseTo(h, 10);
  });
});
