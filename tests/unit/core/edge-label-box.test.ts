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
  computeMergedLabelBox,
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

/**
 * `computeMergedLabelBox` — the note-on-link arm (`SvekEdge.java:302-325,
 * 440-445, 485-489`). `noteDim` stands in for the note sizer's decorated
 * image output (T9/T10 wire the real sizer); the values below are chosen
 * to make the three terms (merge, shield, halving) individually legible,
 * not to match the `lozego-15-coci435` oracle — that fixture needs the
 * real note sizer to verify end to end.
 */
describe('computeMergedLabelBox — mergeLR/mergeTB, shield, halving', () => {
  const label = 'Items';
  const labelDim = computeReservedLabelBox(label, ARROW_FONT, measurer, false);
  const noteDim = { width: 100, height: 80 };

  it('LEFT: width sums note+label, height is the max (XDimension2D.java:108-112)', () => {
    const box = computeMergedLabelBox({
      label,
      noteDim,
      position: 'left',
      halfWidth: false,
      hasMiddleDecor: false,
      font: ARROW_FONT,
      measurer,
    });
    expect(box.reservedWidth).toBe(noteDim.width + labelDim.reservedWidth);
    expect(box.reservedHeight).toBe(Math.max(noteDim.height, labelDim.reservedHeight));
  });

  it('RIGHT: same numbers as LEFT — width-sum/height-max are commutative', () => {
    const left = computeMergedLabelBox({
      label,
      noteDim,
      position: 'left',
      halfWidth: false,
      hasMiddleDecor: false,
      font: ARROW_FONT,
      measurer,
    });
    const right = computeMergedLabelBox({
      label,
      noteDim,
      position: 'right',
      halfWidth: false,
      hasMiddleDecor: false,
      font: ARROW_FONT,
      measurer,
    });
    expect(right.reservedWidth).toBe(left.reservedWidth);
    expect(right.reservedHeight).toBe(left.reservedHeight);
  });

  it('TOP: width is the max, height sums note+label (XDimension2D.java:94-98)', () => {
    const box = computeMergedLabelBox({
      label,
      noteDim,
      position: 'top',
      halfWidth: false,
      hasMiddleDecor: false,
      font: ARROW_FONT,
      measurer,
    });
    expect(box.reservedWidth).toBe(Math.max(noteDim.width, labelDim.reservedWidth));
    expect(box.reservedHeight).toBe(noteDim.height + labelDim.reservedHeight);
  });

  it('BOTTOM: same numbers as TOP — max/sum are commutative', () => {
    const top = computeMergedLabelBox({
      label,
      noteDim,
      position: 'top',
      halfWidth: false,
      hasMiddleDecor: false,
      font: ARROW_FONT,
      measurer,
    });
    const bottom = computeMergedLabelBox({
      label,
      noteDim,
      position: 'bottom',
      halfWidth: false,
      hasMiddleDecor: false,
      font: ARROW_FONT,
      measurer,
    });
    expect(bottom.reservedWidth).toBe(top.reservedWidth);
    expect(bottom.reservedHeight).toBe(top.reservedHeight);
  });

  it('a middle decor adds 2 * 7 to BOTH dimensions (SvekEdge.java:353-356, 441)', () => {
    const noShield = computeMergedLabelBox({
      label,
      noteDim,
      position: 'left',
      halfWidth: false,
      hasMiddleDecor: false,
      font: ARROW_FONT,
      measurer,
    });
    const shielded = computeMergedLabelBox({
      label,
      noteDim,
      position: 'left',
      halfWidth: false,
      hasMiddleDecor: true,
      font: ARROW_FONT,
      measurer,
    });
    expect(shielded.reservedWidth - noShield.reservedWidth).toBe(14);
    expect(shielded.reservedHeight - noShield.reservedHeight).toBe(14);
  });

  it('NONE middle decor adds no shield', () => {
    const box = computeMergedLabelBox({
      label,
      noteDim,
      position: 'left',
      halfWidth: false,
      hasMiddleDecor: false,
      font: ARROW_FONT,
      measurer,
    });
    expect(box.reservedWidth).toBe(noteDim.width + labelDim.reservedWidth);
  });

  it('a HALF_* strategy halves width only, never height (SvekEdge.java:485-489)', () => {
    const full = computeMergedLabelBox({
      label,
      noteDim,
      position: 'left',
      halfWidth: false,
      hasMiddleDecor: false,
      font: ARROW_FONT,
      measurer,
    });
    const halved = computeMergedLabelBox({
      label,
      noteDim,
      position: 'left',
      halfWidth: true,
      hasMiddleDecor: false,
      font: ARROW_FONT,
      measurer,
    });
    expect(halved.reservedWidth).toBe(Math.floor(full.reservedWidth / 2));
    expect(halved.reservedHeight).toBe(full.reservedHeight);
  });

  it('halving is applied AFTER the shield, not before', () => {
    // If halving ran before the shield, the shield's 14 would survive intact
    // on top of a halved base; SvekEdge halves the SHIELDED dimension
    // (`eventuallyDivideByTwo(dimNote)` at `:443`, where `dimNote` already
    // includes `delta(2 * labelShield)` from `:441`).
    const halvedAndShielded = computeMergedLabelBox({
      label,
      noteDim,
      position: 'left',
      halfWidth: true,
      hasMiddleDecor: true,
      font: ARROW_FONT,
      measurer,
    });
    const preHalfWidth = noteDim.width + labelDim.reservedWidth + 2 * 7;
    expect(halvedAndShielded.reservedWidth).toBe(Math.floor(preHalfWidth / 2));
  });

  it('an empty label short-circuits to the bare note dimension, unmerged', () => {
    // Mirrors `TextBlockUtils.mergeLR`/`mergeTB`'s own `EMPTY_TEXT_BLOCK`
    // check (`TextBlockUtils.java:112-120, 122-130`): a link with no label
    // text merges to exactly the note's own dimension, no margin added.
    const box = computeMergedLabelBox({
      label: '',
      noteDim,
      position: 'left',
      halfWidth: false,
      hasMiddleDecor: false,
      font: ARROW_FONT,
      measurer,
    });
    expect(box.reservedWidth).toBe(noteDim.width);
    expect(box.reservedHeight).toBe(noteDim.height);
  });

  it('truncates a fractional merged dimension toward zero on BOTH axes', () => {
    // Unlike the plain label arm, both width and height can be fractional
    // here because `noteDim` (the note sizer's output) is not naturally
    // integer the way `lines.length * font.size` is. The expected width
    // uses the UNFLOORED label width (`measuredWidth + 2 * marginLabel`) —
    // NOT `labelDim.reservedWidth`, which is already floored and would
    // silently paper over the double-truncation regression below.
    const fractionalNote = { width: 100.7, height: 80.6 };
    const unflooredLabelWidth = measurer.measure(label, ARROW_FONT).width + 2 * 1;
    const box = computeMergedLabelBox({
      label,
      noteDim: fractionalNote,
      position: 'left',
      halfWidth: false,
      hasMiddleDecor: false,
      font: ARROW_FONT,
      measurer,
    });
    expect(box.reservedWidth).toBe(Math.floor(fractionalNote.width + unflooredLabelWidth));
    expect(box.reservedHeight).toBe(Math.floor(Math.max(fractionalNote.height, labelDim.reservedHeight)));
  });

  it('regression: the label operand enters the merge UNFLOORED, not pre-floored', () => {
    // Defect fixed in fix(T8): `computeMergedLabelBox` used to build the
    // label operand from `computeReservedLabelBox(...).reservedWidth`,
    // which is already `Math.floor(measuredWidth + 2 * marginLabel)`
    // (`edge-label-box.ts:107`), then floored the merged SUM again.
    // Upstream's own pipeline stays in doubles the entire way —
    // `withMargin` (`TextBlockUtils.java:75-78`), `mergeLR`
    // (`XDimension2D.java:108-112`), `delta` (`:87-92`) — and truncates
    // exactly ONCE, at `appendTable`'s `(int)` cast (`SvekEdge.java:504-507`).
    //
    // `measuredWidth('Items', ARROW_FONT) === 24.375` (DeterministicMeasurer);
    // `marginLabel === 1` (non-self-loop) => unfloored label width 26.375.
    // `noteDim.width = 100.7` is chosen so the two fractional parts (.375
    // and .7) sum past 1 — exactly where an early floor on the label loses
    // a pixel: `floor(26.375) + 100.7 = 126.7 -> floor -> 126` (the old,
    // wrong result) vs `floor(26.375 + 100.7) = floor(127.075) -> 127`
    // (correct, and what this asserts). This test fails against the
    // pre-fix commit (`dee0972f`), which produces 126.
    const box = computeMergedLabelBox({
      label,
      noteDim: { width: 100.7, height: 80 },
      position: 'left',
      halfWidth: false,
      hasMiddleDecor: false,
      font: ARROW_FONT,
      measurer,
    });
    expect(box.reservedWidth).toBe(127);
  });
});
