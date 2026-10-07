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

/**
 * add4-T1g: `ConnectionVerticalOut` is `super(tile, null)`
 * (`FtileIfWithLinks.java:374-375`), so `Swimlanes$Cross` skips it
 * (`Swimlanes.java:189-193`) and it draws -- and is measured, arrowhead
 * included -- in the branch tile's own out lane, straight down.
 */
describe('FtileIfWithLinks ConnectionVerticalOut stays in its tile lane', () => {
  it('else branch in another lane: dividers equal the jar (pezubu shape)', () => {
    expect(dividerXs('hline-links-else-xlane.puml')).toEqual([20, 59.013, 152.025, 200.375]);
  });

  it('else branch exit drops straight to the bar, no cross-lane elbow', () => {
    const svg = renderFixtureActivity(
      readFileSync(join(DIR, 'hline-links-else-xlane.puml'), 'utf8'),
      new DeterministicMeasurer(),
    );
    const lines = (svg.match(/<line x1="181.375"[^>]*>/g) ?? []).map((l) =>
      /y1="([^"]*)" x2="([^"]*)" y2="([^"]*)"/.exec(l)!.slice(1),
    );
    expect(lines).toContainEqual(['208.5', '181.375', '228.5']);
    expect(lines).not.toContainEqual(['208.5', '181.375', '217.5']);
  });
});
