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
 *  - minimal-json `JsonObject#add` appends, never dedups
 *    (`JsonObject.java:337-348`), in source order: json (`Json.java:377-378`)
 *    and hcl fields (`HclParser.java:123-148`) keep duplicates; yaml's
 *    `LinkedHashMap` (`Monomorph.java:103-111`) and hcl's top-level module
 *    map (`HclParser.java:61-75`) collapse them, last value at first position
 *    (`*-dup-*`, `*-int-keys`).
 */
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { compareSvg } from '../../oracle/svg-conformance/compare.js';

const DIR = join(dirname(fileURLToPath(import.meta.url)), '../../fixtures/unwind2-S2b');

/**
 * Multi-node fixtures: upstream lays the json family out with
 * `SmetanaForJson`, this port with `@knowvah/dot-engine` (CLAUDE.md, "One
 * layout engine", ruling 2026-08-09), so node placement and edge paths carry
 * the settled geometry delta. Only coordinates may differ.
 */
const SMETANA_GEOMETRY: ReadonlySet<string> = new Set(['hcl-dup-module', 'json-dup-nested']);
const SMETANA_POSITIONAL = /\/@(x|y|cx|cy|x1|x2|y1|y2|d\[\d+\])$/u;

const CASES = readdirSync(DIR)
  .filter((f) => f.endsWith('.puml'))
  .map((f) => f.slice(0, -'.puml'.length))
  .sort();

describe('unwind2-S2b — json-family key cells and object entries', () => {
  it('has the fixture set', () => {
    expect(CASES.length).toBe(10);
  });

  it.each(CASES)('%s', (name) => {
    const source = readFileSync(join(DIR, `${name}.puml`), 'utf8');
    const jar = readFileSync(join(DIR, `${name}.svg`), 'utf8');
    const ours = renderSync(source, { measurer: new DeterministicMeasurer() });
    const paths = compareSvg(ours, jar, 'deterministic').diffs.map((d) => d.path);
    const unexplained = SMETANA_GEOMETRY.has(name) ? paths.filter((p) => !SMETANA_POSITIONAL.test(p)) : paths;
    expect(unexplained).toEqual([]);
  });
});
