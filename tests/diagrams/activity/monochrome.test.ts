/**
 * add4-T3d (tobajo-64-mipi810): `skinparam monochrome true` swaps in
 * `ColorMapper.MONOCHROME` for the whole draw pass (`TitledDiagram
 * #muteColorMapper`, `klimt/color/ColorMapper.java:80-83`), so an
 * `Orange` action becomes gray `#ADADAD` and the `#FEFFDD` note `#FAFAFA`.
 * Golden via `scripts/oracle-render.sh`.
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { renderActivityFixture } from '../../helpers/activity-text-position.js';
import { compareSvg } from '../../oracle/svg-conformance/compare.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURE_ROOT = join(HERE, '../../fixtures/activity/add4-T3d');

describe('activity under skinparam monochrome', () => {
  it('maps every drawn colour to gray, as the jar does', () => {
    const { ours, golden } = renderActivityFixture(FIXTURE_ROOT, 'monochrome-colors');
    expect(ours).toContain('fill="#ADADAD"');
    expect(compareSvg(ours, golden, 'deterministic').diffs).toEqual([]);
  });
});
