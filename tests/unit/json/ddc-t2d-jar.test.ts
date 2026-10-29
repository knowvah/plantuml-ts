/**
 * ddc-T2d: the authored json-family rows this task closed, against their jar
 * renders (`tests/fixtures/<type>/<slug>.svg`, `scripts/oracle-render.sh`).
 *
 * Each row's structural diff (positional attributes excluded, as the gate
 * does -- D1) must be empty. The mechanism per row:
 *  - number-forms, scalar-negative-float: `JsonNumber` keeps the literal text
 *    (`JsonNumber.java:32-44`), drawn by `TextBlockJson#getShortString`.
 *  - scalar-string-escapes: `getTextBlock` runs `Display.getWithNewlines`,
 *    whose `else` branch keeps an unknown escape's backslash
 *    (`Display.java:310-312`).
 *  - malformed-trailing-comma: `JsonParser#readObject` expects a name after a
 *    comma (`JsonParser.java:234-236`) so the page is the parse-failure one.
 *  - hcl/scale-factor: the failure page's `font-size` is scaled
 *    (`SvgGraphics.java:693`).
 */
import { describe, expect, it } from 'vitest';
import { structuralDiffs } from '../../oracle/svg-conformance/json-family-structural.js';

const ROWS: ReadonlyArray<readonly [type: string, slug: string]> = [
  ['json', 'number-forms'],
  ['json', 'scalar-negative-float'],
  ['json', 'scalar-string-escapes'],
  ['json', 'malformed-trailing-comma'],
  ['hcl', 'scale-factor'],
];

describe('ddc-T2d authored rows match the jar structurally', () => {
  it.each(ROWS)('%s/%s', (type, slug) => {
    expect(structuralDiffs(type, slug).diffs).toEqual([]);
  });
});
