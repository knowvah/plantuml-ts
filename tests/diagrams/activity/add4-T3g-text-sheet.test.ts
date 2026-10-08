/**
 * add4-T3g (D9): every non-action activity label drawn through the creole
 * `TextBlock` upstream builds (`Display#create0`, `Display.java:637-701`).
 * Each fixture under `tests/fixtures/activity/add4-T3g/` carries its jar
 * oracle (`scripts/oracle-render.sh`, deterministic text) as `<name>.svg`.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { renderFixtureActivity } from '../../oracle/svg-conformance/render-fixture-activity.js';
import { fixtureIncludeStore } from '../../helpers/fixture-include-store.js';
import { compareSvg } from '../../oracle/svg-conformance/compare.js';

const DIR = join(dirname(fileURLToPath(import.meta.url)), '../../fixtures/activity/add4-T3g');

function diffPaths(name: string): string[] {
  const markup = readFileSync(join(DIR, `${name}.puml`), 'utf8');
  const golden = readFileSync(join(DIR, `${name}.svg`), 'utf8');
  const ours = renderFixtureActivity(markup, new DeterministicMeasurer(), { includeStore: fixtureIncludeStore() });
  return compareSvg(ours, golden, 'deterministic').diffs.map((d) => d.path);
}

describe('activity labels through Display#create0 (jar oracles)', () => {
  // FtileFactoryDelegator.java:103-112: `create7(fc, LEFT, skinParam,
  // CreoleMode.SIMPLE_LINE)`. Every <text>/<a>/<filter> matches the jar,
  // and the layout sizes the label with the same block (add4-T3h,
  // `edge-label-anchor.ts#edgeLabelBlockSize`, `Snake.java:247`).
  it('edge labels: bold, italic, url, <back:>, <color:> runs match the jar', () => {
    expect(diffPaths('edge-label-creole')).toEqual([]);
  });

  // ConditionalBuilder.java:240-247 (FULL Sheet, diamond alignment,
  // Hexagon.asStencil) centred by FtileDiamondInside.java:94-96.
  it('hexagon test label: CENTER Sheet with creole colour matches the jar', () => {
    expect(diffPaths('hexagon-labels-center')).toEqual([]);
  });

  // FtileGroup.java:104-108: `title.create(fc, LEFT, skinParam)` (FULL).
  it('partition and package titles: bold, italic, <color:> runs match the jar', () => {
    expect(diffPaths('composite-titles')).toEqual([]);
  });
});
