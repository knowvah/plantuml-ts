/**
 * add4-T1g: `FtileIfWithLinks`' `ConnectionHline` is `super(null, null)`
 * (`cond/FtileIfWithLinks.java:425-426`), so `UGraphicInterceptorAllSwimlanes`
 * measures its `getMinmaxSimple` bar into EVERY lane of the enclosing tile's
 * `getSwimlanes()` (`FtileIfNude.java:79-87`: `in` plus both branches' lanes),
 * not just the diamond's lane.
 *
 * Expected divider x values were read from `scripts/oracle-render.sh` renders
 * of `tests/fixtures/activity/add4-T1g/hline-links-*.puml` (deterministic
 * text). `else-xlane` is the pezubu-98-niba240 markup.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';
import { DeterministicMeasurer } from '../../../../src/core/measurer-deterministic.js';
import { renderFixtureActivity } from '../../../oracle/svg-conformance/render-fixture-activity.js';
import { censusOf } from '../../../oracle/svg-conformance/swimlane-census.js';

const DIR = join(import.meta.dirname, '../../../fixtures/activity/add4-T1g');

function dividerXs(name: string): readonly number[] {
  return censusOf(renderFixtureActivity(readFileSync(join(DIR, name), 'utf8'), new DeterministicMeasurer())).dividerXs;
}

describe('FtileIfWithLinks ConnectionHline lane ink — divider x vs the jar', () => {
  it('then branch in another lane widens that lane to the bar', () => {
    expect(dividerXs('hline-links-then-xlane.puml')).toEqual([20, 262.194, 348.569]);
  });
});
