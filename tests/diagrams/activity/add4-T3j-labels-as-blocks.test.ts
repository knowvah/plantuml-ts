/**
 * add4-T3j: the remaining label slots sized as the blocks upstream builds
 * (T3h's "Not done" 1-6). Fixtures carry their jar oracle as `<name>.svg`
 * (`scripts/oracle-render.sh`, deterministic text).
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { renderFixtureActivity } from '../../oracle/svg-conformance/render-fixture-activity.js';
import { fixtureIncludeStore } from '../../helpers/fixture-include-store.js';
import { compareSvg } from '../../oracle/svg-conformance/compare.js';

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), '../../fixtures/activity');

function diffPaths(dir: string, name: string): string[] {
  const markup = readFileSync(join(FIXTURES, dir, `${name}.puml`), 'utf8');
  const golden = readFileSync(join(FIXTURES, dir, `${name}.svg`), 'utf8');
  const ours = renderFixtureActivity(markup, new DeterministicMeasurer(), { includeStore: fixtureIncludeStore() });
  return compareSvg(ours, golden, 'deterministic').diffs.map((d) => d.path);
}

describe('labels sized as the drawn blocks (jar oracles)', () => {
  // FtileIfLongHorizontal.java:172-177,186: elseif side slots are FULL
  // `create(fcArrow)` blocks, the condition a `create0(fcTest, FULL)` Sheet.
  it('elseif hexagon: condition Sheet and FULL side blocks', () => {
    expect(diffPaths('add4-T3g', 'hexagon-labels')).toEqual([]);
  });

  it('elseif hexagon: creole in condition and branch labels', () => {
    expect(diffPaths('add4-T3h', 'elseif-creole')).toEqual([]);
  });
});
