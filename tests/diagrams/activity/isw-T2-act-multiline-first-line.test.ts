/**
 * isw-T2-act F2: a multiline action's first line is `CommandActivityLong3`'s
 * `":" DATA(.*)` verbatim (`CommandActivityLong3.java:81-82,139`) -- its
 * leading spaces measure and shift, and an empty DATA is still a line the
 * jar draws. Jar oracle: one-JVM `scripts/oracle-render.sh` render (seam #4).
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { renderFixtureActivity } from '../../oracle/svg-conformance/render-fixture-activity.js';
import { compareSvg } from '../../oracle/svg-conformance/compare.js';

const FIXTURE = join(dirname(fileURLToPath(import.meta.url)), '../../fixtures/isw-T2-act/multiline-first-line');

describe('multiline action first line (jar oracle)', () => {
  it('keeps an empty or space-led first line as the jar does', () => {
    const ours = renderFixtureActivity(readFileSync(`${FIXTURE}.puml`, 'utf8'), new DeterministicMeasurer());
    const golden = readFileSync(`${FIXTURE}.svg`, 'utf8');
    expect(compareSvg(ours, golden, 'deterministic').diffs.map((d) => d.path)).toEqual([]);
  });
});
