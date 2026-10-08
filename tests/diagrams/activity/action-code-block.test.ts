/**
 * add4-T3e: a `<code>` block is one more stripe of the action box's Sheet --
 * `CreoleParser.java:103-104` builds a `StripeCode` in the monospaced family,
 * sized by `StripeCode#calculateDimensionSlow` (`StripeCode.java:89-98`, raw
 * bounder heights, no `AtomText` floor) and drawn by `drawU` (`:104-117`).
 * The old per-line monospace sizer/renderer pair (`0.6 * fontSize` advance)
 * is gone. Goldens via `scripts/oracle-render.sh`.
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { renderActivityFixture } from '../../helpers/activity-text-position.js';
import { compareSvg } from '../../oracle/svg-conformance/compare.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURE_ROOT = join(HERE, '../../fixtures/activity/add4-T3e');

describe('<code> blocks inside an action box', () => {
  it.each(['code-first', 'code-mixed', 'code-wide', 'code-center', 'code-padding', 'code-small'])(
    '%s matches the jar',
    (name) => {
      const { ours, golden } = renderActivityFixture(FIXTURE_ROOT, name);
      expect(compareSvg(ours, golden, 'deterministic').diffs).toEqual([]);
    },
  );
});
