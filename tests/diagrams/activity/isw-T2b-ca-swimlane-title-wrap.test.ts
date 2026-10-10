/**
 * isw-T2b-ca: `skinparam swimlaneWrapTitleWidth` wraps swimlane titles
 * (`Swimlanes#getTitle`/`getWrap`, `Swimlanes.java:285-302`;
 * `SkinParam#swimlaneWrapTitleWidth`, `SkinParam.java:980-984`). Fixtures
 * under `tests/fixtures/isw-T2b-ca/` carry their one-JVM jar render
 * (`scripts/oracle-render.sh`, seam #4) as `<name>.svg`.
 *
 * - `swimlane-title-wrap-px`: a pixel width wraps every title, a
 *   `|name|LABEL` display included; the band grows to the tallest title.
 * - `swimlane-title-wrap-auto`: `AUTO` (case-insensitive `isAuto`) wraps
 *   at each lane's `(int) getActualWidth()` under a `swimlaneWidth` floor.
 * - `swimlane-title-wrap-none`: a non-numeric value never wraps, and
 *   `wrapWidth` still does not reach the title.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { renderFixtureActivity } from '../../oracle/svg-conformance/render-fixture-activity.js';
import { compareSvg } from '../../oracle/svg-conformance/compare.js';

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), '../../fixtures/isw-T2b-ca');

function diffPaths(name: string): string[] {
  const markup = readFileSync(join(FIXTURES, `${name}.puml`), 'utf8');
  const golden = readFileSync(join(FIXTURES, `${name}.svg`), 'utf8');
  const ours = renderFixtureActivity(markup, new DeterministicMeasurer());
  return compareSvg(ours, golden, 'deterministic').diffs.map((d) => d.path);
}

describe('swimlaneWrapTitleWidth (jar oracles)', () => {
  it.each(['swimlane-title-wrap-px', 'swimlane-title-wrap-auto', 'swimlane-title-wrap-none'])(
    '%s renders equal to the jar',
    (name) => {
      expect(diffPaths(name)).toEqual([]);
    },
  );
});
