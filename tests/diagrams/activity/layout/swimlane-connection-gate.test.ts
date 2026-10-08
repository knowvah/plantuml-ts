/**
 * The per-lane gate for non-`ConnectionTranslatable` connections and for
 * children outside a composite's `getSwimlanes()`
 * (`UGraphicInterceptorOneSwimlane.java:68-75,93-104`, `ConnectionCross.java
 * :49-64`). Goldens are jar renders from `scripts/oracle-render.sh`.
 *
 * - `ifdown-stop-other-lane`: `FtileIfDown`'s `optionalStop` in another lane
 *   -- neither the stop (outside `getSwimlanes()`, `FtileIfDown.java:91-95`)
 *   nor `ConnectionHorizontal` (`:161-166`) draws.
 * - `while-special-other-lane`: `FtileWhile`'s `specialOut` stop in another
 *   lane (`FtileWhile.java:96-100,513-517`) -- same omission.
 * - `merge-branch-other-lane`: `fork ... end merge`, first branch in another
 *   lane than the diamond (last branch's out lane, `AbstractParallelFtiles
 *   Builder.java:208-210`) -- its `ConnectionHorizontalThenVertical`
 *   (`ParallelBuilderMerge.java:121-129`) does not draw.
 * - `switch-one-other-lane`: single-case switch, case in another lane --
 *   `FtileSwitchWithOneLink`'s two connections (`:64-121`) and the case label
 *   do not draw.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DeterministicMeasurer } from '../../../../src/core/measurer-deterministic.js';
import {
  childDrawnInLanes,
  compositeLaneGate,
  nonTranslatableConnectionDrawn,
} from '../../../../src/diagrams/activity/layout/swimlane-connection-gate.js';
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

const CASES = [
  'ifdown-stop-other-lane',
  'while-special-other-lane',
  'merge-branch-other-lane',
  'switch-one-other-lane',
] as const;

describe('swimlane connection gate fixtures', () => {
  it.each(CASES)('%s matches the jar exactly', (slug) => {
    expect(diffCount(slug)).toBe(0);
  });

  // Counts are the jar's own (`in.svg`); the pre-gate port drew more.
  it('ifdown-stop-other-lane draws no stop and no connector to it', () => {
    const svg = render('ifdown-stop-other-lane');
    expect(count(svg, 'ellipse')).toBe(3);
    expect(count(svg, 'line')).toBe(8);
  });

  it('while-special-other-lane draws no special-out stop and no connector', () => {
    const svg = render('while-special-other-lane');
    expect(count(svg, 'ellipse')).toBe(1);
    expect(count(svg, 'line')).toBe(10);
  });

  it('merge-branch-other-lane draws one merge connector, not two', () => {
    const svg = render('merge-branch-other-lane');
    expect(count(svg, 'line')).toBe(15);
    expect(count(svg, 'polygon')).toBe(8);
  });

  it('switch-one-other-lane draws no in-link label', () => {
    const svg = render('switch-one-other-lane');
    expect(svg).not.toContain('>one<');
    expect(count(svg, 'line')).toBe(7);
  });
});

describe('swimlane-connection-gate helpers', () => {
  it('compositeLaneGate is undefined when the diagram has no lanes', () => {
    expect(compositeLaneGate(undefined, [], undefined)).toBeUndefined();
  });

  it('compositeLaneGate holds swimlaneIn when no child touches a lane', () => {
    expect([...(compositeLaneGate('A', [], 'A') ?? [])]).toEqual(['A']);
  });

  it('nonTranslatableConnectionDrawn needs one gate lane holding both ends', () => {
    const gate = new Set(['A', 'B']);
    expect(nonTranslatableConnectionDrawn(gate, 'A', 'A')).toBe(true);
    expect(nonTranslatableConnectionDrawn(gate, 'A', 'B')).toBe(false);
    expect(nonTranslatableConnectionDrawn(gate, undefined, 'B')).toBe(true);
    expect(nonTranslatableConnectionDrawn(gate, 'C', 'C')).toBe(false);
    expect(nonTranslatableConnectionDrawn(undefined, 'A', 'B')).toBe(true);
  });

  it('childDrawnInLanes draws a child only in a lane of the gate', () => {
    const gate = new Set(['A']);
    expect(childDrawnInLanes(gate, 'A')).toBe(true);
    expect(childDrawnInLanes(gate, 'B')).toBe(false);
    expect(childDrawnInLanes(gate, undefined)).toBe(true);
    expect(childDrawnInLanes(undefined, 'B')).toBe(true);
  });
});
