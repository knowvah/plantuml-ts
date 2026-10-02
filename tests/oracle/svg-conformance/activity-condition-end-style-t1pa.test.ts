/**
 * T1p-a: `skinparam ConditionEndStyle hline` -- authored fixtures.
 *
 * No corpus fixture exercises `FtileIfDown`'s own HLINE connectors in
 * isolation (both `saxeku-17-gume203`/`pezubu-98-niba240`, the b0 cohort's
 * HLINE rows, have non-empty/non-stop branches on both sides and so route
 * through `FtileIfWithLinks` instead, per `ifBuilderOf`). Authored here
 * (CLAUDE.md: the corpus is not a ceiling) and NOT added to the gated
 * corpus (memory: new-corpus-tree-trips-two-gates).
 *
 * `if-with-links-hline.puml` is saxeku's own shape with its swimlanes
 * stripped -- saxeku itself is laned and hits the documented swimlane-
 * unaware `ConnectionHline`/`ConnectionVerticalOut` gap (same accepted
 * precedent as `walk-if-long-horizontal.ts#connectionHline`'s own doc
 * comment); this unlaned fixture isolates the connector port itself from
 * that gap and is exact.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { renderFixtureActivity } from './render-fixture-activity.js';
import { compareSvg } from './compare.js';

const FIXTURE_DIR = 'tests/fixtures/activity/T1p-a';

function renderAndCompare(slug: string): { pass: boolean; diffs: ReturnType<typeof compareSvg>['diffs'] } {
  const markup = readFileSync(`${FIXTURE_DIR}/${slug}.puml`, 'utf8');
  const golden = readFileSync(`${FIXTURE_DIR}/${slug}.svg`, 'utf8');
  const ours = renderFixtureActivity(markup, new DeterministicMeasurer());
  return compareSvg(ours, golden, 'deterministic');
}

describe('activity T1p-a fixtures — skinparam ConditionEndStyle hline', () => {
  it('if-down-hline: FtileIfDown ElseHline/Hline/ConnectionOut byte-exact vs. the jar', () => {
    const { pass, diffs } = renderAndCompare('if-down-hline');
    expect(diffs).toEqual([]);
    expect(pass).toBe(true);
  });

  it('if-with-links-hline: FtileIfWithLinks ConnectionVerticalOut/Hline byte-exact vs. the jar (unlaned)', () => {
    const { pass, diffs } = renderAndCompare('if-with-links-hline');
    expect(diffs).toEqual([]);
    expect(pass).toBe(true);
  });
});
