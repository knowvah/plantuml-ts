import { describe, it, expect } from 'vitest';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';

/**
 * Locks in the jar-golden verification numbers captured for this task
 * (`measurer-deterministic.ts`'s doc comment table) — real output from
 * `java -DPLANTUML_DETERMINISTIC_TEXT=true -jar plantuml-1.2026.7beta3.jar
 * -tsvg -pipe` (openjdk 21.0.1), read off each `<text>` element's
 * `textLength` attribute. `DeterministicMeasurer` extends
 * `WidthTableMeasurer` (see that module's own test file for full
 * per-glyph/table coverage) and overrides only U+0020 (oracle seam #4, isw
 * D1; `isw-space-width.test.ts`) — none of the texts below contains a space,
 * so these jar-observed values hold before and after seam #4's space entry;
 * seam #4 also rounds every width to float like the stock SVG bounder
 * (`FontMetrics.getStringBounds` is a `Rectangle2D.Float`), hence `Math.fround`.
 */
describe('DeterministicMeasurer — jar-golden verification (2026-07-10)', () => {
  const m = new DeterministicMeasurer();
  const font = { family: 'sans-serif', size: 14 };

  it.each<[string, number]>([
    ['Component', 72.3625],
    ['comp1', 42],
    ['A', 9.3625],
  ])('%s at size 14 matches jar textLength %f', (text, jarTextLength) => {
    expect(m.measure(text, font).width).toBe(Math.fround(jarTextLength));
  });

  it('astral codepoint (U+1F600) matches jar textLength 14 — getCharWidth fallback, not /10', () => {
    expect(m.measure('\u{1F600}', font).width).toBe(Math.fround(14));
  });

  it('block-255-overflow codepoint (U+FF21, fullwidth A) matches jar textLength 11.375', () => {
    expect(m.measure('Ａ', font).width).toBe(Math.fround(11.375));
  });

  it('height equals font size (SVG_DETERMINISTIC formula: height = size)', () => {
    expect(m.measure('Component', font).height).toBe(14);
  });
});

/**
 * Mission G5/C0: pins the exact numeric mechanism behind G4 §S13's
 * "text-measurement calibration gap" finding. `bemena-23-zebu249`'s
 * `lnk16` transition label (`test-results/dot-cache/state/bemena-23-
 * zebu249/in.svg`) renders `"EvNewValueSaved"` at `font-size="13"` with
 * `textLength="111.475"` — upstream's real, jar-verified value for THIS
 * measurer at the CORRECT size (`FontParam.ARROW`'s default, 13, per
 * `~/git/plantuml/.../klimt/font/FontParam.java:54`).
 *
 * S13 reported this port's own computed width as `120.05` and attributed
 * the ~7% gap to the measurer being "miscalibrated". `DeterministicMeasurer`
 * is NOT miscalibrated — see `plans/g5-measurer-calibration/ledger.md` §C0
 * for the full corpus-wide proof (13,564 in-scope samples, 0.000% mean
 * error). `120.05` is this SAME measurer's exact, correct answer for the
 * SAME string at `size=14` (the body-text default, `FontParam.STATE`) —
 * the bug is a caller passing the wrong size, not a measurer defect. This
 * pin locks BOTH numbers down together so a future fix to the caller
 * (`state-composite-pass.ts:326`, currently `size: theme.fontSize`) has an
 * unambiguous, jar-verified target: switching that call site to
 * `size: 13` must make its measured width match `111.475`, not `120.05`.
 */
describe('DeterministicMeasurer — G5/C0 calibration-gap mechanism (jar-verified)', () => {
  const m = new DeterministicMeasurer();

  it('"EvNewValueSaved" at the CORRECT arrow-label size (13) matches jar textLength 111.475', () => {
    expect(m.measure('EvNewValueSaved', { family: 'sans-serif', size: 13 }).width).toBe(Math.fround(111.475));
  });

  it('"EvNewValueSaved" at the body-text size (14) reproduces S13\'s own reported "wrong" value 120.05 -- proving the measurer, not the size, is exact', () => {
    expect(m.measure('EvNewValueSaved', { family: 'sans-serif', size: 14 }).width).toBe(Math.fround(120.05));
  });
});
