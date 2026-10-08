/**
 * add4-T3d (GOTO-LINES): `UGraphicDispatchFtile` draws a goto's hline +
 * vline to the label drawn before it (`UGraphicDispatchFtile.java:70-85,
 * 101-119`), except when the label or goto is an if branch's ONLY
 * instruction: `FtileMinWidthCentered` (an `FtileDecorate`) then draws it
 * with a direct `drawU` (`vertical/FtileDecorate.java:79-80`) and the
 * dispatcher never sees it. Goldens via `scripts/oracle-render.sh`:
 * `goto-seq` (`:x; goto` in a branch, lines drawn), `goto-alone` (goto alone
 * in a branch, none), `goto-lblalone` (label alone in a branch, none).
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { renderActivityFixture } from '../../helpers/activity-text-position.js';
import { compareSvg } from '../../oracle/svg-conformance/compare.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURE_ROOT = join(HERE, '../../fixtures/activity/add4-T3d');

describe('goto lines', () => {
  it.each(['goto-seq', 'goto-alone', 'goto-lblalone'])('%s matches the jar', (name) => {
    const { ours, golden } = renderActivityFixture(FIXTURE_ROOT, name);
    expect(compareSvg(ours, golden, 'deterministic').diffs).toEqual([]);
  });
});
