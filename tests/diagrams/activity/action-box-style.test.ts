/**
 * add4-T3e: every SDL/UML `BoxStyle` (`BoxStyle.java:61-97`) against the jar
 * -- multi- and single-line labels, LEFT/CENTER alignment, `----`/`====`
 * rules through the shielded stencil, mixed-case and hyphenated stereotypes.
 * Goldens via `scripts/oracle-render.sh`.
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { renderActivityFixture } from '../../helpers/activity-text-position.js';
import { compareSvg } from '../../oracle/svg-conformance/compare.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURE_ROOT = join(HERE, '../../fixtures/activity/add4-T3e');

const STYLES = [
  'input',
  'output',
  'procedure',
  'load',
  'save',
  'continuous',
  'task',
  'object',
  'objectSignal',
  'trigger',
  'sendSignal',
  'acceptEvent',
  'timeEvent',
];

describe('action box styles match the jar', () => {
  it.each([
    ...STYLES.map((s) => `boxstyle-${s}`),
    'boxstyle-center',
    'boxstyle-hr',
    'boxstyle-variants',
    'boxstyle-stereogroup',
    'boxstyle-backward',
    'boxstyle-backward-multi',
    'boxstyle-lanes',
  ])('%s', (name) => {
    const { ours, golden } = renderActivityFixture(FIXTURE_ROOT, name);
    expect(compareSvg(ours, golden, 'deterministic').diffs).toEqual([]);
  });
});
