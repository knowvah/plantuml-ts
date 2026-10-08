/**
 * `FtileIfLongHorizontal`'s `ConnectionLastElseIn` is `super(lastDiamond,
 * tile2)` and NOT `ConnectionTranslatable` (`FtileIfLongHorizontal.java
 * :323-350`). The cross-lane pass draws only translatables
 * (`ConnectionCross.java:49-64`) and every lane pass needs both tiles in that
 * lane (`UGraphicInterceptorOneSwimlane.java:93-104`), so with the else branch
 * in another lane the jar draws no else-entry connector. Goldens are jar
 * renders from `scripts/oracle-render.sh`.
 *
 * - `else-other-lane`: else branch in `Other` -- no else-entry connector.
 * - `then-other-lane`: a then branch in `Other` -- `ConnectionVerticalIn` IS
 *   translatable (`:389`), so it still draws across lanes.
 * - `same-lane`: every branch in `Main` -- the else-entry connector draws.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DeterministicMeasurer } from '../../../../src/core/measurer-deterministic.js';
import { renderFixtureActivity } from '../../../oracle/svg-conformance/render-fixture-activity.js';
import { compareSvg } from '../../../oracle/svg-conformance/compare.js';

const FIXTURE_DIR = 'tests/fixtures/activity/jucidi-mirror';

function render(slug: string): string {
  return renderFixtureActivity(readFileSync(`${FIXTURE_DIR}/${slug}/in.puml`, 'utf8'), new DeterministicMeasurer());
}

function diffCount(slug: string): number {
  return compareSvg(render(slug), readFileSync(`${FIXTURE_DIR}/${slug}/in.svg`, 'utf8'), 'deterministic').diffs.length;
}

function count(svg: string, tag: string): number {
  return svg.match(new RegExp(`<${tag}[ >]`, 'g'))?.length ?? 0;
}

describe('long-horizontal if swimlane connection gate', () => {
  it.each(['else-other-lane', 'then-other-lane', 'same-lane'])('%s matches the jar exactly', (slug) => {
    expect(diffCount(slug)).toBe(0);
  });

  // Element counts are the jar's own (`in.svg`); before the gate ours drew
  // the else-entry Snake too: 20 lines, 13 polygons.
  it('else-other-lane draws the jar element counts, no else-entry Snake', () => {
    const svg = render('else-other-lane');
    expect(count(svg, 'line')).toBe(17);
    expect(count(svg, 'polygon')).toBe(12);
  });

  it('same-lane keeps the else-entry Snake', () => {
    const svg = render('same-lane');
    expect(count(svg, 'line')).toBe(20);
    expect(count(svg, 'polygon')).toBe(13);
  });
});
