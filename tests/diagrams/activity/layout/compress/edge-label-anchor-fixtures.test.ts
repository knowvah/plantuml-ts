/**
 * add4-T3a (R2): edge labels placed on the raw worm and mapped through
 * compression (`compress/edge-label-anchor.ts`). Every golden is the jar's,
 * via `scripts/oracle-render.sh`. Before this port each fixture carried a
 * label-y residual: vif-center-label +10.5 (CENTER, half a removed 21 px
 * slice), switch-first-last-labels 1.723 (LD/RD), the T1a/T1f switch labels
 * 1.72 / 5.056, the multi-line ones on every line.
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { compareSvg } from '../../../../oracle/svg-conformance/compare.js';
import { renderActivityFixture } from '../../../../helpers/activity-text-position.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURES = join(HERE, '../../../../fixtures/activity');

describe('edge label placement through compression', () => {
  it.each([
    ['add4-T3a', 'vif-center-label'],
    ['add4-T3a', 'switch-first-last-labels'],
    ['add4-T1a', 'big-1line'],
    ['add4-T1a', 'big-mixed'],
    ['add4-T1a', 'small-2line'],
    ['add4-T1a', 'small-3line'],
    ['add4-T1a', 'small-out-label'],
    ['add4-T1f', 'after-endswitch'],
    ['add4-T1f', 'floating-one'],
    ['add4-T1f', 'pre-case-one'],
  ])('%s/%s renders equal to the jar', (dir, name) => {
    const { ours, golden } = renderActivityFixture(join(FIXTURES, dir), name);
    expect(compareSvg(ours, golden, 'deterministic').diffs).toEqual([]);
  });
});
