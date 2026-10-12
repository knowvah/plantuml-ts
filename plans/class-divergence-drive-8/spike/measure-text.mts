// T0c spike helper (not production code). Run: npx jiti <this file>
//
// Prints the full-precision deterministic-mode text widths the jar measured
// for cadutu-02-lazu601. The oracle SVG prints textLength to 3 dp and omits
// textLength for the single-glyph quantifiers "1" and "*", so those two widths
// cannot be read from in.svg. DeterministicMeasurer is the repo's port of
// StringBounderFromWidthTable.java:67-80 (height = font size, :71) plus the
// oracle's seam #4 (space = '!', float rounding); every multi-glyph value it
// prints below equals the SVG textLength to 3 dp (checked in elk-spike.cjs).
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.ts';

const m = new DeterministicMeasurer();
const arrow = { family: 'SansSerif', size: 13 };
const header = { family: 'SansSerif', size: 14 };
const out: Record<string, { width: number; height: number }> = {};
for (const t of [
  '1',
  '*',
  'foo',
  'bar',
  'hello',
  'short label',
  'this label is very',
  'long and has an impact',
  'on the layout',
]) {
  out[`13:${t}`] = m.measure(t, arrow);
}
for (const t of ['foo1', 'foo2', 'foo', 'bar', 'bar2']) out[`14:${t}`] = m.measure(t, header);
console.log(JSON.stringify(out, null, 2));
