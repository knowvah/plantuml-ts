/**
 * add4-T2a SWIMLANE-GATE: `FtileIfLongVertical#getSwimlanes()` leaves out the
 * diamonds' lane (`FtileIfLongVertical.java:111-129`), and the swimlane
 * interceptors draw a child or a `Connection` only in a lane the composite
 * covers (`UGraphicInterceptorAllSwimlanes.java:63-79,129-143`,
 * `UGraphicInterceptorOneSwimlane.java:68-75,93-104`). Goldens are jar renders
 * from `scripts/oracle-render.sh`.
 *
 * - `vif-lane-gate`: diamonds in `Decide`, every branch in another lane, so the
 *   jar draws no diamond, no connector, and no inlabel or else label.
 * - `vif-lane-mixed`: diamonds in `Main` with branch 0 also in `Main`, so the
 *   diamonds draw. The connections into and out of the `Side` branch drop.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DeterministicMeasurer } from '../../../../src/core/measurer-deterministic.js';
import { renderFixtureActivity } from '../../../oracle/svg-conformance/render-fixture-activity.js';
import { compareSvg } from '../../../oracle/svg-conformance/compare.js';

const FIXTURE_DIR = 'tests/fixtures/activity/add4-T2a';

function render(slug: string): string {
  return renderFixtureActivity(readFileSync(`${FIXTURE_DIR}/${slug}.puml`, 'utf8'), new DeterministicMeasurer());
}

function diffCount(slug: string): number {
  return compareSvg(render(slug), readFileSync(`${FIXTURE_DIR}/${slug}.svg`, 'utf8'), 'deterministic').diffs.length;
}

function count(svg: string, tag: string): number {
  return svg.match(new RegExp(`<${tag}[ >]`, 'g'))?.length ?? 0;
}

describe('vertical-if swimlane gate', () => {
  it('vif-lane-gate matches the jar exactly', () => {
    expect(diffCount('vif-lane-gate')).toBe(0);
  });

  it('vif-lane-gate draws no diamond polygon and no diamond or edge label', () => {
    const svg = render('vif-lane-gate');
    expect(svg).not.toContain('route?');
    expect(svg).not.toContain('retry');
    expect(svg).not.toContain('>none<');
    // Arrowheads only: start -> prepare, prepare -> composite, composite -> stop.
    expect(count(svg, 'polygon')).toBe(3);
  });

  it('vif-lane-mixed matches the jar exactly', () => {
    expect(diffCount('vif-lane-mixed')).toBe(0);
  });

  it('vif-lane-mixed still draws both condition diamonds', () => {
    const svg = render('vif-lane-mixed');
    expect(svg).toContain('first?');
    expect(svg).toContain('second?');
  });
});
