/**
 * The reserved-box formula every engine's edge labels go through.
 *
 * The two size cases below are the jar's own numbers, read off
 * `usecase/jecici-56-bimu826`'s cached `svek-1.dot` — not off a previous run
 * of this code. Before creole stripping landed, the two-line case measured
 * **336.1** wide against that 72, because the colour tags were counted as
 * glyphs.
 */
import { describe, it, expect } from 'vitest';

import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import {
  computeReservedLabelBox,
  computeQuantifierBox,
  splitCreoleLines,
  stripCreoleMarkup,
} from '../../../src/core/edge-label-box.js';

const measurer = new DeterministicMeasurer();
/** `skinparam arrowFontSize 10`, which the fixture sets. */
const ARROW_FONT = { family: 'SansSerif', size: 10 };
/**
 * `class/camuna-58-veca254`'s `<style>` block: `arrow.cardinality { FontSize
 * 10  FontStyle italic }` — its own scoped override wins over the enclosing
 * `arrow { FontSize 14 FontStyle bold }`, so the resolved cardinality font is
 * size 10 italic, NOT the arrow label's 14 bold.
 */
const CARDINALITY_FONT = { family: 'SansSerif', size: 10, style: 'italic' as const };

describe('stripCreoleMarkup', () => {
  it('removes formatting tags, opening and closing', () => {
    expect(stripCreoleMarkup('<color:green>x</color>')).toBe('x');
    expect(stripCreoleMarkup('<b>a</b><i>b</i><u>c</u><s>d</s>')).toBe('abcd');
    expect(stripCreoleMarkup('<size:13>x</size>')).toBe('x');
    expect(stripCreoleMarkup('<back:#eee>x</back>')).toBe('x');
    expect(stripCreoleMarkup('<font color="red">x</font>')).toBe('x');
  });

  it('leaves ATOMS alone — they occupy real width', () => {
    // `creole-atoms.ts#scanLineForAtoms` sizes these; stripping them would
    // silently shrink every label carrying an icon.
    const withAtoms = 'a <img:x.svg> b <$sprite> c <&icon> d';
    expect(stripCreoleMarkup(withAtoms)).toBe(withAtoms);
  });

  it('does not confuse a tag with its prefix', () => {
    // `back` before `b`, `size` before `s` — alternation is first-match.
    expect(stripCreoleMarkup('<back:#eee>q')).toBe('q');
    expect(stripCreoleMarkup('<size:9>q')).toBe('q');
  });
});

describe('splitCreoleLines', () => {
  it('splits on the literal two-character token and on a real newline', () => {
    expect(splitCreoleLines(String.raw`a\nb`)).toEqual(['a', 'b']);
    expect(splitCreoleLines('a\nb')).toEqual(['a', 'b']);
  });
});

