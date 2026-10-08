/**
 * unwind2-S2b: json-family key cells and object entries against the jar.
 *
 * Every `tests/fixtures/unwind2-S2b/<name>.puml` has its jar render beside it
 * as `<name>.svg` (`scripts/oracle-render.sh`, deterministic text), rendered
 * here through production `renderSync` and compared clean.
 *
 * Upstream mechanisms:
 *  - A key cell is the same creole `TextBlock` as a value cell
 *    (`TextBlockJson.java:123`, `getTextBlock` at `:341-345`), so its width is
 *    `AtomText#getWidth`'s tab-stop walk (`*-tab-key`).
 */
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { compareSvg } from '../../oracle/svg-conformance/compare.js';

const DIR = join(dirname(fileURLToPath(import.meta.url)), '../../fixtures/unwind2-S2b');

const CASES = readdirSync(DIR)
  .filter((f) => f.endsWith('.puml'))
  .map((f) => f.slice(0, -'.puml'.length))
  .sort();

describe('unwind2-S2b — json-family key cells and object entries', () => {
  it('has the fixture set', () => {
    expect(CASES.length).toBe(2);
  });

  it.each(CASES)('%s', (name) => {
    const source = readFileSync(join(DIR, `${name}.puml`), 'utf8');
    const jar = readFileSync(join(DIR, `${name}.svg`), 'utf8');
    const ours = renderSync(source, { measurer: new DeterministicMeasurer() });
    expect(compareSvg(ours, jar, 'deterministic').diffs.map((d) => d.path)).toEqual([]);
  });
});
