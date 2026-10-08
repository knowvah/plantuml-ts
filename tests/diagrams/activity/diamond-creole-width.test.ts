/**
 * add4-T2d (DIAMOND-CREOLE-WIDTH, `mazoka-64-nixi123`): the condition text
 * is a `CreoleMode.FULL` Sheet in a `SheetBlock1`
 * (`vcompact/cond/ConditionalBuilder.java:241-244`), so the hexagon is sized
 * and its label centred on the resolved creole width -- `**`/`__` markup
 * takes no room. `in.svg` is the jar's own render (`scripts/oracle-render.sh`).
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { compareSvg } from '../../oracle/svg-conformance/compare.js';
import { renderActivityFixture } from '../../helpers/activity-text-position.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURE_ROOT = join(HERE, '../../fixtures/activity/add4-T2d');

describe('diamond label creole width', () => {
  it('diamond-creole-width renders jar-exact (single- and multi-line, bold + underline)', () => {
    const { ours, golden } = renderActivityFixture(FIXTURE_ROOT, 'diamond-creole-width');
    expect(compareSvg(ours, golden, 'deterministic').diffs).toEqual([]);
  });
});
