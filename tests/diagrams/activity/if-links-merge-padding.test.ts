/**
 * add4-T3d (zivege-92-rise076): `FtileIfWithLinks#getYdeltaForLabels` adds
 * diamond2's west/east label height (`FtileIfWithLinks.java:83-88`) to the
 * if's height (`FtileIfWithDiamonds.java:187-190`). Its `tbout`s are
 * `Display.NULL`, built into padded empty Sheets 2p tall
 * (`ConditionalBuilder.java:292-303`), so `skinparam padding` lowers every
 * merge rhombus; Y compression then caps the gap (jar sweep: 6 at p=0,
 * 8 at p=1, 10 at p>=5). `conditionEndStyle hline` builds an `FtileEmpty`
 * instead, which adds nothing. Goldens via `scripts/oracle-render.sh`.
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { renderActivityFixture } from '../../helpers/activity-text-position.js';
import { compareSvg } from '../../oracle/svg-conformance/compare.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURE_ROOT = join(HERE, '../../fixtures/activity/add4-T3d');

describe('if-with-links merge diamond under skinparam padding', () => {
  it.each([
    'if-links-merge-padding-1',
    'if-links-merge-padding-5',
    'if-links-merge-padding-30',
    'if-links-merge-padding-hline',
  ])('%s matches the jar', (name) => {
    const { ours, golden } = renderActivityFixture(FIXTURE_ROOT, name);
    expect(compareSvg(ours, golden, 'deterministic').diffs).toEqual([]);
  });
});
