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
  applyVisibilityIcon,
  applyGuillemet,
} from '../../../src/core/edge-label-box.js';

/** M4 causes A+B (`.agent-notes/m4-single-line-width.md`) at the default
 *  `classAttributeIconSize` (10, `SkinParam.java:555`), the arrow-label font
 *  used by `class/gikipi-69-pepo172` etc. (`FontParam.ARROW`, size 13). */
const LINK_FONT = { family: 'SansSerif', size: 13 };

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
 * M4 causes A+B (`.agent-notes/m4-single-line-width.md`, T12a): strip a
 * leading visibility character off line 0 (`Display.java:415-416`) and
 * reserve the icon block it's replaced by (`VisibilityModifier.java
 * :100-102`, `TextBlockUtils.java:75-78`) — gated on `classAttributeIconSize
 * () > 0` (`AbstractClassOrObjectDiagram.java:74`). Oracle widths read off
 * `.agent-notes/m4-single-line-width.md`'s own table (T4, jar-verified
 * against `class/gikipi-69-pepo172`, `class/canuti-20-jotu614`,
 * `class/gixesa-28-feri809`, `state/susena-02-gusa448`).
 */
describe('applyVisibilityIcon — M4 causes A+B', () => {
  it('strips the leading char and reports the default icon width (10+2=12)', () => {
    const adj = applyVisibilityIcon('+parameter');
    expect(adj.text).toBe('parameter');
    expect(adj.iconWidth).toBe(12);
    expect(adj.iconHeight).toBe(13);
  });

  it('leaves a label with no leading visibility char untouched', () => {
    const adj = applyVisibilityIcon('parameter');
    expect(adj.text).toBe('parameter');
    expect(adj.iconWidth).toBe(0);
    expect(adj.iconHeight).toBe(0);
  });

  it('does not treat a doubled leading char as a visibility marker', () => {
    // `VisibilityModifier#isVisibilityCharacter`'s `s.charAt(1) == c` guard
    // (`VisibilityModifier.java:216-217`) — `--comment` is not `-comment`.
    const adj = applyVisibilityIcon('--comment');
    expect(adj.text).toBe('--comment');
    expect(adj.iconWidth).toBe(0);
  });

  it('requires more than 2 characters (VisibilityModifier.java:212-213)', () => {
    expect(applyVisibilityIcon('-x').iconWidth).toBe(0);
  });

  it('is gated off by classAttributeIconSize <= 0', () => {
    const adj = applyVisibilityIcon('+parameter', 0);
    expect(adj.text).toBe('+parameter');
    expect(adj.iconWidth).toBe(0);
    expect(adj.iconHeight).toBe(0);
  });
});

/**
 * M4 cause C (`.agent-notes/m4-single-line-width.md`,
 * `Guillemet.java:76,78-88`). The four widths are T4's oracle values,
 * jar-measured on `class/xopuku-46-nefa571` (`<<delegate>>` 66,
 * `<<create>>` 52), `class/tebore-53-tese080` (`<<alias>>` 43) and
 * `class/tedeba-19-lisi250` (`<<implement>>` 76) -- reproduced here by
 * `applyGuillemet` + `WidthTableMeasurer` + `2 * marginLabel(1)`, the same
 * arithmetic `computeMeasuredLabelAttrs`/`withLabelMargin` in
 * `class-layout-edge-labels.ts` perform.
 */
describe('applyGuillemet — M4 cause C', () => {
  it.each([
    ['<<delegate>>', '«delegate»', 66],
    ['<<create>>', '«create»', 52],
    ['<<alias>>', '«alias»', 43],
    ['<<implement>>', '«implement»', 76],
  ])('%s -> %s, reserved width %i', (input, expectedText, expectedWidth) => {
    const rewritten = applyGuillemet(input);
    expect(rewritten).toBe(expectedText);
    const width = Math.floor(measurer.measure(rewritten, LINK_FONT).width + 2 * 1);
    expect(width).toBe(expectedWidth);
  });

  it('rewrites a run ANYWHERE in the string, not only at position 0', () => {
    // `GUILLEMET_PATTERN` (`Guillemet.java:76`) has no `^` anchor --
    // `Matcher#replaceAll` (`:86-87`) scans the whole input.
    expect(applyGuillemet('foo <<bar>> baz')).toBe('foo «bar» baz');
  });

  it('rewrites every run when more than one is present', () => {
    expect(applyGuillemet('<<a>> and <<b>>')).toBe('«a» and «b»');
  });

  it('eats exactly one optional space inside each bracket', () => {
    expect(applyGuillemet('<< a >>')).toBe('«a»');
    expect(applyGuillemet('<<a>>')).toBe('«a»');
    // Only ONE of two spaces is eaten per side -- `\s?` matches at most one.
    expect(applyGuillemet('<<  a  >>')).toBe('« a »');
  });

  it('leaves a string with no "<" untouched (fast path)', () => {
    expect(applyGuillemet('plain label')).toBe('plain label');
  });

  it('leaves an unmatched single-angle-bracket pair untouched', () => {
    expect(applyGuillemet('<foo>')).toBe('<foo>');
  });
});

