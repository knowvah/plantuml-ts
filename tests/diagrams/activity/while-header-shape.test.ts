/**
 * add4-T2f: `FtileWhile.create` picks the while header's diamond by
 * conditionStyle exactly as an if does (`vcompact/FtileWhile.java:130-140`):
 * INSIDE_DIAMOND -> `FtileDiamondSquare` (4-point rhombus), EMPTY_DIAMOND ->
 * `FtileDiamond` with the test on north (`:137-139`). Goldens via
 * `scripts/oracle-render.sh`.
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { renderActivityFixture } from '../../helpers/activity-text-position.js';
import { compareSvg } from '../../oracle/svg-conformance/compare.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURE_ROOT = join(HERE, '../../fixtures/activity/add4-T2f');

function firstPolygonPointCount(svg: string): number {
  const m = /<polygon points="([^"]*)"/.exec(svg);
  return m === null ? 0 : m[1]!.split(',').length / 2;
}

describe('while header shape by conditionStyle', () => {
  it.each([
    ['while-inside-diamond', 4],
    ['while-empty-diamond-test', 5],
  ])('%s draws the jar polygon', (name, points) => {
    const { ours, golden } = renderActivityFixture(FIXTURE_ROOT, name);
    expect(firstPolygonPointCount(ours)).toBe(points);
    expect(compareSvg(ours, golden, 'deterministic').diffs).toEqual([]);
  });
});
