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

  // ConditionalBuilder.java:240-247,262-267,280-283: an EMPTY_DIAMOND test
  // is the condition Sheet (padding included), its sides SIMPLE_LINE blocks.
  it('EMPTY_DIAMOND if: north Sheet and side blocks carry the padding', () => {
    expect(diffPaths('add4-T3j', 'empty-diamond-padding')).toEqual([]);
  });

  // Residual: a heading stripe in the north test compresses 0.889 px too
  // far (compress/shapes-of.ts#ifLabelShape derives stripe baselines from
  // the base font; (15 - 11) / 4.5 is the heading's extra descent).
  it('EMPTY_DIAMOND if: heading north keeps only the compress residual', () => {
    const paths = diffPaths('add4-T3j', 'empty-diamond-blocks');
    expect(paths.filter((p) => !/@(y|y1|y2|cy|points\[\d*[13579]\]|height|viewBox\[3\])$/.test(p))).toEqual([]);
    expect(paths).toHaveLength(67);
  });

  // FtileFactoryDelegatorAssembly.java:58-62: the sequential gap adds the
  // create7 SIMPLE_LINE block's height (padding and stripe floor included).
  it('sequential gap: the in-label block height, padding included', () => {
    expect(diffPaths('add4-T3h', 'side-labels-padding')).toEqual([]);
  });

  // FtileWhile.java:124-126,137-139: an EMPTY_DIAMOND while's north is the
  // test (`withNorth(testTb)`), drawn at the diamond font and colour.
  it('EMPTY_DIAMOND while: the north test is the condition, not a branch label', () => {
    expect(diffPaths('add4-T3h', 'empty-diamond-north')).toEqual([]);
  });
});
