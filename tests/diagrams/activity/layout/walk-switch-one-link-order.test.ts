/**
 * add4-T3a: `FtileSwitchWithOneLink#addLinks` adds `ConnectionVerticalTop`
 * (the labelled in-link) before `ConnectionVerticalBottom`
 * (`FtileSwitchWithOneLink.java:134-143`), so the jar draws the in-link's
 * line, arrowhead and label first. Ours pushed the bottom edge during the
 * case-body pass, ahead of every in-edge (one-link 16, one-link-1line 15).
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { compareSvg } from '../../../oracle/svg-conformance/compare.js';
import { renderActivityFixture } from '../../../helpers/activity-text-position.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURE_ROOT = join(HERE, '../../../fixtures/activity/add4-T1a');

describe('single-case switch connection order', () => {
  it.each(['one-link', 'one-link-1line'])('%s renders equal to the jar', (name) => {
    const { ours, golden } = renderActivityFixture(FIXTURE_ROOT, name);
    expect(compareSvg(ours, golden, 'deterministic').diffs).toEqual([]);
  });
});
