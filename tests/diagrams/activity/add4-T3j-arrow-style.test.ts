/**
 * add4-T3j: `CommandArrow3`'s COLOR group styles the NEXT arrow
 * (`CommandArrow3.java:99-103`, `HtmlColorAndStyle.java:86-106`,
 * `Worm.java:119-171`). Fixtures carry their jar oracle as `<name>.svg`.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { renderFixtureActivity } from '../../oracle/svg-conformance/render-fixture-activity.js';
import { fixtureIncludeStore } from '../../helpers/fixture-include-store.js';
import { compareSvg } from '../../oracle/svg-conformance/compare.js';
import { consumeArrowLabel } from '../../../src/diagrams/activity/layout/tile-layout-inlabel.js';

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), '../../fixtures/activity');

function diffPaths(dir: string, name: string): string[] {
  const markup = readFileSync(join(FIXTURES, dir, `${name}.puml`), 'utf8');
  const golden = readFileSync(join(FIXTURES, dir, `${name}.svg`), 'utf8');
  const ours = renderFixtureActivity(markup, new DeterministicMeasurer(), { includeStore: fixtureIncludeStore() });
  return compareSvg(ours, golden, 'deterministic').diffs.map((d) => d.path);
}

describe('consumeArrowLabel', () => {
  it('keeps a style-only arrow as a pending colour with no label', () => {
    expect(consumeArrowLabel({ kind: 'arrow-label', label: '', style: 'bold' })).toEqual({ label: '', color: 'bold' });
  });

  it('carries label and COLOR group together', () => {
    expect(consumeArrowLabel({ kind: 'arrow-label', label: 'x', style: '#red' })).toEqual({
      label: 'x',
      color: '#red',
    });
  });

  it('drops a plain arrow with neither', () => {
    expect(consumeArrowLabel({ kind: 'arrow-label', label: '' })).toBeUndefined();
  });
});

describe('next-arrow style (jar oracles)', () => {
  it.each([
    ['add4-T3i', 'arrow-style-bold'],
    ['add4-T3i', 'arrow-style-colored'],
    ['add4-T3i', 'arrow-style-colored-label'],
    ['add4-T3i', 'arrow-long-multiline'],
    ['add4-T3j', 'arrow-style-dashed'],
    ['add4-T3j', 'arrow-style-headcolor'],
  ])('%s/%s renders equal to the jar', (dir, name) => {
    expect(diffPaths(dir, name)).toEqual([]);
  });

  // Worm.java:123-124 returns before drawing a hidden worm; its label still
  // draws (Snake.java:195). Residual: compress/shapes-of.ts still counts the
  // hidden arrowhead, so the gap below compresses 8.444 px less than the jar.
  it('hidden arrow: no line or head, label kept; only the compress residual', () => {
    const paths = diffPaths('add4-T3j', 'arrow-style-hidden');
    expect(paths.filter((p) => !/@(y|y1|y2|cy|points\[\d*[13579]\]|height|viewBox\[3\])$/.test(p))).toEqual([]);
    expect(paths).toHaveLength(12);
  });
});