describe('computeReservedLabelBox — jar-measured cases', () => {
  it('two-line label with colour tags reserves the oracle box', () => {
    const label = String.raw`<color:green>Purchase Price\n<color:green>Payment of $100`;
    const box = computeReservedLabelBox(label, ARROW_FONT, measurer, false);
    expect(box.reservedWidth).toBe(72);
    expect(box.reservedHeight).toBe(22);
  });

  it('one-line label with a colour tag reserves the oracle box', () => {
    const box = computeReservedLabelBox('<color:blue>Sale of Widget 1', ARROW_FONT, measurer, false);
    expect(box.reservedWidth).toBe(67);
    expect(box.reservedHeight).toBe(12);
  });

  it('width is the MAX over lines, not their sum', () => {
    // The defect this replaced: a two-line label measured as one concatenated
    // line. `short` must not widen the box beyond the longer line.
    const wide = computeReservedLabelBox('Payment of $100', ARROW_FONT, measurer, false);
    const both = computeReservedLabelBox(String.raw`ab\nPayment of $100`, ARROW_FONT, measurer, false);
    expect(both.reservedWidth).toBe(wide.reservedWidth);
    expect(both.reservedHeight).toBeGreaterThan(wide.reservedHeight);
  });

  it('a self-loop takes the wider margin', () => {
    const plain = computeReservedLabelBox('x', ARROW_FONT, measurer, false);
    const loop = computeReservedLabelBox('x', ARROW_FONT, measurer, true);
    expect(loop.marginLabel).toBe(6);
    expect(plain.marginLabel).toBe(1);
    expect(loop.reservedHeight - plain.reservedHeight).toBe(10);
  });

  /**
   * Discrimination: the size assertions above must be sensitive to the
   * stripping, not merely compatible with it. Measuring the same label WITHOUT
   * stripping has to land somewhere else entirely — otherwise the oracle
   * numbers would pass whether or not the fix is present.
   */
  it('the oracle numbers depend on stripping — unstripped text measures far wider', () => {
    const raw = String.raw`<color:green>Purchase Price\n<color:green>Payment of $100`;
    const unstripped = splitCreoleLines(raw);
    const widestUnstripped = Math.max(
      ...unstripped.map((l) => measurer.measure(l, ARROW_FONT).width),
    );
    const stripped = computeReservedLabelBox(raw, ARROW_FONT, measurer, false);
    expect(widestUnstripped).toBeGreaterThan(stripped.reservedWidth * 1.5);
  });
});

/**
 * `computeQuantifierBox` — the SEPARATE, un-shielded formula
 * `SvekEdge.java:447-467` uses for `taillabel`/`headlabel`
 * (`startTailText`/`endHeadText`, built at `:330-351` from
 * `Display.getWithNewlines(...).create(cardinalityFont, ...)`). Both cases
 * below are the jar's own numbers, read off
 * `class/camuna-58-veca254`'s cached `svek-1.dot`: `headlabel` on the
 * `HashMap -> Customer` edge is `41x20` (two lines, `"customer\n1"`); on the
 * `Map -> HashMap` edge it is `23x10` (one line, `"value"`) — both at the
 * fixture's `<style>`-overridden cardinality font, size 10 italic.
 */
describe('computeQuantifierBox — jar-measured cases, no shield/margin', () => {
  it('two-line quantifier reserves the oracle box (camuna-58-veca254, HashMap edge)', () => {
    const box = computeQuantifierBox(String.raw`customer\n1`, CARDINALITY_FONT, measurer);
    expect(box.lines).toEqual(['customer', '1']);
    expect(box.reservedWidth).toBe(41);
    expect(box.reservedHeight).toBe(20);
  });

  it('single-line quantifier reserves the oracle box (camuna-58-veca254, Map edge)', () => {
    const box = computeQuantifierBox('value', CARDINALITY_FONT, measurer);
    expect(box.lines).toEqual(['value']);
    expect(box.reservedWidth).toBe(23);
    expect(box.reservedHeight).toBe(10);
  });

  it('adds neither labelShield nor 2 * marginLabel — matches raw measured width', () => {
    // The label arm (computeReservedLabelBox) would add 2 * marginLabel (>=2)
    // to this exact width/height. The quantifier arm must not.
    const rawWidth = measurer.measure('value', CARDINALITY_FONT).width;
    const box = computeQuantifierBox('value', CARDINALITY_FONT, measurer);
    expect(box.reservedWidth).toBe(Math.floor(rawWidth));
    expect(box.reservedHeight).toBe(CARDINALITY_FONT.size);
  });

  it('truncates a fractional width toward zero, not rounds', () => {
    // `measure('value', ...).width` is 23.9375 — appendTable's `(int)` cast
    // (SvekEdge.java:504-507) truncates to 23, not Math.round's 24.
    const box = computeQuantifierBox('value', CARDINALITY_FONT, measurer);
    const rawWidth = measurer.measure('value', CARDINALITY_FONT).width;
    expect(rawWidth).not.toBe(Math.trunc(rawWidth));
    expect(box.reservedWidth).toBe(Math.trunc(rawWidth));
  });
});
