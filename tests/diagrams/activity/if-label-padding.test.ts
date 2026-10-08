/**
 * add4-T3d (fukika-81-gite897): an if's arrow-side labels are padded creole
 * Sheets (`ConditionalBuilder.java:280-282`, `Display.java:692-700`): +2p on
 * both axes (`SheetBlock1.java:196-199`), text drawn at (+p, +p)
 * (`SheetBlock1.java:209-210`), and Y/X compression maps the UText draw
 * point, not the padded box (`UGraphicCompressOnXorY.java:122-128`).
 * Goldens via `scripts/oracle-render.sh`.
 *
 * add4-T3e: the if-down merge diamond's padded empty north label
 * (`getShape2(useNorth=true)`, `ConditionalBuilder.java:292-303`) is now
 * modelled by `tiles/gtile-if-down.ts#diamond2North`, closing the else-line
 * mid-arrow residual.
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { renderActivityFixture } from '../../helpers/activity-text-position.js';
import { compareSvg } from '../../oracle/svg-conformance/compare.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURE_ROOT = join(HERE, '../../fixtures/activity/add4-T3d');

describe('if side labels under skinparam padding', () => {
  it('if-with-links then/else labels match the jar', () => {
    const { ours, golden } = renderActivityFixture(FIXTURE_ROOT, 'if-label-padding-links');
    expect(compareSvg(ours, golden, 'deterministic').diffs).toEqual([]);
  });

  it('if-down labels and the else-line mid arrow match the jar', () => {
    const { ours, golden } = renderActivityFixture(FIXTURE_ROOT, 'if-label-padding-down-yes');
    expect(compareSvg(ours, golden, 'deterministic').diffs).toEqual([]);
  });
});
