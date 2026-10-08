/**
 * add4-T3h (D9): the layout sizes every activity label with the SAME creole
 * `TextBlock` the renderer draws, so the reserved box matches the drawn ink.
 * Fixtures are T3g's (`tests/fixtures/activity/add4-T3g/`) and this task's
 * (`tests/fixtures/activity/add4-T3h/`), each with its jar oracle
 * (`scripts/oracle-render.sh`, deterministic text) as `<name>.svg`.
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

describe('labels measured as drawn (jar oracles)', () => {
  // FtileRepeat.java:124-128,706: the EMPTY_DIAMOND repeat floors its width
  // at `tbTest` -- a FULL creole block, so `//data//` is its italic atom.
  it('EMPTY_DIAMOND repeat: tbTest width is the resolved creole width', () => {
    expect(diffPaths('add4-T3g', 'diamond-labels')).toEqual([]);
  });
});