describe('computeReservedLabelBox — M4 causes A+B, jar-measured cases', () => {
  it.each([
    ['+parameter', 73],
    ['-entries', 53],
    ['#factory', 52],
    ['+parent', 50],
    ['-var1', 39],
    ['+var2', 39],
    ['#var3', 39],
    ['~var4', 39],
    ['+OK', 32],
    ['-ok', 27],
    ['+marche pas', 78],
    ['-marche pas', 78],
  ])('%s reserves the oracle width %i', (label, oracleWidth) => {
    const box = computeReservedLabelBox(label, LINK_FONT, measurer, false);
    expect(box.reservedWidth).toBe(oracleWidth);
    expect(box.reservedHeight).toBe(15);
  });

  it('regression guard: classAttributeIconSize 0 keeps the raw-string width (bugeli-63-mixa543)', () => {
    // gixesa's `-var1` measures 39 by default (A+B applied); the guard
    // fixture pins the same label at icon size 0, which must reproduce the
    // OLD raw-string reservation, not 39. This assertion fails against the
    // pre-fix code, which had no `classAttributeIconSize` parameter at all
    // and always measured the raw string — i.e. it already "passes"
    // pre-fix, which is exactly what a regression guard must do.
    const gated = computeReservedLabelBox('-var1', LINK_FONT, measurer, false, 0);
    const rawWidth = measurer.measure('-var1', LINK_FONT).width;
    expect(gated.reservedWidth).toBe(Math.floor(rawWidth + 2));
    expect(gated.reservedWidth).not.toBe(39);
  });

  it('a label with no leading visibility char is unaffected by the gate', () => {
    const withIcon = computeReservedLabelBox('plainlabel', LINK_FONT, measurer, false);
    const withoutIcon = computeReservedLabelBox('plainlabel', LINK_FONT, measurer, false, 0);
    expect(withIcon.reservedWidth).toBe(withoutIcon.reservedWidth);
  });

  it('FAILS against pre-fix computeReservedLabelBox (no 5th argument existed)', () => {
    // Pre-fix, `computeReservedLabelBox('+parameter', LINK_FONT, measurer,
    // false)` measured the raw string INCLUDING the leading `+` and never
    // added an icon block, landing on 68 (`floor(66.788 + 2)`), not 73.
    const box = computeReservedLabelBox('+parameter', LINK_FONT, measurer, false);
    expect(box.reservedWidth).not.toBe(68);
    expect(box.reservedWidth).toBe(73);
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
 * `class/focaci-80-suzu938`'s headlabel `"~* initiators"` at the default
 * cardinality font (`CARDINALITY_FONT_SIZE`, `graph-layout-build-edges.ts
 * :19` = 13, `svek/SvekEdge.java` cardinality default) measures 61x13
 * unstripped vs the oracle's 53x13 — `~*` is `CharHidder`'s escape
 * sequence (`utils/CharHidder.java:59-90`), not a `VisibilityModifier`
 * strip (see `stripLeadingEscapedChar`'s doc comment for the full
 * mechanism and the oracle renders that disprove the visibility reading).
 */
describe('computeQuantifierBox — the CharHidder escape is not a visibility strip', () => {
  const DEFAULT_CARDINALITY_FONT = { family: 'SansSerif', size: 13 };

  it('strips a leading ~* escape, keeping the * as a literal glyph (focaci-80-suzu938)', () => {
    const box = computeQuantifierBox('~* initiators', DEFAULT_CARDINALITY_FONT, measurer);
    expect(box.lines).toEqual(['* initiators']);
    expect(box.reservedWidth).toBe(53);
    expect(box.reservedHeight).toBe(13);
  });

  it('leaves a quantifier with no escape sequence unchanged', () => {
    const box = computeQuantifierBox('initiators', DEFAULT_CARDINALITY_FONT, measurer);
    expect(box.lines).toEqual(['initiators']);
    expect(box.reservedWidth).toBe(Math.floor(measurer.measure('initiators', DEFAULT_CARDINALITY_FONT).width));
  });

  it('does not strip a bare ~ before a non-escape character (space)', () => {
    // Solo oracle render of "~ initiators": 56, tilde rendered literally —
    // `~` only escapes when immediately followed by an isToBeHidden char.
    const box = computeQuantifierBox('~ initiators', DEFAULT_CARDINALITY_FONT, measurer);
    expect(box.lines).toEqual(['~ initiators']);
    expect(box.reservedWidth).toBe(56);
  });

  it('does not strip a leading UML visibility char that is not a ~ escape', () => {
    // `applyVisibilityIcon` would strip `+`/`-`/`#` too; the quantifier arm
    // must not, since VisibilityModifier never reaches it (SvekEdge.java
    // :329-351 never calls LinkArg#build). Assert against the FULL literal
    // string's own measurement (not a hardcoded oracle number — this
    // measurer's `#`-glyph width table entry is a separate, untouched
    // concern from this task's escape-vs-visibility distinction).
    for (const text of ['+ initiators', '# initiators']) {
      const box = computeQuantifierBox(text, DEFAULT_CARDINALITY_FONT, measurer);
      expect(box.lines).toEqual([text]);
      expect(box.reservedWidth).toBe(Math.floor(measurer.measure(text, DEFAULT_CARDINALITY_FONT).width));
    }
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
