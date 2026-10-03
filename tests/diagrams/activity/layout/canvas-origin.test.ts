/**
 * b3/T3a (mission `activity-divergence-drive-2`, batch 3): four
 * `canvas-origin.ts`/`canvas-origin-text-ink.ts` ink-scan corrections,
 * pinned against the REAL jar oracle for one corpus fixture per family
 * rather than a hand-derived number (`measurements/b3-cohort-a.md`'s own
 * per-row table cites each slug below). Mirrors `canvas-bounds.test.ts`'s
 * own rationale: "asserted here directly rather than left to the corpus
 * gates" -- these are single-attribute checks, not full `compareSvg` runs.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { DeterministicMeasurer } from '../../../../src/core/measurer-deterministic.js';
import { fixtureIncludeStore } from '../../../helpers/fixture-include-store.js';
import { renderFixtureActivity } from '../../../oracle/svg-conformance/render-fixture-activity.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const CACHE_ROOT = join(HERE, '../../../../test-results/dot-cache/activity');

function renderCorpusFixture(slug: string): { ours: string; golden: string } {
  const puml = readFileSync(join(CACHE_ROOT, slug, 'in.puml'), 'utf8');
  const golden = readFileSync(join(CACHE_ROOT, slug, 'in.svg'), 'utf8');
  const ours = renderFixtureActivity(puml, new DeterministicMeasurer(), { includeStore: fixtureIncludeStore() });
  return { ours, golden };
}

function attr(svg: string, name: string): string {
  const m = svg.match(new RegExp(`${name}="([^"]*)"`));
  if (m === null) throw new Error(`${name} not found`);
  return m[1]!;
}

describe('canvas-origin — family A: lane-divider ink (LaneDivider.java:97)', () => {
  it('totalHeight includes the full-height divider ink, not just the fudged node ink', () => {
    // begivo-34-sicu289 (b3-cohort-a.md): height 276 (ours, pre-fix) vs
    // 277 (jar) -- the lane divider's own `ULine.vline(height)` was
    // missing from the ink scan entirely.
    const { ours, golden } = renderCorpusFixture('begivo-34-sicu289');
    expect(attr(ours, 'height')).toBe(attr(golden, 'height'));
  });
});

describe('canvas-origin — family P: split-bar ink is a point, not a 1.5-tall box (FtileThinSplit.java:88,95)', () => {
  it('totalHeight does not count the split-bar bookkeeping height as drawn ink', () => {
    // fomapa-90-bore251 (b3-cohort-a.md): height 229 (ours, pre-fix) vs
    // 228 (jar) -- no lanes, bottom ink = the split-join `ULine.hline`.
    const { ours, golden } = renderCorpusFixture('fomapa-90-bore251');
    expect(attr(ours, 'height')).toBe(attr(golden, 'height'));
  });
});

describe('canvas-origin — family Q: if-label text ink uses baseline + 1.5 (LimitFinder.java:217-224)', () => {
  it('totalHeight matches when the deepest ink is a repeat-label UText, not a node box', () => {
    // xekame-27-geba281 (b3-cohort-a.md): height 509 (ours, pre-fix) vs
    // 508 (jar) -- no lanes, bottom ink = the repeat "value2" if-label.
    const { ours, golden } = renderCorpusFixture('xekame-27-geba281');
    expect(attr(ours, 'height')).toBe(attr(golden, 'height'));
  });
});

describe('canvas-origin — family E: chrome centres on the un-floored raw span (DecorateEntityImage.java:144-150)', () => {
  it('the title text/@x lands on the un-floored ink span, not the floored total', () => {
    // gitoke-38-beme495 (b3-cohort-a.md): title/@x 1842.47 (ours, pre-fix,
    // derived by subtracting a margin from the already-FLOORED totalWidth)
    // vs 1832.47 (jar) -- a 10px loss from the floored dims' missing
    // fraction, on a canvas whose own ink span is itself a whole px off.
    const { ours, golden } = renderCorpusFixture('gitoke-38-beme495');
    const oursTitleX = Number(ours.match(/<text[^>]*>lot_of_elsif/)![0].match(/x="([^"]*)"/)![1]);
    const goldenTitleX = Number(golden.match(/<text[^>]*>lot_of_elsif/)![0].match(/x="([^"]*)"/)![1]);
    // `deterministic` tolerance (`tests/oracle/svg-conformance/compare.ts`),
    // not a hand-fitted epsilon: floating-point ct()/measurer arithmetic,
    // never an integer-grid attribute like `height`.
    expect(Math.abs(oursTitleX - goldenTitleX)).toBeLessThan(0.01);
  });
});
